#!/usr/bin/env python3
"""Hamasaki Linux planning pipeline on the Kaeru DSHA-Index/Router model.

Decision-only adapter: never executes a selected command. Execution must use
Kaeru's authorization and receipt pipeline after Linux contract tests.
"""
from __future__ import annotations
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable
import hamasaki_linux as linux

# The original Kaeru Router remains the metadata source for common tools.
EXTENSIONS = {
    "github": {"name": "Oyasmi GitHubTool (Linux plan)", "keywords": ["github", "gh", "repository", "repo", "git", "仓库", "代码托管", "推送", "拉取"], "extensions": [".git"], "exact_filenames": [], "weight": 1.3},
    "kde": {"name": "Oyasmi KDE / Dolphin (Linux plan)", "keywords": ["kde", "plasma", "dolphin", "konsole", "桌面", "文件管理器"], "extensions": [], "exact_filenames": [], "weight": 1.3},
    "package": {"name": "Oyasmi package source management (plan-only)", "keywords": ["apt", "dnf", "pacman", "zypper", "软件源", "换源", "镜像源", "安装软件", "包管理"], "extensions": [".sources", ".list"], "exact_filenames": [], "weight": 1.3},
    "python": {"name": "Oyasmi Python policy / quota hooks (plan-only)", "keywords": ["python", "venv", "pip", "pypi", "虚拟环境", "python权限"], "extensions": [".py"], "exact_filenames": ["pyproject.toml"], "weight": 1.1},
}
REQUIRES = {
    "cf": ("node",), "rea": ("node",), "scribe": ("python",),
    "pwsh": ("pwsh",), "sh": ("bash",), "tier": ("python",),
    "meter": ("python",), "github": ("gh",), "kde": ("dolphin",),
    "python": ("python",), "package": (),
}
PENDING_PORT = frozenset({"tier", "meter", "kde", "package", "python", "rea", "cf", "scribe"})
MUTATING = re.compile(
    r"(?i)\b(push|install|remove|delete|deploy|write|update|upgrade|reset|rebase|commit|sudo|chmod)\b"
    r"|安装|卸载|删除|修改|更改|切换|换源|推送|提交|部署|升级|写入"
)
SCHEMA = "hamasaki-plan-v1"

@dataclass(frozen=True)
class Candidate:
    id: str
    score: float
    reason: tuple[str, ...]

class EnvSnapshot:
    """Bounded in-process TTL cache, not a persisted permission decision."""
    def __init__(self, probe: Callable[[str], dict] | None = None,
                 ttl: float = 15.0, clock: Callable[[], float] = time.monotonic):
        self.probe = probe or default_probe
        self.ttl = max(0.0, ttl)
        self.clock = clock
        self._cache: dict[str, tuple[float, dict]] = {}
        self.probes = 0
        self.hits = 0

    def get(self, name: str) -> dict:
        now = self.clock()
        entry = self._cache.get(name)
        if entry and now - entry[0] < self.ttl:
            self.hits += 1
            return dict(entry[1])
        result = dict(self.probe(name))
        self._cache[name] = (now, result)
        self.probes += 1
        return dict(result)

def default_probe(name: str) -> dict:
    if name == "python":
        return {"state": "NATIVE", "binary": linux.platform.python_implementation(),
                "evidence": "current_interpreter_running"}
    if name in linux.CAPABILITIES:
        return linux.capability(name)
    return {"state": "UNAVAILABLE", "binary": None, "evidence": "undeclared_probe"}

def catalog() -> dict:
    # If the common catalog fails, DO NOT invent an unrestricted shell.
    try:
        from router import TOOL_REGISTRY
    except (ImportError, RuntimeError, OSError):
        return {}
    return {**TOOL_REGISTRY, **EXTENSIONS}

def rank(query: str, meta: dict) -> list[Candidate]:
    text = query.strip().lower()
    if not text:
        return []
    paths = re.findall(r"[a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]+", text)
    scored = []
    for tool_id, entry in meta.items():
        value = 0.0
        reasons = []
        if text == tool_id or text.startswith(tool_id + " "):
            value += 60
            reasons.append("explicit_tool")
        for path in paths:
            p = Path(path)
            if p.name in entry.get("exact_filenames", ()):
                value += 45
                reasons.append("exact_filename")
            elif p.suffix in entry.get("extensions", ()):
                value += 35
                reasons.append("extension")
        matched = []
        for kw in entry.get("keywords", ()):
            kw = kw.lower()
            if not kw:
                continue
            if kw.isascii() and re.fullmatch(r"[a-z0-9_.-]+", kw):
                found = re.search(r"(?<![\w-])" + re.escape(kw) + r"(?![\w-])", text)
            else:
                found = kw in text
            if found:
                matched.append(kw)
        if matched:
            value += 12 * min(4, len(matched)) * float(entry.get("weight", 1))
            reasons.append("keywords:" + ",".join(matched[:4]))
        if value:
            scored.append(Candidate(tool_id, round(value, 2), tuple(reasons)))
    return sorted(scored, key=lambda c: (-c.score, c.id))

def make_error(code: str, reason: str, *, stages: list[str], details: dict | None = None) -> dict:
    return {"schema": SCHEMA, "status": "ERR_BLOCK", "error_code": code,
            "reason": reason, "executed": False, "details": details or {},
            "trace_receipt": {"status": "BLOCKED", "stages": stages + ["err_block"]}}

def plan(query: str, *, root: Path | None = None, snapshot: EnvSnapshot | None = None,
         tools: dict | None = None, tier: str | None = None) -> dict:
    """Rank once; probe selected tool only; return plan/error, never execute."""
    stages = ["index_catalog"]
    root = root or Path(__file__).resolve().parents[1]
    meta = tools if tools is not None else catalog()
    if not meta:
        return make_error("ERR_CATALOG_UNAVAILABLE", "Kaeru catalog cannot be loaded", stages=stages)
    ranked = rank(query, meta)
    stages.append("router_rank")
    if not ranked:
        return make_error("ERR_NO_MATCH", "No match; ask the user instead of choosing a shell", stages=stages)
    selected = ranked[0]
    current_tier = tier if tier is not None else linux.tier_status(root)
    if current_tier not in linux.VALID_TIERS:
        return make_error("ERR_POLICY_UNKNOWN", "Missing or invalid permission tier", stages=stages,
                          details={"tier": current_tier})
    stages.append("policy_guard")
    modifying = bool(MUTATING.search(query))
    if modifying and current_tier == "read-only":
        return make_error("ERR_PERMISSION_DENIED", "Request conflicts with read-only tier", stages=stages,
                          details={"selected_tool": selected.id})
    env = snapshot if snapshot is not None else EnvSnapshot()
    reqs = REQUIRES.get(selected.id)
    if reqs is None:
        return make_error("ERR_UNDECLARED_TOOL", "No Linux tool contract", stages=stages)
    evidence = {r: env.get(r) for r in reqs}
    stages.append("envfeel_selected_only")
    unknown = [name for name, entry in evidence.items() if entry.get("state") != "NATIVE"]
    if selected.id == "package":
        unknown.append("package_manager_selection")
    if unknown:
        return make_error("ERR_PREREQUISITE_UNVERIFIED", "No verified native runtime for selected tool",
                          stages=stages, details={"selected_tool": selected.id, "environment": evidence,
                                                  "unverified": unknown,
                                                  "alternatives": [c.id for c in ranked[1:3]]})
    stages.append("choose_tool")
    return {"schema": SCHEMA, "status": "PLAN_ONLY", "selected_tool": selected.id,
            "score": selected.score, "reason": list(selected.reason),
            "environment": evidence, "needs_user_approval": modifying,
            "port_state": "PENDING_OYASMI_PORT" if selected.id in PENDING_PORT else "METADATA_READY",
            "executed": False, "alternatives": [c.id for c in ranked[1:3]],
            "trace_receipt": {"status": "PLANNED", "stages": stages + ["return_plan"],
                              "probes_this_session": env.probes, "cache_hits": env.hits}}

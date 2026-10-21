#!/usr/bin/env python3
"""Hamasaki Linux adapter bootstrap for the Kaeru/DSHA tree.

Read-only by construction: no package installation, privilege escalation,
network calls, or changes to active DSHA permission tiers.
"""
from __future__ import annotations
import argparse
import json
import os
import platform
import re
import shutil
import subprocess
from pathlib import Path

CAPABILITIES = {
    "bash": ("bash",),
    "git": ("git", "--version"),
    "gh": ("gh", "--version"),
    "node": ("node", "--version"),
    "npm": ("npm", "--version"),
    "pwsh": ("pwsh",),
    "dolphin": ("dolphin", "--version"),
    "kreadconfig": ("kreadconfig6", "--version"),
}
PACKAGE_MANAGERS = ("apt-get", "pkcon", "dnf", "pacman", "zypper")
VALID_TIERS = {"read-only", "workspace-write", "danger-full-access", "auto"}

def run_probe(args: list[str], timeout: float = 2.0) -> tuple[bool, str]:
    """Run a fixed, read-only probe, never user input or a shell pipeline."""
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return False, "probe_failed"
    if result.returncode != 0:
        return False, "probe_failed"
    return True, (result.stdout or result.stderr).strip()[:160]

def capability(name: str) -> dict[str, str | None]:
    argv = CAPABILITIES[name]
    binary = shutil.which(argv[0])
    if not binary:
        return {"state": "UNAVAILABLE", "binary": None, "evidence": "not_on_path"}
    if name == "bash":
        ok, out = run_probe([binary, "-c", 'printf "HAMASAKI_BASH:%s" "${BASH_VERSION:+ok}"'])
        verified = ok and out == "HAMASAKI_BASH:ok"
    elif name == "pwsh":
        ok, out = run_probe([binary, "-NoProfile", "-NonInteractive", "-Command",
                             'Write-Output ($PSVersionTable.PSVersion.Major -ge 7); Get-Date -Format yyyy'])
        lines = out.splitlines()
        verified = ok and len(lines) == 2 and lines[0].lower() == "true" and bool(re.fullmatch(r"[0-9]{4}", lines[1]))
    else:
        ok, out = run_probe([binary, *argv[1:]])
        verified = ok and bool(out) and (name not in {"git", "node", "npm", "gh"} or bool(re.search(r"[0-9]+", out)))
    return {
        "state": "NATIVE" if verified else "COMPATIBLE",
        "binary": binary,
        "evidence": "semantic_probe_passed" if verified else "only_discovered_or_probe_failed",
    }

def ds_core(root: Path) -> dict[str, str]:
    expected = {
        "base_tool": "scripts/base_tool.py", "index": "scripts/index.py",
        "router": "scripts/router.py", "gate": "plugins/dsh-permissions/scripts/gate.py",
        "englock": "plugins/dsh-permissions/scripts/englock.py",
    }
    return {name: "PRESENT" if (root / rel).is_file() else "MISSING" for name, rel in expected.items()}

def tier_status(root: Path) -> str:
    config = root / "plugins/dsh-permissions/tier.json"
    try:
        data = json.loads(config.read_text(encoding="utf-8"))
        tier = str(data.get("tier", "")).strip().lower()
        return tier if tier in VALID_TIERS else "INVALID"
    except (OSError, ValueError, TypeError):
        return "UNKNOWN"

def observe(root: Path) -> dict:
    system = platform.system()
    if system != "Linux":
        return {"status": "UNSUPPORTED", "platform": system, "reason": "Linux adapter only"}
    caps = {name: capability(name) for name in CAPABILITIES}
    for name in PACKAGE_MANAGERS:
        path = shutil.which(name)
        caps[name] = {
            "state": "COMPATIBLE" if path else "UNAVAILABLE",
            "binary": path,
            "evidence": "discovery_only_no_installation" if path else "not_on_path",
        }
    desktop = (os.environ.get("XDG_CURRENT_DESKTOP") or "").upper()
    caps["kde_session"] = {
        "state": "COMPATIBLE" if "KDE" in desktop or "PLASMA" in desktop else "UNAVAILABLE",
        "binary": None,
        "evidence": "desktop_env_not_runtime_proof" if "KDE" in desktop or "PLASMA" in desktop else "desktop_env_not_kde",
    }
    core = ds_core(root)
    return {
        "schema": "hamasaki-linux-bootstrap-v0",
        "status": "READY_FOR_REVIEW" if all(v == "PRESENT" for v in core.values()) else "INCOMPLETE_BASELINE",
        "platform": system, "root": str(root), "python": platform.python_version(),
        "core": core, "active_tier": tier_status(root),
        "capabilities": caps, "side_effects": "none",
        "limitations": ["discovery is not authorization", "no privileged actions", "Oyasmi source parity not yet verified"],
    }

def package_plan() -> dict:
    detected = [name for name in PACKAGE_MANAGERS if shutil.which(name)]
    return {
        "status": "PLAN_ONLY", "managers_detected": detected,
        "authorization_required": True, "executed": False,
        "description": "Package management is intentionally not executed by the bootstrap.",
    }

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Hamasaki: Kaeru-derived Linux adapter (read-only bootstrap)")
    parser.add_argument("command", choices=["status", "package-plan"], nargs="?", default="status")
    parser.add_argument("--json", action="store_true", help="Print structured JSON")
    args = parser.parse_args(argv)
    root = Path(__file__).resolve().parents[1]
    output = observe(root) if args.command == "status" else package_plan()
    print(json.dumps(output, indent=2 if args.json else None, ensure_ascii=False))
    return 2 if output.get("status") in {"UNSUPPORTED", "INCOMPLETE_BASELINE"} else 0

if __name__ == "__main__":
    raise SystemExit(main())

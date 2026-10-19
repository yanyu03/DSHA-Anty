#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSHA BaseTool & Prerequisite Environment Assertion Architecture.

Design Principles:
  1. No Bundled Runtimes: DSHA does NOT bundle heavy external runtimes into the repository.
     External tools rely strictly on host-installed runtimes.
  2. Strict Prerequisite Assertion: Required runtimes must be declared. If missing or
     version unsatisfied, execution is STRICTLY REFUSED with a structured ErrBlock.
  3. Strict Anti-Privilege Escalation: Tools declare their RiskLevel (read-only, low,
     medium, admin) and cannot bypass active DSH permission tiers (e.g. read-only tier
     forbids medium/admin modifying operations).
  4. Class-Based Extensibility & Categorized Retrieval: Tools are organized by Category
     (ReverseEngineering, WebEdge, Archivist, SysAdmin, PolicyRadar) and extended via
     BaseTool inheritance for seamless, type-safe class extensions.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from abc import ABC, abstractmethod
from enum import Enum
from pathlib import Path

# Ensure UTF-8 output across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


class ToolCategory(str, Enum):
    REVERSE_ENGINEERING = "ReverseEngineering"
    WEB_EDGE = "WebEdge"
    ARCHIVIST = "Archivist"
    SYSADMIN = "SysAdmin"
    POLICY_RADAR = "PolicyRadar"


class RiskLevel(str, Enum):
    READ_ONLY = "read-only"
    LOW = "low"
    MEDIUM = "medium"
    ADMIN = "admin"


def parse_semver(v_str):
    if not v_str:
        return (0, 0, 0)
    m = re.search(r"(\d+)(?:\.(\d+))?(?:\.(\d+))?", str(v_str))
    if m:
        return tuple(int(x or 0) for x in m.groups())
    return (0, 0, 0)


def get_active_tier():
    """Discover active DSH permission tier from tier.json."""
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir
    user_home = Path(os.environ.get("USERPROFILE") or ".")

    candidates = [
        repo_root / "tier.json",
        repo_root / "plugins" / "dsh-permissions" / "tier.json",
        user_home / ".gemini" / "config" / "plugins" / "dsh-permissions" / "tier.json",
        user_home / ".gemini" / "config" / "tier.json",
    ]
    for c in candidates:
        if c.is_file():
            try:
                with open(c, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    tier = data.get("tier")
                    if tier:
                        return str(tier).lower()
            except Exception:
                pass
    return "auto"


class HostEnvPerceiver:
    """
    Dynamic Host Environment Perception & Penetration Engine.
    Discovers installed runtimes (Python, Node, Wrangler, Pwsh, Bash, Git)
    dynamically from host environment variables, system directories, and standard package managers.
    Eliminates hardcoded drive letters and usernames to ensure portable execution across migrations.
    """

    @staticmethod
    def get_system_roots():
        """Resolve system roots dynamically without hardcoded drive letters, even in stripped environments."""
        try:
            raw_home = os.environ.get("USERPROFILE") or os.environ.get("HOME")
            if not raw_home:
                raw_home = str(Path.home())
        except Exception:
            raw_home = "."
        user_home = Path(raw_home or ".")

        try:
            sys_drive = os.environ.get("SystemDrive") or (Path(sys.executable).drive if hasattr(Path(sys.executable), "drive") and Path(sys.executable).drive else "C:")
        except Exception:
            sys_drive = "C:"

        sys_root = os.environ.get("SystemRoot") or str(Path(sys_drive) / "Windows")
        prog_files = os.environ.get("ProgramFiles") or str(Path(sys_drive) / "Program Files")
        prog_files_x86 = os.environ.get("ProgramFiles(x86)") or str(Path(sys_drive) / "Program Files (x86)")
        local_data = os.environ.get("LOCALAPPDATA") or str(user_home / "AppData" / "Local")
        roam_data = os.environ.get("APPDATA") or str(user_home / "AppData" / "Roaming")
        prog_data = os.environ.get("ProgramData") or str(Path(sys_drive) / "ProgramData")

        return {
            "sys_drive": Path(sys_drive),
            "sys_root": Path(sys_root),
            "user_home": Path(user_home),
            "prog_files": Path(prog_files),
            "prog_files_x86": Path(prog_files_x86),
            "local_data": Path(local_data),
            "roam_data": Path(roam_data),
            "prog_data": Path(prog_data),
        }

    @classmethod
    def get_candidate_locations(cls, binary_name):
        """Generate dynamic probe paths for a given runtime without hardcoding."""
        roots = cls.get_system_roots()
        candidates = []

        # Package manager roots (Scoop, Chocolatey, NVM, FNM, Pyenv)
        scoop_shims = roots["user_home"] / "scoop" / "shims"
        choco_bin = roots["prog_data"] / "chocolatey" / "bin"
        pyenv_shims = roots["user_home"] / ".pyenv" / "pyenv-win" / "shims"

        script_dir = Path(__file__).resolve().parent
        repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir

        b = binary_name.lower()
        if b in ("python", "python3", "py"):
            candidates.append(Path(sys.executable))
            # Scan LocalAppData Python installations dynamically (Python310, Python311, Python312, etc.)
            py_local = roots["local_data"] / "Programs" / "Python"
            if py_local.is_dir():
                try:
                    for d in sorted(py_local.iterdir(), reverse=True):
                        if d.is_dir() and d.name.lower().startswith("python"):
                            candidates.append(d / "python.exe")
                except Exception:
                    pass
            # Scan ProgramFiles Python installations
            for pf in (roots["prog_files"], roots["prog_files_x86"]):
                if pf.is_dir():
                    try:
                        for d in sorted(pf.iterdir(), reverse=True):
                            if d.is_dir() and d.name.lower().startswith("python"):
                                candidates.append(d / "python.exe")
                    except Exception:
                        pass
            # Python launcher and package manager shims
            candidates.append(roots["sys_root"] / "py.exe")
            candidates.append(roots["local_data"] / "Programs" / "Python" / "Launcher" / "py.exe")
            candidates.append(pyenv_shims / "python.exe")
            candidates.append(scoop_shims / "python.exe")

        elif b in ("node", "nodejs"):
            candidates.append(roots["prog_files"] / "nodejs" / "node.exe")
            candidates.append(roots["prog_files_x86"] / "nodejs" / "node.exe")
            candidates.append(roots["local_data"] / "Programs" / "nodejs" / "node.exe")
            candidates.append(roots["roam_data"] / "npm" / "node.exe")
            candidates.append(scoop_shims / "node.exe")

        elif b == "wrangler":
            candidates.append(roots["roam_data"] / "npm" / "wrangler.cmd")
            candidates.append(roots["local_data"] / "Programs" / "nodejs" / "wrangler.cmd")
            candidates.append(roots["roam_data"] / "npm" / "wrangler")
            candidates.append(scoop_shims / "wrangler.cmd")

        elif b in ("pwsh", "powershell7"):
            candidates.append(roots["user_home"] / ".gemini" / "config" / "pwsh" / "pwsh.exe")
            candidates.append(repo_root / "bin" / "pwsh" / "pwsh.exe")
            for pf in (roots["prog_files"], roots["prog_files_x86"]):
                pwsh_dir = pf / "PowerShell"
                if pwsh_dir.is_dir():
                    try:
                        for v in sorted(pwsh_dir.iterdir(), reverse=True):
                            if (v / "pwsh.exe").is_file():
                                candidates.append(v / "pwsh.exe")
                    except Exception:
                        pass
            candidates.append(scoop_shims / "pwsh.exe")
            candidates.append(choco_bin / "pwsh.exe")

        elif b in ("bash", "sh"):
            candidates.append(roots["prog_files"] / "Git" / "bin" / "bash.exe")
            candidates.append(roots["prog_files"] / "Git" / "usr" / "bin" / "bash.exe")
            candidates.append(roots["prog_files"] / "Git" / "cmd" / "bash.exe")
            candidates.append(roots["prog_files_x86"] / "Git" / "bin" / "bash.exe")
            candidates.append(roots["local_data"] / "Programs" / "Git" / "bin" / "bash.exe")
            candidates.append(scoop_shims / "bash.exe")

        elif b == "git":
            candidates.append(roots["prog_files"] / "Git" / "cmd" / "git.exe")
            candidates.append(roots["prog_files"] / "Git" / "bin" / "git.exe")
            candidates.append(roots["prog_files_x86"] / "Git" / "cmd" / "git.exe")
            candidates.append(roots["local_data"] / "Programs" / "Git" / "cmd" / "git.exe")
            candidates.append(scoop_shims / "git.exe")

        return candidates

    @classmethod
    def locate(cls, binary_name, custom_paths=None):
        """Locate binary, filtering out 0-byte WindowsApps execution alias stubs."""
        if custom_paths:
            for p in custom_paths:
                po = Path(os.path.expandvars(str(p)))
                if po.is_file() and cls._is_valid_executable(po):
                    return str(po)

        # 1. Search PATH (filtering out 0-byte WindowsApps stubs)
        which_p = shutil.which(binary_name)
        if which_p and cls._is_valid_executable(Path(which_p)):
            return which_p

        # 2. Search dynamic candidate locations
        for cand in cls.get_candidate_locations(binary_name):
            if cand.is_file() and cls._is_valid_executable(cand):
                return str(cand)

        return None

    @staticmethod
    def _is_valid_executable(path_obj):
        """Reject 0-byte WindowsApps execution alias stubs."""
        p_str = str(path_obj).lower()
        if "windowsapps" in p_str:
            try:
                if path_obj.stat().st_size == 0:
                    return False
            except Exception:
                return False
        return True

    @classmethod
    def get_penetrated_path(cls):
        """Build penetrated PATH string by injecting discovered runtime directories."""
        current_path = os.environ.get("PATH", "")
        existing_dirs = [os.path.normcase(os.path.abspath(d)) for d in current_path.split(os.pathsep) if d]

        injected_dirs = []
        for b in ("python", "node", "wrangler", "pwsh", "git", "bash"):
            loc = cls.locate(b)
            if loc:
                parent_dir = os.path.dirname(loc)
                norm_parent = os.path.normcase(os.path.abspath(parent_dir))
                if norm_parent not in existing_dirs and norm_parent not in [os.path.normcase(d) for d in injected_dirs]:
                    injected_dirs.append(parent_dir)

        if injected_dirs:
            return os.pathsep.join(injected_dirs + [current_path])
        return current_path

    @classmethod
    def probe_all(cls):
        """Returns diagnostic map of host runtimes with locations and status."""
        runtimes = ["python", "node", "wrangler", "pwsh", "bash", "git"]
        status = {}
        for r in runtimes:
            loc = cls.locate(r)
            status[r] = {
                "located": loc is not None,
                "path": loc,
            }
        return status


class ExecutionEnvelope:
    """
    Unidirectional Execution Parameter Envelope.
    Sanitizes caller parameters and builds a strictly whitelisted minimal environment,
    preventing session secret leakage and unintended parent context inheritance.
    """
    ALLOWED_CONTEXT_KEYS = {"tier", "timeout", "cwd", "proxy", "capture", "custom_env"}
    ALLOWED_TIERS = {"read-only", "workspace-write", "danger-full-access", "auto"}
    WHITELIST_ENV_VARS = {
        "SYSTEMROOT", "SYSTEMDRIVE", "WINDIR", "COMSPEC", "PATHEXT",
        "TEMP", "TMP", "USERPROFILE", "USERNAME", "LOCALAPPDATA", "APPDATA",
        "PROGRAMFILES", "PROGRAMFILES(X86)", "PROGRAMDATA", "ALLUSERSPROFILE",
        "HOMEDRIVE", "HOMEPATH", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
        "LANG", "LC_ALL",
    }

    def __init__(self, tier=None, timeout=180, cwd=None, proxy=None, capture=True, custom_env=None):
        self.tier = str(tier).lower().strip() if tier else None
        try:
            self.timeout = max(1, min(int(timeout), 3600))
        except (ValueError, TypeError):
            self.timeout = 180
        self.cwd = str(Path(cwd).resolve()) if cwd and Path(cwd).is_dir() else str(Path.cwd())
        self.proxy = proxy.strip() if proxy and isinstance(proxy, str) else None
        self.capture = bool(capture)
        self.custom_env = custom_env if isinstance(custom_env, dict) else {}

    @classmethod
    def from_context(cls, context=None):
        if not context:
            return cls()
        return cls(
            tier=context.get("tier"),
            timeout=context.get("timeout", 180),
            cwd=context.get("cwd"),
            proxy=context.get("proxy"),
            capture=context.get("capture", True),
            custom_env=context.get("custom_env"),
        )

    def build_subprocess_env(self):
        """Construct sanitized minimal environment via unidirectional whitelisting and env penetration."""
        clean_env = {}
        for var_name, var_val in os.environ.items():
            if var_name.upper() in self.WHITELIST_ENV_VARS:
                clean_env[var_name] = var_val

        # Inject penetrated PATH ensuring host runtimes are reachable
        clean_env["PATH"] = HostEnvPerceiver.get_penetrated_path()

        # Enforce UTF-8 consistency
        clean_env["PYTHONUTF8"] = "1"
        clean_env["PYTHONIOENCODING"] = "utf-8"

        # Apply unidirectional proxy if configured
        if self.proxy:
            clean_env["ALL_PROXY"] = self.proxy
            clean_env["HTTPS_PROXY"] = self.proxy
            clean_env["HTTP_PROXY"] = self.proxy

        # Apply caller's explicitly whitelisted custom environment variables
        for k, v in self.custom_env.items():
            clean_env[str(k)] = str(v)

        return clean_env


class PrerequisiteEnv:
    """Declares a host runtime dependency required by a tool."""

    def __init__(self, binary, min_version=None, version_flag="--version", version_pattern=None, remediation=None, custom_paths=None):
        self.binary = binary
        self.min_version = min_version
        self.version_flag = version_flag
        self.version_pattern = version_pattern or r"(\d+\.\d+(?:\.\d+)?)"
        self.remediation = remediation or f"Please install '{binary}' and ensure it is available in PATH."
        self.custom_paths = custom_paths or []

    def locate_binary(self):
        return HostEnvPerceiver.locate(self.binary, self.custom_paths)

    def verify(self):
        loc = self.locate_binary()
        if not loc:
            return {
                "satisfied": False,
                "binary": self.binary,
                "located_path": None,
                "detected_version": None,
                "required_version": f">={self.min_version}" if self.min_version else "any",
                "message": f"Prerequisite binary '{self.binary}' not found on system.",
                "remediation": self.remediation,
            }

        if not self.min_version:
            return {
                "satisfied": True,
                "binary": self.binary,
                "located_path": loc,
                "detected_version": "available",
                "required_version": "any",
                "message": "Binary located.",
                "remediation": None,
            }

        # Check version
        try:
            r = subprocess.run(
                [loc, self.version_flag],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
            )
            out = r.stdout + " " + r.stderr
            if r.returncode != 0:
                raise RuntimeError(f"version probe exited with status {r.returncode}")
            m = re.search(self.version_pattern, out)
            detected_ver_str = m.group(1) if m else "unknown"

            detected_ver = parse_semver(detected_ver_str)
            required_ver = parse_semver(self.min_version)

            if detected_ver >= required_ver:
                return {
                    "satisfied": True,
                    "binary": self.binary,
                    "located_path": loc,
                    "detected_version": detected_ver_str,
                    "required_version": f">={self.min_version}",
                    "message": "Version requirement satisfied.",
                    "remediation": None,
                }
            else:
                return {
                    "satisfied": False,
                    "binary": self.binary,
                    "located_path": loc,
                    "detected_version": detected_ver_str,
                    "required_version": f">={self.min_version}",
                    "message": f"Version mismatch: found {detected_ver_str}, requires >={self.min_version}.",
                    "remediation": self.remediation,
                }
        except Exception as e:
            return {
                "satisfied": False,
                "binary": self.binary,
                "located_path": loc,
                "detected_version": "probe_error",
                "required_version": f">={self.min_version}",
                "message": f"Failed probing binary version: {e}",
                "remediation": self.remediation,
            }


class ErrBlock:
    """Structured refusal message block when execution is rejected."""

    def __init__(self, error_code, tool_id, tool_name, category, refusal_statement, details, remediations):
        self.error_code = error_code
        self.tool_id = tool_id
        self.tool_name = tool_name
        self.category = category
        self.refusal_statement = refusal_statement
        self.details = details
        self.remediations = remediations

    def to_dict(self):
        return {
            "status": "REFUSED",
            "error_code": self.error_code,
            "tool_id": self.tool_id,
            "tool_name": self.tool_name,
            "category": str(self.category),
            "refusal_statement": self.refusal_statement,
            "details": self.details,
            "remediations": self.remediations,
        }

    def format_cli(self):
        lines = [
            f"❌ [DSHA 拒绝执行 · {self.error_code}]",
            f"  受限工具: [{self.category}] {self.tool_name} (id: {self.tool_id})",
            f"  阻断原因: {self.refusal_statement}",
        ]
        if self.details:
            lines.append("  详细判据:")
            for d in self.details:
                if "binary" in d:
                    req = d.get("required_version", "any")
                    cur = d.get("detected_version") or "missing"
                    lines.append(f"    - {d.get('binary')}: 要求 {req} (实测: {cur})")
                elif "active_tier" in d:
                    lines.append(f"    - 当前权限档位: {d.get('active_tier')}, 工具风险级别: {d.get('tool_risk_level')}")
        if self.remediations:
            lines.append("  环境修复指引:")
            for r in self.remediations:
                lines.append(f"    💡 {r}")
        return "\n".join(lines)


class BaseTool(ABC):
    """Abstract Base Class for all DSHA tools."""

    def __init__(
        self,
        tool_id,
        name,
        category,
        risk_level,
        version,
        description,
        cmd,
        script=None,
        prerequisites=None,
        keywords=None,
        extensions=None,
        exact_filenames=None,
        weight=1.0,
    ):
        self.id = tool_id
        self.name = name
        self.category = ToolCategory(category) if isinstance(category, str) else category
        self.risk_level = RiskLevel(risk_level) if isinstance(risk_level, str) else risk_level
        self.version = version
        self.description = description
        self.cmd = cmd
        self.script = script
        self.prerequisites = prerequisites or []
        self.keywords = keywords or []
        self.extensions = extensions or []
        self.exact_filenames = exact_filenames or []
        self.weight = weight

    def assert_environment(self):
        """Verifies that all required host runtimes are installed."""
        failed_prereqs = []
        remediations = []
        for req in self.prerequisites:
            res = req.verify()
            if not res["satisfied"]:
                failed_prereqs.append(res)
                if res.get("remediation"):
                    remediations.append(res["remediation"])

        if failed_prereqs:
            err = ErrBlock(
                error_code="ERR_PREREQUISITE_MISSING",
                tool_id=self.id,
                tool_name=self.name,
                category=self.category.value,
                refusal_statement=f"DSHA 拒绝执行: 工具 '{self.id}' 缺少必需宿主运行环境，DSHA 坚持不臃肿合并运行时的纯净原则。",
                details=failed_prereqs,
                remediations=remediations,
            )
            return False, err
        return True, None

    def assert_authorization(self, active_tier=None):
        """Anti-privilege escalation gate: strictly blocks unauthorized operations."""
        # A caller's context may restrict, never replace the active host tier.
        tiers = [str(get_active_tier()).strip().lower()]
        if active_tier is not None:
            tiers.append(str(active_tier).strip().lower())
        valid = {"read-only", "workspace-write", "danger-full-access", "auto"}
        invalid = next((value for value in tiers if value not in valid), None)
        tier = "read-only" if "read-only" in tiers else tiers[0]

        # Strict permission tier rules:
        # read-only: blocks medium and admin tools from modifying or executing privileged operations
        if invalid is not None or (tier == "read-only" and self.risk_level in (RiskLevel.MEDIUM, RiskLevel.ADMIN)):
            err = ErrBlock(
                error_code="ERR_PERMISSION_DENIED",
                tool_id=self.id,
                tool_name=self.name,
                category=self.category.value,
                refusal_statement=f"DSHA 越权拦截: 当前权限处于 '{tier}' 档位，禁止调用具有修改/写操作风险等级 ({self.risk_level.value}) 的工具。",
                details=[{"active_tier": tiers[0], "requested_tier": active_tier, "invalid_tier": invalid, "tool_risk_level": self.risk_level.value}],
                remediations=["如需执行此操作，请先确认并将权限档位切换为 workspace-write、auto 或 danger-full-access。"],
            )
            return False, err

        return True, None

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.value,
            "risk_level": self.risk_level.value,
            "version": self.version,
            "description": self.description,
            "cmd": self.cmd,
            "script": self.script,
            "prerequisites": [
                {
                    "binary": p.binary,
                    "min_version": p.min_version,
                    "remediation": p.remediation,
                }
                for p in self.prerequisites
            ],
            "keywords": self.keywords,
            "extensions": self.extensions,
            "exact_filenames": self.exact_filenames,
            "weight": self.weight,
        }

    def resolve_executable(self):
        cmd_name = self.cmd
        script_dir = Path(__file__).resolve().parent
        repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir
        user_home = Path(os.environ.get("USERPROFILE") or ".")

        candidate_locations = [
            repo_root / "bin" / cmd_name,
            user_home / ".gemini" / "config" / cmd_name,
            repo_root / cmd_name,
        ]
        for p in candidate_locations:
            if p.is_file():
                return str(p)

        which_path = shutil.which(cmd_name)
        if which_path:
            return which_path
        return None

    def assert_target_contained(self, exec_path):
        """解析出的可执行目标必须落在白名单根之内。

        前置断言证明“运行时存在”；这条证明“要跑的就是索引声明的那个东西”。
        元数据被改、或工具名被拼成相对路径时，前置断言挡不住，这条可以。
        """
        target = Path(exec_path).resolve()
        script_dir = Path(__file__).resolve().parent
        repo_root = script_dir.parent if script_dir.name in ("scripts", "bin") else script_dir
        user_home = Path(os.environ.get("USERPROFILE") or ".")
        allowed_roots = [
            (repo_root / "bin").resolve(),
            (user_home / ".gemini" / "config").resolve(),
        ]
        for root in allowed_roots:
            try:
                target.relative_to(root)
                return True, None
            except ValueError:
                continue
        which_path = shutil.which(self.cmd)
        if which_path and Path(which_path).resolve() == target:
            return True, None
        err = ErrBlock(
            error_code="ERR_TARGET_OUTSIDE_SANDBOX",
            tool_id=self.id,
            tool_name=self.name,
            category=self.category.value,
            refusal_statement=(
                f"DSHA 拒绝执行: 解析出的目标 '{target}' 不在允许的根之内"
                "(仓库 bin/ 与 ~/.gemini/config/)。"
            ),
            details=[{"binary": str(target), "reason": "target-outside-sandbox"}],
            remediations=[
                "确认 DSHA-Index 里该工具的 cmd 未被改写成相对路径或仓库外路径。",
                "如确需仓库外目标，请先在白名单中显式声明它，再重试。",
            ],
        )
        return False, err

    def execute(self, args=None, context=None):
        if args is None:
            args = []
        if context is None:
            context = {}

        # 0. Convert context into unidirectional ExecutionEnvelope
        envelope = ExecutionEnvelope.from_context(context)

        # 1. Environment Assertion (No bundled runtime principle)
        ok_env, err_env = self.assert_environment()
        if not ok_env:
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 126,
                "stdout": "",
                "stderr": err_env.format_cli(),
                "err_block": err_env.to_dict(),
                "duration_ms": 0,
            }

        # 2. Authorization Assertion (Anti-privilege escalation principle)
        active_tier = envelope.tier
        ok_auth, err_auth = self.assert_authorization(active_tier)
        if not ok_auth:
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 126,
                "stdout": "",
                "stderr": err_auth.format_cli(),
                "err_block": err_auth.to_dict(),
                "duration_ms": 0,
            }

        # 3. Resolve Launcher
        exec_path = self.resolve_executable()
        if not exec_path:
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 127,
                "stdout": "",
                "stderr": f"[DSHA] Error: Launcher '{self.cmd}' could not be resolved on disk.",
                "duration_ms": 0,
            }

        # 3.5 Target Containment Assertion (目标必须在白名单根内)
        ok_contained, err_contained = self.assert_target_contained(exec_path)
        if not ok_contained:
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 125,
                "stdout": "",
                "stderr": f"[DSHA] Error: target outside allowed roots: {exec_path}",
                "duration_ms": 0,
                "err_block": err_contained.to_dict() if err_contained is not None else {},
            }

        # 4. Execute with Environment Isolation & Unidirectional Parameter Envelope
        start_time = time.time()
        exec_env = envelope.build_subprocess_env()
        cwd = envelope.cwd
        timeout = envelope.timeout

        if exec_path.endswith(".ps1"):
            script_dir = Path(__file__).resolve().parent
            pwsh_bin = script_dir.parent / "bin" / "pwsh.cmd"
            cmd_list = [str(pwsh_bin), "-NoProfile", "-File", exec_path] + args
        else:
            cmd_list = [exec_path] + args

        capture = envelope.capture

        try:
            if capture:
                proc = subprocess.run(
                    cmd_list,
                    cwd=cwd,
                    env=exec_env,
                    capture_output=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=timeout,
                )
                duration_ms = int((time.time() - start_time) * 1000)
                return {
                    "success": proc.returncode == 0,
                    "tool": self.id,
                    "tool_name": self.name,
                    "category": self.category.value,
                    "exit_code": proc.returncode,
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "duration_ms": duration_ms,
                    "cmd": cmd_list,
                }
            else:
                proc = subprocess.run(cmd_list, cwd=cwd, env=exec_env, timeout=timeout)
                duration_ms = int((time.time() - start_time) * 1000)
                return {
                    "success": proc.returncode == 0,
                    "tool": self.id,
                    "tool_name": self.name,
                    "category": self.category.value,
                    "exit_code": proc.returncode,
                    "stdout": "",
                    "stderr": "",
                    "duration_ms": duration_ms,
                    "cmd": cmd_list,
                }
        except subprocess.TimeoutExpired:
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 124,
                "stdout": "",
                "stderr": f"[DSHA] Execution timed out after {timeout} seconds.",
                "duration_ms": duration_ms,
            }
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            return {
                "success": False,
                "tool": self.id,
                "tool_name": self.name,
                "category": self.category.value,
                "exit_code": 1,
                "stdout": "",
                "stderr": f"[DSHA] Execution error: {e}",
                "duration_ms": duration_ms,
            }


# Concrete Tool Implementations


class CFTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="cf",
            name="Cloudflare Web & Edge Engine",
            category=ToolCategory.WEB_EDGE,
            risk_level=RiskLevel.MEDIUM,
            version="1.0.0",
            description="Cloudflare Workers, Pages, Tunnels, Web deployment, Edge APIs & Forge OpenAPI",
            cmd="cf.cmd",
            script="dsha_cf.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="node",
                    min_version="20.0.0",
                    remediation="Install Node.js >= 20.0.0 via 'winget install OpenJS.NodeJS.LTS' or https://nodejs.org",
                ),
                PrerequisiteEnv(
                    binary="wrangler",
                    remediation="Install Wrangler CLI via 'npm install -g wrangler' or use npx wrangler.",
                ),
            ],
            keywords=[
                "cloudflare", "wrangler", "worker", "workers", "pages", "tunnel",
                "web", "edge", "deploy", "serverless", "dns", "kv", "r2", "d1",
                "frontend", "http", "api", "ingress", "部署", "网页", "前端", "边缘计算", "函数计算", "隧道", "域名"
            ],
            extensions=[".html", ".css", ".ts", ".tsx", ".js", ".jsx", ".wasm", ".toml"],
            exact_filenames=["wrangler.toml", "wrangler.json", "package.json", "index.html"],
            weight=1.0,
        )


class REATool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="rea",
            name="Reverse Engineer Anything (REA)",
            category=ToolCategory.REVERSE_ENGINEERING,
            risk_level=RiskLevel.LOW,
            version="1.0.0",
            description="Binary analysis, PE/ELF/Mach-O inspection, ASAR unpack, APK decompilation",
            cmd="rea.cmd",
            script="dsha_rea_driver.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="python",
                    min_version="3.10.0",
                    remediation="Install Python >= 3.10 via 'winget install Python.Python.3.12' or https://python.org",
                ),
            ],
            keywords=[
                "reverse", "decompile", "disassemble", "unpack", "binary", "pe",
                "elf", "macho", "apk", "asar", "dex", "section", "iat", "import table",
                "inspect-artifact", "ghidra", "hopper", "ida", "strings",
                "逆向", "反编译", "解包", "脱壳", "查壳", "节表", "导入表", "二进制分析", "反汇编"
            ],
            extensions=[".exe", ".dll", ".so", ".dylib", ".apk", ".asar", ".dex", ".class", ".bin", ".sys"],
            exact_filenames=[],
            weight=1.0,
        )


class ScribeTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="scribe",
            name="DSHA Scribe (Chronicler & Archivist)",
            category=ToolCategory.ARCHIVIST,
            risk_level=RiskLevel.READ_ONLY,
            version="1.0.0",
            description="Log harvesting, error stack trace indexing, research dossier synthesis",
            cmd="scribe.cmd",
            script="scribe.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="python",
                    min_version="3.10.0",
                    remediation="Install Python >= 3.10 via 'winget install Python.Python.3.12' or https://python.org",
                ),
            ],
            keywords=[
                "log", "audit", "dossier", "triage", "trace", "error", "exception",
                "harvest", "chronicler", "incident", "briefing", "diagnose", "investigate",
                "stacktrace", "failed", "exit code",
                "日志", "收录", "简报", "审计", "崩溃", "报错", "异常", "排查", "门禁记录", "堆栈", "诊断", "复盘"
            ],
            extensions=[".log", ".jsonl"],
            exact_filenames=["gate.log", "transcript.jsonl"],
            weight=1.0,
        )


class PwshTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="pwsh",
            name="DSHA Dedicated PowerShell 7",
            category=ToolCategory.SYSADMIN,
            risk_level=RiskLevel.MEDIUM,
            version="7.6.6",
            description="Parenthesis-safe PowerShell 7 pipeline and Windows automation",
            cmd="dsha-pwsh.cmd",
            script=None,
            prerequisites=[
                PrerequisiteEnv(
                    binary="pwsh",
                    min_version="7.0.0",
                    remediation="Install PowerShell 7 via 'winget install Microsoft.PowerShell' or https://github.com/PowerShell/PowerShell",
                ),
            ],
            keywords=[
                "powershell", "pwsh", "cmdlet", "pipeline", "wmi", "cim", "get-process",
                "set-executionpolicy", "active directory", "windows service",
                "管道", "进程", "脚本执行", "注册表"
            ],
            extensions=[".ps1", ".psm1", ".psd1"],
            exact_filenames=[],
            weight=1.0,
        )


class ShTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="sh",
            name="DSHA Safe GNU Bash",
            category=ToolCategory.SYSADMIN,
            risk_level=RiskLevel.MEDIUM,
            version="5.3",
            description="POSIX shell automation, Git Bash utilities (grep, awk, sed, curl)",
            cmd="dsha-sh.cmd",
            script=None,
            prerequisites=[
                PrerequisiteEnv(
                    binary="bash",
                    remediation="Install Git for Windows (includes GNU Bash) via 'winget install Git.Git' or https://git-scm.com",
                ),
            ],
            keywords=[
                "bash", "sh", "posix", "shell", "grep", "sed", "awk", "curl", "chmod", "export", "终端脚本"
            ],
            extensions=[".sh", ".bash"],
            exact_filenames=["Makefile", "Dockerfile"],
            weight=0.8,
        )


class TierTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="tier",
            name="DSH Permission Tier Gate",
            category=ToolCategory.POLICY_RADAR,
            risk_level=RiskLevel.ADMIN,
            version="1.0.0",
            description="Antigravity permission tier management (read-only, auto, danger-full-access, workspace-write)",
            cmd="agy-tier.ps1",
            script="gate.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="pwsh",
                    min_version="7.0.0",
                    remediation="Install PowerShell 7 via 'winget install Microsoft.PowerShell'",
                ),
            ],
            keywords=[
                "tier", "permission", "sandbox", "read-only", "danger-full-access",
                "workspace-write", "gate", "switch tier", "grant",
                "权限", "档位", "切档", "只读", "全权", "沙箱", "放行"
            ],
            extensions=[],
            exact_filenames=["tier.json"],
            weight=1.1,
        )


class MeterTool(BaseTool):
    def __init__(self):
        super().__init__(
            tool_id="meter",
            name="DSHA Quota Floating Radar",
            category=ToolCategory.POLICY_RADAR,
            risk_level=RiskLevel.LOW,
            version="1.0.0",
            description="5H / 7D sliding window token and quota visual monitoring HUD",
            cmd="agy-meter.ps1",
            script="meter.py",
            prerequisites=[
                PrerequisiteEnv(
                    binary="pwsh",
                    min_version="7.0.0",
                    remediation="Install PowerShell 7 via 'winget install Microsoft.PowerShell'",
                ),
            ],
            keywords=[
                "meter", "quota", "token", "floating window", "hud", "radar", "5h", "7d", "watermark",
                "额度", "悬浮窗", "雷达", "回血", "水位", "代币"
            ],
            extensions=[],
            exact_filenames=[],
            weight=1.1,
        )


class ToolRegistry:
    """Central registry supporting class-based tool registration and category queries."""

    def __init__(self):
        self._registry = {}

    def register(self, tool_or_cls):
        if isinstance(tool_or_cls, type) and issubclass(tool_or_cls, BaseTool):
            tool = tool_or_cls()
        elif isinstance(tool_or_cls, BaseTool):
            tool = tool_or_cls
        else:
            raise TypeError("Expected BaseTool instance or subclass")
        self._registry[tool.id.lower()] = tool
        return tool

    def get(self, tool_id):
        if not tool_id:
            return None
        return self._registry.get(str(tool_id).lower())

    def get_by_category(self, category):
        cat_str = (category.value if isinstance(category, ToolCategory) else str(category)).lower()
        results = []
        for tool in self._registry.values():
            if tool.category.value.lower() == cat_str or tool.category.name.lower() == cat_str:
                results.append(tool)
        return results

    def list_categories(self):
        cats = set()
        for tool in self._registry.values():
            cats.add(tool.category.value)
        return sorted(list(cats))

    def all(self):
        return dict(self._registry)

    def to_legacy_dict(self):
        """Backward-compatible dictionary matching the previous DSHA_INDEX format."""
        d = {}
        for t_id, t in self._registry.items():
            d[t_id] = {
                "id": t.id,
                "name": t.name,
                "category": t.category.value,
                "cmd": t.cmd,
                "script": t.script,
                "version": t.version,
                "description": t.description,
                "tags": [t.category.value.lower(), t.id] + [k for k in t.keywords[:3]],
                "extensions": t.extensions,
                "exact_filenames": t.exact_filenames,
                "risk_level": t.risk_level.value,
                "prerequisites": [
                    {"binary": p.binary, "min_version": p.min_version, "remediation": p.remediation}
                    for p in t.prerequisites
                ],
                "keywords": t.keywords,
                "weight": t.weight,
            }
        return d


# Initialize global registry and register all standard tools
TOOL_REGISTRY = ToolRegistry()
TOOL_REGISTRY.register(CFTool)
TOOL_REGISTRY.register(REATool)
TOOL_REGISTRY.register(ScribeTool)
TOOL_REGISTRY.register(PwshTool)
TOOL_REGISTRY.register(ShTool)
TOOL_REGISTRY.register(TierTool)
TOOL_REGISTRY.register(MeterTool)


def Call_Tools(tool_name, args=None, context=None):
    """
    Unified Parallel Tool Execution via BaseTool.
    Validates environment prerequisites and anti-privilege authorization before launch.
    """
    if args is None:
        args = []
    if context is None:
        context = {}

    tool = TOOL_REGISTRY.get(tool_name)
    if not tool:
        return {
            "success": False,
            "tool": tool_name,
            "exit_code": 127,
            "stdout": "",
            "stderr": f"[DSHA] Error: Tool '{tool_name}' not registered in DSHA ToolRegistry.",
            "duration_ms": 0,
        }

    return tool.execute(args, context)


def run_selftest():
    tests = []

    # Test 1: Registry completeness (7 tools)
    tests.append(("registry_7_tools", len(TOOL_REGISTRY.all()) == 7))

    # Test 2: Category query WebEdge
    we_tools = TOOL_REGISTRY.get_by_category(ToolCategory.WEB_EDGE)
    tests.append(("category_query_webedge", len(we_tools) == 1 and we_tools[0].id == "cf"))

    # Test 3: Category query SysAdmin
    sa_tools = TOOL_REGISTRY.get_by_category("SysAdmin")
    tests.append(("category_query_sysadmin", len(sa_tools) == 2 and {t.id for t in sa_tools} == {"pwsh", "sh"}))

    # Test 4: Category query Archivist
    ar_tools = TOOL_REGISTRY.get_by_category("Archivist")
    tests.append(("category_query_archivist", len(ar_tools) == 1 and ar_tools[0].id == "scribe"))

    # Test 5: Category query PolicyRadar
    pr_tools = TOOL_REGISTRY.get_by_category("PolicyRadar")
    tests.append(("category_query_policyradar", len(pr_tools) == 2 and {t.id for t in pr_tools} == {"tier", "meter"}))

    # Test 6: Category query ReverseEngineering
    re_tools = TOOL_REGISTRY.get_by_category("ReverseEngineering")
    tests.append(("category_query_reverse", len(re_tools) == 1 and re_tools[0].id == "rea"))

    # Test 7: List all categories (5 distinct categories)
    cats = TOOL_REGISTRY.list_categories()
    tests.append(("list_categories_5", len(cats) == 5))

    # Test 8: Host Python prerequisite verified
    scribe_tool = TOOL_REGISTRY.get("scribe")
    ok_env, _ = scribe_tool.assert_environment()
    tests.append(("scribe_env_satisfied", ok_env))

    # Test 9: Host Pwsh prerequisite verified
    pwsh_tool = TOOL_REGISTRY.get("pwsh")
    ok_env_pwsh, _ = pwsh_tool.assert_environment()
    tests.append(("pwsh_env_satisfied", ok_env_pwsh))

    # Test 10: Missing prerequisite triggers ErrBlock refusal
    class MissingPrereqTool(BaseTool):
        def __init__(self):
            super().__init__(
                tool_id="missing_tool",
                name="Tool with Missing Binary",
                category=ToolCategory.SYSADMIN,
                risk_level=RiskLevel.LOW,
                version="1.0.0",
                description="Test tool",
                cmd="missing.cmd",
                prerequisites=[
                    PrerequisiteEnv(binary="nonexistent_virtual_binary_999", min_version="9.9.9")
                ],
            )

    missing_tool = MissingPrereqTool()
    res_missing = missing_tool.execute()
    tests.append((
        "missing_prereq_err_block",
        not res_missing["success"]
        and res_missing["exit_code"] == 126
        and "ERR_PREREQUISITE_MISSING" in res_missing["stderr"]
        and "err_block" in res_missing
    ))

    # Test 11: Anti-privilege escalation blocks modifying tool under read-only tier
    res_auth = pwsh_tool.execute(context={"tier": "read-only"})
    tests.append((
        "anti_privilege_escalation_read_only",
        not res_auth["success"]
        and res_auth["exit_code"] == 126
        and "ERR_PERMISSION_DENIED" in res_auth["stderr"]
    ))

    # Test 12: Read-only tool permitted under read-only tier
    ok_auth_scribe, err_auth_scribe = scribe_tool.assert_authorization("read-only")
    tests.append(("read_only_tool_permitted_under_read_only", ok_auth_scribe and err_auth_scribe is None))

    # Test 13: Class extensibility - custom tool subclassing BaseTool and registering
    class CustomTelemetryTool(BaseTool):
        def __init__(self):
            super().__init__(
                tool_id="custom_telemetry",
                name="Custom Telemetry Extension",
                category=ToolCategory.POLICY_RADAR,
                risk_level=RiskLevel.READ_ONLY,
                version="2.0.0",
                description="User custom extension tool",
                cmd="scribe.cmd",
            )

    custom_instance = TOOL_REGISTRY.register(CustomTelemetryTool)
    tests.append((
        "class_extensibility_registration",
        TOOL_REGISTRY.get("custom_telemetry") is not None
        and TOOL_REGISTRY.get("custom_telemetry").version == "2.0.0"
    ))

    # Test 11: Containment refuses a target outside the sandbox
    _probe = TOOL_REGISTRY.get("scribe")
    outside_target = str(Path(os.environ.get("SystemRoot") or "/outside_sandbox").resolve() / "System32" / "cmd.exe")
    _ok_out, _ = _probe.assert_target_contained(outside_target)
    tests.append(("containment_refuses_outside", not _ok_out))

    # Test 12: Containment allows the declared launcher
    _declared = _probe.resolve_executable()
    _ok_in, _ = _probe.assert_target_contained(_declared) if _declared else (False, None)
    tests.append(("containment_allows_declared", bool(_ok_in)))

    # Test 13: HostEnvPerceiver probes all 6 runtimes dynamically without hardcoded paths
    probe_map = HostEnvPerceiver.probe_all()
    tests.append((
        "host_env_perceiver_dynamic_probe",
        isinstance(probe_map, dict)
        and len(probe_map) == 6
        and probe_map["python"]["located"] is True
    ))

    # Test 14: ExecutionEnvelope strictly isolates parent secrets (unidirectional sanitization)
    old_token = os.environ.get("SENSITIVE_LEAK_TOKEN")
    try:
        os.environ["SENSITIVE_LEAK_TOKEN"] = "stolen_session_secret"
        env_envelope = ExecutionEnvelope.from_context({"tier": "auto", "custom_env": {"EXPLICIT_SAFE": "1"}})
        sanitized_env = env_envelope.build_subprocess_env()
        tests.append((
            "execution_envelope_secret_isolation",
            "SENSITIVE_LEAK_TOKEN" not in sanitized_env
            and sanitized_env.get("EXPLICIT_SAFE") == "1"
            and sanitized_env.get("PYTHONUTF8") == "1"
            and "PATH" in sanitized_env
        ))
    finally:
        if old_token is not None:
            os.environ["SENSITIVE_LEAK_TOKEN"] = old_token
        else:
            os.environ.pop("SENSITIVE_LEAK_TOKEN", None)

    # Test 15: ExecutionEnvelope unidirectional parameter bounds
    bounded_envelope = ExecutionEnvelope.from_context({"timeout": 999999, "tier": " READ-ONLY "})
    tests.append((
        "execution_envelope_param_bounds",
        bounded_envelope.timeout == 3600
        and bounded_envelope.tier == "read-only"
    ))

    passed = sum(1 for _, ok in tests if ok)
    total = len(tests)
    print(f"selftest: {passed}/{total}")
    for name, ok in tests:
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}")
    return passed == total


def main():
    parser = argparse.ArgumentParser(description="DSHA BaseTool & Prerequisite Environment Architecture")
    subparsers = parser.add_subparsers(dest="subcmd", help="Subcommand")

    # list
    list_p = subparsers.add_parser("list", help="List registered tools")
    list_p.add_argument("-c", "--category", help="Filter by category (WebEdge, Archivist, etc.)")
    list_p.add_argument("--json", action="store_true", help="Output in JSON format")

    # categories
    subparsers.add_parser("categories", help="List all tool categories")

    # check
    check_p = subparsers.add_parser("check", help="Check prerequisite environments")
    check_p.add_argument("tool", nargs="?", help="Tool ID to check (optional)")

    # selftest
    subparsers.add_parser("selftest", help="Run automated unit tests")

    args = parser.parse_args()

    if args.subcmd == "selftest":
        ok = run_selftest()
        sys.exit(0 if ok else 1)

    if args.subcmd == "categories":
        for cat in TOOL_REGISTRY.list_categories():
            count = len(TOOL_REGISTRY.get_by_category(cat))
            print(f"  • {cat.ljust(22)} ({count} tools)")
        return 0

    if args.subcmd == "check":
        tools_to_check = [TOOL_REGISTRY.get(args.tool)] if args.tool else list(TOOL_REGISTRY.all().values())
        all_ok = True
        for t in tools_to_check:
            if not t:
                print(f"Tool '{args.tool}' not found.", file=sys.stderr)
                return 1
            ok, err = t.assert_environment()
            if ok:
                print(f"  [PASS] [{t.category.value}] {t.name} (id: {t.id}) - All prerequisites satisfied.")
            else:
                all_ok = False
                print(err.format_cli())
        return 0 if all_ok else 1

    if args.subcmd == "list" or not args.subcmd:
        tools = list(TOOL_REGISTRY.all().values())
        if getattr(args, "category", None):
            tools = TOOL_REGISTRY.get_by_category(args.category)

        if getattr(args, "json", False):
            print(json.dumps([t.to_dict() for t in tools], ensure_ascii=False, indent=2))
            return 0

        print(f"=== 🛠️ DSHA 工具类目与环境声明清单 ({len(tools)} 工具) ===")
        print(f"| {'标识'.ljust(8)} | {'类目'.ljust(20)} | {'工具名称'.ljust(30)} | {'风险等级'.ljust(10)} | {'依赖环境'} |")
        print(f"|{'-'*10}|{'-'*22}|{'-'*32}|{'-'*12}|{'-'*20}|")
        for t in tools:
            prereq_str = ", ".join([p.binary for p in t.prerequisites]) or "none"
            print(f"| {t.id.ljust(8)} | {t.category.value.ljust(20)} | {t.name.ljust(30)} | {t.risk_level.value.ljust(10)} | {prereq_str} |")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())

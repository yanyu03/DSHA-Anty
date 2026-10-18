#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DSH Permissions -- PreToolUse gate for Antigravity.

Ports the four DeepSeek Harness permission presets onto Antigravity's lifecycle
hook system.  Antigravity calls this once per tool call with the context as JSON
on stdin and expects a JSON decision on stdout:

    stdin : {"toolCall":{"name":"run_command","args":{"CommandLine":"npm test"}},
             "conversationId":"...","workspacePaths":[...],"stepIdx":19,...}
    stdout: {"decision":"allow|deny|ask|force_ask","reason":"...",
             "permissionOverrides":["command(npm test)"]}

The active tier is read from tier.json next to this plugin (written by
agy-tier.ps1).  Tiers whose behaviour Antigravity's native settings already
express (workspace-write, danger-full-access) run with the hook DISABLED, so
they pay nothing per call; only read-only and auto are gated here.

Design rules that matter:
  * stdout is always ASCII (ensure_ascii) and always a single valid JSON object,
    so odd console code pages cannot corrupt the protocol.
  * stdin is read as raw bytes and decoded as UTF-8, because a Windows console
    default of cp936 would otherwise mangle non-ASCII commands.
  * Every path is wrapped so the hook never dies without emitting a decision.
"""

import json
import os
import re
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIER_PATH = os.path.join(BASE_DIR, "tier.json")
LOG_PATH = os.path.join(BASE_DIR, "logs", "gate.log")
LOG_MAX_BYTES = 512 * 1024          # rotate past this; the old plugin grew unbounded
LOG_CMD_CHARS = 200                 # never dump whole scripts into the log

# ---------------------------------------------------------------------------
# Tool classes (tool names = Cortex step type, CORTEX_STEP_TYPE_ stripped,
# lowercased -- see Antigravity's built-in agy-customizations docs).
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Tool classes.
#
# The authoritative list comes from this deployment's own system prompt, which
# enumerates the tools the agent actually receives:
#
#   view_file run_command manage_task send_message schedule invoke_subagent
#   define_subagent manage_subagents write_to_file replace_file_content
#   generate_image read_url_content search_web find_by_name grep_search
#   list_dir ask_question                 (+ notebook_edit, seen in the binary)
#
# That is a long way from what the built-in docs imply. The docs say a tool name
# is the Cortex step type lowercased with CORTEX_STEP_TYPE_ stripped, which gives
# list_directory / write_file / edit_file; the real names are list_dir /
# write_to_file / replace_file_content. Both have already cost something:
# deny-by-default on list_dir hard-blocked a legitimate read, and a write tool
# missing from WRITE_TOOLS would slip past read-only.
# ---------------------------------------------------------------------------
READ_TOOLS = frozenset([
    # from the live tool list
    "list_dir", "view_file", "grep_search", "find_by_name", "search_web",
    "read_url_content", "ask_question", "manage_task", "manage_subagents",
    "send_message",
    # aliases and names seen in the binary, kept so a rename only costs a prompt
    "read_file", "list_directory", "list_files", "code_search", "find",
    "find_file", "find_all_references", "list_resources", "internal_search",
    "web_search", "read_url", "moma_search", "conversation_history",
    "code_acknowledgement", "get_conversation_metadata",
    # browser reads
    "list_browser_pages", "capture_browser_screenshot",
    "capture_browser_console_logs", "browser_get_dom",
    "browser_get_network_request", "browser_list_network_requests",
    # meta steps that change nothing locally
    "command_status", "findings", "checkpoint",
])

# Tools that mutate state.  Kept explicit, because an unknown name is only
# escalated rather than blocked (see decide_read_only).
WRITE_TOOLS = frozenset([
    # from the live tool list -- the ones that actually write or spawn work
    "run_command", "write_to_file", "replace_file_content", "generate_image",
    "schedule", "invoke_subagent", "define_subagent",
    # aliases and names seen in the binary
    "notebook_edit", "edit_notebook", "execute_notebook", "file_change",
    "create_file", "write_file", "edit_file", "delete_file", "move_file",
    "apply_patch", "delete_directory", "move", "git_commit", "mcp_tool",
    "memory", "brain_update", "ki_insertion", "deploy_firebase",
    "install_applet_dependencies", "install_applet_package", "lint_applet",
    "lint_diff", "compile", "compile_applet", "build_cleaner",
    "blaze_build_targets", "blaze_test_targets", "cloud_sql_execute_sql",
    "cloud_sql_update_schema", "execute_url", "execute_browser_javascript",
    "browser_click_element", "browser_input", "browser_press_key",
    "browser_select_option", "browser_refresh_page", "browser_mouse_wheel",
    "browser_move_mouse", "browser_mouse_down", "browser_mouse_up",
    "browser_drag_pixel_to_pixel", "click_browser_pixel", "agency_tool_call",
    "code_action", "multicall",
])

# ---------------------------------------------------------------------------
# Command classification
# ---------------------------------------------------------------------------
# Commands that only observe.  `git` and friends need a subcommand check,
# because `git status` reads but `git commit` writes.
PURE_READ_COMMANDS = frozenset([
    "ls", "dir", "pwd", "cd", "cat", "type", "head", "tail", "more", "less",
    "echo", "where", "which", "tree", "wc", "sort", "uniq", "diff", "cmp",
    "grep", "findstr", "rg", "fd", "stat", "file", "du", "df", "date", "whoami",
    "hostname", "ver", "uname", "id", "env", "set", "printenv", "tasklist",
    "get-childitem", "get-content", "get-location", "get-command", "get-item",
    "get-process", "get-service", "get-help", "get-member", "get-date",
    "get-host", "get-variable", "select-string", "select-object", "where-object",
    "test-path", "resolve-path", "split-path", "join-path", "measure-object",
    "sort-object", "format-table", "format-list", "convertto-json", "out-string",
    "write-output", "measure-command",
])

# `git <sub>` that only read.
GIT_READ_SUBCOMMANDS = frozenset([
    "status", "diff", "log", "show", "rev-parse", "branch", "tag", "remote",
    "config", "describe", "blame", "shortlog", "ls-files", "ls-tree", "cat-file",
    "whatchanged", "reflog", "stash", "worktree", "grep", "help", "version",
])

# Package managers / runtimes / build tools that only report.
PROBE_SUBCOMMANDS = {
    "npm": {"--version", "-v", "ls", "list", "view", "info", "outdated", "why", "ping", "config"},
    "pnpm": {"--version", "-v", "list", "ls", "why", "outdated"},
    "yarn": {"--version", "-v", "list", "info", "why", "outdated"},
    "pip": {"--version", "-v", "list", "freeze", "show", "check"},
    "pip3": {"--version", "-v", "list", "freeze", "show", "check"},
    "python": {"--version", "-v", "-V"},
    "python3": {"--version", "-v", "-V"},
    "py": {"--version", "-v", "-V", "-0"},
    "node": {"--version", "-v"},
    "cargo": {"--version", "-V", "metadata", "tree"},
    "go": {"version", "env", "list"},
    "dotnet": {"--version", "--list-sdks", "--list-runtimes", "--info"},
}

DANGEROUS_PATTERNS = [
    # whole-drive / whole-volume destruction
    r"(?i)\b(rmdir|rd)\s+/[sq]\b[^|;&]*\b[a-z]:[\\/]?\s*$",
    r"(?i)\bdel\s+/[fsq]\b[^|;&]*\b[a-z]:[\\/]?\s*$",
    r"(?i)\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+(/|[a-z]:[\\/]?)\s*(\*|$)",
    r"(?i)\bremove-item\b[^|;&]*-recurse[^|;&]*\b([a-z]:[\\/]?\s*$|c:\\windows)",
    r"(?i)\b(format|format-volume|clear-disk|initialize-disk)\b",
    r"(?i)\bdiskpart\b",
    # boot / firmware / registry hives
    r"(?i)\bbcdedit\b", r"(?i)\bbootrec\b",
    r"(?i)\breg\s+delete\b[^|;&]*(hklm|hkey_local_machine)",
    r"(?i)\bremove-item\b[^|;&]*(hklm|hkey_local_machine)",
    # power / session
    r"(?i)\b(shutdown|logoff)\b\s*(/[a-z]|-)",
    r"(?i)\bstop-computer\b", r"(?i)\brestart-computer\b",
    # credential / secret exfiltration
    r"(?i)\b(type|cat|get-content)\b[^|;&]*(\.ssh[\\/]id_|\.aws[\\/]credentials|\.credentials\.yaml|_netrc)",
    r"(?i)\bcurl\b[^|;&]*\|\s*(ba)?sh\b", r"(?i)\bwget\b[^|;&]*\|\s*(ba)?sh\b",
    r"(?i)\binvoke-expression\b[^|;&]*\|\s*iex\b",
    r"(?i)\b(iwr|invoke-webrequest)\b[^|;&]*\|\s*(iex|invoke-expression)\b",
    # git history destruction
    r"(?i)\bgit\s+push\b[^|;&]*(--force\b|-f\b)",
    r"(?i)\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f)",
    # recursive permission/ownership changes
    r"(?i)\b(chmod|chown)\b[^|;&]*\s-[a-z]*r[a-z]*\s+[^|;&]*\s/(\s|$)",
]

_DANGEROUS_RE = [re.compile(p) for p in DANGEROUS_PATTERNS]


def _first_token(command):
    """Return the bare executable token, lowercased and extension-stripped."""
    tokens = command.strip().split()
    if not tokens:
        return "", []
    first = tokens[0].strip('"').lower()
    if re.match(r"^(\./|\.\\|\.\./)", first):
        first = first[2:]
    for ext in (".exe", ".bat", ".cmd", ".ps1", ".com"):
        if first.endswith(ext):
            first = first[: -len(ext)]
            break
    first = os.path.basename(first)
    return first, tokens[1:]


def is_readonly_command(command):
    """True only for commands that cannot mutate filesystem or system state."""
    # A redirection writes a file, so it is never read-only -- EXCEPT the handful
    # of discard idioms that write nowhere.  This branch used to be the head of a
    # single test that also split on | & ;, and because the split set did not
    # include '>' any command with a redirect and no chain separator was
    # re-classified as itself, unbounded: RecursionError, caught by the outer
    # handler and reported as force_ask.  `echo x > f` therefore "passed" its
    # self-test for the wrong reason -- the failure value coincided with the
    # expected one.  Found by auditing logs\gate.log for [internal] rows.
    stripped = re.sub(r"(?i)(^|\s)(\d?)>\s*(nul|\$null|/dev/null)\b", " ", command)
    # `2>&1` merges streams, it does not write a file; without this the trailing
    # `&` reads as a chain separator and the whole command is escalated.
    stripped = re.sub(r"(?i)(\d?)>&\d", " ", stripped)
    if re.search(r">(?!&)", stripped):
        return False
    # A chain can hide a write behind a read prefix.  Only recurse when the split
    # actually produced more than one part, so a command that reaches this branch
    # can never be handed back to itself.
    if re.search(r"[|;&]", stripped):
        parts = [p for p in re.split(r"\|\||&&|[|;&]", stripped) if p.strip()]
        if len(parts) > 1:
            return all(is_readonly_command(p) for p in parts)
        stripped = parts[0] if parts else stripped
    command = stripped
    # Substitutions can run anything.
    if re.search(r"\$\(|`|@\(", command):
        return False
    if re.search(r"(?i)\brm\b|\bdel\b|\brmdir\b|\bmove\b|\bcopy\b|\brename\b|\bmkdir\b|\bnew-item\b|\bset-content\b|\badd-content\b|\bout-file\b|\bremove-item\b", command):
        return False

    head, rest = _first_token(command)
    if not head:
        return True
    if head == "sudo":
        head, rest = _first_token(" ".join(rest))
    if head in ("git",):
        for tok in rest:
            if tok.startswith("-"):
                continue
            return tok.lower() in GIT_READ_SUBCOMMANDS
        return False
    if head in PROBE_SUBCOMMANDS:
        for tok in rest:
            if tok in PROBE_SUBCOMMANDS[head]:
                return True
        return False
    return head in PURE_READ_COMMANDS


def is_dangerous(command):
    for rx in _DANGEROUS_RE:
        if rx.search(command):
            return True
    return False


# ---------------------------------------------------------------------------
# State + logging
# ---------------------------------------------------------------------------
DEFAULT_STATE = {
    "tier": "danger-full-access",
    "auto_reviewer": "local",
    "audit_logging": True,
    "log_allow": False,
}


def load_state():
    state = dict(DEFAULT_STATE)
    try:
        with open(TIER_PATH, "r", encoding="utf-8") as fh:
            state.update(json.load(fh))
    except Exception:
        # Missing/damaged state must not silently grant more than intended.
        state["tier"] = "read-only"
        state["_state_error"] = True
    return state


def rotate_if_needed():
    try:
        if os.path.getsize(LOG_PATH) > LOG_MAX_BYTES:
            os.replace(LOG_PATH, LOG_PATH + ".1")
    except OSError:
        pass


def audit(state, tool, decision, reason, command, cid="", step=None):
    if not state.get("audit_logging", True):
        return
    if decision == "allow" and not state.get("log_allow", False):
        return
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        rotate_if_needed()
        snippet = " ".join(command.split())[:LOG_CMD_CHARS]
        # conversationId is recorded so a real agent call is distinguishable
        # from a synthetic self-test payload.
        line = "[{ts}] [{tier}] [{dec}] cid={cid} step={step} tool={tool} cmd={cmd!r} :: {reason}\n".format(
            ts=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            tier=state.get("tier", "?"),
            dec=decision,
            cid=(cid or "-"),
            step=("-" if step is None else step),
            tool=tool,
            cmd=snippet,
            reason=reason,
        )
        with open(LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write(line)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Decisions
# ---------------------------------------------------------------------------
def decide_read_only(tool, command):
    """DSH read-only: nothing is writable anywhere.

    The harness enforces that with a filesystem sandbox.  Antigravity has no
    such knob inside the workspace, so the hook stands in for it: mutating tools
    are denied, and a command that would write is denied too.  Read-only
    commands pass.  Anything the classifier cannot vouch for is force_ask rather
    than allow -- the equivalent of the harness asking before a wider retry.
    """
    if tool == "run_command":
        if not command.strip():
            return "force_ask", "read-only: empty command needs confirmation"
        if is_dangerous(command):
            return "deny", "read-only: command matches a destructive pattern"
        if is_readonly_command(command):
            return "allow", "read-only: observation command"
        return "force_ask", ("read-only: this command may write; the harness sandbox "
                             "would block it, so confirm explicitly")
    if tool in READ_TOOLS:
        return "allow", "read-only: read-only tool"
    if tool in WRITE_TOOLS:
        return "deny", "read-only: writes are blocked in this tier"
    # Unknown tools are escalated, NOT blocked.  Hard-denying here is exactly
    # what broke a legitimate `list_dir` before its real name was known, and a
    # wrong guess in this branch silently cripples the agent, whereas a prompt
    # is recoverable.
    return "force_ask", ("read-only: tool {0!r} is not classified as read-only; "
                         "confirm before it runs").format(tool)


def decide_auto(tool, command, state):
    """DSH `auto` (Auto review), approximated by a local policy engine.

    HONEST DIFFERENCE: DSH's auto tier has no sandbox and asks the same model to
    adjudicate every call.  A local rule engine is not a model review -- it is
    deterministic, free and offline, and it will get judgement calls wrong in
    both directions.  It is named "auto (local policy)" everywhere so it is not
    mistaken for the real thing.
    """
    if tool != "run_command":
        if tool in READ_TOOLS:
            return "allow", "auto(local): read-only tool"
        # Mutating non-command tools still get reviewed, just not by a model.
        if tool in WRITE_TOOLS:
            return "ask", "auto(local): mutating tool, no local rule vouches for it"
        return "ask", "auto(local): unrecognised tool"

    if not command.strip():
        return "ask", "auto(local): empty command"
    if is_dangerous(command):
        return "deny", "auto(local): command matches a destructive pattern"
    if is_readonly_command(command):
        return "allow", "auto(local): observation command"
    return "ask", "auto(local): no local rule vouches for this command"


def decide_workspace_write(tool, command):
    """Normally unreachable: the hook is disabled in this tier and Antigravity's
    native policy (request-review + sandbox + workspace grants) carries it."""
    if tool == "run_command" and is_dangerous(command):
        return "force_ask", "workspace-write: destructive pattern, confirm explicitly"
    return "allow", "workspace-write: deferred to native policy"


def decide_full_access(tool, command):
    """Normally unreachable: the hook is disabled in this tier."""
    return "allow", "danger-full-access: unrestricted"


def main():
    raw = sys.stdin.buffer.read().decode("utf-8", "replace") if hasattr(sys.stdin, "buffer") else sys.stdin.read()
    state = load_state()

    try:
        payload = json.loads(raw) if raw.strip() else {}
    except Exception as exc:
        # Unparseable input: refuse rather than guess.
        sys.stdout.write(json.dumps({
            "decision": "deny",
            "reason": "DSH Permissions: could not parse hook payload ({0})".format(exc),
        }, ensure_ascii=True))
        return

    call = payload.get("toolCall") or {}
    tool = (call.get("name") or "").strip()
    args = call.get("args") or {}
    command = args.get("CommandLine") or args.get("command") or ""
    if not isinstance(command, str):
        command = str(command)

    tier = state.get("tier", "read-only")
    if tier == "read-only":
        decision, reason = decide_read_only(tool, command)
    elif tier == "auto":
        decision, reason = decide_auto(tool, command, state)
    elif tier == "workspace-write":
        decision, reason = decide_workspace_write(tool, command)
    elif tier == "danger-full-access":
        decision, reason = decide_full_access(tool, command)
    else:
        decision, reason = "force_ask", "DSH Permissions: unknown tier {0!r}".format(tier)

    if state.get("_state_error"):
        reason += " [tier.json unreadable; defaulted to read-only]"

    # Only a real allow on a command earns a cached grant, and only in tiers
    # whose intent is to stop asking.
    overrides = []
    if decision == "allow" and tool == "run_command" and command.strip() and tier == "auto":
        overrides = ["command({0})".format(" ".join(command.split())[:200])]

    audit(state, tool, decision, reason, command,
          cid=str(payload.get("conversationId") or ""),
          step=payload.get("stepIdx"))
    sys.stdout.write(json.dumps({
        "decision": decision,
        "reason": reason,
        "permissionOverrides": overrides,
    }, ensure_ascii=True))


def log_internal_error(text):
    """Record a failure without relying on stderr.

    The launcher discards stderr on purpose: Antigravity captures a hook's
    stderr into a protobuf string value, and cmd.exe's OEM code page is not
    valid UTF-8 -- feeding that back killed the agent executor with
    "proto: field google.protobuf.Value.string_value contains invalid UTF-8".
    Diagnostics land here instead, forced to ASCII so this log can never carry
    bytes that would break the same way.
    """
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        safe = str(text).encode("ascii", "backslashreplace").decode("ascii")
        with open(LOG_PATH, "a", encoding="utf-8") as fh:
            fh.write("[{0}] [internal] [force_ask] {1}\n".format(
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"), safe))
    except Exception:
        pass


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # never leave Antigravity without a decision
        detail = "{0}: {1}".format(type(exc).__name__, exc)
        log_internal_error("unhandled " + detail)
        sys.stdout.write(json.dumps({
            "decision": "force_ask",
            "reason": "DSH Permissions: internal error " + detail,
        }, ensure_ascii=True))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Self-test for the DSH Permissions gate.

Feeds synthetic PreToolUse payloads to gate.py for every tier and checks the
decision each one returns.  Touches only tier.json (restored afterwards) and
logs/gate.log.  Run it after any edit:

    python scripts\\selftest.py
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PLUGIN = os.path.dirname(HERE)
TIER = os.path.join(PLUGIN, "tier.json")
GATE = os.path.join(HERE, "gate.py")
LOG = os.path.join(PLUGIN, "logs", "gate.log")

# Remember the caller's active tier: a self-test must never leave the machine on
# a different tier than it found it.
try:
    with open(TIER, "r", encoding="utf-8") as _fh:
        ORIGINAL_TIER_STATE = _fh.read()
except OSError:
    ORIGINAL_TIER_STATE = None

FAIL = []
PASS = 0


def count_internal_rows():
    """Rows the gate wrote when it crashed and fell back to force_ask."""
    try:
        with open(LOG, "r", encoding="utf-8", errors="replace") as fh:
            return sum(1 for line in fh if "[internal]" in line)
    except OSError:
        return 0


def run(tier, tool, command=None, raw=None):
    with open(TIER, "w", encoding="utf-8") as fh:
        json.dump({"tier": tier, "auto_reviewer": "local",
                   "audit_logging": True, "log_allow": False}, fh)
    if raw is None:
        args = {"CommandLine": command} if command is not None else {}
        payload = {"toolCall": {"name": tool, "args": args},
                   "conversationId": "selftest", "stepIdx": 1}
        raw = json.dumps(payload)
    proc = subprocess.run([sys.executable, GATE], input=raw.encode("utf-8"),
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out = proc.stdout.decode("utf-8", "replace").strip()
    try:
        return json.loads(out)
    except Exception:
        return {"decision": "<INVALID JSON>", "raw": out[:200],
                "stderr": proc.stderr.decode("utf-8", "replace")[:300]}


def expect(tier, tool, command, want, raw=None, want_reason=None):
    """Assert a decision, and optionally a substring of its reason.

    want_reason exists because a bare decision can be satisfied by a crash: the
    gate's outer handler answers force_ask, so any case expecting force_ask used
    to pass even when the classifier raised.  An [internal] row count is checked
    for the same reason.
    """
    global PASS
    internal_before = count_internal_rows()
    got = run(tier, tool, command, raw)
    internal_after = count_internal_rows()
    actual = got.get("decision")
    ok = actual == want
    detail = ""
    if ok and want_reason is not None:
        reason = str(got.get("reason", ""))
        if want_reason not in reason:
            ok = False
            detail = " (reason lacks {0!r})".format(want_reason)
    if ok and internal_after > internal_before:
        ok = False
        detail = " (gate crashed: wrote an [internal] row)"
    if ok:
        PASS += 1
    else:
        FAIL.append((tier, tool, command, want, actual, got))
    flag = "ok  " if ok else "FAIL"
    shown = command if command is not None else "<raw>"
    if len(str(shown)) > 44:
        shown = str(shown)[:44] + "..."
    print("  [{0}] {1:20} {2:20} want={3:10} got={4}{5}".format(
        flag, tier, str(shown), want, actual, detail))


print("== read-only: nothing is writable ==")
expect("read-only", "run_command", "ls -la", "allow")
expect("read-only", "run_command", "git status", "allow")
expect("read-only", "run_command", "git log --oneline -5", "allow")
expect("read-only", "run_command", "Get-ChildItem -Force", "allow")
expect("read-only", "view_file", None, "allow")
expect("read-only", "grep_search", None, "allow")
# The names observed in a REAL PreToolUse payload, plus the read-shaped aliases.
expect("read-only", "list_dir", None, "allow")
expect("read-only", "read_file", None, "allow")
expect("read-only", "list_directory", None, "allow")
# The live tool list taken from this deployment's own system prompt.
expect("read-only", "read_url_content", None, "allow")
expect("read-only", "find_by_name", None, "allow")
expect("read-only", "search_web", None, "allow")
expect("read-only", "manage_task", None, "allow")
expect("read-only", "ask_question", None, "allow")
expect("read-only", "write_to_file", None, "deny")
expect("read-only", "replace_file_content", None, "deny")
expect("read-only", "notebook_edit", None, "deny")
expect("read-only", "generate_image", None, "deny")
expect("read-only", "schedule", None, "deny")
expect("read-only", "invoke_subagent", None, "deny")
expect("read-only", "define_subagent", None, "deny")
expect("read-only", "run_command", "git commit -m wip", "force_ask")
expect("read-only", "run_command", "npm install", "force_ask")
expect("read-only", "file_change", None, "deny")
expect("read-only", "create_file", None, "deny")
expect("read-only", "edit_file", None, "deny")
expect("read-only", "write_file", None, "deny")
expect("read-only", "delete_directory", None, "deny")
expect("read-only", "mcp_tool", None, "deny")
expect("read-only", "run_command", "mkdir build", "force_ask")
expect("read-only", "run_command", "rmdir /s /q C:", "deny")
# Redirections: a write, so escalate rather than allow -- and assert the REASON,
# because the old code answered force_ask by recursing until it crashed, which
# this expectation alone cannot tell apart from a real classification.
expect("read-only", "run_command", "echo hi > out.txt", "force_ask",
       want_reason="may write")
expect("read-only", "run_command", "cmd >> log.txt", "force_ask",
       want_reason="may write")
expect("read-only", "run_command", "ls > list.txt", "force_ask",
       want_reason="may write")
# The discard idioms write nowhere and must stay read-only.
expect("read-only", "run_command", "ls 2>nul", "allow",
       want_reason="observation")
expect("read-only", "run_command", "Get-ChildItem 2>$null", "allow",
       want_reason="observation")
# Chains still classify per part, without re-entering on the whole string.
expect("read-only", "run_command", "ls | Select-String foo", "allow",
       want_reason="observation")
expect("read-only", "run_command", "ls && git status", "allow",
       want_reason="observation")
expect("read-only", "run_command", "echo hi > out.txt", "force_ask")
# An unknown tool is escalated rather than blocked: blocking on an unknown name
# is what hard-denied a legitimate list_dir before its real name was known.
expect("read-only", "something_unknown", None, "force_ask")

print("== auto: local policy engine (NOT a model review) ==")
expect("auto", "run_command", "ls -la", "allow")
expect("auto", "run_command", "pip list", "allow")
expect("auto", "run_command", "npm install react", "ask")
expect("auto", "run_command", "python train.py", "ask")
expect("auto", "run_command", "rmdir /s /q C:", "deny")
expect("auto", "run_command", "git push --force origin main", "deny")
expect("auto", "view_file", None, "allow")
expect("auto", "file_change", None, "ask")
expect("auto", "run_command", "ls | rm -rf /", "deny")

print("== workspace-write / danger-full-access (hook normally disabled) ==")
expect("workspace-write", "run_command", "npm install", "allow")
expect("workspace-write", "file_change", None, "allow")
expect("danger-full-access", "run_command", "rmdir /s /q C:", "allow")
expect("danger-full-access", "file_change", None, "allow")

print("== protocol robustness ==")
expect("read-only", None, None, "deny", raw="{not json")
expect("read-only", "run_command", None, "force_ask", raw=json.dumps(
    {"toolCall": {"name": "run_command", "args": {}}}))
expect("nonexistent-tier", "run_command", "ls", "force_ask")
# Non-ASCII must survive the UTF-8 stdin round trip.  echo is read-only, so the
# meaningful probe is a non-ASCII *first token*, which matches no rule list.
expect("read-only", "run_command", "echo 中文测试", "allow")
expect("read-only", "run_command", "中文工具 --flag", "force_ask")

# Shell chaining must not smuggle a write past the read-only classifier.
# An ordinary write in a chain is confirmed rather than hard-blocked (there is
# no real sandbox to block it), but a catastrophic one is denied outright.
expect("read-only", "run_command", "ls && rm -rf /tmp/x", "force_ask")
expect("read-only", "run_command", "ls && rmdir /s /q C:", "deny")
expect("read-only", "run_command", "cat a; touch b", "force_ask")
expect("read-only", "run_command", "echo $(rm -rf /)", "force_ask")

print("")
print("pass={0}  fail={1}".format(PASS, len(FAIL)))
for row in FAIL:
    print("  FAILED: tier={0} tool={1} cmd={2!r} want={3} got={4} -> {5}".format(*row))

# Restore exactly what the caller had, so running the self-test can never change
# the tier an agent is working under.
if ORIGINAL_TIER_STATE is not None:
    with open(TIER, "w", encoding="utf-8") as fh:
        fh.write(ORIGINAL_TIER_STATE)
    try:
        restored = json.loads(ORIGINAL_TIER_STATE).get("tier")
    except Exception:
        restored = "?"
    print("tier.json restored to {0}".format(restored))
else:
    print("tier.json had no original state to restore")
sys.exit(1 if FAIL else 0)

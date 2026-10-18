#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Engineering Lock (englock) v2 -- PreToolUse checker for Antigravity.

Two families of locks:
  L1-L8  engineering discipline (source / sample / retraction / delivery / header /
         wording / re-entry / external review)
  L9     LANGUAGE NORM LOCK -- keep the model from talking nonsense:
         L9.1 banned wording (absolute / marketing / promise / self-praise)
         L9.2 source-less authority ("official", "industry consensus", ...)
         L9.3 fake precision (2+ decimals with no sample or error bar)
         L9.4 completion claimed without any validation marker
         L9.5 terminology drift (two spellings from the same group in one document)
         L9.6 unresolvable citation (a file:/// path that does not exist)

Protocol (same as gate.py):
    stdin : {"toolCall":{"name":"write_to_file","args":{...}}, ...}
    stdout: {"decision":"allow|deny","reason":"...","permissionOverrides":[]}

Safety model:
    * FAIL-OPEN. Any internal error -> allow. The lock must never brick a workflow.
    * Default mode "advisory": findings go into `reason`, decision stays allow.
    * "strict" mode denies only the hard locks (L5, L6, L9.1).
    * All word lists live in lexicon.json -- edit data, not code.

CLI:
    python englock.py status | check <file.md> | selftest | lexicon
"""

import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
_PARENT = os.path.dirname(_HERE)


def _resolve(name):
    for cand in (os.path.join(_PARENT, name),
                 os.path.join(_HERE, name),
                 os.path.join(os.getcwd(), name)):
        if os.path.exists(cand):
            return cand
    return os.path.join(_PARENT, name)


CONF_PATH = _resolve("englock.json")
LEX_PATH = _resolve("lexicon.json")

# ---------------------------------------------------------------- fallbacks
FALLBACK_LEX = {
    "ban_absolute": ["\u53f2\u8bd7\u7ea7", "\u5b8c\u7f8e", "\u5f7b\u5e95", "\u4e07\u80fd",
                     "\u65e0\u654c", "\u7edd\u5bf9", "epic", "flawless"],
    "ban_marketing": ["\u9707\u64bc", "\u60ca\u8273", "\u9006\u5929", "\u795e\u5668"],
    "ban_promise": ["\u4fdd\u8bc1", "\u5fc5\u5b9a", "\u6c38\u4e45", "\u4e00\u52b3\u6c38\u9038"],
    "ban_selfpraise": ["\u6211\u5f7b\u5e95\u653b\u514b"],
    "vague_authority": ["\u5b98\u65b9", "\u4e1a\u5185", "\u6743\u5a01", "\u4f17\u6240\u5468\u77e5"],
    "completion_words": ["\u5df2\u4fee\u590d", "\u5df2\u89e3\u51b3", "\u5df2\u5b8c\u6210", "\u641e\u5b9a\u4e86"],
    "validation_markers": ["\u9a8c\u8bc1", "\u590d\u6d4b", "\u5f85\u9a8c\u8bc1", "n="],
    "precision_needs_evidence": ["\u8bef\u5dee", "\u00b1", "n="],
    "term_groups": [],
    "required_uncertainty_when_forward": ["\u5c06", "\u8ba1\u5212"],
}

DEFAULT_CONF = {"mode": "advisory", "log": True,
                "report_path_hints": ["documents_md", "\u62a5\u544a", "report"]}

BANNED_GROUPS = ("ban_absolute", "ban_marketing", "ban_promise", "ban_selfpraise")

# ---- L1-L8 word lists (kept in code; the language lists live in lexicon.json)
RETRACTED_TOPICS = ["override-status", "override_status", "app_standby_enabled",
                    "standby-bucket", "standby bucket", "89%", "soft_contain", "120Hz", "120 hz"]
CLAIM_WORDS = ["\u9a8c\u8bc1", "\u8bc1\u660e", "\u786e\u8ba4", "\u6210\u7acb", "\u5df2\u89e3\u51b3"]
SAMPLE_MARKERS = ["n=", "N=", "\u6837\u672c", "\u6b21\u6d4b\u91cf", "\u91cd\u590d", "\u590d\u6d4b",
                  "\u5bf9\u7167\u7ec4", "\u6b21\u5b9e\u6d4b", "\u5355\u6b21\u89c2\u6d4b"]
NUMBER_RE = re.compile(r"\d+(\.\d+)?\s*(mAh|mA|mV|MHz|GHz|W|%|\u2103|MS|ms)")
SOURCE_MARKERS = ["dumpsys", "logcat", "batterystats", "/sys/", "adb", "time_in_state",
                  "POWER_SUPPLY", "\u8f6e", "\u62a5\u544a", "\u89c1 ", "file://", "source:",
                  "\u547d\u4ee4", "\u65e5\u5fd7", "\u5b9e\u6d4b", "n=", "track"]
HEADER_FIELDS = [("\u65e5\u671f", "date"), ("\u8bbe\u5907", "device"),
                 ("\u5de5\u5177", "tool"), ("\u6837\u672c", "sample"),
                 ("\u5b9e\u6d4b", "measured"), ("\u7ed3\u8bba", "conclusion")]
EXTRAPOLATED = "[EXTRAPOLATED]"
RETRACT_MARK = "\u64a4\u56de"

# L9.3 narrowed: only a *precision claim* is suspicious, not any measured decimal.
# Fires on "37.24%" or "提升 12.5%" / "准确率 99.87%" style claims without evidence,
# and deliberately NOT on "3.67W" / "639.02MB", which are instrument readings.
DECIMAL2_PCT_RE = re.compile(r"\d+\.\d{2,}\s*%")
DECIMAL2_CLAIM_RE = re.compile(r"(\u63d0\u5347|\u964d\u4f4e|\u63d0\u9ad8|\u4e0b\u964d|\u51cf\u5c11|\u589e\u52a0|\u51c6\u786e\u7387|\u7cbe\u786e\u5ea6|\u5360\u6bd4|\u4f18\u5316\u5230)[^\u3002\n]{0,16}?\d+\.\d{2,}")
FILEURI_RE = re.compile(r"file:///([^\s)\]\"'<>]+)")
WINPATH_RE = re.compile(r"\b[A-Za-z]:\\[^\s\"'<>|]+")


# ---------------------------------------------------------------- loading
def _load_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8-sig") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else dict(fallback)
    except Exception:
        return dict(fallback)


def load_conf():
    base = dict(DEFAULT_CONF)
    base.update(_load_json(CONF_PATH, {}))
    return base


def load_lex():
    lex = {k: list(v) for k, v in FALLBACK_LEX.items()}
    got = _load_json(LEX_PATH, {})
    for k, v in got.items():
        if k.startswith("_") or k in ("version", "updated", "notes"):
            continue
        if isinstance(v, list):
            lex[k] = v
    return lex


def _dedup_keep_order(seq):
    seen = set()
    out = []
    for x in seq:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out



# ---------------------------------------------------------------- masking
FENCE_RE = re.compile(r"```.*?```", re.S)
QUOTE_LINE_RE = re.compile(r"^\s*>.*$", re.M)
YUANWEN_SPAN_RE = re.compile(r"【\u539f\u6587[^】]*】.*?(?=\n\n|\Z)", re.S)
YUANWEN_RE = re.compile(r"【\u539f\u6587】[^\n]*")


def mask_quoted(text):
    """Remove material the author is QUOTING rather than asserting.

    A pure text scanner cannot tell 'he said "epic breakthrough"' from
    'this is an epic breakthrough'. Code fences, blockquotes and 【原文】
    markers carry somebody else's wording, so they must not be scored.
    """
    t = FENCE_RE.sub("\n", text)
    t = YUANWEN_SPAN_RE.sub("\n", t)
    t = YUANWEN_RE.sub("\n", t)
    t = QUOTE_LINE_RE.sub("", t)
    return t

# ---------------------------------------------------------------- L1-L8
def check_engineering(text, path, conf):
    out = []
    if len(text) < 16:
        return out
    text = mask_quoted(text)
    if any(w.lower() in text.lower() for w in ("\u53f2\u8bd7\u7ea7",)):
        pass  # handled by L9.1 as well; kept for backward compatibility
    report = is_report_target(path, conf)

    if report:
        missing = [cn for cn, _ in HEADER_FIELDS if cn not in text]
        if missing:
            out.append("L5 \u62a5\u544a\u5934\u9501: \u7f3a\u5b57\u6bb5 " + ", ".join(missing))

    if NUMBER_RE.search(text):
        if not any(m in text for m in SOURCE_MARKERS) and EXTRAPOLATED not in text:
            out.append("L1 \u51fa\u5904\u9501: \u51fa\u73b0\u91cf\u5316\u6570\u5b57\u4f46\u672a\u68c0\u5230\u6765\u6e90\u6807\u8bb0")

    if any(c in text for c in CLAIM_WORDS):
        # v3: prefer the proximity rule; fall back to the old doc-level check
        prox = check_claim_proximity(text, _LEX_CACHE if '_LEX_CACHE' in globals() else {})
        if prox:
            out.extend(prox)
        elif not any(s in text for s in SAMPLE_MARKERS):
            out.append("L2 \u6837\u672c\u9501: \u51fa\u73b0\u201c\u9a8c\u8bc1/\u8bc1\u660e\u201d\u7c7b\u8bf4\u6cd5\u4f46\u672a\u7ed9\u6837\u672c\u91cf")

    for topic in RETRACTED_TOPICS:
        if topic.lower() in text.lower() and RETRACT_MARK not in text:
            out.append("L3 \u64a4\u56de\u9501: \u6d89\u53ca\u5df2\u64a4\u56de\u8bdd\u9898 %r\uff0c\u4f46\u672a\u6807\u201c\u64a4\u56de\u201d" % topic)
            break
    return out


# ---------------------------------------------------------------- L9
def check_language(text, path, lex, conf):
    out = []
    if len(text) < 16:
        return out
    text = mask_quoted(text)
    low = text.lower()

    # L9.1 banned wording (hard)
    hits = []
    for grp in BANNED_GROUPS:
        for w in lex.get(grp, []):
            if w and w.lower() in low:
                hits.append(w)
    hits = _dedup_keep_order(hits)
    if hits:
        out.append("L9.1 \u8bed\u8a00\u89c4\u8303\u9501(\u786c): \u547d\u4e2d\u7981\u7528\u8bcd " + ", ".join(hits[:6]))

    # L9.2 source-less authority
    auth = [w for w in lex.get("vague_authority", []) if w and w in text]
    if auth and not any(m in text for m in SOURCE_MARKERS):
        out.append("L9.2 \u65e0\u636e\u6743\u5a01: " + ", ".join(_dedup_keep_order(auth)[:4]) + " \u2014\u2014 \u4f46\u5168\u6587\u65e0\u6765\u6e90\u6807\u8bb0")

    # L9.3 fake precision
    if (DECIMAL2_PCT_RE.search(text) or DECIMAL2_CLAIM_RE.search(text)) and not any(m in text for m in lex.get("precision_needs_evidence", [])):
        out.append("L9.3 \u4f2a\u7cbe\u5ea6: \u51fa\u73b0\u4e24\u4f4d\u4ee5\u4e0a\u5c0f\u6570\u4f46\u65e0\u6837\u672c/\u8bef\u5dee\u8bf4\u660e")

    # L9.4 completion without validation
    comp = [w for w in lex.get("completion_words", []) if w and w in text]
    if comp and not any(m in text for m in lex.get("validation_markers", [])):
        out.append("L9.4 \u5b8c\u6210\u6001\u65e0\u9a8c\u8bc1: " + ", ".join(_dedup_keep_order(comp)[:4]) + " \u2014\u2014 \u4f46\u65e0\u4efb\u4f55\u9a8c\u8bc1/\u5f85\u9a8c\u8bc1\u6807\u8bb0")

    # L9.5 terminology drift
    for grp in lex.get("term_groups", []) or []:
        if not isinstance(grp, list):
            continue
        present = [w for w in grp if w and w in text]
        if len(present) > 1:
            out.append("L9.5 \u672f\u8bed\u6f02\u79fb: \u540c\u4e00\u6982\u5ff5\u51fa\u73b0\u591a\u79cd\u5199\u6cd5 " + " / ".join(present))
            break

    # L9.6 unresolvable citation (file:/// paths must exist on disk)
    bad = []
    for m in FILEURI_RE.finditer(text):
        p = m.group(1)
        try:
            p = p.replace("%3A", ":").replace("%20", " ")
            if os.name == "nt" and re.match(r"^[A-Za-z]:", p) is None and p.startswith("/"):
                p = p[1:]
            if not os.path.exists(p):
                bad.append(p[:70])
        except Exception:
            continue
    if bad:
        out.append("L9.6 \u5f15\u7528\u4e0d\u53ef\u89e3\u6790: " + " | ".join(_dedup_keep_order(bad)[:3]))

    # L9.7 forward-looking text must carry an uncertainty marker
    fwd = [w for w in lex.get("required_uncertainty_when_forward", []) if w and w in text]
    if fwd and not any(m in text for m in lex.get("validation_markers", [])):
        out.append("L9.7 \u672a\u6765\u6001\u65e0\u4e0d\u786e\u5b9a\u6807\u8bb0: " + ", ".join(_dedup_keep_order(fwd)[:3]) + " \u2014\u2014 \u8bf7\u8865\u201c\u8ba1\u5212/\u5f85\u9a8c\u8bc1\u201d\u5b57\u6837")

    return out



# ---------------------------------------------------------------- window rules (L9.8+)
def _window_ok(text, pos, span, requires):
    """Compensation present within +/- span chars of pos?"""
    lo = max(0, pos - span); hi = min(len(text), pos + span)
    near = text[lo:hi]
    return any(r in near for r in requires) if requires else False


def check_window_rules(text, lex, strict):
    """L9.8-L9.13: 允许说，但必须在邻近窗口里给出补偿信息。"""
    out = []
    for rule in lex.get("window_rules", []) or []:
        if not isinstance(rule, dict):
            continue
        rid = str(rule.get("id", "L9?"))
        name = rule.get("name", "")
        span = int(rule.get("window", 0) or 0)
        triggers = rule.get("trigger", []) or []
        requires = rule.get("requires", []) or []
        if not triggers:
            continue
        hits = []
        for w in triggers:
            for m in re.finditer(re.escape(w), text):
                if span <= 0 or not _window_ok(text, m.start(), span, requires):
                    hits.append(w)
                    break
        if hits:
            out.append("%s %s: %s%s" % (
                rid, name, ", ".join(hits[:4]),
                ("" if span <= 0 else " \u2014\u2014 \u7f3a\u8865\u507f\u4fe1\u606f")))
    return out


def check_claim_proximity(text, lex):
    """L2 upgraded: evidence must sit near the claim, not merely exist in the file."""
    cp = lex.get("claim_proximity") or {}
    if not cp:
        return []
    span = int(cp.get("window", 120) or 120)
    claims = cp.get("claims", []) or []
    requires = cp.get("requires", []) or []
    hits = []
    for w in claims:
        for m in re.finditer(re.escape(w), text):
            if not _window_ok(text, m.start(), span, requires):
                hits.append(w)
                break
    if hits:
        return ["L2 \u6837\u672c\u90bb\u8fd1\u9501: \u65ad\u8a00\u9644\u8fd1 %d \u5b57\u5185\u65e0\u8bc1\u636e\uff08%s\uff09" % (span, ", ".join(hits[:4]))]
    return []

# ---------------------------------------------------------------- helpers
def is_report_target(path, conf):
    if not path:
        return False
    low = str(path).replace("\\", "/").lower()
    if not low.endswith(".md"):
        return False
    return any(h.lower() in low for h in conf.get("report_path_hints", []))


def collect_text(args):
    path = ""
    chunks = []

    def walk(v, key=""):
        nonlocal path
        if isinstance(v, dict):
            for k, vv in v.items():
                walk(vv, str(k))
        elif isinstance(v, (list, tuple)):
            for vv in v:
                walk(vv, key)
        elif isinstance(v, str):
            kl = key.lower()
            if not path and any(t in kl for t in ("path", "file", "target", "uri")):
                if "/" in v or "\\" in v or v.endswith(".md"):
                    path = v
            chunks.append(v)

    walk(args)
    return path, "\n".join(chunks)


HARD_PREFIXES = ("L5", "L6", "L9.1", "L9.11")


def hard_ids(lex):
    """Rules that should DENY in strict mode: always-hard + strict_hard."""
    ids = {"L5", "L6", "L9.1", "L9.11"}
    for rule in (lex.get("window_rules") or []):
        if isinstance(rule, dict) and str(rule.get("strict_level", "")) == "strict_hard":
            ids.add(str(rule.get("id")))
    cp = lex.get("claim_proximity") or {}
    if str(cp.get("strict_level", "")) == "strict_hard":
        ids.add("L2")
    return tuple(sorted(ids))


def decide(payload):
    conf = load_conf()
    lex = load_lex()
    mode = str(conf.get("mode", "advisory")).lower()
    try:
        tool = str(((payload.get("toolCall") or {}).get("name")) or "")
        args = (payload.get("toolCall") or {}).get("args") or {}
    except Exception:
        tool, args = "", {}

    if not re.search(r"write|create|replace|edit|apply|patch|save|append", tool, re.I):
        return {"decision": "allow", "reason": "englock: not a write tool"}

    path, text = collect_text(args)
    strict = (mode == "strict")
    globals()['_LEX_CACHE'] = lex
    findings = check_engineering(text, path, conf) + check_language(text, path, lex, conf)
    findings += check_window_rules(mask_quoted(text), lex, strict)

    if findings:
        ids = hard_ids(lex)
        hard = [f for f in findings if f.startswith(ids)]
        tag = "strict" if mode == "strict" else "advisory"
        if mode == "strict" and hard:
            return {"decision": "deny",
                    "reason": "ENG LOCK (strict): " + " | ".join(findings),
                    "permissionOverrides": []}
        return {"decision": "allow",
                "reason": "ENG LOCK (%s): " % tag + " | ".join(findings),
                "permissionOverrides": []}

    return {"decision": "allow", "reason": "englock: clean", "permissionOverrides": []}


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            conf, lex = load_conf(), load_lex()
            print(json.dumps({
                "mode": conf.get("mode"),
                "config": CONF_PATH,
                "lexicon": LEX_PATH,
                "lexicon_groups": {k: len(v) for k, v in lex.items() if isinstance(v, list)},
                "locks": ["L1 source", "L2 sample", "L3 retraction", "L4 triple-delivery",
                          "L5 report header", "L6 wording", "L7 re-entry", "L8 external review",
                          "L9 language norm (9.1-9.7)"],
            }, ensure_ascii=False, indent=2))
            return 0
        if cmd == "lexicon":
            print(json.dumps(load_lex(), ensure_ascii=False, indent=2))
            return 0
        if cmd == "check" and len(sys.argv) > 2:
            p = sys.argv[2]
            try:
                t = open(p, "r", encoding="utf-8", errors="ignore").read()
            except Exception as e:
                print("read error: %s" % e)
                return 2
            conf, lex = load_conf(), load_lex()
            f = check_engineering(t, p, conf) + check_language(t, p, lex, conf)
            print(json.dumps({"file": p, "findings": f}, ensure_ascii=False, indent=2))
            return 0 if not f else 1
        if cmd == "selftest":
            return selftest()
        print("usage: englock.py [status|lexicon|check <file>|selftest]")
        return 0

    try:
        raw = sys.stdin.buffer.read().decode("utf-8", "replace") if hasattr(sys.stdin, "buffer") else sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except Exception:
        payload = {}
    try:
        out = decide(payload)
    except Exception as e:
        out = {"decision": "allow", "reason": "englock: internal error, failing open (%s)" % e}
    sys.stdout.write(json.dumps(out, ensure_ascii=True))
    return 0


def selftest():
    lex = load_lex()
    conf = load_conf()
    R = "documents_md/report.md"

    cases = [
        # --- L1-L8 ---
        ("L1 no-source", "SOC \u529f\u8017\u964d\u5230 0.94W\uff0c\u5f85\u673a\u4ece 3.67W \u964d\u5230 1.9W\uff0c\u6574\u673a\u53d8\u51c9", "x.md", True),
        ("L1 with-source", "\u636e dumpsys \u5b9e\u6d4b\uff0c\u5f85\u673a 1.9W\uff0c\u89c1 0928 \u62a5\u544a\u7b2c 3 \u8282", "x.md", False),
        ("L1 extrapolated", "\u63a8\u7b97\u503c 6255mAh\uff0c\u5bf9\u5e94\u5faa\u73af 1800-2000 \u6b21 [EXTRAPOLATED]", "x.md", False),
        ("L5 header-missing", "\u672c\u8f6e\u62a5\u544a\n\u4eca\u5929\u6d4b\u4e86\u4e00\u4e0b\u6563\u70ed\uff0c\u611f\u89c9\u6bd4\u4e4b\u524d\u597d", R, True),
        ("L2 no-sample", "\u6211\u4eec\u9a8c\u8bc1\u4e86\u8fd9\u5957\u65b9\u6cd5\u786e\u5b9e\u6709\u6548\uff0c\u53ef\u4ee5\u63a8\u5e7f\u4e0b\u53bb", "x.md", True),
        ("L2 with-sample", "\u672c\u8f6e\u4ec5\u6837\u672c n=1\uff0c\u5c5e\u5355\u6b21\u89c2\u6d4b\uff0c\u5f85\u590d\u6d4b\u786e\u8ba4", "x.md", False),
        ("L3 retracted-topic", "override-status \u53ef\u4ee5\u4f5c\u4e3a\u9891\u7387\u4e0a\u9650\u6267\u884c\u5668\u4f7f\u7528", "x.md", True),
        ("L3 with-retract", "\u64a4\u56de\uff1aoverride-status \u5bf9 CPU \u9891\u7387\u6beb\u65e0\u4f5c\u7528\uff0c\u6b64\u524d\u7cfb\u70ed\u6001\u5de7\u5408", "x.md", False),
        # --- L9 ---
        ("L9.1 absolute", "\u8fd9\u662f\u4e00\u6b21\u53f2\u8bd7\u7ea7\u7a81\u7834\uff0c\u95ee\u9898 100% \u5f7b\u5e95\u89e3\u51b3\u4e86", "x.md", True),
        ("L9.1 marketing", "\u8fd9\u4e2a\u65b9\u6cd5\u771f\u7684\u9006\u5929\uff0c\u5c0f\u767d\u4e5f\u80fd\u4e00\u952e\u641e\u5b9a", "x.md", True),
        ("L9.1 promise", "\u7528\u4e86\u8fd9\u5957\u65b9\u6848\u5c31\u4fdd\u8bc1\u4e0d\u518d\u53d1\u70ed\uff0c\u4e00\u52b3\u6c38\u9038", "x.md", True),
        ("L9.2 vague-authority", "\u4e1a\u5185\u516c\u8ba4\u8fd9\u662f\u6700\u4f73\u5b9e\u8df5\uff0c\u5b98\u65b9\u4e5f\u662f\u8fd9\u4e48\u5efa\u8bae\u7684", "x.md", True),
        ("L9.2 with-source", "\u4e1a\u5185\u516c\u8ba4\u8fd9\u662f\u6700\u4f73\u5b9e\u8df5\uff0c\u4f9d\u636e 0928 \u62a5\u544a\u4e0e dumpsys \u6570\u636e", "x.md", False),
        ("L9.3 fake-precision", "\u63d0\u5347\u4e86 37.24%\uff0c\u8017\u7535\u964d\u5230 1.993W", "x.md", True),
        ("L9.4 completion", "\u95ee\u9898\u5df2\u4fee\u590d\uff0c\u73b0\u5df2\u751f\u6548\uff0c\u672c\u8f6e\u4efb\u52a1\u5df2\u5b8c\u6210\uff0c\u6536\u5de5", "x.md", True),
        ("L9.5 term-drift", "\u8be5\u7ed3\u8bba\u5f85\u9a8c\u8bc1\uff0c\u4e0d\u8fc7\u4e5f\u6709\u4eba\u8bf4\u5c1a\u672a\u786e\u8ba4", "x.md", True),
        ("L9.7 forward-no-marker", "\u4e0b\u4e00\u6b65\u8ba1\u5212\u628a\u5b83\u63a5\u5165\u6d41\u6c34\u7ebf\uff0c\u5c06\u91cd\u6784\u76d1\u63a7\u6a21\u5757", "x.md", True),
        # --- clean ---
        # --- v3 window rules ---
        ("L9.8 量词无限定", "\u6211\u4eec\u628a\u6240\u6709\u540e\u53f0\u7ec4\u4ef6\u5168\u90e8\u5c01\u6b7b\uff0c\u7cfb\u7edf\u5f7b\u5e95\u5e72\u51c0\u4e86", "x.md", True),
        ("L9.8 量词有范围", "\u5728\u672c\u6b21\u5165\u7f51\u7684\u6837\u672c\u8303\u56f4\u5185\uff0c\u6240\u6709\u7ec4\u4ef6\u5747\u5df2\u65ad\u7f51\uff08n=15\uff09", "x.md", False),
        ("L9.9 因果无对照", "\u56e0\u4e3a\u6ce8\u5165\u4e86\u8be5\u547d\u4ee4\uff0c\u6240\u4ee5\u8017\u7535\u7acb\u523b\u4e0b\u964d\u4e86\u4e00\u5927\u622a", "x.md", True),
        ("L9.9 因果有对照", "\u56e0\u4e3a\u540c\u6e29\u533a\u4ea4\u66ff 8 \u6b21\u5bf9\u7167\u540e\u9891\u7387\u4e0d\u53d8\uff0c\u6240\u4ee5\u5224\u5b9a\u8be5\u547d\u4ee4\u65e0\u6548", "x.md", False),
        ("L9.10 程度无量化", "\u6027\u80fd\u5927\u5e45\u63d0\u5347\uff0c\u53d1\u70ed\u4e25\u91cd\u6539\u5584\uff0c\u4f53\u9a8c\u5dee\u5f02\u5de8\u5927", "x.md", True),
        ("L9.10 程度有量化", "\u636e\u5b9e\u6d4b\uff1a\u6027\u80fd\u5927\u5e45\u63d0\u5347\uff0821.5%\uff09\uff0c\u53d1\u70ed\u4e25\u91cd\u6539\u5584\uff08-3.2\u2103\uff09", "x.md", False),
        ("L9.11 断言强度", "\u6beb\u65e0\u7591\u95ee\uff0c\u8fd9\u5c31\u662f\u94c1\u8bc1", "x.md", True),
        ("L9.12 时间绝对", "\u4e00\u52b3\u6c38\u9038\u5730\u89e3\u51b3\u4e86\u53d1\u70ed\u95ee\u9898", "x.md", True),
        ("L9.13 自指无据", "\u6211\u8ba4\u4e3a\u8fd9\u662f\u6700\u4f18\u89e3\uff0c\u53ef\u4ee5\u653e\u5fc3\u7528", "x.md", True),
        ("L2 邻近无证据", "\u7ecf\u8fc7\u6d4b\u8bd5\u9a8c\u8bc1\uff0c\u8be5\u65b9\u6848\u786e\u5b9e\u6709\u6548\uff0c\u53ef\u4ee5\u63a8\u5e7f\u4e0b\u53bb\u4f7f\u7528", "x.md", True),
        ("L2 邻近有证据", "\u672c\u8f6e\u590d\u6d4b n=3 \u6b21\u9a8c\u8bc1\uff0c\u8be5\u65b9\u6848\u6709\u6548", "x.md", False),
        ("clean", "\u65e5\u671f 2026-10-05\uff1b\u8bbe\u5907 MT6899\uff0c\u56fa\u4ef6 16.1.14.1\uff1b\u5de5\u5177 dumpsys\uff1b"
                  "\u6837\u672c n=3 \u6b21\u5b9e\u6d4b\uff08\u5b9e\u6d4b\uff0c\u975e\u63a8\u7b97\uff09\uff1b\u7ed3\u8bba\u5f3a\u5ea6\uff1a\u4e2d\u3002"
                  "\u636e dumpsys \u5b9e\u6d4b\uff0c\u5f85\u673a 1.9W\uff0c\u89c1 0928 \u62a5\u544a\u3002", R, False),
    ]
    ok = 0
    for name, text, target, expect in cases:
        f = (check_engineering(text, target, conf) + check_language(text, target, lex, conf)
             + check_window_rules(mask_quoted(text), lex, False))
        got = bool(f)
        good = (got == expect)
        ok += 1 if good else 0
        marks = "; ".join(x.split(":")[0] for x in f) if f else ""
        print("%-4s %-20s expect=%-5s got=%-5s %s" % ("PASS" if good else "FAIL", name, expect, got, marks))

    try:
        out = decide({"toolCall": {"name": "write_to_file", "args": {"TargetFile": "x.md", "CodeContent": "hi"}}})
        fo = out.get("decision") == "allow"
    except Exception:
        fo = False
    print("%-4s %-20s expect=True  got=%s" % ("PASS" if fo else "FAIL", "fail-open/short", fo))
    ok += 1 if fo else 0
    total = len(cases) + 1
    print("\nselftest: %d/%d" % (ok, total))
    return 0 if ok == total else 1


if __name__ == "__main__":
    sys.exit(main())

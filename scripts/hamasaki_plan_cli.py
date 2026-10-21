#!/usr/bin/env python3
"""Standalone read-only planning and catalog entry for Hamasaki."""
import argparse
import json
import platform
from hamasaki_pipeline import catalog, make_error, plan, identity_snapshot

def main(argv=None):
    ap = argparse.ArgumentParser(description="Hamasaki Linux planning; no command execution")
    ap.add_argument("command", choices=("plan", "catalog", "identity"))
    ap.add_argument("intent", nargs="*")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    if platform.system() != "Linux":
        out = make_error("ERR_PLATFORM_UNSUPPORTED", "Linux is required", stages=["platform_guard"])
    elif args.command == "identity":
        try:
            out = identity_snapshot()
        except (OSError,ValueError,KeyError,TypeError):
            out = make_error("ERR_CORE_PINS_UNAVAILABLE", "Hash baseline unavailable", stages=["hash_manifest"])
    elif args.command == "catalog":
        tool_meta = catalog()
        out = ({"status": "CATALOG_ONLY", "tools": sorted(tool_meta), "executed": False}
               if tool_meta else make_error("ERR_CATALOG_UNAVAILABLE", "Kaeru catalog unavailable",
                                            stages=["index_catalog"]))
    else:
        out = plan(" ".join(args.intent))
    print(json.dumps(out, ensure_ascii=False, indent=2 if args.json else None))
    return 2 if out.get("status") == "ERR_BLOCK" else 0

if __name__ == "__main__":
    raise SystemExit(main())

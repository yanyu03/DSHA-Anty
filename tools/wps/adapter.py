#!/usr/bin/env python3
"""WPS Tool: local Linux WPS RPC readiness ONLY. Does not launch WPS or edit docs."""
from __future__ import annotations
import argparse, importlib.util, json, os, shutil

def status():
    apps={name:shutil.which(name) for name in ('wps','et','wpp')}
    rpc=bool(importlib.util.find_spec('pywpsrpc'))
    desktop=bool(os.getenv('DISPLAY') or os.getenv('WAYLAND_DISPLAY'))
    return {'status':'READY_FOR_REAL_MACHINE_TEST' if rpc and desktop and apps['wps'] else 'DEPENDENCY_MISSING',
            'tool':'wps','applications':{k:bool(v) for k,v in apps.items()},
            'pywpsrpc':rpc,'graphical_session':desktop,'executed_application':False,
            'note':'No network fallback; local RPC functionality requires real WPS client'}

def main(argv=None):
    p=argparse.ArgumentParser();p.add_argument('action',choices=['status','diagnose']);a=p.parse_args(argv)
    result=status()
    print(json.dumps(result,ensure_ascii=False))
    return 0 if result['status']=='READY_FOR_REAL_MACHINE_TEST' else 2
if __name__=='__main__':raise SystemExit(main())

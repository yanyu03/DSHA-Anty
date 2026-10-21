#!/usr/bin/env python3
"""Markdown Tool: offline, read-only inspection; no HTML rendering or network."""
from __future__ import annotations
import argparse, importlib.util, json, os, pathlib, stat, sys

MAX_BYTES = 4_194_304

def read_checked(value):
    p=pathlib.Path(value)
    if not p.exists() or not stat.S_ISREG(p.lstat().st_mode) or p.suffix.lower() not in ('.md','.markdown'):
        raise ValueError('ERR_INVALID_OR_LINKED_MARKDOWN_FILE')
    if p.stat().st_size > MAX_BYTES: raise ValueError('ERR_TOO_LARGE')
    return p.read_text(encoding='utf-8')

def check(text):
    lines=text.splitlines(); warnings=[]; last_heading=0; fenced=False; fence_marker=None
    for i,line in enumerate(lines,1):
        if line.startswith(chr(96)*3) or line.startswith('~~~'):
            mark=line[:3]
            if not fenced: fenced=True; fence_marker=mark
            elif mark==fence_marker: fenced=False; fence_marker=None
            continue
        if fenced: continue
        trimmed=line.lstrip()
        if trimmed.startswith('#'):
            depth=len(trimmed)-len(trimmed.lstrip('#'))
            if 1<=depth<=6 and trimmed[depth:depth+1] in (' ',''):
                if last_heading and depth>last_heading+1: warnings.append({'line':i,'rule':'MD001','message':'heading level jumps'})
                last_heading=depth
    if fenced: warnings.append({'line':len(lines),'rule':'MD-FENCE','message':'unterminated code fence'})
    if text and not text.endswith('\n'): warnings.append({'line':len(lines),'rule':'MD047','message':'missing final newline'})
    return warnings

def inspect(text):
    from markdown_it import MarkdownIt
    tokens=MarkdownIt('commonmark').parse(text)
    outline=[]
    for i,token in enumerate(tokens):
        if token.type=='heading_open' and i+1<len(tokens):
            outline.append({'level':int(token.tag[1:]),'text':tokens[i+1].content[:160]})
    return {'status':'PASS','tool':'markdown','headings':outline[:128],
            'heading_count':len(outline),'lines':len(text.splitlines()),
            'warnings':check(text),'executed_external':False}

def main(argv=None):
    p=argparse.ArgumentParser(); p.add_argument('action',choices=['status','inspect','check'])
    p.add_argument('file',nargs='?'); a=p.parse_args(argv)
    if a.action=='status':
        out={'status':'AVAILABLE' if importlib.util.find_spec('markdown_it') else 'DEPENDENCY_MISSING',
             'tool':'markdown','runtime':'markdown-it-py','side_effects':'none'}
    else:
        try:
            if not a.file: raise ValueError('ERR_FILE_REQUIRED')
            content=read_checked(a.file)
            out=inspect(content) if a.action=='inspect' else {'status':'PASS','tool':'markdown','warnings':check(content),'executed_external':False}
        except (OSError,UnicodeError,ValueError,ImportError) as e:
            out={'status':'ERR_BLOCK','reason':str(e)[:120],'executed_external':False}
    print(json.dumps(out,ensure_ascii=False))
    return 0 if out['status'] in ('PASS','AVAILABLE') else 2
if __name__=='__main__':raise SystemExit(main())

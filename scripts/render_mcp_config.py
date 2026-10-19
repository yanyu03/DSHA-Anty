"""Resolve private MCP configuration to a new local file; never print values."""
import argparse
import json
import os
from pathlib import Path
from dsha_env import find_binary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default=None)
    parser.add_argument('--rea-entry', default=os.environ.get('DSHA_REA_ENTRY'))
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    node = find_binary('node', args.node)
    entry = Path(args.rea_entry).expanduser() if args.rea_entry else None
    if not node or not entry or not entry.is_absolute() or not entry.is_file():
        parser.error('Provide valid DSHA_NODE/--node and DSHA_REA_ENTRY/--rea-entry; values omitted')
    value = {'mcpServers': {'dsha-rea': {'command': node, 'args': [str(entry), 'mcp']}}}
    # Exclusive creation avoids replacing unrelated client configuration.
    try:
        with args.output.open('x', encoding='utf-8', newline='\n') as output:
            json.dump(value, output, indent=2)
            output.write('\n')
    except OSError:
        parser.exit(2, 'Cannot create private configuration; destination exists or is inaccessible; value omitted\n')
    print('Created private configuration; keep it outside version control')


if __name__ == '__main__':
    main()

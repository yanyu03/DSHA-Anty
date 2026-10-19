"""Create an owned 1 KiB PE64 fixture for static provider validation, not execution."""
import argparse
import hashlib
import json
from pathlib import Path
import struct


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    data = bytearray(1024)
    data[:2] = b'MZ'
    struct.pack_into('<I', data, 0x3c, 0x80)
    data[0x80:0x84] = b'PE\0\0'
    struct.pack_into('<HHIIIHH', data, 0x84, 0x8664, 1, 0, 0, 0, 240, 0x22)
    optional = 0x98
    struct.pack_into('<H', data, optional, 0x20b)
    struct.pack_into('<I', data, optional + 4, 512)
    struct.pack_into('<II', data, optional + 16, 0x1000, 0x1000)
    struct.pack_into('<Q', data, optional + 24, 0x140000000)
    struct.pack_into('<II', data, optional + 32, 0x1000, 0x200)
    struct.pack_into('<HH', data, optional + 40, 6, 0)
    struct.pack_into('<HH', data, optional + 48, 6, 0)
    struct.pack_into('<II', data, optional + 56, 0x2000, 0x200)
    struct.pack_into('<HH', data, optional + 68, 3, 0x100)
    struct.pack_into('<QQQQ', data, optional + 72, 0x100000, 0x1000, 0x100000, 0x1000)
    struct.pack_into('<I', data, optional + 108, 16)
    section = optional + 240
    data[section:section + 8] = b'.text\0\0\0'
    struct.pack_into('<IIII', data, section + 8, 0x80, 0x1000, 0x200, 0x200)
    struct.pack_into('<I', data, section + 36, 0x60000020)
    data[0x200:0x206] = bytes.fromhex('b82a000000c3')  # mov eax,42; ret
    marker = b'DSHA_REA_ENVIRONMENT_SMOKE_TEST\0'
    data[0x240:0x240 + len(marker)] = marker
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    identity = {'purpose': 'owned synthetic static-analysis fixture; never executed',
                'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                'entry_rva': '0x1000', 'image_base': '0x140000000',
                'expected_entry_semantics': 'return integer 42', 'architecture': 'x86_64'}
    args.output.with_suffix('.identity.json').write_text(json.dumps(identity, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(identity))


if __name__ == '__main__':
    main()

"""Require literal equality between a publication tag and the HA manifest."""
import argparse
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--manifest', type=Path, default=Path(__file__).resolve().parents[1]
                        / 'custom_components/s8_omni/manifest.json')
    args = parser.parse_args()
    version = json.loads(args.manifest.read_text(encoding='utf-8'))['version']
    if not isinstance(version, str) or not version or version.startswith('v') or args.tag != version:
        print(f'Release tag {args.tag!r} must exactly equal manifest version {version!r} without a v prefix.', file=sys.stderr)
        return 1
    print(f'Release tag matches manifest: {version}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

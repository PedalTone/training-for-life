#!/usr/bin/env python3
"""On-demand caption-only fallback after YouTube to Transcript returns empty.

python3 public/video-caption-fallback.py URL --site-empty
python3 public/video-caption-fallback.py --captions FILE.vtt
Existing cached captions are reused. Never downloads audio/video or reads cookies.
"""
import argparse
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
from urllib.parse import urlparse, parse_qs


def video_id(url):
    parsed = urlparse(url)
    host = (parsed.hostname or '').lower()
    if parsed.scheme not in ('https', 'http'):
        raise ValueError('Use a full YouTube video URL.')
    if host == 'youtu.be':
        value = parsed.path.strip('/').split('/')[0]
    elif host in ('youtube.com', 'www.youtube.com', 'm.youtube.com'):
        value = parse_qs(parsed.query).get('v', [''])[0]
        if not value:
            parts = parsed.path.strip('/').split('/')
            value = parts[1] if len(parts) == 2 and parts[0] in ('shorts', 'embed', 'live') else ''
    else:
        value = ''
    if not re.fullmatch(r'[\w-]{11}', value):
        raise ValueError('Use a valid YouTube video link.')
    return value


def clean_captions(text):
    out, previous, metadata = [], '', False
    lines=text.replace('\r', '').split('\n')
    for index,raw in enumerate(lines):
        line = raw.strip()
        if re.match(r'^(NOTE|STYLE|REGION)(\s|$)', line):
            metadata = True
            continue
        if not line:
            metadata = False
            continue
        if metadata or re.match(r'^(WEBVTT|Kind:|Language:)', line) or (line.isdigit() and index+1<len(lines) and '-->' in lines[index+1]) or '-->' in line:
            continue
        line = re.sub(r'^\[?(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?\]?(?:\s+|$)', '', line)
        line = html.unescape(re.sub(r'<[^>]*>', '', line))
        line = re.sub(r'\[(music|applause)\]', '', line, flags=re.I).strip()
        if not line or line == previous:
            continue
        a, b = previous.split(), line.split()
        overlap = 0
        for n in range(min(len(a), len(b)), 1, -1):
            if a[-n:] == b[:n]:
                overlap = n
                break
        fresh = ' '.join(b[overlap:])
        if fresh:
            out.append(fresh)
        previous = line
    return '\n'.join(out) + '\n' if out else ''


def run(args, output=None):
    completed = subprocess.run(args, check=True, text=True, capture_output=True, timeout=120)
    if output:
        Path(output).write_text(completed.stdout)
    return completed.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('url', nargs='?')
    parser.add_argument('--site-empty', action='store_true', help='Use only after the primary transcript site returned empty.')
    parser.add_argument('--captions', type=Path, help='Clean an existing .vtt or .srt file without network access.')
    parser.add_argument('--output-dir', type=Path, default=Path.cwd() / 'caption-cache')
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    try:
        if args.captions:
            text = clean_captions(args.captions.read_text())
            name = args.captions.stem
        else:
            if not args.url:
                parser.error('Supply a video URL or --captions file.')
            name = video_id(args.url)
            cached = args.output_dir / f'{name}.txt'
            if cached.exists() and cached.read_text().strip():
                print(f'Reusing cached captions: {cached}')
                return
            if not args.site_empty:
                parser.error('Try YouTube to Transcript first. Pass --site-empty only when it returns empty.')
            executable = shutil.which('yt-dlp')
            if not executable:
                raise ValueError('yt-dlp is not installed. Install it from https://github.com/yt-dlp/yt-dlp before using this fallback.')
            with tempfile.TemporaryDirectory(prefix='t4l-captions-') as folder:
                path = Path(folder)
                common = [executable, '--ignore-config', '--no-playlist', '--skip-download', '--retries', '0', '--extractor-retries', '0', '--fragment-retries', '0']
                metadata = json.loads(run(common + ['--dump-single-json', f'https://www.youtube.com/watch?v={name}']))
                official, automatic = metadata.get('subtitles') or {}, metadata.get('automatic_captions') or {}
                def english(tracks):
                    return next((lang for lang in ('en', 'en-orig') if tracks.get(lang)), next((lang for lang in tracks if lang.startswith('en-') and tracks[lang]), None))
                language = english(official)
                auto = not language
                language = language or english(automatic)
                if not language:
                    raise ValueError('No English captions found. Nothing was downloaded; no retry attempted.')
                info = path / 'metadata.json'
                info.write_text(json.dumps(metadata))
                run(common + ['--load-info-json', str(info), '--write-auto-subs' if auto else '--write-subs', '--sub-langs', re.escape(language), '--sub-format', 'vtt', '--sleep-subtitles', '5', '-o', str(path / '%(id)s.%(ext)s')])
                files = list(path.glob('*.vtt'))
                if not files:
                    raise ValueError('No captions returned. Stop here and try later; no automatic retry is performed.')
                text = clean_captions(files[0].read_text())
        if not text.strip():
            raise ValueError('Caption file was empty. No cached transcript created.')
        output = args.output_dir / f'{name}.txt'
        output.write_text(text)
        print(f'Import this transcript into the video’s workout plan: {output}')
    except (ValueError, OSError, subprocess.SubprocessError, json.JSONDecodeError) as error:
        parser.exit(1, f'Caption fallback stopped: {error}\nNo video/audio downloaded. No repeated retry.\n')


if __name__ == '__main__':
    main()

"""Measure the envelope of each seed across every frame of its display video."""
from pathlib import Path
import json, subprocess, sys, argparse
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/video'))
import cv2
import numpy as np
import imageio_ffmpeg

catalog = subprocess.run(['node', '--input-type=module', '-e',
    "import {elements} from './src/data.js'; console.log(JSON.stringify([...new Set(elements.map(seed => seed.whiteVideoFile))]))"],
    cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
parser = argparse.ArgumentParser()
parser.add_argument('files', nargs='*')
args = parser.parse_args()
sources = args.files or json.loads(catalog.stdout)
output = ROOT / 'src/seed-video-bounds.json'
results = json.loads(output.read_text(encoding='utf-8')) if args.files and output.exists() else {}
for filename in sources:
    source = ROOT / 'src/assets' / filename
    cap = cv2.VideoCapture(str(source))
    width, height, count = int(cap.get(3)), int(cap.get(4)), int(cap.get(7))
    cap.release()
    target_width = 192
    target_height = round(height * target_width / width)
    process = subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error',
        '-i', str(source), '-vf', f'scale={target_width}:{target_height}', '-f', 'rawvideo',
        '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    envelope = [target_width, target_height, 0, 0]
    frames = 0
    hull = None
    while True:
        raw = process.stdout.read(target_width * target_height * 3)
        if not raw: break
        if len(raw) != target_width * target_height * 3: raise RuntimeError('Incomplete frame')
        frame = np.frombuffer(raw, np.uint8).reshape(target_height, target_width, 3)
        border = np.concatenate([frame[0], frame[-1], frame[:, 0], frame[:, -1]])
        background = np.median(border, axis=0)
        mask = (np.max(np.abs(frame.astype(float) - background), axis=2) > 20).astype(np.uint8)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours: raise RuntimeError(f'No seed in {filename}: {frames}')
        contour = max(contours, key=cv2.contourArea)
        hull = cv2.convexHull(contour if hull is None else np.concatenate([hull, contour]))
        x, y, w, h = cv2.boundingRect(contour)
        envelope = [min(envelope[0], x), min(envelope[1], y), max(envelope[2], x+w), max(envelope[3], y+h)]
        frames += 1
    if process.wait() or frames != count: raise RuntimeError(f'Incomplete video: {filename} {frames}/{count}')
    # Two measurement pixels cover soft edges and downsampling uncertainty.
    results[filename] = {
        'left': max(0, envelope[0]-2)/target_width,
        'top': max(0, envelope[1]-2)/target_height,
        'right': min(target_width, envelope[2]+2)/target_width,
        'bottom': min(target_height, envelope[3]+2)/target_height,
        'outline': [[float(point[0])/target_width, float(point[1])/target_height] for point in hull[:,0]],
        'edgePadding': 2/min(target_width,target_height),
    }
    print(f'{filename}: {frames} frames, {len(hull)} contour vertices', flush=True)
(ROOT / 'src/seed-video-bounds.json').write_text(json.dumps(results, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')

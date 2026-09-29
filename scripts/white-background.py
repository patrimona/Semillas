"""Export white-background copies while preserving all original seed videos."""
from pathlib import Path
import argparse
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/video'))
import cv2
import numpy as np
import imageio_ffmpeg

review_dir = ROOT / '.tools/white-review'
review_dir.mkdir(parents=True, exist_ok=True)

def convert(name):
    source = ROOT / 'src/assets' / f'{name}.mp4'
    output = ROOT / 'src/assets' / f'{name}-blanco.mp4'
    capture = cv2.VideoCapture(str(source))
    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    if not capture.isOpened() or not count:
        raise RuntimeError('Cannot read source video')
    
    encoder = subprocess.Popen([
        imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-hide_banner', '-loglevel', 'error',
        '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{width}x{height}',
        '-r', str(fps), '-i', '-', '-i', str(source),
        '-map', '0:v:0', '-map', '1:a?', '-c:v', 'libx264', '-crf', '18',
        '-color_range', 'tv', '-colorspace', 'smpte170m', '-color_primaries', 'bt709',
        '-color_trc', 'bt709', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy',
        '-movflags', '+faststart', str(output),
    ], stdin=subprocess.PIPE)
    
    samples = []
    sample_indices = {0, count // 4, count // 2, count * 3 // 4, count - 1}
    processed = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            # Use the exterior silhouette, keeping dark markings inside the seed.
            cutoff = 6 if name in ('cebolla', 'nabo') else 10 if name == 'cardo_blanco' else 20
            threshold = (frame.max(axis=2) > cutoff).astype(np.uint8) * 255
            contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                raise RuntimeError(f'No seed found at frame {processed}')
            contour = max(contours, key=cv2.contourArea)
            if name == 'nabo':
                # Its rounded silhouette includes nearly black edge markings.
                # Bridge those edge gaps rather than cutting into the seed.
                contour = cv2.convexHull(contour)
            mask = np.zeros((height, width), dtype=np.uint8)
            cv2.drawContours(mask, [contour], -1, 255, cv2.FILLED)
            # A narrow feather removes the black fringe without filtering the texture.
            inset = cv2.erode(mask, np.ones((3, 3), np.uint8))
            alpha = cv2.GaussianBlur(inset, (5, 5), 0.65).astype(np.float32)[:, :, None] / 255
            result = np.rint(frame.astype(np.float32) * alpha + 255 * (1 - alpha)).astype(np.uint8)
            encoder.stdin.write(cv2.cvtColor(result, cv2.COLOR_BGR2YUV_I420).tobytes())
            if processed in sample_indices:
                x, y, w, h = cv2.boundingRect(contour)
                margin = 18
                bounds = (slice(max(0, y - margin), min(height, y + h + margin)),
                          slice(max(0, x - margin), min(width, x + w + margin)))
                pair = [cv2.resize(img[bounds], (300, 300)) for img in (frame, result)]
                samples.append(np.vstack(pair))
            processed += 1
    finally:
        capture.release()
        encoder.stdin.close()
        status = encoder.wait()
    if status or processed != count:
        raise RuntimeError(f'Incomplete encode: {processed}/{count}, exit {status}')
    cv2.imwrite(str(review_dir / f'{name}.png'), np.hstack(samples))
    check = cv2.VideoCapture(str(output))
    encoded_frames = int(check.get(cv2.CAP_PROP_FRAME_COUNT))
    encoded_fps = check.get(cv2.CAP_PROP_FPS)
    if encoded_frames != count or abs(encoded_fps - fps) > .001:
        raise RuntimeError(f'Output timing mismatch: {name}')
    print(json.dumps({'seed': name, 'frames': processed, 'fps': fps, 'size': [width, height]}), flush=True)
    check.release()
    

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('names', nargs='*')
    parser.add_argument('--all', action='store_true')
    args = parser.parse_args()
    names = args.names or ['algarroba']
    if args.all:
        names = [p.stem for p in sorted((ROOT / 'src/assets').glob('*.mp4')) if '-blanco' not in p.stem]
    for name in names:
        if args.all and (ROOT / 'src/assets' / f'{name}-blanco.mp4').exists():
            print(f'Already exported: {name}', flush=True)
            continue
        print(f'Processing: {name}', flush=True)
        convert(name)

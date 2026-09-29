from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/video'))
import cv2
import numpy as np

tiles = []
for path in sorted((ROOT / 'src/assets').glob('*.mp4')):
    if '-blanco' in path.stem:
        continue
    capture = cv2.VideoCapture(str(path))
    count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = capture.get(cv2.CAP_PROP_FPS)
    capture.set(cv2.CAP_PROP_POS_FRAMES, count // 2)
    ok, frame = capture.read()
    print(path.name, count, fps, frame.shape if ok else None, flush=True)
    if ok:
        mask = (frame.max(axis=2) > 10).astype(np.uint8)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        crop = frame[max(0, y-15):y+h+15, max(0, x-15):x+w+15]
        tile = cv2.resize(crop, (240, 240))
        cv2.putText(tile, path.stem, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, .6, (0, 255, 255), 1)
        tiles.append(tile)
    capture.release()
review_dir = ROOT / '.tools/white-review'
review_dir.mkdir(parents=True, exist_ok=True)
cv2.imwrite(str(review_dir / 'originals.png'), np.vstack([
    np.hstack(tiles[i:i+4]) for i in range(0, len(tiles), 4)
]))

"""Create reviewed 60 fps seed loops; keep the source videos unchanged."""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/video'))
import cv2
import imageio_ffmpeg
import numpy as np

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

def difference(a, b):
    foreground = (a < 240) | (b < 240)
    return float(np.abs(a.astype(float)-b)[foreground].mean()) if foreground.any() else 0

def bridge(a, b, count):
    """Align both silhouettes before blending intermediate closing frames."""
    height, width = a.shape[:2]
    ratio = min(1, 384 / max(width, height))
    size = (max(16, round(width*ratio)), max(16, round(height*ratio)))
    ga = cv2.resize(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), size)
    gb = cv2.resize(cv2.cvtColor(b, cv2.COLOR_BGR2GRAY), size)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    forward = flow.calc(ga, gb, None)
    backward = flow.calc(gb, ga, None)
    forward = cv2.resize(forward, (width,height))
    backward = cv2.resize(backward, (width,height))
    forward[:,:,0] *= width/size[0]; forward[:,:,1] *= height/size[1]
    backward[:,:,0] *= width/size[0]; backward[:,:,1] *= height/size[1]
    grid = np.stack(np.meshgrid(np.arange(width), np.arange(height)), axis=2).astype(np.float32)
    for index in range(1, count+1):
        t = index/(count+1)
        wa = cv2.remap(a, grid-forward*t, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(255,255,255))
        wb = cv2.remap(b, grid-backward*(1-t), None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(255,255,255))
        yield cv2.addWeighted(wa,1-t,wb,t,0)

def convert(entry):
    slug = entry['slug']
    source = ROOT/'src/assets'/entry['file']
    output = ROOT/'src/assets'/f'{slug}-fluido.mp4'
    capture = cv2.VideoCapture(str(source))
    width, height = int(capture.get(3)), int(capture.get(4))
    fps, count = capture.get(5), int(capture.get(7))
    raw = subprocess.run([FFMPEG,'-v','error','-i',str(source),'-vf','scale=192:192','-f','rawvideo','-pix_fmt','gray','-'],stdout=subprocess.PIPE,check=True).stdout
    small = np.frombuffer(raw,np.uint8).reshape(-1,192,192)
    occupied = (small<240).any(axis=0)
    ys,xs = np.where(occupied)
    margin = 24
    left = max(0,int(xs.min()/192*width)-margin)//2*2
    top = max(0,int(ys.min()/192*height)-margin)//2*2
    right = min(width,int((xs.max()+1)/192*width)+margin+1)//2*2
    bottom = min(height,int((ys.max()+1)/192*height)+margin+1)//2*2
    steps = np.array([difference(a,b) for a,b in zip(small[:-1],small[1:])])
    median = float(np.median(steps))
    end = count
    # The azafranero source overshoots its starting orientation at the end.
    if slug == 'azafranero':
        candidates = range(int(count*.85),count)
        end = min(candidates,key=lambda i:difference(small[0],small[i]))+1
    selected = [0]
    for index in range(1,end):
        if difference(small[selected[-1]],small[index]) >= .15:
            selected.append(index)
    # A repeated closing pose belongs to the beginning of the next turn.
    if len(selected)>2 and difference(small[selected[-1]],small[0]) < median*.55:
        selected.pop()
    chosen = set(selected)
    frames = []
    for index in range(end):
        ok, frame = capture.read()
        if not ok: raise RuntimeError(f'Cannot decode {slug} frame {index}')
        if index in chosen:
            frames.append(frame[top:bottom,left:right].copy())
    capture.release()
    seam = difference(small[selected[-1]],small[0])
    closing_count = min(12,max(2,math.ceil(seam/max(median,.1)))) if seam>median*1.5 else 0
    if closing_count:
        frames.extend(bridge(frames[-1],frames[0],closing_count))
    duration = (count-1)/fps if count%int(round(fps)) == 1 else count/fps
    rate = len(frames)/duration
    context = frames[-2:]+frames+frames[:3]
    output_count = round(duration*60)
    crop_width,crop_height = right-left,bottom-top
    filters = (
        'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:me=epzs:vsbmc=1:scd=none,'
        f'trim=start={2/rate:.9f},setpts=N/(60*TB),'
        f'pad={width}:{height}:{left}:{top}:color=white'
    )
    encoder = subprocess.Popen([
        FFMPEG,'-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24',
        '-s',f'{crop_width}x{crop_height}','-r',str(rate),'-i','-',
        '-vf',filters,'-frames:v',str(output_count),'-r','60','-fps_mode','cfr','-an','-c:v','libx264','-crf','18',
        '-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output),
    ],stdin=subprocess.PIPE)
    print(json.dumps({'slug':slug,'status':'encoding','sourceFrames':count,'movingFrames':len(selected),'closingFrames':closing_count,'crop':[crop_width,crop_height]}),flush=True)
    try:
        for frame in context: encoder.stdin.write(frame.tobytes())
    finally:
        encoder.stdin.close()
        status = encoder.wait()
    if status: raise RuntimeError(f'Encoder failed: {slug}')
    check=cv2.VideoCapture(str(output))
    actual_count=int(check.get(7))
    if actual_count!=output_count or abs(check.get(5)-60)>.001 or check.get(3)!=width or check.get(4)!=height:
        raise RuntimeError(f'Wrong output timing/dimensions: {slug}, {actual_count}/{output_count}')
    check.release()
    result={**entry,'output':output.name,'frames':output_count,'fps':60,'duration':duration,'removedFrames':count-len(selected),'closingFrames':closing_count}
    report_dir=ROOT/'.tools/smooth-loops'
    report_dir.mkdir(exist_ok=True)
    (report_dir/f'{slug}.json').write_text(json.dumps(result,indent=2))
    print(json.dumps(result),flush=True)
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('slugs',nargs='*')
    args=parser.parse_args()
    entries=json.loads((ROOT/'scripts/loop-sources.json').read_text(encoding='utf-8'))
    results=[]
    for entry in entries:
        if args.slugs and entry['slug'] not in args.slugs: continue
        results.append(convert(entry))

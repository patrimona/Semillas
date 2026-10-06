"""Retime slow portions of reviewed loops, preserving their framing and duration."""
import argparse,json,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools/video'))
import cv2,numpy as np,imageio_ffmpeg
cv2.setNumThreads(2)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()

def motion_profile(path):
    raw=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-vf','fps=15,scale=192:192','-f','rawvideo','-pix_fmt','gray','-'],stdout=subprocess.PIPE,check=True).stdout
    small=np.frombuffer(raw,np.uint8).reshape(-1,192,192)
    dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    movement=[]
    for a,b in zip(small,np.roll(small,-1,axis=0)):
        flow=dis.calc(a,b,None)
        mask=cv2.erode(((a<230)&(b<230)).astype(np.uint8),np.ones((3,3),np.uint8)).astype(bool)
        speed=np.sqrt(flow[:,:,0]**2+.25*flow[:,:,1]**2)
        movement.append(float(np.percentile(speed[mask],65)))
    smoothed=sum(np.roll(movement,k) for k in range(-4,5))/9
    return small,smoothed

def convert(slug):
    source=ROOT/'src/assets'/f'{slug}-fluido.mp4'
    output=ROOT/'src/assets'/f'{slug}-constante.mp4'
    small,motion=motion_profile(source)
    capture=cv2.VideoCapture(str(source))
    width,height=int(capture.get(3)),int(capture.get(4))
    count=int(capture.get(7));fps=capture.get(5)
    ratio=motion/max(float(np.median(motion)),.001)
    # Preserve already steady rotations; avoid correcting natural perspective changes.
    if float((ratio<.6).mean()) < .04:
        capture.release();print(json.dumps({'slug':slug,'status':'already steady'}),flush=True);return
    density=np.clip(ratio,.12,1.8)**.8
    density=np.interp(np.arange(count)*len(motion)/count,np.arange(len(motion)+1),np.r_[density,density[0]])
    density/=density.mean()
    edges=np.r_[0,np.cumsum(density)]
    positions=np.interp(np.arange(count),edges,np.arange(count+1))
    ys,xs=np.where((small<240).any(axis=0))
    left=max(0,int(xs.min()/192*width)-24)//2*2
    top=max(0,int(ys.min()/192*height)-24)//2*2
    right=min(width,int((xs.max()+1)/192*width)+25)//2*2
    bottom=min(height,int((ys.max()+1)/192*height)+25)//2*2
    cw,ch=right-left,bottom-top
    size=(max(16,round(cw*min(1,256/max(cw,ch)))),max(16,round(ch*min(1,256/max(cw,ch)))))
    grid=np.stack(np.meshgrid(np.arange(cw),np.arange(ch)),axis=2).astype(np.float32)
    dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    ok,decoded=capture.read();assert ok
    first=decoded[top:bottom,left:right].copy()
    previous=first;following=None;decoded_index=0;cached_index=-1
    output.parent.mkdir(exist_ok=True)
    encoder=subprocess.Popen([FFMPEG,'-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{cw}x{ch}','-r',str(fps),'-i','-',
        '-vf',f'format=rgb24,pad={width}:{height}:{left}:{top}:color=white','-frames:v',str(count),'-an','-c:v','libx264','-crf','12','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
    print(json.dumps({'slug':slug,'status':'retiming','minPlaybackRate':round(float(1/density.max()),2),'maxPlaybackRate':round(float(1/density.min()),2)}),flush=True)
    try:
        for position in positions:
            index=min(count-1,int(position));fraction=float(position-index)
            # Decode in order: retain only the adjacent pair and the first frame.
            while decoded_index<=index:
                if following is not None:previous=following
                if decoded_index+1<count:
                    ok,decoded=capture.read();assert ok
                    following=decoded[top:bottom,left:right].copy()
                else:following=first
                decoded_index+=1
            if fraction<.005:
                frame=previous
            else:
                if cached_index!=index:
                    a=cv2.resize(cv2.cvtColor(previous,cv2.COLOR_BGR2GRAY),size)
                    b=cv2.resize(cv2.cvtColor(following,cv2.COLOR_BGR2GRAY),size)
                    forward=cv2.resize(dis.calc(a,b,None),(cw,ch))
                    backward=cv2.resize(dis.calc(b,a,None),(cw,ch))
                    for flow in [forward,backward]:
                        flow[:,:,0]*=cw/size[0];flow[:,:,1]*=ch/size[1]
                    cached_index=index
                a=cv2.remap(previous,grid-forward*fraction,None,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(255,255,255))
                b=cv2.remap(following,grid-backward*(1-fraction),None,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=(255,255,255))
                frame=cv2.addWeighted(a,1-fraction,b,fraction,0)
            # Restore neutral white after decoding/interpolation so multiply
            # keeps the same gray background without tinted compression noise.
            frame=frame.copy()
            frame[(frame.min(axis=2)>245)]=255
            encoder.stdin.write(frame.tobytes())
    finally:
        encoder.stdin.close();status=encoder.wait();capture.release()
    if status:raise RuntimeError(slug)
    check=cv2.VideoCapture(str(output))
    assert int(check.get(7))==count and abs(check.get(5)-fps)<.001 and int(check.get(3))==width and int(check.get(4))==height
    check.release()
    _,after=motion_profile(output)
    before_cv=float(motion.std()/motion.mean());after_cv=float(after.std()/after.mean())
    if after_cv>=before_cv*.85:
        raise RuntimeError(f'Insufficient improvement: {slug}, {before_cv:.3f} -> {after_cv:.3f}')
    report={'slug':slug,'output':output.name,'frames':count,'fps':fps,'duration':count/fps,'variationBefore':before_cv,'variationAfter':after_cv}
    directory=ROOT/'.tools/rotation-reports';directory.mkdir(exist_ok=True)
    (directory/f'{slug}.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('slugs',nargs='*');args=parser.parse_args()
    entries=json.loads((ROOT/'scripts/loop-sources.json').read_text(encoding='utf-8'))
    for entry in entries:
        if not args.slugs or entry['slug'] in args.slugs:convert(entry['slug'])

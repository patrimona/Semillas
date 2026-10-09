from pathlib import Path
import sys,subprocess,argparse
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.tools/video'))
import cv2,numpy as np,imageio_ffmpeg

def composite(frame, color_only=False, minimum_saturation=50, convex_outline=False):
    # The seed is darker and browner than the neutral background.
    delta=frame[:,:,2].astype(np.int16)-frame[:,:,0].astype(np.int16)
    border=np.concatenate([delta[:20].ravel(),delta[-20:].ravel(),delta[:,:20].ravel(),delta[:,-20:].ravel()])
    threshold=max(20,float(np.percentile(border,99))+10)
    gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
    gray_border=np.concatenate([gray[:20].ravel(),gray[-20:].ravel(),gray[:,:20].ravel(),gray[:,-20:].ravel()])
    dark_limit=float(np.percentile(gray_border,1))-35
    mask=((delta>threshold)|((gray<dark_limit) & (not color_only))).astype(np.uint8)*255
    if color_only:
        saturation=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV)[:,:,1]
        mask=(saturation>=minimum_saturation).astype(np.uint8)*255
        cleanup=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15))
        mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,cleanup)
        mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,cleanup)
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    contour=max(contours,key=cv2.contourArea)
    if convex_outline:contour=cv2.convexHull(contour)
    silhouette=np.zeros(mask.shape,np.uint8)
    cv2.drawContours(silhouette,[contour],-1,255,cv2.FILLED)
    alpha=cv2.GaussianBlur(silhouette,(5,5),.7).astype(np.float32)[:,:,None]/255
    result=np.rint(frame.astype(np.float32)*alpha+255*(1-alpha)).astype(np.uint8)
    return result

def export(source=None, output=None, color_only=False, minimum_saturation=50, convex_outline=False):
    cap=cv2.VideoCapture(str(source or ROOT/'src/assets/ZANAHORIA BUENO.mp4'))
    width,height=int(cap.get(3)),int(cap.get(4))
    fps,count=cap.get(5),int(cap.get(7))
    output=output or ROOT/'src/assets/zanahoria-bueno-blanco.mp4'
    encoder=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-hide_banner','-loglevel','error',
        '-f','rawvideo','-pix_fmt','bgr24','-s',f'{width}x{height}','-r',str(fps),'-i','-',
        '-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709',
        '-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-color_range','tv',
        '-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
    processed=0
    try:
        while True:
            ok,frame=cap.read()
            if not ok:break
            encoder.stdin.write(composite(frame,color_only,minimum_saturation,convex_outline).tobytes())
            processed+=1
    finally:
        cap.release();encoder.stdin.close();status=encoder.wait()
    if status or processed!=count:raise RuntimeError('Incomplete export')
    check=cv2.VideoCapture(str(output))
    assert int(check.get(7))==count and abs(check.get(5)-fps)<.001
    assert int(check.get(3))==width and int(check.get(4))==height
    for index in [0,count//4,count//2,count*3//4,count-1]:
        check.set(1,index);ok,frame=check.read()
        assert ok and np.abs(frame[:20].astype(float)-255).max()<=2
    check.release()
    print(f'Exported and verified {processed} frames at {fps} fps')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path,default=ROOT/'src/assets/ZANAHORIA BUENO.mp4')
    parser.add_argument('--output',type=Path,default=ROOT/'src/assets/zanahoria-bueno-blanco.mp4')
    parser.add_argument('--export',action='store_true')
    parser.add_argument('--color-only',action='store_true')
    parser.add_argument('--minimum-saturation',type=int,default=50)
    parser.add_argument('--convex-outline',action='store_true')
    args=parser.parse_args()
    source=args.source
    cap=cv2.VideoCapture(str(source))
    count=int(cap.get(7));tiles=[]
    for index in [0,count//4,count//2,count*3//4,count-1]:
        cap.set(1,index);ok,frame=cap.read()
        if not ok:raise RuntimeError(index)
        result=composite(frame,args.color_only,args.minimum_saturation,args.convex_outline)
        gray=np.rint(result.astype(np.float32)*224/255).astype(np.uint8)
        preview_size=(384,round(384*frame.shape[0]/frame.shape[1]))
        tiles.append(np.vstack([cv2.resize(frame,preview_size),cv2.resize(gray,preview_size)]))
    cv2.imwrite(str(ROOT/'.tools/daucus-background-review.png'),np.hstack(tiles))
    cap.release()
    if args.export:export(source,args.output,args.color_only,args.minimum_saturation,args.convex_outline)

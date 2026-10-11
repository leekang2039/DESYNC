import numpy as np, cv2
from PIL import Image
S=4
src=np.array(Image.open('/tmp/claude-0/-home-user-DESYNC/36e57bd7-db17-5ffc-9df8-0d4fba490d11/images/5.png').convert('RGB')).astype(np.float32)
# row-wise background (left / right edge colours), extendable to any width
L=np.array([src[y,0:10].mean(0) if y<=132 else src[y,0:40].mean(0) for y in range(216)]); R=np.array([src[y,370:384].mean(0) for y in range(216)])
L=cv2.GaussianBlur(L[:,None,:],(1,9),0)[:,0,:]; R=cv2.GaussianBlur(R[:,None,:],(1,9),0)[:,0,:]
def bg_canvas(w):  # w in orig px
    t=np.linspace(0,1,w*S)[None,:,None]; Ls=cv2.resize(L[:,None,:],(1,216*S),interpolation=cv2.INTER_CUBIC); Rs=cv2.resize(R[:,None,:],(1,216*S),interpolation=cv2.INTER_CUBIC)
    return (Ls*(1-t)+Rs*t).astype(np.float32)
bg0=bg_canvas(384)[:, :, :]
diff=np.abs(src-cv2.resize(bg0,(384,216),interpolation=cv2.INTER_AREA)).max(-1)
m=(diff>26).astype(np.uint8); m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((2,2),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
yy,xx=np.mgrid[0:216,0:384]
m[(xx<252)&(yy>129)]=0; m[(xx<262)&(yy<27)]=0; m[yy<24]=0; m[(xx>352)&(yy>60)&(yy<130)]=0   # floor shadow / halo are background
n,lab,st,_=cv2.connectedComponentsWithStats(m); m=(lab==np.argmax(st[1:,4])+1).astype(np.uint8)
ff=m.copy(); cv2.floodFill(ff,np.zeros((218,386),np.uint8),(0,0),1); holes=(ff==0).astype(np.uint8)
nh,hl,hs,_=cv2.connectedComponentsWithStats(holes)
for i in range(1,nh):
    if hs[i,4]<40: m[hl==i]=1                     # only tiny holes; the trigger-guard opening stays background
m[(yy>126)&(xx<262+(yy-126)*0.35)]=0
IMG=cv2.resize(src,(384*S,216*S),interpolation=cv2.INTER_LANCZOS4)
MASK=cv2.GaussianBlur(cv2.resize(m.astype(np.float32),(384*S,216*S),interpolation=cv2.INTER_LINEAR),(5,5),0)
def piece(x0,y0,x1,y1, mask=None):
    """RGBA piece cut from the gun (orig coords); mask restricted to the gun silhouette"""
    a=MASK[y0*S:y1*S, x0*S:x1*S].copy()
    if mask is not None: a*=mask
    return np.dstack([IMG[y0*S:y1*S, x0*S:x1*S], a])
def paste(canvas, pc, x, y):
    """alpha-composite RGBA piece at orig coords (x,y) (floats allowed)"""
    X=int(round(x*S)); Y=int(round(y*S)); h,w=pc.shape[:2]
    H,W=canvas.shape[:2]; xa,ya=max(0,X),max(0,Y); xb,yb=min(W,X+w),min(H,Y+h)
    if xb<=xa or yb<=ya: return
    p=pc[ya-Y:yb-Y, xa-X:xb-X]; al=p[...,3:4]
    canvas[ya:yb,xa:xb]=canvas[ya:yb,xa:xb]*(1-al)+p[...,:3]*al
def glow(canvas, draw_fn, color, core=1.0, blur=18, strength=1.0):
    """draw_fn(mask) draws on a float mask (full-res); adds additive glow + core"""
    H,W=canvas.shape[:2]; mk=np.zeros((H,W),np.float32); draw_fn(mk)
    g=cv2.GaussianBlur(mk,(0,0),blur); c=np.array(color,np.float32)
    canvas+= (g[...,None]*c*strength*1.4)
    canvas[:]=canvas*(1-mk[...,None]*core)+mk[...,None]*core*np.minimum(255,c*0.35+255*0.7)
def shade_ellipse(canvas, cx, cy, rx, ry, col=(38,40,44), rim=(150,155,160)):
    H,W=canvas.shape[:2]; mk=np.zeros((H,W),np.float32)
    cv2.ellipse(mk,(int(cx*S),int(cy*S)),(int(rx*S),int(ry*S)),0,0,360,1,-1,cv2.LINE_AA)
    yy,xx=np.mgrid[0:H,0:W]; t=np.clip(((yy/S-cy)/ry+1)/2,0,1)
    base=np.array(col,np.float32)[None,None]*(1.25-0.5*t[...,None])
    canvas[:]=canvas*(1-mk[...,None])+base*mk[...,None]
    hl=np.zeros((H,W),np.float32); cv2.ellipse(hl,(int(cx*S),int(cy*S)),(int(rx*S),int(ry*S)),0,200,250,1,max(2,S),cv2.LINE_AA)
    hl=cv2.GaussianBlur(hl,(0,0),1.2); canvas[:]=canvas*(1-hl[...,None]*0.8)+np.array(rim,np.float32)*hl[...,None]*0.8
def save(canvas, path):
    out=np.clip(canvas,0,255).astype(np.uint8); Image.fromarray(out).save(path); return out
ORANGE=(255,120,30)

def slot(canvas,x,y,w,h=3.2):
    """recessed black slot with an orange light capsule (orig coords)"""
    H,W=canvas.shape[:2]; mk=np.zeros((H,W),np.float32)
    cv2.rectangle(mk,(int(x*S),int(y*S)),(int((x+w)*S),int((y+h)*S)),1,-1,cv2.LINE_AA); mk=cv2.GaussianBlur(mk,(3,3),0)
    canvas[:]=canvas*(1-mk[...,None])+np.array([24,24,26])*mk[...,None]
    glow(canvas,lambda m2: cv2.line(m2,(int((x+1.2)*S),int((y+h/2)*S)),(int((x+w-1.2)*S),int((y+h/2)*S)),1,max(2,S//2+1),cv2.LINE_AA),ORANGE,core=1.0,blur=6,strength=0.7)

import sys; sys.path.insert(0,'.'); from lib import *
# AP · rail: barrel section stretched (×1.45), upper/lower barrels split by a lit rail channel, heat vents on top
X0,X1,EXT=58,200,64; Wn=384+EXT; c=bg_canvas(Wn)
lay=np.zeros((216*S,Wn*S,4),np.float32)
def put(pc,x):
    X=int(x*S);h,w=pc.shape[:2]; a=pc[...,3:4]; reg=lay[:h,X:X+w]; reg[...,:3]=reg[...,:3]*(1-a)+pc[...,:3]*a; reg[...,3:4]=np.maximum(reg[...,3:4],a)
put(piece(X1,0,384,216),X1+EXT)
mid=piece(X0,0,X1,216); mid=cv2.resize(mid,((X1-X0+EXT)*S,216*S),interpolation=cv2.INTER_CUBIC); put(mid,X0)
put(piece(0,0,X0,216),0)
SPLIT=96; out=np.zeros_like(lay)
for X in range(lay.shape[1]):
    x=X/S; g=0 if x>X1+EXT-4 else (5 if x<X1+EXT-34 else 5*(X1+EXT-4-x)/30)
    G=int(round(g*S)); col=lay[:,X]; up=col[:SPLIT*S]; lo=col[SPLIT*S:]
    if G>0:
        out[:SPLIT*S-G, X]=up[G:]; out[SPLIT*S+G:, X]=lo[:lo.shape[0]-G]
        if col[SPLIT*S,3]>0.5:
            t=np.linspace(-1,1,2*G)[:,None]; out[SPLIT*S-G:SPLIT*S+G,X,:3]=np.array([18,16,16])*np.abs(t)+np.array([255,160,70])*(1-np.abs(t))**2.5; out[SPLIT*S-G:SPLIT*S+G,X,3]=1
    else: out[:,X]=col
a=out[...,3:4]; c=c*(1-a)+out[...,:3]*a
def rail(mk): cv2.line(mk,(int(17*S),int(SPLIT*S)),(int((X1+EXT-10)*S),int(SPLIT*S)),1,max(2,S//2),cv2.LINE_AA)
glow(c,rail,ORANGE,core=0.0,blur=9,strength=0.8)
for x in (112,150,188): slot(c,x,44.5,22)
save(c,'ap.png')

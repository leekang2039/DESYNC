import sys; sys.path.insert(0,'.'); from lib import *
rng=np.random.default_rng(7)
# DSYNC · desync: the front shell detaches into floating segments a step out of sync, the dark inner frame and its energy
# spine show through the gaps, glowing tethers hold each segment, faint time-lag ghosts trail them
c=bg_canvas(400); SPLIT=96; O=16
yy=np.mgrid[0:216*S,0:384*S][0]
def chunk(x0,x1,up):
    pc=piece(x0,0,x1,216); m=(yy[:, x0*S:x1*S] < SPLIT*S) if up else (yy[:, x0*S:x1*S] >= SPLIT*S); pc[...,3]*=m; return pc
CH=[ (14,60,True,-16,-13), (60,150,True,-7,-9), (150,205,True,-1,-5), (14,60,False,-18,10), (60,205,False,-6,7) ]
paste(c,piece(205,0,384,216),205+O,0)
# inner frame: the front silhouette, shrunk a little, as dark machined skeleton with ribs
inner=piece(14,0,205,216); a=inner[...,3]; a=cv2.erode(a,np.ones((5*S//2,5*S//2),np.uint8)); 
dark=np.dstack([np.full(a.shape,30),np.full(a.shape,30),np.full(a.shape,33)]).astype(np.float32)
dark+= (IMG[:, 14*S:205*S]-IMG[:, 14*S:205*S].mean())*0.12
paste(c,np.dstack([dark,a*0.97]),14+O,0)
H,W=c.shape[:2]
for x in range(24+O,205+O,14):
    mk=np.zeros((H,W),np.float32); cv2.rectangle(mk,(int(x*S),int(46*S)),(int((x+2)*S),int(122*S)),1,-1); mk*=cv2.resize(np.pad(a,((0,0),((14+O)*S,W-(205+O)*S))),(W,H))
    c[:]=c*(1-mk[...,None]*0.8)+np.array([62,62,66])*mk[...,None]*0.8
glow(c,lambda mk: cv2.line(mk,(int((22+O)*S),int(SPLIT*S)),(int((204+O)*S),int(SPLIT*S)),1,max(3,S),cv2.LINE_AA),ORANGE,core=1,blur=12,strength=1.4)
glow(c,lambda mk: [cv2.circle(mk,(int(x*S),int(SPLIT*S)),int(2.4*S),1,-1,cv2.LINE_AA) for x in (40+O,100+O,170+O)],ORANGE,core=1,blur=10,strength=1.2)
for x0,x1,up,dx,dy in CH:
    pc=chunk(x0,x1,up)
    for k in (2,1):
        g=pc.copy(); g[...,3]*=0.22/k; g[...,:3]=g[...,:3]*0.5+np.array([255,170,110])*0.5; paste(c,g,x0+O+dx+5*k,dy*(1-0.3*k))
    paste(c,pc,x0+O+dx,dy)
    ey=(SPLIT+dy-1) if up else (SPLIT+dy+1)
    for t in (0.2,0.5,0.8):
        xx=x0+O+dx+(x1-x0)*t
        glow(c,lambda mk,xx=xx,ey=ey: cv2.line(mk,(int(xx*S),int(ey*S)),(int((xx-dx*0.4)*S),int(SPLIT*S)),1,max(2,S//2),cv2.LINE_AA),ORANGE,core=1,blur=5,strength=0.9)
save(c,'dsync.png')

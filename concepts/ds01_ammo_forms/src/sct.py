import sys; sys.path.insert(0,'.'); from lib import *
# SCT · flechette scatter: the front barrels hinge open like jaws (upper −8°, lower +8°), a fan of flechette rails glows inside
c=bg_canvas(384); SPLIT=96; PX=150
yy,xx=np.mgrid[0:216*S,0:384*S]
def rot_piece(mask_up, ang, pivot):
    pc=piece(0,0,PX,216); m=np.ones(pc.shape[:2],np.float32)
    m*= (yy[:, :PX*S] < SPLIT*S) if mask_up else (yy[:, :PX*S] >= SPLIT*S)
    pc[...,3]*=m
    full=np.zeros((216*S,384*S,4),np.float32); full[:, :PX*S]=pc
    M=cv2.getRotationMatrix2D((pivot[0]*S,pivot[1]*S),ang,1.0)
    return cv2.warpAffine(full,M,(384*S,216*S),flags=cv2.INTER_CUBIC,borderValue=(0,0,0,0))
# inner core visible between the jaws: dark wedge + flechette fan
H,W=c.shape[:2]; mk=np.zeros((H,W),np.float32)
cv2.fillPoly(mk,[(np.array([(PX,90),(30,74),(30,120),(PX,102)])*S).astype(np.int32)],1,cv2.LINE_AA)
c[:]=c*(1-mk[...,None])+np.array([22,22,24])*mk[...,None]
for k,ang in enumerate((-9,-4.5,0,4.5,9)):
    def fl(mk,ang=ang):
        a=np.deg2rad(ang); x0,y0=PX-6,96
        for j in range(6):
            r0=18+j*17; r1=r0+9
            cv2.line(mk,(int((x0-r0*np.cos(a))*S),int((y0+r0*np.sin(a))*S)),(int((x0-r1*np.cos(a))*S),int((y0+r1*np.sin(a))*S)),1,max(2,S//2),cv2.LINE_AA)
    glow(c,fl,ORANGE,core=1,blur=6,strength=0.9)
paste(c,piece(PX,0,384,216),PX,0)
for up,ang,pv in ((True,-8,(PX,92)),(False,8,(PX,100))):
    r=rot_piece(up,ang,pv); a=r[...,3:4]; c[:]=c*(1-a)+r[...,:3]*a
# hinge knuckles at the pivot
for y in (92,100): shade_ellipse(c,PX-2,y,4.2,4.2,col=(40,40,44),rim=(190,190,195)); glow(c,lambda mk,y=y: cv2.circle(mk,(int((PX-2)*S),int(y*S)),int(1.4*S),1,-1,cv2.LINE_AA),ORANGE,core=1,blur=5,strength=0.8)
save(c,'sct.png')

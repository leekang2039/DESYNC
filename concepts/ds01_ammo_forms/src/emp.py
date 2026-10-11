import sys; sys.path.insert(0,'.'); from lib import *
rng=np.random.default_rng(3)
# EMP · coil: barrel shortened (x 80..150 removed, muzzle block slides back), coil rings on a stub barrel, two discharge prongs, arc
CUT0,CUT1=80,150; D=CUT1-CUT0; c=bg_canvas(384)
def tex_poly(canvas, pts, src_box, edge=(20,20,22)):
    H,W=canvas.shape[:2]; mk=np.zeros((H,W),np.float32); P=(np.array(pts)*S).astype(np.int32)
    cv2.fillPoly(mk,[P],1,cv2.LINE_AA); x,y,w,h=cv2.boundingRect(P)
    x0,y0,x1,y1=src_box; t=cv2.resize(IMG[y0*S:y1*S,x0*S:x1*S],(w,h),interpolation=cv2.INTER_CUBIC)
    reg=canvas[y:y+h,x:x+w]; a=mk[y:y+h,x:x+w,None]; reg[:]=reg*(1-a)+t*a
    e=np.zeros((H,W),np.float32); cv2.polylines(e,[P],True,1,max(2,S//2),cv2.LINE_AA); canvas[:]=canvas*(1-e[...,None])+np.array(edge)*e[...,None]
AX=78   # bore axis (upper barrel)
# stub barrel + rings + prongs are drawn first so the shortened body overlaps their roots
def stub(cv_):
    H,W=cv_.shape[:2]; mk=np.zeros((H,W),np.float32); cv2.rectangle(mk,(int(24*S),int((AX-8)*S)),(int(90*S),int((AX+8)*S)),1,-1)
    yy=np.mgrid[0:H,0:W][0]/S; t=np.clip((yy-(AX-8))/16,0,1); col=np.dstack([30+70*np.exp(-((t-0.3)/0.12)**2)]*3)+np.array([8,8,10])
    cv_[:]=cv_*(1-mk[...,None])+col*mk[...,None]
stub(c)
for i,x in enumerate((78,64,50,36)):
    ry=24-i*1.6
    shade_ellipse(c,x,AX,7.5,ry,col=(34,35,38),rim=(170,172,176))
    shade_ellipse(c,x+1.2,AX,4.6,ry-4.5,col=(14,14,15),rim=(60,60,62))
    glow(c,lambda mk,x=x,ry=ry: cv2.ellipse(mk,(int((x+1.2)*S),int(AX*S)),(int(4.6*S),int((ry-4.5)*S)),0,0,360,1,max(3,S),cv2.LINE_AA),ORANGE,core=1.0,blur=10,strength=1.3)
tex_poly(c,[(94,40),(40,45),(26,52),(40,58),(94,63)],(150,42,214,62))
tex_poly(c,[(94,96),(40,99),(26,104),(40,110),(94,115)],(150,42,214,62))
for y0 in (51.5,103.5): glow(c,lambda mk,y0=y0: cv2.line(mk,(int(44*S),int(y0*S)),(int(88*S),int(y0*S)),1,max(2,S//2),cv2.LINE_AA),ORANGE,core=1,blur=6,strength=0.8)
for y in (52,104): glow(c,lambda mk,y=y: cv2.circle(mk,(int(26*S),int(y*S)),int(2.2*S),1,-1,cv2.LINE_AA),ORANGE,core=1,blur=14,strength=1.6)
# arc between the prong tips (jagged)
pts=[(26,52)]; 
for k in range(1,9): pts.append((24+rng.uniform(-6,4), 52+(104-52)*k/9))
pts.append((26,104))
glow(c,lambda mk: cv2.polylines(mk,[(np.array(pts)*S).astype(np.int32)],False,1,max(2,S//2),cv2.LINE_AA),(255,190,120),core=1,blur=12,strength=1.5)
# shortened body
paste(c,piece(CUT1,0,384,216),CUT1,0)
paste(c,piece(0,0,CUT0,216),D,0)
# seam: short black collar inside the body only
H,W=c.shape[:2]; mk=np.zeros((H,W),np.float32); cv2.rectangle(mk,(int((CUT1-1.5)*S),int(44*S)),(int((CUT1+1.5)*S),int(122*S)),1,-1)
c[:]=c*(1-mk[...,None])+np.array([26,26,28])*mk[...,None]
save(c,'emp.png')

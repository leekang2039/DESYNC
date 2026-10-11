from PIL import Image, ImageDraw, ImageFont
fp='/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'; fpm='/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
P=[('STD','표준탄 · 기본 지급 상태 (원본)','std.png','DS-01 기본형. 모든 형태는 그립·방아쇠·리시버를 공유'),
   ('AP','관통탄 · 레일 전개','ap.png','총열부가 앞으로 늘어나고 상·하단 총열이 벌어지며 가운데 레일 채널 점등 · 상단 방열 벤트 3개'),
   ('EMP','EMP탄 · 코일 압축','emp.png','총열이 뒤로 접혀 짧아지고, 코일 링 4개 + 방전 프롱 2개 전개, 프롱 사이 아크'),
   ('SCT','산탄 · 조 개방','sct.png','앞쪽 상·하단 총열이 힌지로 8°씩 벌어지고 내부 플레셰트 레일 5줄 점등'),
   ('DSYNC','탈동조탄 · 분리 부유','dsync.png','앞쪽 셸이 조각으로 떠서 어긋난 채 유지, 내부 프레임과 에너지 스파인 노출, 테더로 연결')]
TW=1000; PH=560; rows=[]
F1=ImageFont.truetype(fpm,34); F2=ImageFont.truetype(fp,30); F3=ImageFont.truetype(fp,22)
for code,name,f,desc in P:
    im=Image.open(f).convert('RGB'); r=min(TW/im.width,PH/im.height); im=im.resize((int(im.width*r),int(im.height*r)),Image.LANCZOS)
    pan=Image.new('RGB',(TW,PH+90),(18,20,23)); bgc=im.getpixel((2,im.height//2)); box=Image.new('RGB',(TW,PH),bgc); box.paste(im,((TW-im.width)//2,(PH-im.height)//2)); pan.paste(box,(0,90))
    d=ImageDraw.Draw(pan); d.text((24,16),code,font=F1,fill=(255,130,40)); d.text((24+F1.getlength(code)+18,20),name,font=F2,fill=(235,235,235)); d.text((24,58),desc,font=F3,fill=(160,166,172))
    pan.save(f'DS01_{code}.png'); rows.append(pan)
cols=2; pad=16; w=TW*cols+pad*3; n=(len(rows)+1)//2; th=90
sheet=Image.new('RGB',(w,th+n*(PH+90)+pad*(n+1)),(12,13,15)); d=ImageDraw.Draw(sheet)
d.text((pad+8,22),'DS-01 · 탄종별 변형 시안',font=ImageFont.truetype(fp,40),fill=(240,240,240))
for i,r in enumerate(rows): sheet.paste(r,(pad+(i%2)*(TW+pad), th+pad+(i//2)*(PH+90+pad)))
sheet.save('DS01_ammo_forms_sheet.png'); print(sheet.size)

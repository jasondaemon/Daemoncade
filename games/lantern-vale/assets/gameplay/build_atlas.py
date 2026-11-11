"""Original Lantern Vale pixel art. Standard-library-only reproducible PNG authoring."""
from pathlib import Path
import json, math, struct, zlib, hashlib
ROOT = Path(__file__).resolve().parent
class Raster:
    def __init__(self,w,h): self.w,self.h=w,h; self.p=bytearray(w*h*4)
    def dot(self,x,y,c):
        x,y=int(x),int(y)
        if 0<=x<self.w and 0<=y<self.h:
            if isinstance(c,str): c=tuple(bytes.fromhex(c.lstrip('#')))+(255,)
            self.p[(y*self.w+x)*4:(y*self.w+x)*4+4]=bytes(c)
    def rect(self,x,y,w,h,c):
        for yy in range(int(y),int(y+h)):
            for xx in range(int(x),int(x+w)): self.dot(xx,yy,c)
    def line(self,x,y,X,Y,c,width=1):
        n=max(abs(X-x),abs(Y-y),1)
        for i in range(int(n)+1): self.rect(round(x+(X-x)*i/n),round(y+(Y-y)*i/n),width,width,c)
    def oval(self,x,y,w,h,c):
        for yy in range(int(y),int(y+h)):
            for xx in range(int(x),int(x+w)):
                if ((xx+.5-x-w/2)/(w/2))**2+((yy+.5-y-h/2)/(h/2))**2<=1:self.dot(xx,yy,c)
    def poly(self,points,c):
        for y in range(min(p[1] for p in points),max(p[1] for p in points)+1):
            cuts=[]
            for (x1,y1),(x2,y2) in zip(points,points[1:]+points[:1]):
                if min(y1,y2)<=y<max(y1,y2):cuts.append(x1+(y-y1)*(x2-x1)/(y2-y1))
            cuts.sort()
            for a,b in zip(cuts[::2],cuts[1::2]):self.rect(math.ceil(a),y,math.ceil(b)-math.ceil(a),1,c)
    def paste(self,im,x,y):
        for yy in range(im.h):
            for xx in range(im.w):
                c=im.p[(yy*im.w+xx)*4:(yy*im.w+xx)*4+4]
                if c[3]:
                    pos=((y+yy)*self.w+x+xx)*4
                    base=self.p[pos:pos+4]
                    if base[3] and c[3]<255:
                        a=c[3]/255; b=base[3]/255; out=a+b*(1-a)
                        c=bytes([round((c[k]*a+base[k]*b*(1-a))/out) for k in range(3)]+[round(out*255)])
                    self.dot(x+xx,y+yy,c)
    def png(self,path):
        def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
        rows=b''.join(b'\0'+self.p[y*self.w*4:(y+1)*self.w*4] for y in range(self.h))
        path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',self.w,self.h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))
INK='182731'; GOLD='ffdb87'; WHITE='e0eee0'
frames={}; animations={}; art=[]
def add(name,im,kind='sprite',pivot=None):
    art.append((name,im));frames[name]={'kind':kind,'pivot':pivot or [im.w/2,im.h/2],'logicalSize':[im.w,im.h]}
def anim(name,ids,ms,loop=True):animations[name]={'frames':ids,'durationsMs':ms if isinstance(ms,list) else [ms]*len(ids),'loop':loop}
# Each palette: ground, shade, middle, highlight, vegetation, water.
palettes={
 'mossward':['29493e','1b3434','456550','88a96a','548b62','203e51'],
 'amber-fen':['61523c','3c3836','8b7450','c9ab68','ad8751','294652'],
 'glass-highlands':['586579','333f57','8192a5','c7dbd7','91b5be','31445f'],
 'rootvault':['303f38','192e2d','59684b','a4ac71','66815a','172b39'],
 'drowned-archive':['344d52','21353f','5d7d7c','b4b590','849970','1a344c'],
 'prism-crypt':['43475e','272d46','727793','b7c7d8','84b9c5','263c59']}
for land,p in palettes.items():
 for variant in range(3):
    im=Raster(40,40);im.rect(0,0,40,40,p[0])
    for i in range(16):
        x=(i*13+variant*7)%36+1;y=(i*17+variant*5)%36+1
        im.rect(x,y,2+(i%2),1,p[2] if i%3 else p[1])
    if land=='mossward':
        for x,y in [(7,8),(28,29)]:im.line(x,y,x+1,y-3,p[4]);im.line(x+1,y,x+4,y-2,p[4])
    elif land=='amber-fen':
        im.oval(22,9,9,4,p[1]);im.line(7,30,7,24,p[4]);im.line(9,31,10,26,p[3])
    elif land=='glass-highlands' or land=='prism-crypt':
        im.line(10,17,13,22,p[1]);im.line(13,22,21,24,p[1]);im.rect(24,7,3,2,p[3])
    elif land=='rootvault':im.line(3,10,9,15,p[1]);im.line(9,15,8,20,p[1])
    else:im.rect(6,12,10,1,p[2]);im.rect(27,30,6,1,p[3])
    add(f'terrain.{land}.floor.{variant}',im,'tile',[0,0])
 for variant in range(2):
    im=Raster(40,40);im.rect(0,0,40,40,p[1]);im.rect(0,0,40,6,p[0]);im.rect(1,6,38,29,p[2]);im.rect(2,6,36,4,p[3]);im.rect(2,11,36,2,p[0]);im.rect(1,33,38,6,p[1])
    for x,y,w in [(2,15,17),(21,15,17),(2,26,9),(13,26,25)]:
        im.rect(x,y,w,1,p[1]);im.rect(x+w-1,y-9,1,9,p[1]);im.rect(x+2,y-6,4,1,p[3])
    if land in ['mossward','rootvault']:
        im.oval(1+variant*19,4,20,9,p[4]);im.line(5,10,6,24,p[4],2)
    if land=='amber-fen':im.rect(0,29,40,4,p[4]);im.line(28,3,24,8,p[1])
    if land in ['glass-highlands','prism-crypt']:
        im.poly([(26,10),(30,2),(34,10),(30,18)],p[4]);im.line(30,4,30,14,p[3])
    add(f'terrain.{land}.wall.{variant}',im,'tile',[0,0])
 for phase in range(4):
    im=Raster(40,40);im.rect(0,0,40,40,p[5])
    for j in range(5):
        x=(j*11+phase*2)%28+2;y=3+j*7
        im.rect(x,y,7,1,p[2]);im.rect(x+2,y+1,3,1,p[0])
    add(f'terrain.{land}.water.{phase}',im,'tile',[0,0])
 anim(f'terrain.{land}.water',[f'terrain.{land}.water.{i}' for i in range(4)],240)
# Transparent foliage / rocks, for layering over a base floor.
for land,p in list(palettes.items())[:3]:
 im=Raster(40,40);im.oval(3,31,34,7,(7,17,26,95))
 if land=='mossward':
    im.rect(18,21,6,14,'715743');im.poly([(20,1),(35,19),(30,25),(10,25),(4,19)],p[1]);im.oval(7,6,26,18,p[4]);im.rect(12,8,10,3,p[3]);im.rect(25,19,5,3,p[0])
 elif land=='amber-fen':
    for x,y in [(9,11),(15,5),(23,13),(29,8)]:im.line(x,34,x,y,p[4],2);im.rect(x-1,y-3,4,8,p[3]);im.line(x,29,x-4,22,p[4])
 else:
    im.poly([(8,30),(10,14),(20,4),(28,12),(32,31)],p[2]);im.poly([(20,4),(20,29),(10,31),(10,14)],p[3]);im.line(22,11,27,18,p[0]);im.rect(12,31,20,3,p[1])
 add(f'prop.{land}.foliage',im)
# Keeper: four directional poses with separate footfall, breathing and sword frames.
for direction in ['down','left','right','up']:
 for action,count in [('idle',2),('walk',4),('strike',4)]:
  ids=[]
  for phase in range(count):
    im=Raster(40,40);bob=1 if (action=='walk' and phase%2) or (action=='idle' and phase==1) else 0
    im.oval(9,32,23,5,(5,15,23,90)); leg=(2 if phase==1 else -2 if phase==3 else 0) if action=='walk' else 0
    im.rect(13,28+leg,5,6,INK);im.rect(23,28-leg,5,6,INK);im.rect(13,32+leg,6,2,'78634d');im.rect(23,32-leg,6,2,'78634d')
    im.poly([(13,16+bob),(26,16+bob),(31,29+bob),(24,32+bob),(10,29+bob)],INK)
    im.poly([(14,17+bob),(25,17+bob),(28,28+bob),(22,30+bob),(12,27+bob)],'b8613f');im.rect(14,20+bob,3,7,'df8c51');im.rect(12,28+bob,16,2,'713f35')
    im.oval(11,3+bob,18,19,INK);im.oval(12,4+bob,16,16,'bc6744');im.rect(15,5+bob,9,2,'e49b5b')
    if direction!='up':
        fx=14 if direction=='left' else 19 if direction=='right' else 15
        im.rect(fx,11+bob,10 if direction=='down' else 7,7,'382e30');im.rect(fx+1,12+bob,7 if direction=='down' else 5,4,'dfb68b');im.rect(fx+2,12+bob,1,2,INK)
    else: im.rect(15,10+bob,9,8,'a6533d');im.line(20,8+bob,20,18+bob,'d28049')
    # Cross-body strap, lantern cage and sword scabbard.
    im.line(14,18+bob,25,27+bob,'e1b575',2); lx=7 if direction=='left' else 29
    im.rect(lx,23+bob,7,10,INK);im.rect(lx+1,25+bob,5,6,GOLD);im.rect(lx+3,24+bob,1,8,'a4784e');im.rect(lx+2,21+bob,3,2,'b6b8a8')
    if action=='strike':
        a={'right':0,'down':math.pi/2,'left':math.pi,'up':-math.pi/2}[direction]+[-.7,-.2,.35,.75][phase]
        sx,sy=20+round(math.cos(a)*7),21+round(math.sin(a)*7);ex,ey=20+round(math.cos(a)*18),21+round(math.sin(a)*18)
        im.line(sx,sy,ex,ey,INK,3);im.line(sx,sy,ex,ey,'d9e9e1',2);im.rect(sx-2,sy-1,5,3,GOLD)
    name=f'keeper.{direction}.{action}.{phase}';add(name,im);ids.append(name)
  anim(f'keeper.{direction}.{action}',ids,{'idle':420,'walk':115,'strike':65}[action],action!='strike')
# Mira, readable silver hair and teal coat.
im=Raster(40,40);im.oval(9,32,23,5,(5,15,23,90));im.rect(14,28,5,7,INK);im.rect(23,28,5,7,INK);im.poly([(13,16),(26,16),(30,31),(10,31)],'4d9691');im.rect(13,18,3,11,'a6c5b3');im.oval(11,3,18,18,'c9d1bc');im.rect(15,10,10,9,'ddb58d');im.rect(16,12,2,2,INK);im.rect(23,12,2,2,INK);im.rect(10,10,4,13,'c9d1bc');im.rect(26,10,4,13,'c9d1bc');add('npc.mira',im)
# Three enemy families and three wardens, each with four readable action silhouettes.
for family in ['briarling','fen-moth','glass-sentinel','root-warden','tide-warden','prism-warden']:
 boss='warden' in family;size=80 if boss else 40
 for action in ['idle','walk','windup','attack','hurt','defeat']:
  ids=[]
  for phase in range(4):
    im=Raster(size,size); scale=2 if boss else 1
    def r(x,y,w,h,c):im.rect(x*scale,y*scale,w*scale,h*scale,c)
    def o(x,y,w,h,c):im.oval(x*scale,y*scale,w*scale,h*scale,c)
    def poly(ps,c):im.poly([(x*scale,y*scale) for x,y in ps],c)
    def ln(x,y,X,Y,c,w=1):im.line(x*scale,y*scale,X*scale,Y*scale,c,w*scale)
    p=palettes['mossward' if family in ['briarling','root-warden'] else 'amber-fen' if family in ['fen-moth','tide-warden'] else 'glass-highlands']; shift=(phase%2) if action=='walk' else 0
    o(5,32,30,5,(5,15,23,95)); eye=GOLD if action!='windup' else 'fff2d0'
    if family in ['briarling','root-warden']:
        ln(12,24,9-phase%2,33,p[2],3);ln(27,24,30+phase%2,33,p[2],3)
        poly([(8,26),(8,14+shift),(14,8),(27,9),(33,18),(29,29),(18,32)],INK);poly([(10,25),(11,15+shift),(16,10),(26,11),(30,19),(27,27),(18,29)],p[2]);o(12,9,17,8,p[4]);r(16,18,3,3,eye);r(24,18,3,3,eye)
        ln(10,17,4,10,p[4],2);ln(28,13,34,6,p[4],2)
        if boss:
            for x,y in [(9,12),(17,9),(24,9),(30,13)]:ln(x,y,x-2,y-7,p[3],2)
            r(17,24,7,5,GOLD);r(19,24,3,6,p[1])
    elif family in ['fen-moth','tide-warden']:
        wing=phase%2*3
        poly([(18,17),(5,7+wing),(2,16),(5,26),(16,25)],p[2]);poly([(22,17),(35,7+wing),(38,16),(35,26),(24,25)],p[2]);o(5,14,9,8,p[3]);o(26,14,9,8,p[3]);o(15,9+shift,10,22,INK);r(17,16+shift,2,3,eye);r(22,16+shift,2,3,eye);ln(17,11,14,5,p[3]);ln(23,11,26,5,p[3]);r(18,23,5,5,p[4])
        if boss:
            poly([(12,29),(8,35),(18,31),(23,35),(31,29)],p[4]);r(16,10,9,3,GOLD);r(19,6,3,5,GOLD)
    else:
        poly([(11,29),(13,13),(20,3),(28,13),(30,29),(23,33)],INK);poly([(14,26),(15,13),(20,6),(25,14),(27,27),(21,30)],p[2]);poly([(20,6),(20,27),(15,24),(15,13)],p[3]);r(17,16,8,3,eye);ln(12,23,6,29,p[4],3);ln(28,23,34,29,p[4],3)
        if boss:
            poly([(5,15),(10,8),(13,18),(8,26)],p[3]);poly([(27,18),(30,8),(36,15),(33,26)],p[3]);r(17,24,8,4,GOLD)
    if action=='windup':
        for x,y in [(5,3),(32,4),(2,26)]:r(x,y,2,4,GOLD)
    if action=='attack':
        ln(3,30-phase*3,11,25-phase*3,'f4cd85',2);ln(29,25-phase*3,37,30-phase*3,'f4cd85',2)
    if action=='hurt':
        # Flash highlights without hiding the family silhouette.
        ln(14,8,22,5,WHITE,2);r(27,19,3,5,WHITE)
    if action=='defeat':
        # Dissolve upward, retaining ground pivot and frame dimensions.
        for yy in range(size):
            for xx in range(size):
                if (xx//scale+yy//scale)%4<=phase:im.dot(xx,yy,(0,0,0,0))
    name=f'enemy.{family}.{action}.{phase}';add(name,im);ids.append(name)
  anim(f'enemy.{family}.{action}',ids,150 if action in ['idle','walk'] else 100,action in ['idle','walk'])
# Architectural and inventory props, all ground centered in one tile.
for name in ['waystone','stairs','stairs-up','beacon','chest','chest-open','plate','plate-lit','gate','bridge','relic-root','relic-tide','relic-prism','tonic','coin','key','secondary-boomerang','sword-1','sword-2','sword-3']:
 for phase in range(4 if name in ['waystone','beacon','relic-root','relic-tide','relic-prism'] else 1):
    im=Raster(40,40);im.oval(6,32,28,5,(5,15,23,85)); pulse=['d6b576','ffdb87','fff0b0','ffdb87'][phase]
    if name=='waystone':
        im.rect(7,29,26,6,'536c70');im.poly([(11,29),(13,8),(20,3),(27,8),(29,29)],INK);im.poly([(14,28),(15,10),(20,6),(25,10),(26,28)],'78938e');im.poly([(20,10),(24,17),(20,24),(16,17)],pulse);im.rect(18,16,4,3,WHITE)
    elif name.startswith('stairs'):
        im.rect(3,3,34,34,INK)
        for i in range(5):
            w=30-i*4;y=8+i*5;im.rect(5+i*2,y,w,3,['b2b5a3','8d9b93','6f8584','536b70','3e555f'][i])
        if name=='stairs-up': im.poly([(20,5),(13,13),(17,13),(17,21),(23,21),(23,13),(27,13)],GOLD)
    elif name=='beacon':
        im.rect(5,32,30,5,'697e88');im.rect(10,28,20,4,'b0bcbd');im.poly([(12,28),(15,8),(25,8),(28,28)],'657785');im.rect(16,12,8,12,INK);im.poly([(20,4),(26,15),(20,25),(14,15)],pulse);im.rect(11,5,18,3,'becbc7');im.rect(17,2,6,3,GOLD)
    elif name.startswith('chest'):
        im.rect(6,16,28,17,INK);im.rect(8,18,24,13,'9c633c');im.rect(10,20,20,2,'d49b55');im.rect(11,17,3,15,'ddb873');im.rect(27,17,3,15,'ddb873');im.rect(18,22,5,5,GOLD)
        if name=='chest-open':im.rect(6,9,28,10,'b98149');im.rect(9,12,22,5,INK);im.rect(9,19,22,5,INK)
        else:im.rect(7,13,26,7,'c0894c');im.rect(9,14,22,2,'ecc47a')
    elif name.startswith('plate'):
        im.poly([(7,16),(29,13),(35,27),(13,31)],'53616e');im.poly([(10,17),(28,16),(31,25),(14,28)],'a5ad9a');im.oval(15,18,11,7,GOLD if name=='plate-lit' else '596d72');im.rect(19,17,2,8,'e5cc8d')
    elif name=='gate':
        im.rect(2,1,7,37,'697a7b');im.rect(31,1,7,37,'697a7b');im.rect(2,1,36,5,'b0b5a0')
        for x in range(11,30,6):im.rect(x,5,3,32,'bc9964')
        im.rect(8,21,24,4,'6f604b');im.rect(18,19,5,8,GOLD)
    elif name=='bridge':
        im.rect(1,0,38,40,'5a4c3e')
        for y in range(0,40,8):im.rect(3,y,34,6,'b09b69');im.rect(6,y+1,26,1,'ddc991')
        im.rect(5,0,2,40,'564435');im.rect(33,0,2,40,'564435')
    elif name.startswith('relic'):
        color={'relic-root':'a2d687','relic-tide':'80d6cf','relic-prism':'c7b4f2'}[name];im.rect(11,30,18,4,'647278');im.poly([(20,7),(29,17),(24,27),(16,27),(11,17)],INK);im.poly([(20,9),(26,17),(22,25),(17,24),(14,17)],color);im.rect(18,13,3,7,pulse);im.rect(7,9,2,2,GOLD);im.rect(30,23,2,2,GOLD)
    elif name=='tonic':
        im.rect(17,6,7,5,'c49b67');im.rect(16,11,9,7,'c3dfce');im.oval(11,17,19,17,INK);im.oval(13,18,15,14,'bc5f72');im.rect(15,20,3,6,'f5a694');im.rect(12,28,17,3,'733d5c')
    elif name=='coin': im.oval(12,10,16,20,'b67b43');im.oval(13,10,13,17,GOLD);im.rect(18,13,3,10,'b67b43')
    elif name=='key':im.oval(10,8,13,13,GOLD);im.oval(14,12,5,5,INK);im.rect(19,18,4,14,GOLD);im.rect(22,26,6,4,GOLD)
    elif name=='secondary-boomerang':
        im.poly([(7,10),(11,7),(24,15),(32,29),(27,33),(19,21)],INK);im.poly([(9,11),(11,9),(23,17),(30,29),(27,30),(20,20)],'d6a16a');im.line(12,11,21,17,GOLD,2);im.rect(20,18,5,3,'6fbab1')
    elif name.startswith('sword'):
        color={'sword-1':'c2d3d1','sword-2':GOLD,'sword-3':'9ce2dd'}[name];im.poly([(25,4),(28,5),(26,15),(16,26),(12,22)],INK);im.line(15,23,26,7,color,3);im.line(11,21,20,27,GOLD,2);im.line(14,26,10,32,'b77e50',3)
    add(f'prop.{name}.{phase}',im)
 if name in ['waystone','beacon','relic-root','relic-tide','relic-prism']:anim(f'prop.{name}',[f'prop.{name}.{i}' for i in range(4)],180)
# Effects have transparent margins and retain a centered pivot.
for effect in ['lantern-glow','sword-arc','light-burst','projectile','spark','shadow','danger-ring']:
 ids=[]
 for phase in range(4):
    size=120 if effect=='lantern-glow' else 80 if effect in ['sword-arc','light-burst','danger-ring'] else 40
    im=Raster(size,size);cx=cy=size//2
    if effect=='lantern-glow':
        for y in range(size):
            for x in range(size):
                d=math.hypot(x-cx,y-cy)/(size/2-2);a=int(max(0,1-d)**2*(65+phase*3))
                if a:im.dot(x,y,(255,205,110,a))
    elif effect in ['sword-arc','danger-ring','light-burst']:
        radius=21+phase*4
        for i in range(361 if effect!='sword-arc' else 105):
            a=(i if effect!='sword-arc' else i-52)*math.pi/180
            x=round(cx+radius*math.cos(a));y=round(cy+radius*math.sin(a));im.rect(x,y,2,2,('db986a' if effect=='danger-ring' else GOLD))
        if effect=='light-burst':
            for a in range(0,360,45):im.line(cx+int(math.cos(a*math.pi/180)*8),cy+int(math.sin(a*math.pi/180)*8),cx+int(math.cos(a*math.pi/180)*(radius-3)),cy+int(math.sin(a*math.pi/180)*(radius-3)),WHITE,2)
    elif effect=='projectile':
        im.poly([(20,7+phase),(27,20),(20,31-phase),(13,20)],'7cc8c4');im.rect(18,15,4,10,WHITE)
    elif effect=='spark':
        for dx,dy in [(0,1),(1,0),(0,-1),(-1,0)]:im.line(20+dx*(3+phase),20+dy*(3+phase),20+dx*(9+phase*2),20+dy*(9+phase*2),GOLD,2)
    else:im.oval(5,27,30,9,(4,12,24,80))
    name=f'effect.{effect}.{phase}';add(name,im,'effect');ids.append(name)
 anim(f'effect.{effect}',ids,90,effect in ['lantern-glow','projectile','shadow','danger-ring'])
# Shelf packing with two clear pixels around every frame. No scaling or extrusion.
width=1024;x=y=2;row=0
for name,im in art:
 if x+im.w+2>width:x=2;y+=row+4;row=0
 frames[name]['rect']=[x,y,im.w,im.h];x+=im.w+4;row=max(row,im.h)
height=y+row+2;atlas=Raster(width,height)
for name,im in art:atlas.paste(im,*frames[name]['rect'][:2])
atlas.png(ROOT/'lantern-gameplay-v1.png')
manifest={'schemaVersion':1,'image':'lantern-gameplay-v1.png','imageSize':[width,height],'tileSize':40,'padding':2,'sampling':'nearest','pivotUnits':'pixels from frame top-left; world position is frame center unless tile','directions':['down','left','right','up'],'frames':frames,'animations':animations,'terrainSets':{land:{'floor':[f'terrain.{land}.floor.{i}' for i in range(3)],'wall':[f'terrain.{land}.wall.{i}' for i in range(2)],'water':f'terrain.{land}.water'} for land in palettes},'enemySets':{'mossward':'briarling','amber-fen':'fen-moth','glass-highlands':'glass-sentinel','rootvault':'briarling','drowned-archive':'fen-moth','prism-crypt':'glass-sentinel'},'wardenSets':{'rootvault':'root-warden','drowned-archive':'tide-warden','prism-crypt':'prism-warden'}}
(ROOT/'atlas.json').write_text(json.dumps(manifest,indent=2)+'\n')
(ROOT/'manifest.mjs').write_text('// Generated by build_atlas.py; local module avoids fetch under connect-src none.\nexport default '+json.dumps(manifest,separators=(',',':'))+';\n')
# A true raster contact sheet: actual atlas frames, no simulated gameplay.
preview=Raster(960,680);preview.rect(0,0,960,680,'16232d')
for li,land in enumerate(palettes):
 for yy in range(3):
  for xx in range(4):
   key=f'terrain.{land}.'+('wall.0' if yy==0 else 'floor.'+str((xx+yy)%3))
   im=dict(art)[key];preview.paste(im,li*160+xx*40,yy*40)
 preview.paste(dict(art)[f'terrain.{land}.water.1'],li*160+80,80)
for i,direction in enumerate(['down','left','right','up']):
 for j in range(4):preview.paste(dict(art)[f'keeper.{direction}.walk.{j}'],20+j*48,140+i*48)
for i,family in enumerate(['briarling','fen-moth','glass-sentinel','root-warden','tide-warden','prism-warden']):
 for j,action in enumerate(['idle','windup','attack','defeat']):preview.paste(dict(art)[f'enemy.{family}.{action}.0'],240+j*92,140+i*84)
for i,(name,im) in enumerate([(n,im) for n,im in art if n.startswith('prop.') and n.endswith('.0')]):preview.paste(im,640+(i%6)*48,140+(i//6)*56)
for i,effect in enumerate(['lantern-glow','sword-arc','light-burst','projectile','spark','danger-ring']):preview.paste(dict(art)[f'effect.{effect}.1'],640+i%2*140,400+i//2*85)
preview.png(ROOT/'contact-sheet.png')
print(f'Authored {len(frames)} frames, {len(animations)} animations; atlas {width}x{height}; sha256 '+hashlib.sha256((ROOT/'lantern-gameplay-v1.png').read_bytes()).hexdigest())

"""Editable original pixel geometry for the expanded Lantern Vale atlas (CC0)."""
def build(Raster, add, anim, palettes, art):
    import math
    ink='182731'; gold='ffdb87'
    regions={
      'cinder-coast':['665047','352e37','a77759','efbb7c','c76846','243e55'],
      'moonwood':['344858','202b40','577482','a5c2c6','739b99','23344f'],
      'sunken-garden':['35594f','203b3c','5d8971','bad28d','80b976','254d58'],
      'storm-peaks':['536071','30394f','8292a1','d5e0d4','a4c4cd','293b56'],
      'starfall-desert':['9b7959','564654','c3a77a','f2dab0','929f90','38495d'],
      'eclipse-reach':['434052','29283d','74667b','d5b5a1','ac7c9a','27394f'],
      'ember-forge':['513a3c','2c2833','87564d','eeb078','c56845','9c493c'],
      'lunar-observatory':['3f475f','252b44','737b98','c1d4de','9daed2','2b3e60'],
      'verdant-cistern':['344a46','1b3034','628674','c1ce91','8ab27b','254e59'],
      'tempest-spire':['465366','272f48','7c93a1','c9e0dc','89bfcb','293f60'],
      'solar-tomb':['6c564c','362e3b','a38a65','edd9a3','c8b276','30465d'],
      'eclipse-citadel':['45394d','252438','7e627e','dcbdc8','ac8cae','343a59']}
    allpal={**palettes,**regions}
    # Structured material clusters, never random noise. Preserve seamless floor edges.
    for name,im in art:
      if '.floor.' in name:
        p=palettes[name.split('.')[1]]
        for x,y in [(4,6),(22,18),(8,29)]:
          im.line(x,y,x+5,y,p[1]);im.line(x+1,y+1,x+4,y+1,p[2]);im.dot(x+5,y-1,p[3])
      if '.wall.' in name:
        p=palettes[name.split('.')[1]]
        im.line(3,31,36,31,p[0]);im.rect(4,10,7,1,p[3]);im.rect(28,23,7,1,p[3]);im.rect(4,34,32,3,p[1])
    for land,p in allpal.items():
      if land in regions:
        for v in range(3):
          im=Raster(40,40);im.rect(0,0,40,40,p[0])
          for x,y in [(4,7),(24,5),(13,24),(28,31)]:
            x=(x+v*3)%30+2;im.line(x,y,x+5,y,p[1]);im.line(x+1,y+1,x+4,y+1,p[2]);im.dot(x+4,y-1,p[3])
          if land in ['ember-forge','cinder-coast']:im.line(9,12,15,18,p[1]);im.line(15,18,22,17,p[2])
          if land in ['lunar-observatory','solar-tomb','eclipse-citadel']:im.rect(8,8,24,1,p[2]);im.rect(8,8,1,24,p[2])
          add(f'terrain.{land}.floor.{v}',im,'tile',[0,0])
        for v in range(2):
          im=Raster(40,40);im.rect(0,0,40,40,p[1])
          for row in range(3):
            for col in range(3):
              x=col*18-(9 if row%2 else 0);y=row*11+2
              im.rect(x,y,17,10,p[2]);im.rect(x+1,y,15,2,p[3]);im.rect(x+1,y+3,15,5,p[0]);im.rect(x+3,y+4,6,1,p[2])
          im.rect(0,34,40,6,p[1]);add(f'terrain.{land}.wall.{v}',im,'tile',[0,0])
        ids=[]
        for phase in range(4):
          im=Raster(40,40);im.rect(0,0,40,40,p[5])
          for j in range(5):
            x=(j*13+phase*2)%27;y=4+j*7;im.rect(x,y,9,1,p[2]);im.rect(x+2,y+1,4,1,p[0])
          key=f'terrain.{land}.water.{phase}';add(key,im,'tile',[0,0]);ids.append(key)
        anim(f'terrain.{land}.water',ids,220)
      # Transparent N/E/S/W shoreline overlay masks: 16 combinable corners.
      for mask in range(16):
        im=Raster(40,40)
        for side in range(4):
          if not mask & (1<<side):continue
          for t in range(40):
            depth=4+((t//5)%3)
            for d in range(depth):
              x,y=[(t,d),(39-d,t),(t,39-d),(d,t)][side]
              im.dot(x,y,p[3] if d==depth-1 else p[2] if d==depth-2 else p[0])
        # mask zero remains a useful sparse submerged-stone detail, not an empty frame.
        if not mask:im.rect(17,18,5,2,p[2]);im.rect(18,17,3,1,p[3])
        add(f'terrain.{land}.shore.{mask}',im,'overlay',[0,0])
      for v in range(3):
        im=Raster(40,40);im.oval(3,30,34,8,(5,15,23,90))
        if v==0:
          im.poly([(6,29),(9,13),(20,6),(32,15),(35,30)],p[1]);im.poly([(9,26),(12,14),(20,9),(29,16),(31,27)],p[2]);im.poly([(12,14),(20,9),(20,23),(10,26)],p[3]);im.line(24,17,27,24,p[0])
        elif v==1:
          for x,y in [(7,19),(14,12),(23,16),(30,22)]:
            im.line(x,34,x,y,p[0],2);im.poly([(x,y-5),(x+5,y),(x,y+4),(x-4,y)],p[4]);im.dot(x,y-2,p[3])
        else:
          im.rect(12,8,17,25,p[1]);im.rect(13,9,14,22,p[2]);im.rect(14,9,3,21,p[3]);im.rect(10,6,21,4,p[3]);im.rect(9,31,23,4,p[0]);im.line(20,12,24,18,p[1]);im.line(24,18,21,24,p[1])
        add(f'prop.{land}.detail.{v}',im)
      # A region-specific 80px landmark with a readable doorway and stepped roofline.
      im=Raster(80,80);im.oval(4,65,72,12,(5,15,23,100));im.rect(9,65,62,6,p[1]);im.rect(12,59,56,7,p[2]);im.rect(17,29,46,31,p[0]);im.rect(18,30,5,28,p[2]);im.rect(57,30,5,28,p[2]);im.rect(16,26,48,5,p[3])
      im.poly([(10,26),(40,5),(70,26)],p[1]);im.poly([(15,25),(40,8),(65,25)],p[2]);im.line(20,23,40,11,p[3],2)
      im.oval(28,32,24,27,p[1]);im.rect(28,45,24,15,p[1]);im.rect(32,46,16,14,ink);im.poly([(40,33),(44,39),(40,45),(36,39)],gold)
      for x in [23,53]:im.rect(x,37,4,11,p[3]);im.rect(x+1,39,2,7,p[5])
      im.rect(24,62,32,2,p[3]);im.rect(20,68,40,2,p[3]);add(f'landmark.{land}',im)
    # Settlement furniture and interior materials.
    for name in ['oak','woven','marble']:
      p={'oak':['654b3e','382f32','a47b54'],'woven':['65536b','37354a','ad8590'],'marble':['748b91','3d5264','bed3cd']}[name]
      for v in range(3):
        im=Raster(40,40);im.rect(0,0,40,40,p[0])
        for y in range(4,39,10):
          im.rect(1,y,38,1,p[1]);im.rect(3,y+1,34,1,p[2]);im.rect(10+v*7,y+2,1,6,p[1])
        add(f'interior.{name}.floor.{v}',im,'tile',[0,0])
    for name in ['bed','bookshelf','counter','hearth','sign','barrel','market-stall','door']:
      im=Raster(40,40);im.oval(3,32,34,6,(5,15,23,90));im.rect(6,9,28,25,ink);im.rect(8,10,24,22,'93684e');im.rect(9,11,22,2,'d0a371');im.rect(9,29,22,3,'604438')
      if name=='bed':im.rect(10,12,20,6,'e0d9b8');im.rect(10,19,20,10,'598d8a');im.rect(11,20,3,8,'9bc2a7')
      elif name=='bookshelf':
        for y in [14,24]:
          for i,c in enumerate(['699c96','b66b55','bda575','777d9a']):im.rect(10+i*5,y,3,7,c)
      elif name=='hearth':im.rect(11,15,18,16,ink);im.poly([(13,29),(16,20),(19,23),(23,15),(27,29)],'dc8252');im.poly([(17,29),(21,22),(24,29)],gold)
      elif name=='market-stall':
        for i in range(6):im.rect(3+i*6,6,6,12,'d3b68a' if i%2 else '668f8a')
        im.rect(4,24,32,4,'ddba87');im.oval(9,20,6,5,'b96c52');im.oval(23,20,6,5,'91ae75')
      elif name=='sign':im.rect(16,26,7,11,'705041');im.line(12,17,28,17,gold,2);im.poly([(28,13),(33,18),(28,22)],gold)
      elif name=='barrel':im.rect(8,16,24,3,'b4bdad');im.rect(8,26,24,3,'b4bdad');im.line(18,14,18,31,'604438')
      elif name=='door':im.rect(12,14,16,18,'604438');im.rect(24,22,2,3,gold)
      else:im.rect(9,14,22,4,'deb687');im.rect(20,20,8,6,'77988c')
      add(f'prop.{name}.0',im)
    # Individual portrait silhouettes in world scale, two breathing frames each.
    people=[('mira','c9d1bc','4d9691','ddb58d'),('oren','59433d','b8834f','bd8e6c'),('sable','b4becb','66678b','9c7264'),('tavi','bf784a','859b65','edbe91'),('ilya','34323c','758eaf','b98a72'),('sol','e5c99d','b76e50','895f50'),('nima','4b3b41','b0a477','dca383'),('rook','898b89','597b77','ae7b61'),('vesper','d1c2cc','846785','c99e8c'),('ada','804b40','839d9f','e1b594'),('ferryman','9aaca8','4b6375','9b786b'),('merchant','302d38','a58b60','c08f73')]
    for name,hair,coat,skin in people:
      ids=[]
      for phase in range(2):
        im=Raster(40,40);b=phase;im.oval(8,32,25,6,(5,15,23,90));im.rect(12,28,6,7,ink);im.rect(23,28,6,7,ink);im.poly([(13,16+b),(26,16+b),(31,31),(10,31)],ink);im.poly([(14,17+b),(25,17+b),(28,29),(12,29)],coat);im.line(16,20,16,28,'d8c49a');im.oval(11,3+b,19,19,ink);im.oval(12,4+b,17,17,hair);im.rect(15,11+b,11,9,skin);im.rect(16,12+b,2,2,ink);im.rect(23,12+b,2,2,ink);im.rect(13,8+b,15,3,hair);im.rect(29,22,4,8,'bca178')
        if name in ['oren','rook']:im.rect(14,16+b,13,5,hair)
        if name in ['sable','vesper','merchant']:im.poly([(8,9+b),(20,0+b),(33,9+b)],coat);im.rect(8,9+b,25,2,'d8c49a')
        if name in ['tavi','ada']:im.rect(24,4+b,6,8,hair)
        key=f'npc.{name}.idle.{phase}';add(key,im);ids.append(key)
      anim(f'npc.{name}.idle',ids,500)
      if name!='mira':anim(f'npc.{name}',ids,500)
    bosses=['ember-colossus','moon-weaver','thorn-matriarch','storm-roc','sun-scarab','eclipse-sovereign']
    for bi,family in enumerate(bosses):
      p=list(regions.values())[6+bi]
      for action in ['idle','walk','windup','attack','hurt','defeat']:
        ids=[]
        for phase in range(4):
          im=Raster(80,80);im.oval(8,65,64,10,(5,15,23,100));b=phase%2
          # Each silhouette is separately authored, not a recolored old warden.
          if bi==0:
            for x,y,w,h in [(20,20,40,39),(8,27,15,30),(57,27,15,30),(23,56,12,15),(46,56,12,15)]:im.rect(x,y+b,w,h,ink);im.rect(x+3,y+3+b,w-6,h-6,p[2])
            im.rect(28,11,24,22,p[2]);im.rect(31,17,18,4,gold);im.poly([(40,30),(49,44),(40,56),(31,44)],'ef9861')
          elif bi==1:
            for x in [7,57]:im.poly([(40,28),(x,8),(x+15,40),(x,63),(39,48)],p[2]);im.line(x+4,20,x+10,47,p[3],2)
            im.oval(29,17+b,23,44,ink);im.oval(32,20+b,17,37,p[4]);im.line(34,22,22,6,p[3],2);im.line(46,22,58,6,p[3],2)
          elif bi==2:
            for i in range(7):
              a=i*math.pi/3;dx=int(math.cos(a)*28);dy=int(math.sin(a)*20);im.poly([(40,39),(40+dx,31+dy),(46+dx,43+dy),(43,53)],p[2])
            im.poly([(21,56),(26,21),(40,9),(55,24),(62,58)],ink);im.poly([(26,54),(30,25),(40,14),(51,27),(56,55)],p[4]);im.rect(35,31,12,8,gold)
          elif bi==3:
            im.poly([(39,32),(11,8+b*4),(2,36),(25,52),(36,46)],p[2]);im.poly([(42,32),(68,8+b*4),(78,36),(55,52),(43,46)],p[2]);im.poly([(29,49),(34,20),(45,15),(53,34),(46,59),(33,68)],ink);im.poly([(34,46),(38,24),(45,22),(48,36),(43,56)],p[3]);im.poly([(45,25),(60,30),(46,34)],gold)
          elif bi==4:
            for y in [24,38,50]:im.line(27,y,10,y+12,p[3],3);im.line(53,y,70,y+12,p[3],3)
            im.oval(20,18,40,46,ink);im.oval(23,21,34,39,p[2]);im.line(40,23,40,58,p[3],2);im.oval(29,8,23,19,p[4]);im.line(32,12,24,4,gold,3);im.line(48,12,56,4,gold,3)
          else:
            im.poly([(10,68),(25,24),(40,15),(55,24),(70,68),(40,59)],ink);im.poly([(17,63),(29,29),(40,23),(51,29),(63,63),(40,54)],p[2]);im.oval(27,10+b,27,25,p[1]);im.rect(32,21+b,6,3,gold);im.rect(44,21+b,6,3,gold)
            for x,y in [(24,6),(36,2),(48,6)]:im.poly([(x,y),(x+8,y+11),(x+4,y+17)],p[3])
            im.oval(32,38,17,17,p[4]);im.oval(36,41,9,9,ink)
          if action=='windup':
            for x,y in [(8,9),(65,12),(6,55),(67,54)]:im.poly([(x,y-4-phase),(x+3,y),(x,y+4+phase),(x-3,y)],gold)
            im.line(28,66,52,66,'fff2ce',2)
          if action=='attack':
            for x in [5,65]:im.line(x,47-phase*5,x+9,28-phase*4,'fff2ce',3)
          if action=='hurt':im.line(30,16,44,11,'eaf5e9',3)
          if action=='defeat':
            for y in range(80):
              for x in range(80):
                if (x//2+y//2)%4<=phase:im.dot(x,y,(0,0,0,0))
          key=f'enemy.{family}.{action}.{phase}';add(key,im);ids.append(key)
        anim(f'enemy.{family}.{action}',ids,140 if action in ['idle','walk'] else 110,action in ['idle','walk'])
    # New equipment and consumables are visually legible in both world and inventory.
    for i,name in enumerate(['grapnel','tide-boots','ember-gauntlet','moon-lens','storm-bow','sun-disc','eclipse-lantern','potion-health','potion-light','potion-ward']):
      im=Raster(40,40);c=['89c8bc','7eacd1','dc9268','c6b9e4','aecbd0','edc97f','c5a3d1','d77581','edcd7f','8fc1bd'][i]
      if i>=7:
        im.rect(16,5,8,5,'bf9665');im.rect(17,10,6,6,'d8e7dc');im.oval(10,14,21,21,ink);im.oval(12,16,17,17,c);im.rect(15,18,3,7,'eaf0d8');im.rect(13,30,15,2,'657082')
      elif i==0:im.line(13,31,23,13,'a5b5ae',3);im.line(23,13,31,9,c,3);im.line(31,9,31,18,c,3);im.oval(7,25,14,10,'bc956c')
      elif i==1:
        for x in [8,22]:im.rect(x,10,8,19,ink);im.rect(x+1,11,6,13,c);im.rect(x,26,12,6,c);im.rect(x,30,12,3,'d7c393')
      elif i==2:im.poly([(10,29),(12,14),(17,8),(21,15),(29,11),(31,28),(22,34)],ink);im.rect(14,17,14,13,c);im.rect(15,19,11,2,gold)
      elif i in [3,5]:im.oval(7,7,26,26,ink);im.oval(9,9,22,22,c);im.oval(14,14,12,12,'475c71');im.rect(18,11,3,16,gold);im.rect(11,18,17,3,gold)
      elif i==4:im.line(12,5,28,19,c,3);im.line(28,19,12,34,c,3);im.line(12,5,12,34,'d9d9ba');im.line(6,20,33,20,gold,2)
      else:im.rect(12,12,17,22,ink);im.rect(14,15,13,15,c);im.rect(18,17,5,11,gold);im.line(15,12,15,6,'c7b8aa',2);im.line(15,6,26,6,'c7b8aa',2);im.line(26,6,26,12,'c7b8aa',2)
      add(f'prop.{name}.0',im)
    return regions, bosses

def polish(Raster, add, anim, palettes, regions, art):
    """Second art layer: region silhouettes, material facets, actual moving poses."""
    import math
    ink='182731';gold='ffdb87';allpal={**palettes,**regions}
    # Replace generic landmarks with authored architecture for each family.
    for name,im in art:
      if not name.startswith('landmark.'):continue
      land=name.split('.')[1];p=allpal[land]
      if land in ['mossward','rootvault','moonwood','sunken-garden','verdant-cistern']:
        # Buttressed living tree arch, hanging leaves and inset root door.
        im.p=bytearray(im.w*im.h*4);im.oval(3,65,74,12,(4,13,24,100))
        for x in [14,53]:
          im.poly([(x-7,70),(x,21),(x+8,9),(x+13,29),(x+10,60),(x+17,70)],ink);im.poly([(x-3,66),(x+3,24),(x+8,14),(x+10,40),(x+7,62),(x+12,67)],'79614d');im.line(x+4,28,x+2,60,'b18e62',2)
        for x,y,w,h in [(2,15,42,25),(28,3,40,29),(48,17,29,24),(15,10,42,26)]:
          im.oval(x,y,w,h,p[1]);im.oval(x+2,y+1,w-5,h-6,p[4]);im.oval(x+6,y+2,w-16,5,p[3]);im.line(x+6,y+h-6,x+w-9,y+h-6,p[0],2)
        im.oval(24,32,32,37,p[1]);im.rect(25,50,30,18,p[1]);im.oval(29,37,22,29,ink);im.rect(30,50,20,19,ink);im.poly([(40,39),(45,46),(40,53),(35,46)],gold)
        for x in [9,24,60,68]:im.line(x,35,x-2,49,p[4],2);im.rect(x-3,47,4,4,p[3])
        for x in [18,58]:im.oval(x,61,9,5,'b99870');im.rect(x+3,65,2,5,'d0c194')
      elif land in ['amber-fen','drowned-archive','cinder-coast']:
        # Stilted tide house, mast, sagging roof and exterior dock.
        im.p=bytearray(im.w*im.h*4);im.oval(1,64,78,12,(8,21,32,100))
        for x in [15,29,53,65]:im.rect(x,45,4,30,'715c4a');im.rect(x,65,4,3,p[4])
        im.rect(10,56,60,6,'aa8a5e');im.rect(8,61,65,3,'5d4b40');im.rect(17,24,46,32,'85694f')
        for y in range(28,55,6):im.rect(18,y,44,1,'b29668')
        im.poly([(8,28),(23,11),(56,13),(72,30),(43,25)],ink);im.poly([(12,26),(24,14),(55,16),(67,27),(42,22)],p[2]);im.line(23,15,53,17,p[3],2)
        im.rect(33,34,15,22,ink);im.rect(21,32,8,10,'233e49');im.rect(22,33,5,7,gold);im.rect(53,33,7,10,'233e49');im.rect(56,33,1,10,p[3]);im.rect(35,57,12,3,'d4b282')
        im.line(68,8,68,56,'b7a279',2);im.poly([(70,10),(79,14),(70,20)],p[4]);im.line(10,56,3,64,'c5ad7a',2)
      elif land in ['glass-highlands','prism-crypt','lunar-observatory','storm-peaks','tempest-spire']:
        # Broken astronomical tower, asymmetric crystals and brass orrery.
        im.p=bytearray(im.w*im.h*4);im.oval(3,65,74,12,(5,15,23,100));im.rect(15,64,50,8,p[1]);im.rect(19,60,42,6,p[3]);im.rect(24,18,32,43,p[2]);im.rect(26,20,7,38,p[3]);im.rect(47,20,7,40,p[0])
        for y in [27,40,53]:im.rect(25,y,30,1,p[1])
        im.poly([(20,20),(25,9),(32,15),(38,6),(44,12),(56,8),(60,20)],p[3]);im.oval(32,32,16,28,ink);im.rect(34,45,12,15,ink);im.poly([(40,35),(44,42),(40,49),(36,42)],gold)
        for x,y in [(5,47),(60,38)]:im.poly([(x,y+19),(x+3,y+2),(x+8,y-6),(x+15,y+9),(x+13,y+23)],p[1]);im.poly([(x+3,y+17),(x+5,y+2),(x+8,y-3),(x+8,y+21)],p[3]);im.poly([(x+9,y-2),(x+13,y+10),(x+11,y+18)],p[4])
        im.oval(27,0,26,13,'c9ac77');im.oval(29,2,22,9,ink);im.line(31,4,49,8,gold);im.rect(39,0,2,15,gold)
      elif land in ['ember-forge']:
        im.rect(10,17,12,42,p[1]);im.rect(12,18,8,38,p[2]);im.rect(8,15,16,5,p[3]);im.rect(58,8,10,48,p[1]);im.rect(60,9,6,44,p[2]);im.rect(56,6,14,5,p[3]);im.poly([(33,54),(40,42),(47,54)],'ef9861')
        for x,y in [(14,6),(19,0),(61,0)]:im.oval(x,y,8,7,(159,131,125,110))
        im.line(13,38,26,43,'e4a468',2);im.line(54,40,64,34,'e4a468',2)
      elif land in ['starfall-desert','solar-tomb']:
        im.p=bytearray(im.w*im.h*4);im.oval(2,66,76,11,(5,15,23,100));im.poly([(4,68),(40,9),(76,68)],p[1]);im.poly([(9,65),(40,14),(40,65)],p[3]);im.poly([(40,14),(70,65),(40,65)],p[2])
        for y in range(29,65,8):im.line(40-(y-9)//2,y,40+(y-9)//2,y,p[0])
        im.rect(31,45,18,21,ink);im.rect(29,43,22,3,p[3]);im.oval(31,21,18,18,p[1]);im.oval(34,24,12,12,gold);im.rect(39,20,2,20,p[3])
        for x in [12,62]:im.rect(x,48,6,19,p[0]);im.poly([(x-2,48),(x+3,35),(x+8,48)],p[3])
      else:
        # A dark split-spire stronghold with suspended eclipse ring.
        for x in [8,61]:im.poly([(x,57),(x+2,12),(x+7,0),(x+13,16),(x+12,60)],p[1]);im.line(x+4,17,x+4,52,p[3],2);im.rect(x+5,26,4,8,gold)
        im.oval(27,0,27,23,p[4]);im.oval(32,1,21,18,ink);im.rect(38,4,2,13,p[3]);im.rect(18,60,44,2,p[4])
    # One-pixel material detailing adds depth without muddying silhouettes.
    for name,im in art:
      if not name.startswith('enemy.'):continue
      family=name.split('.')[1];action=name.split('.')[2];phase=int(name.split('.')[-1])
      if action=='defeat' and phase==3:continue
      if im.w==80:
        # Sparse inset chips with a shadow pixel; restrict to opaque interior.
        for x,y in [(30,28),(48,35),(34,49),(46,55),(22,40),(56,43)]:
          pos=(y*im.w+x)*4;c=im.p[pos:pos+4]
          if c[3] and max(c[:3])-min(c[:3])>15:
            hi=tuple(min(255,int(k*1.16)+5) for k in c[:3])+(255,)
            lo=tuple(int(k*.7) for k in c[:3])+(255,)
            im.line(x,y,x+3,y,hi);im.line(x,y+1,x+2,y+1,lo)
        if action!='defeat':
          if family=='ember-colossus':
            for x,y in [(26,24),(50,31),(15,36),(60,45)]:im.line(x,y,x+3,y+8,'ef9861');im.line(x+3,y+8,x+1,y+12,'ffc480')
          if family=='moon-weaver':
            for x in [12,59]:im.oval(x,24,10,13,'b8abc6');im.oval(x+3,27,4,7,ink)
            im.rect(35,26,3,4,gold);im.rect(44,26,3,4,gold);im.line(34,43,46,43,'7887a3')
          if family=='thorn-matriarch':
            for x,y in [(26,22),(47,20),(20,49),(54,48)]:im.oval(x,y,8,6,'b3c38a');im.oval(x+2,y+1,4,3,'e1b59b')
            im.line(38,43,34,57,'b3c38a',2);im.line(43,44,48,56,'5c8266')
          if family=='storm-roc':
            for x,y in [(9,28),(16,34),(58,31),(65,25)]:im.line(x,y,x+4,y+8,'bed9db',2)
            im.rect(40,27,3,3,ink)
          if family=='sun-scarab':
            for y in [30,39,48]:im.line(25,y,37,y+3,'d5bd83');im.line(43,y+3,54,y,'d5bd83')
            im.rect(33,15,3,3,ink);im.rect(45,15,3,3,ink)
          if family=='eclipse-sovereign':
            for x,y in [(25,39),(52,39),(22,51),(55,51)]:im.poly([(x,y-3),(x+3,y),(x,y+4),(x-2,y)],'bd96ae')
          # Poses deform the moving body, leaving the grounding shadow stable.
          shift=([-1,0,1,0][phase] if action in ['idle','walk'] else [0,-1,-2,1][phase] if action=='windup' else [0,2,4,1][phase] if action=='attack' else 0)
          if shift:
            old=bytes(im.p)
            for y in range(65):
              for x in range(80):
                sy=y-shift;im.dot(x,y,old[(sy*80+x)*4:(sy*80+x)*4+4] if 0<=sy<65 else (0,0,0,0))
    # Additional earned action poses retain direction and the familiar keeper anchor.
    lookup=dict(art)
    for direction in ['up','down','left','right']:
      for action in ['cast','use','dash','hurt']:
        ids=[]
        for phase in range(4):
          base=lookup[f'keeper.{direction}.walk.{phase}'];im=Raster(40,40);im.p=bytearray(base.p)
          if action=='cast':
            for x,y in [(4+phase,9),(30,5+phase),(34,21)]:im.rect(x,y,2,3,gold)
            im.oval(29,23,6,6,'fff1c4')
          elif action=='use':im.rect(27,16,6,8,'b77580');im.rect(28,14,4,3,'d6c396');im.rect(28,18,2,4,'f3d5af')
          elif action=='dash':
            for y in [17,23,29]:im.line(2,y,7+phase,y,'9dc2b0')
          else:im.line(13,6,23,4,'f3e1cb',2);im.rect(25,18,3,4,'f3e1cb')
          key=f'keeper.{direction}.{action}.{phase}';add(key,im);ids.append(key)
        anim(f'keeper.{direction}.{action}',ids,80,False)
    families=['cinder-crab','moon-spider','thorn-stalker','storm-wisp','dune-scarab','eclipse-shade']
    for fi,family in enumerate(families):
      p=list(regions.values())[fi]
      for action in ['idle','walk','windup','attack','hurt','defeat']:
        ids=[]
        for phase in range(4):
          im=Raster(40,40);im.oval(4,32,32,6,(5,15,23,90));b=phase%2
          if fi==0:
            for x in [5,29]:im.line(x,23,x-2,30+b,p[2],2);im.oval(x-3,13-b,9,10,p[4])
            im.oval(9,15,23,17,ink);im.oval(11,16,19,13,p[2]);im.line(14,19,27,19,p[3]);im.rect(14,13,3,5,gold);im.rect(25,13,3,5,gold)
          elif fi==1:
            for y in [14,22,28]:im.line(17,y,4,y+5+b,p[3],2);im.line(24,y,36,y+5-b,p[3],2)
            im.oval(12,10,17,22,ink);im.oval(14,11,13,14,p[2]);im.oval(15,23,11,8,p[4]);im.rect(17,24,2,2,gold);im.rect(22,24,2,2,gold)
          elif fi==2:
            im.poly([(9,31),(13,12),(20,4),(28,13),(32,31)],ink);im.poly([(12,28),(16,13),(20,8),(25,15),(28,29)],p[4]);im.line(12,23,4,28+b,p[2],3);im.line(28,23,36,28-b,p[2],3);im.rect(17,15,3,3,gold);im.rect(23,15,3,3,gold)
          elif fi==3:
            im.poly([(20,3+b),(30,15),(28,27),(35,33),(20,29),(9,33),(12,17)],ink);im.poly([(20,7+b),(26,17),(25,25),(20,27),(15,23),(16,17)],p[3]);im.rect(17,18,3,3,ink);im.rect(22,18,3,3,ink);im.rect(18,29,4,3,gold)
          elif fi==4:
            for y in [15,23,29]:im.line(13,y,5,y+4+b,p[3],2);im.line(27,y,35,y+4-b,p[3],2)
            im.oval(11,8,19,25,ink);im.oval(13,10,15,21,p[2]);im.line(20,12,20,29,p[3]);im.oval(15,5,11,9,p[4]);im.rect(17,7,2,2,gold);im.rect(23,7,2,2,gold)
          else:
            im.poly([(5,33),(13,13),(20,5+b),(28,15),(35,33),(24,29),(20,34),(15,30)],ink);im.poly([(10,29),(16,14),(20,9+b),(25,16),(30,29),(21,26)],p[2]);im.rect(16,18,3,3,gold);im.rect(23,18,3,3,gold)
          if action=='windup':im.rect(5,5+phase,2,4,gold);im.rect(33,5+phase,2,4,gold)
          if action=='attack':im.line(3,28-phase*3,9,20-phase*2,gold,2);im.line(31,20-phase*2,37,28-phase*3,gold,2)
          if action=='hurt':im.line(15,9,23,6,'e5ead7',2)
          if action=='defeat':
            for y in range(40):
              for x in range(40):
                if (x+y)%4<=phase:im.dot(x,y,(0,0,0,0))
          key=f'enemy.{family}.{action}.{phase}';add(key,im);ids.append(key)
        anim(f'enemy.{family}.{action}',ids,130 if action in ['idle','walk'] else 90,action in ['idle','walk'])
    for effect in ['ember','mist','leaf-swirl','moon-beam','storm-bolt','eclipse-pulse']:
      ids=[]
      for phase in range(4):
        im=Raster(80,80);c={'ember':'ed9e6c','mist':'9abfca','leaf-swirl':'a6c28a','moon-beam':'c9d9ea','storm-bolt':'c3e6e4','eclipse-pulse':'c3a0c9'}[effect]
        if effect in ['moon-beam','storm-bolt']:
          im.line(38,4,43,24,c,2+phase%2);im.line(43,24,35,43,c,2);im.line(35,43,42,75,c,2);im.line(40,6,45,24,'f3eed6')
        else:
          for i in range(9):
            a=i*math.pi/4+phase*.35;r=12+phase*6;x=40+int(math.cos(a)*r);y=40+int(math.sin(a)*r)
            im.poly([(x,y-3),(x+3,y),(x,y+4),(x-2,y)],c)
        key=f'effect.{effect}.{phase}';add(key,im,'effect');ids.append(key)
      anim(f'effect.{effect}',ids,100,effect in ['mist','leaf-swirl'])
    return families

def campaign_art(Raster, add, anim, art):
    """Names and silhouettes matched to the current world/story content contract."""
    import math
    ink='182731';gold='ffdb87'
    for family in ['bell-leviathan','frost-leviathan','horizon-iris']:
      for action in ['idle','walk','windup','attack','hurt','defeat']:
        ids=[]
        for phase in range(4):
          im=Raster(80,80);b=[0,1,0,-1][phase];im.oval(5,65,70,11,(4,13,24,110))
          if family=='bell-leviathan':
            # Bronze diving bell lifted by four eel tails; bright swinging clapper.
            for x,sign in [(17,-1),(26,-1),(53,1),(62,1)]:
              im.line(x,48,x+sign*(8+phase%2*2),60,'426e78',4);im.line(x+sign*8,60,x+sign*11,65,'72a4a2',3)
            im.oval(17,12+b,47,45,ink);im.oval(20,15+b,41,39,'ac8c5c');im.rect(18,34+b,46,22,'ac8c5c');im.rect(21,27+b,6,25,'d6ba7d');im.rect(54,28+b,6,23,'705846');im.rect(15,53+b,51,8,ink);im.rect(17,53+b,47,4,'dfc993');im.oval(31,8+b,19,10,'d0b17b');im.oval(36,9+b,9,6,ink);im.oval(29,35+b,23,20,'3d505b');im.oval(33,39+b,15,12,ink);im.line(40,42+b,40+phase-2,60,'e8ce8b',3);im.oval(35+phase,58,8,7,gold)
            for x in [28,49]:im.oval(x,28+b,6,7,gold);im.rect(x+2,30+b,2,3,ink)
            for x,y in [(25,20),(48,22),(24,45)]:im.rect(x,y+b,3,2,'efdaa3')
          elif family=='frost-leviathan':
            # Low armored reservoir beast; ice fans point away from its face.
            for x,y in [(9,42),(19,25),(30,17),(45,16),(58,27)]:
              im.poly([(x,y+15),(x-4,y-2),(x+4,y-11),(x+10,y+13)],ink);im.poly([(x+1,y+11),(x-1,y),(x+4,y-7),(x+4,y+11)],'c6e4e3')
            im.oval(13,32+b,55,30,ink);im.oval(17,34+b,46,24,'7399ac');im.oval(21,36+b,35,9,'a9cbd3');im.oval(22,43+b,36,21,ink);im.oval(25,45+b,30,15,'597888');im.rect(28,48+b,8,4,gold);im.rect(44,48+b,8,4,gold)
            for x in [18,52]:im.poly([(x,54),(x+10,55),(x+15,69),(x+1,70)],'91bac5');im.line(x+3,59,x+8,66,'d4e8dd',2)
            for x in [32,39,46]:im.poly([(x,57),(x+3,57),(x+1,63)],'d9ede5')
          else:
            # Mechanical shutter wheel around an eclipse pupil, with side fins.
            for x in [5,59]:im.poly([(x,18),(x+16,27),(x+16,55),(x,64),(x+5,41)],'a89971');im.line(x+4,27,x+10,34,'e5d3a0',2)
            im.oval(15,12+b,51,51,ink);im.oval(18,15+b,45,45,'d9be80');im.oval(23,20+b,35,35,'786c61')
            for i in range(8):
              a=i*math.pi/4+phase*.04;cx=40+int(math.cos(a)*17);cy=37+b+int(math.sin(a)*17);im.poly([(cx,cy),(cx+int(math.cos(a+1)*11),cy+int(math.sin(a+1)*11)),(40,37+b)],'b6a57f' if i%2 else '8a836f')
            im.oval(30,27+b,21,21,ink);im.oval(34,31+b,13,13,'d7ece2');im.rect(39,32+b,3,11,'384c60');im.rect(26,61,29,5,'bba47b');im.rect(30,67,21,3,'766551')
          if action=='windup':
            for x,y in [(9,9),(68,12),(5,53),(70,55)]:im.poly([(x,y-4-phase),(x+3,y),(x,y+4+phase),(x-3,y)],gold)
          if action=='attack':
            for x in [5,66]:im.line(x,53-phase*4,x+7,34-phase*3,'f4e9c3',3)
          if action=='hurt':im.line(28,19,42,14,'eef3dd',3)
          if action=='defeat':
            for y in range(80):
              for x in range(80):
                if (x//2+y//2)%4<=phase:im.dot(x,y,(0,0,0,0))
          key=f'enemy.{family}.{action}.{phase}';add(key,im);ids.append(key)
        anim(f'enemy.{family}.{action}',ids,140 if action in ['idle','walk'] else 100,action in ['idle','walk'])
    # Exact earned story equipment; no renderer-side recoloring required.
    for name in ['ember-cloak','wind-hook','frost-lens','moon-mirror','dawn-thread']:
      im=Raster(40,40)
      if name=='ember-cloak':
        im.poly([(15,6),(25,6),(29,17),(35,32),(20,29),(5,32),(11,17)],ink);im.poly([(16,8),(24,8),(26,18),(31,29),(20,26),(9,29),(14,17)],'ba7153');im.line(16,12,12,26,'e7ac72',2);im.rect(18,12,5,3,gold)
      elif name=='wind-hook':im.line(11,33,25,12,'bbcfc8',3);im.line(25,12,31,8,'e7ce9c',3);im.line(31,8,33,17,'e7ce9c',3);im.oval(5,26,14,10,'aa8764');im.oval(8,29,8,4,ink)
      elif name=='frost-lens':im.oval(7,6,25,25,ink);im.oval(9,8,21,21,'a8d7de');im.oval(12,11,15,15,'547b99');im.line(14,13,20,10,'dfede2',2);im.line(26,28,33,35,'d7c292',4)
      elif name=='moon-mirror':im.oval(8,4,24,26,'c6b8cb');im.oval(11,7,18,20,'46536d');im.oval(14,9,12,15,'bed1d5');im.oval(18,8,10,13,'46536d');im.rect(17,28,6,9,'c6b8cb');im.rect(18,30,4,2,gold)
      else:
        im.oval(6,8,28,24,ink);im.oval(8,10,24,20,'aa8c60');im.oval(12,13,16,14,gold);im.oval(16,15,8,10,ink)
        for y in [12,17,22,27]:im.line(10,y,30,y,'f0dca9')
        im.line(30,25,35,32,gold);im.line(35,32,29,36,gold)
      add(f'prop.{name}.0',im)
    # Named recurring characters missing from the original NPC palette.
    lookup=dict(art)
    for name,source in [('sen','ferryman'),('ida','ada')]:
      ids=[]
      for phase in range(2):
        im=Raster(40,40);im.p=bytearray(lookup[f'npc.{source}.idle.{phase}'].p)
        if name=='sen':im.rect(9,8+phase,23,3,'b7b7a0');im.rect(12,5+phase,17,4,'728b86');im.rect(18,23,8,4,'d0bc91')
        else:im.rect(25,4+phase,5,12,'c7b28e');im.line(13,20,25,26,'d8c49a',2)
        key=f'npc.{name}.idle.{phase}';add(key,im);ids.append(key)
      anim(f'npc.{name}.idle',ids,500);anim(f'npc.{name}',ids,500)

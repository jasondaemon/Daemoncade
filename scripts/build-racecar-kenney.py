"""Bake Kenney CC0 GLBs into Racecar's compact animated vehicle format.

Preserves separate wheel meshes and bakes the supplied palette texture to
material colors, so the runtime needs neither an extra loader nor textures.
Usage: python3 scripts/build-racecar-kenney.py SOURCE_DIRECTORY
"""
import json, struct, sys, math, shutil, colorsys
from pathlib import Path
from collections import defaultdict, Counter
from PIL import Image

source = Path(sys.argv[1])
nature = len(sys.argv)>2 and sys.argv[2]=='nature'
out = Path('games/racecar/assets/kenney-nature' if nature else 'games/racecar/assets/kenney-cars')
out.mkdir(parents=True, exist_ok=True)
names = ['hatchback-sports','sedan-sports','suv-luxury','race','race-future',
         'delivery','delivery-flat','firetruck','garbage-truck','tractor',
         'tractor-shovel','truck','truck-flat','van','ambulance','kart-oopi']
if nature:names=['tree_palm','tree_palmBend','tree_palmDetailedShort','tree_oak','tree_pineTallA','cactus_short','cactus_tall','rock_largeA','rock_largeB','rock_largeD','tent_smallOpen']

def transform(v, node, normal=False):
    scale=node.get('scale',[1,1,1])
    x,y,z=[v[i]/scale[i] if normal else v[i]*scale[i] for i in range(3)]
    qx,qy,qz,qw=node.get('rotation',[0,0,0,1])
    tx,ty,tz=2*(qy*z-qz*y),2*(qz*x-qx*z),2*(qx*y-qy*x)
    v=[x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,z+qw*tz+qx*ty-qy*tx]
    if not normal: v=[a+b for a,b in zip(v,node.get('translation',[0,0,0]))]
    return v

for name in names:
    path=source/(name+'.glb');b=path.read_bytes()
    jsonlen=struct.unpack_from('<I',b,12)[0]
    doc=json.loads(b[20:20+jsonlen]);data=b[28+jsonlen:]
    palette=None if nature else Image.open(source/'Textures/colormap.png').convert('RGB')
    def accessor(index):
        a=doc['accessors'][index];view=doc['bufferViews'][a['bufferView']]
        fmt={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']]
        n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        size=struct.calcsize(fmt);stride=view.get('byteStride',size*n)
        offset=view.get('byteOffset',0)+a.get('byteOffset',0)
        return [struct.unpack_from('<'+fmt*n,data,offset+i*stride) for i in range(a['count'])]
    parents={child:i for i,node in enumerate(doc['nodes']) for child in node.get('children',[])}
    def world(v,index,normal=False):
        while True:
            v=transform(v,doc['nodes'][index],normal)
            if index not in parents:return v
            index=parents[index]
    groups=defaultdict(lambda:{'positions':[],'normals':[]});counts=Counter()
    for ni,node in enumerate(doc['nodes']):
        if 'mesh' not in node:continue
        part=node.get('name','body')
        part=('front-' if 'front' in part else 'rear-')+('left' if 'left' in part else 'right') if 'wheel-' in part else 'body'
        for primitive in doc['meshes'][node['mesh']]['primitives']:
            pos=accessor(primitive['attributes']['POSITION']);norm=accessor(primitive['attributes']['NORMAL']);uv=accessor(primitive['attributes']['TEXCOORD_0'])
            indices=[a[0] for a in accessor(primitive['indices'])]
            for i in range(0,len(indices),3):
                face=indices[i:i+3];u=sum(uv[j][0] for j in face)/3;v=sum(uv[j][1] for j in face)/3
                rgb=tuple(round(c*255) for c in doc['materials'][primitive['material']]['pbrMetallicRoughness']['baseColorFactor'][:3]) if nature else palette.getpixel((min(palette.width-1,max(0,int(u*palette.width))),min(palette.height-1,max(0,int(v*palette.height)))))
                if not nature:
                    # The source palette has gradients. Baking each sampled shade
                    # independently would create hundreds of draw calls per car.
                    hue,saturation,value=colorsys.rgb_to_hsv(*(c/255 for c in rgb))
                    if part!='body':rgb=(28,30,34) if value<.42 else (130,142,154)
                    elif saturation<.32:rgb=(28,30,34) if value<.32 else (58,76,94) if value<.65 else (156,168,180) if value<.88 else (232,238,244)
                    else:
                        colors=[(226,52,40),(239,142,32),(232,206,46),(67,169,74),(43,190,169),(46,151,220),(94,81,204),(210,76,158)]
                        rgb=colors[round(hue*8)%8]
                key=','.join(map(str,rgb));g=groups[part,key]
                if part=='body' and max(rgb)>80 and max(rgb)-min(rgb)>30:counts[key]+=1
                for j in face:g['positions']+=world(pos[j],ni);g['normals']+=world(norm[j],ni,True)
    paint=counts.most_common(1)[0][0] if counts and not nature else None
    allpos=[g['positions'] for g in groups.values()]
    bounds=[(min(v[i] for p in allpos for v in zip(*[iter(p)]*3)),max(v[i] for p in allpos for v in zip(*[iter(p)]*3))) for i in range(3)]
    length=3.0 if name.startswith('kart') else 5.6 if name in ['truck','truck-flat','garbage-truck','firetruck','delivery'] else 4.3
    scale=4 if nature else length/(bounds[2][1]-bounds[2][0]);center=[sum(bounds[0])/2,bounds[1][0],sum(bounds[2])/2]
    mats={};parts=[]
    for (part,key),g in groups.items():
        material='Blue' if key==paint and part=='body' else 'color-'+key.replace(',','-')
        mats[material]={'color':[int(c)/255 for c in key.split(',')]}
        positions=[round((v-center[i%3])*scale*(1 if i%3==1 else -1),4) for i,v in enumerate(g['positions'])]
        normals=[round(v*(1 if i%3==1 else -1),4) for i,v in enumerate(g['normals'])]
        parts.append({'part':part,'material':material,'positions':positions,'normals':normals})
    (out/(name+'.json')).write_text(json.dumps({'materials':mats,'parts':parts},separators=(',',':')))
    shutil.copy2(path,out/path.name)
    print(name,sum(len(p['positions'])//9 for p in parts),'triangles')
shutil.copy2(source.parent.parent/'License.txt',out/'License.txt')

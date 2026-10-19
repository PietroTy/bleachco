# Gera os moldes das fotos da camiseta a partir de src/assets/tshirt.glb:
#   src/assets/camisetas/_molde-frente.png e _molde-costas.png
# Cada molde tem o tamanho/proporção exatos de um lado da camiseta 3D (caixa de ponta de manga a ponta
# de manga, gola à barra) e o contorno dela. Põe a foto por baixo, alinha e exporta no mesmo tamanho.
# Uso: python3 tools/make_molde.py
import json, os, struct
from PIL import Image, ImageDraw, ImageFilter
D = os.path.dirname(os.path.abspath(__file__))
GLB = os.path.join(D, '..', 'src/assets/tshirt.glb')
OUT = os.path.join(D, '..', 'src/assets/camisetas')
b = open(GLB, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + jl])
bin0 = 20 + jl + 8
prim = j['meshes'][0]['primitives'][0]
def acc(i, n):
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
    off = bin0 + v.get('byteOffset', 0) + a.get('byteOffset', 0)
    fmt = {5126: 'f', 5123: 'H', 5125: 'I'}[a['componentType']]
    size = struct.calcsize(fmt)
    stride = v.get('byteStride', size * n)
    return [struct.unpack_from('<' + fmt * n, b, off + k * stride) for k in range(a['count'])]
pos = acc(prim['attributes']['POSITION'], 3)
uv = acc(prim['attributes']['TEXCOORD_0'], 2)
idx = [t[0] for t in acc(prim['indices'], 1)]
xs = [p[0] for p in pos]; ys = [p[1] for p in pos]
aspect = (max(ys) - min(ys)) / (max(xs) - min(xs))  # altura / largura da caixa
W = 1000; H = round(W * aspect)
for name, u0 in (('frente', 0.0), ('costas', 0.5)):
    img = Image.new('RGBA', (W, H), (255, 255, 255, 255))
    dr = ImageDraw.Draw(img)
    tris = []
    for t in range(0, len(idx), 3):
        tri = [uv[idx[t + k]] for k in range(3)]
        if all(u0 <= u <= u0 + 0.5 for u, _ in tri):
            tris.append([((u - u0) * 2 * W, v * H) for u, v in tri])
    mask = Image.new('L', (W, H), 0)
    md = ImageDraw.Draw(mask)
    for tri in tris: md.polygon(tri, fill=255)
    img.paste((225, 225, 225, 255), mask=mask)
    edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
    img.paste((90, 90, 90, 255), mask=edge)
    dr.text((12, 10), f'MOLDE {name.upper()}  {W}x{H}  (cinza = camiseta; fora dela nao aparece)', fill=(120, 120, 120, 255))
    img.save(os.path.join(OUT, f'_molde-{name}.png'))
    print('ok', name, W, H, len(tris), 'triângulos')

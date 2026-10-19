# Encaixa a camiseta (tshirt.glb) no esqueleto (skeleton.gltf), na pose de repouso dele.
# Saída: fit/tshirt_fit.glb no mesmo espaço do esqueleto, com COLOR_0.r = quanto o vértice segue o braço
# (e .g = lado: 1 esquerdo, 0 direito). Coordenadas Blender: Z cima, -Y frente.
import bpy, bmesh, math, sys
from mathutils import Vector, Quaternion, Matrix
P = dict(a.split('=') for a in sys.argv[sys.argv.index('--')+1:]) if '--' in sys.argv else {}
f = lambda k, d: float(P.get(k, d))
# Uso: blender -b -P tools/tee_fit.py -- sx=0.72 hem=0.87 top=1.50 margin=0.02 collar_sy=1.0 collar_sx=0.6 export=1
# Lê tools/tshirt_orig.glb (o modelo original do Poly) e escreve tools/out/tshirt_fit.glb → public/models/tshirt.glb
import os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out') + '/'
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public/models/skeleton/skeleton.gltf'))
arm = bpy.data.objects['Armature']
bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tshirt_orig.glb'))  # original do Poly, fonte fixa
tee = bpy.data.objects['Shirt_adid']
B = lambda n: (arm.matrix_world @ arm.data.bones[n].head_local, arm.matrix_world @ arm.data.bones[n].tail_local)

# solda os pedaços
bm = bmesh.new(); bm.from_mesh(tee.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
bm.to_mesh(tee.data); bm.free()

def ss(x, a, b):
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

# Perfil da caixa torácica por altura: frente (y mín) e costas (y máx) dos ossos do tronco
sk = bpy.data.objects['Skeleton']
gi = {g.index: g.name for g in sk.vertex_groups}
BIN = 0.03
prof = {}
for vv in sk.data.vertices:
    w = sum(g.weight for g in vv.groups if gi[g.group] in ('Torso', 'Shoulder.L', 'Shoulder.R'))
    co = sk.matrix_world @ vv.co
    if w < 0.5 or abs(co.x) > 0.19 or co.z < 0.86: continue
    k = round(co.z / BIN)
    lo, hi = prof.get(k, (9, -9)); prof[k] = (min(lo, co.y), max(hi, co.y))
ks = sorted(prof)
def rib(z):
    k = min(max(z / BIN, ks[0]), ks[-1])
    # envelope: pega o pior (mais pra fora) dos bins vizinhos, ossos são esparsos
    near = [prof[j] for j in ks if abs(j - k) <= 2.2]
    return min(n[0] for n in near), max(n[1] for n in near)
print('RIB', [(round(j*BIN,2), round(prof[j][0],3), round(prof[j][1],3)) for j in ks])
HEM, TOP = f('hem', 0.80), f('top', 1.47)          # altura da barra e da gola
SX = f('sx', 0.80)                                  # largura
YC_T, YC, SY = 0.01, f('yc', 0.045), f('sy', 0.88)  # centro de profundidade (camiseta → peito) e escala
BACK = f('back', 0.06)                              # o quanto o topo (gola) recua pro pescoço
neckY = (B('Neck')[0].y)
# faixa de profundidade da própria camiseta (só o corpo) por altura
tb = {}
for vv in tee.data.vertices:
    if abs(vv.co.x) > 0.22: continue
    k = round(vv.co.z / 0.05)
    lo, hi = tb.get(k, (9, -9)); tb[k] = (min(lo, vv.co.y), max(hi, vv.co.y))
tks = sorted(tb)
def teeY(h):
    k = min(max(round(h / 0.05), tks[0]), tks[-1])
    while k not in tb: k -= 1
    return tb[k]
tips = {}
cols = []
pre = []
shoulderL = B('UpperArm.L')[0]; elbowL = B('UpperArm.L')[1]
for v in tee.data.vertices:
    p = v.co.copy()  # malha sem transformação (dims 0.968 x 0.37 x 1)
    h = p.z
    side = 1 if p.x > 0 else -1
    a = ss(abs(p.x), 0.22, 0.3) * ss(h, 0.42, 0.5)   # quanto é manga
    x = p.x * SX
    z = HEM + h * (TOP - HEM)
    # profundidade: envelope suave da caixa torácica (frente/costas por altura, medido nos ossos)
    # e a camiseta inteira mapeada nele com folga, mantendo o próprio formato
    k = ss(z, 0.9, 1.05)
    fr = -0.075 - 0.005 * k
    bk = 0.11 + 0.055 * k
    m = f('margin', 0.03)
    t = (p.y - (-0.165)) / (0.175 - (-0.165))
    y = (fr - m) + t * ((bk + m) - (fr - m))
    # Gola centrada no pescoço: o pescoço do esqueleto sai bem atrás, então o topo da camiseta é
    # comprimido de frente pra trás em volta dele (o peito sobe inclinado até a gola) e o buraco estreita
    kc = ss(h, f('collar_from', 0.86), 0.98)
    neckC = neckY + f('neck_dy', 0.0)
    y = y + kc * ((neckC + (y - f('collar_c', 0.025)) * f('collar_sy', 0.6)) - y)
    x = x * (1 - f('collar_sx', 0.3) * ss(h, 0.86, 0.99) * (1 - ss(abs(p.x), 0.12, 0.2)))
    q = Vector((x, y, z))
    pre.append((v, q, a, side))
for side in (-1, 1):
    pts = [q for v, q, a, s2 in pre if s2 == side and a > 0.95]
    far = max(abs(q.x) for q in pts)
    tip = [q for q in pts if abs(q.x) > far - 0.03]
    tips[side] = sum(tip, Vector()) / len(tip)
for v, q, a, side in pre:
    if a > 0:
        sh, el = B('UpperArm.L' if side > 0 else 'UpperArm.R')
        pivot = Vector((sh.x, sh.y, sh.z - 0.01))
        # eixo da manga (na malha): ombro → ponta
        tipT = tips[side]
        rot = (tipT - pivot).rotation_difference(el - sh)
        rot = Quaternion().slerp(rot, a)
        q = pivot + rot @ (q - pivot)
        # aperta em volta do úmero
        axis = (el - sh).normalized()
        t = (q - sh).dot(axis)
        on = sh + axis * t
        # só da metade da manga pra baixo: no topo do ombro o tecido fica folgado por cima da escápula
        g = ss(t / (el - sh).length, 0.15, 0.5)
        q = on + (q - on) * (1 - f('squeeze', 0.25) * a * g)
    v.co = q
    cols.append((a, 1.0 if side > 0 else 0.0))
tee.data.update()
# atributo de cor por vértice
ca = tee.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for i, (a, s) in enumerate(cols): ca.data[i].color = (a, s, 0, 1)
tee.data.update()

# Buraco da gola: borda aberta lá no alto, perto do centro
bm = bmesh.new(); bm.from_mesh(tee.data)
ring = {v.index: v.co.copy() for e in bm.edges if e.is_boundary for v in e.verts if v.co.z > 1.4 and abs(v.co.x) < 0.14}
bm.free()
if ring:
    c = sum(ring.values(), Vector()) / len(ring)
    xs = [p.x for p in ring.values()]; ys = [p.y for p in ring.values()]
    print('COLLAR center', round(c.x, 3), round(c.y, 3), round(c.z, 3), 'x', round(min(xs), 3), round(max(xs), 3), 'y', round(min(ys), 3), round(max(ys), 3), '| neck y', round(neckY, 3), 'neck verts y 0.043..0.129')
if P.get('render'):
    sc = bpy.context.scene
    cam = bpy.data.objects.new('c', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.1
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'OBJECT'
    tee.color = (0.15, 0.15, 0.2, 1)
    sc.render.resolution_x = 360; sc.render.resolution_y = 420
    bpy.data.objects['Icosphere'].hide_render = True
    if P.get('noskel'): bpy.data.objects['Skeleton'].hide_render = True
    sc.display.shading.show_backface_culling = bool(P.get('cull'))
    for i, ang in enumerate([0, 90, 180, 270]):
        r = math.radians(ang)
        cam.location = (3 * math.sin(r), -3 * math.cos(r), 1.15)
        cam.rotation_euler = (math.pi / 2, 0, r)
        sc.render.filepath = OUT + f'v{i}.png'
        bpy.ops.render.render(write_still=True)
    # de cima: o buraco da gola com o pescoço dentro (cabeça escondida)
    bpy.data.objects['Skeleton'].hide_render = False
    cam.location = (0, 0, 3); cam.rotation_euler = (0, 0, 0); cam.data.ortho_scale = 0.6
    sc.render.resolution_x = sc.render.resolution_y = 360
    cam.data.clip_start = 3 - 1.56
    sc.render.filepath = OUT + 'top.png'
    bpy.ops.render.render(write_still=True)
if P.get('export'):
    bpy.ops.object.select_all(action='DESELECT'); tee.select_set(True); bpy.context.view_layer.objects.active = tee
    bpy.ops.export_scene.gltf(filepath=OUT + 'tshirt_fit.glb', use_selection=True, export_animations=False, export_texcoords=True, export_normals=True, export_vertex_color='ACTIVE', export_all_vertex_colors=True, export_materials='NONE')
if P.get('poke'):
    from mathutils.bvhtree import BVHTree
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(tee, dg)
    sk = bpy.data.objects['Skeleton']; gi = {g.index: g.name for g in sk.vertex_groups}
    out = []
    for vv in sk.data.vertices:
        w = {gi[g.group]: g.weight for g in vv.groups}
        if w.get('Torso', 0) + w.get('Shoulder.L', 0) + w.get('Shoulder.R', 0) < 0.5: continue
        co = sk.matrix_world @ vv.co
        if co.z < 0.86: continue
        c = Vector((0, 0.045, co.z)); d = (co - c); d.z = 0
        if d.length < 1e-4: continue
        hit = bvh.ray_cast(c, d.normalized())
        if hit[0] is None or (hit[0] - c).length < d.length: out.append(tuple(round(x, 3) for x in co))
    print('POKE', len(out), sorted(out, key=lambda p: -p[2])[:25])

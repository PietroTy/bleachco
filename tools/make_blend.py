# Gera tools/tee.blend: esqueleto + camiseta ORIGINAL (tshirt_orig.glb) só posicionada no corpo, pra moldar à mão.
# Uso: blender -b -P tools/make_blend.py
import bpy, bmesh, os
from mathutils import Vector
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(D, '..', 'public/models/skeleton/skeleton.gltf'))
bpy.data.objects['Icosphere'].hide_set(True); bpy.data.objects['Icosphere'].hide_render = True
arm = bpy.data.objects['Armature']
bpy.ops.import_scene.gltf(filepath=os.path.join(D, 'tshirt_orig.glb'))
shirt = bpy.data.objects['Shirt_adid']; shirt.name = 'Shirt'

# solda os pedaços (o modelo vem picotado, com vértice repetido em cada emenda)
bm = bmesh.new(); bm.from_mesh(shirt.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
# Simétrica: fica a metade direita (x < 0, a manga desse lado aponta mais perto do braço) e o
# modificador Mirror faz a outra; tudo que mexer num lado aparece no outro
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(1, 0, 0), clear_outer=True)
for v in bm.verts:
    if abs(v.co.x) < 1e-4: v.co.x = 0
bm.to_mesh(shirt.data); bm.free()
mir = shirt.modifiers.new('Mirror', 'MIRROR')
mir.use_axis = (True, False, False); mir.use_clip = True; mir.use_mirror_merge = True; mir.merge_threshold = 0.001
mir.show_on_cage = True

def ss(x, a, b):
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
# Peso do braço por vértice (cor 'Col', r = quanto segue o braço; o lado o site tira da posição), nas medidas da malha original
ca = shirt.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for v in shirt.data.vertices:
    a = ss(abs(v.co.x), 0.22, 0.3) * ss(v.co.z, 0.42, 0.5)
    ca.data[v.index].color = (a, 0, 0, 1)
shirt.data.color_attributes.active_color = ca

# Só posiciona: largura/altura do tronco do esqueleto, gola no pescoço (o resto é com você)
neck = arm.matrix_world @ arm.data.bones['Neck'].head_local
shirt.scale = (0.72, 0.8, 0.63)
shirt.location = (neck.x, 0.045 - 0.01 * 0.8, 0.87)
for o in ('Skeleton', 'Armature'):
    bpy.data.objects[o].hide_select = True
bpy.context.view_layer.objects.active = shirt; shirt.select_set(True)
print('verts', len(shirt.data.vertices))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'tee.blend'))

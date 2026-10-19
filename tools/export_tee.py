# Exporta o objeto "Shirt" do .blend aberto pro site (src/assets/tshirt.glb).
# Uso: blender -b tools/tee.blend -P tools/export_tee.py   (ou pela aba Scripting com o Blender aberto)
# Numa cópia, na pose de repouso: aplica o Mirror e move/gira/escala, acerta as normais, refaz a UV da
# estampa projetando de frente (-Y no Blender) e exporta com os pesos dos ossos (rig_tee.py) + a Armature.
import bpy, bmesh, os
D = os.path.dirname(bpy.data.filepath)
OUT = os.path.join(D, '..', 'src/assets/tshirt.glb')
src = bpy.data.objects['Shirt']
if bpy.context.object and bpy.context.object.mode != 'OBJECT':
    bpy.ops.object.mode_set(mode='OBJECT')
arm = bpy.data.objects['Armature']
pose_was = arm.data.pose_position
arm.data.pose_position = 'REST'  # posado no Blender ou não, a camiseta sai na pose de repouso
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
me = bpy.data.meshes.new_from_object(src.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
me.transform(src.matrix_world)
bm = bmesh.new(); bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
uv = bm.loops.layers.uv.active or bm.loops.layers.uv.new('UVMap')
xs = [v.co.x for v in bm.verts]; zs = [v.co.z for v in bm.verts]
x0, w = min(xs), max(xs) - min(xs); z0, hgt = min(zs), max(zs) - min(zs)
for f in bm.faces:
    front = f.normal.y < -0.15
    for l in f.loops:
        l[uv].uv = ((l.vert.co.x - x0) / w, (l.vert.co.z - z0) / hgt) if front else (0.02, 0.02)
    f.smooth = True
bm.to_mesh(me); bm.free()
tmp = bpy.data.objects.new('Shirt', me) if 'Shirt' not in bpy.data.objects else bpy.data.objects.new('ShirtExport', me)
bpy.context.scene.collection.objects.link(tmp)
for g in src.vertex_groups: tmp.vertex_groups.new(name=g.name)  # mesmos índices dos pesos
skinned = len(src.vertex_groups) > 0
if skinned:
    tmp.parent = arm
    tmp.modifiers.new('Armature', 'ARMATURE').object = arm
hidden = arm.hide_select
arm.hide_select = False
bpy.ops.object.select_all(action='DESELECT'); tmp.select_set(True)
if skinned: arm.select_set(True)
bpy.context.view_layer.objects.active = tmp
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_animations=False, export_texcoords=True, export_normals=True,
                          export_vertex_color='ACTIVE', export_all_vertex_colors=True, export_materials='NONE',
                          export_skins=skinned, export_def_bones=True)
bpy.data.objects.remove(tmp); bpy.data.meshes.remove(me)
arm.hide_select = hidden
arm.data.pose_position = pose_was
print('ok:', os.path.normpath(OUT))

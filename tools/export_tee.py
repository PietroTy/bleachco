# Exporta o objeto "Shirt" do tee.blend pro site (public/models/tshirt.glb).
# Uso: blender -b tools/tee.blend -P tools/export_tee.py   (ou rode pelo Scripting do Blender aberto)
import bpy, os
D = os.path.dirname(bpy.data.filepath)
shirt = bpy.data.objects['Shirt']
bpy.ops.object.mode_set(mode='OBJECT') if bpy.context.object and bpy.context.object.mode != 'OBJECT' else None
bpy.ops.object.select_all(action='DESELECT'); shirt.hide_select = False; shirt.select_set(True); bpy.context.view_layer.objects.active = shirt
# O site usa só a forma da malha: move/gira/escala feitos no objeto inteiro entram na malha antes de exportar
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(D, '..', 'public/models/tshirt.glb'), use_selection=True, export_animations=False,
                          export_texcoords=True, export_normals=True, export_vertex_color='ACTIVE', export_all_vertex_colors=True,
                          export_materials='NONE', export_apply=True)
print('ok: public/models/tshirt.glb')

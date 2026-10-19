# Gera tools/tee.blend: esqueleto + camiseta encaixada (de tools/out/tshirt_fit.glb ou public/models/tshirt.glb)
import bpy, os
D = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(D, '..', 'public/models/skeleton/skeleton.gltf'))
bpy.data.objects['Icosphere'].hide_set(True); bpy.data.objects['Icosphere'].hide_render = True
bpy.ops.import_scene.gltf(filepath=os.path.join(D, '..', 'public/models/tshirt.glb'))
shirt = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name not in ('Skeleton', 'Icosphere')][0]
shirt.name = 'Shirt'
# deixa o esqueleto travado (só referência) e a camiseta selecionada
for o in ('Skeleton', 'Armature'):
    bpy.data.objects[o].hide_select = True
bpy.context.view_layer.objects.active = shirt; shirt.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D, 'tee.blend'))

# Prende a camiseta nos ossos do esqueleto (pesos automáticos do Blender) e salva no próprio .blend.
# Uso: blender -b tools/teefixed.blend -P tools/rig_tee.py
# Depois disso dá pra posar o esqueleto (Pose Mode na Armature) e ver a camiseta acompanhando.
import bpy
KEEP = {'Torso', 'Shoulder.L', 'Shoulder.R', 'UpperArm.L', 'UpperArm.R', 'LowerArm.L', 'LowerArm.R'}
sh = bpy.data.objects['Shirt']; arm = bpy.data.objects['Armature']
for o in (sh, arm): o.hide_select = False; o.hide_set(False)
if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
# começa limpo
sh.vertex_groups.clear()
for m in [m for m in sh.modifiers if m.type == 'ARMATURE']: sh.modifiers.remove(m)
sh.parent = None
# pesos automáticos ("bone heat"); se falhar (malha aberta), cai pra envelope por distância
bpy.ops.object.select_all(action='DESELECT'); sh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO', keep_transform=True)
used = {g.name for g in sh.vertex_groups if any(any(e.group == g.index and e.weight > 0.01 for e in v.groups) for v in sh.data.vertices)}
print('RIG auto groups with weight:', sorted(used))
if not used & KEEP:
    print('RIG bone heat falhou, usando distância')
    sh.vertex_groups.clear()
    bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE', keep_transform=True)
# só os ossos que vestem camiseta; o resto sai e os pesos são normalizados
for g in list(sh.vertex_groups):
    if g.name not in KEEP: sh.vertex_groups.remove(g)
for n in KEEP:  # os dois lados existem (o Mirror troca .R ↔ .L nos pesos espelhados)
    if n not in sh.vertex_groups: sh.vertex_groups.new(name=n)
torso = sh.vertex_groups['Torso']
# Osso do braço só manda na manga: a cor 'Col'.r (1 = manga, 0 = corpo) limita o peso dos ossos do braço,
# senão a lateral do corpo sob a axila vai junto quando o braço abre
col = sh.data.color_attributes.get('Col')
armg = {sh.vertex_groups[n].index for n in KEEP if n.startswith(('UpperArm', 'LowerArm'))}
def ss(x, a, b):
    t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
for v in sh.data.vertices:
    lim = ss(col.data[v.index].color[0], 0.15, 0.85) if col else 1
    for e in v.groups:
        if e.group in armg: e.weight *= lim
for v in sh.data.vertices:
    tot = sum(e.weight for e in v.groups)
    if tot < 1e-4: torso.add([v.index], 1.0, 'REPLACE'); continue
    for e in v.groups: e.weight /= tot
# ordem: espelha primeiro, depois deforma
mods = sh.modifiers
am = [m for m in mods if m.type == 'ARMATURE'][0]
while mods.find(am.name) < len(mods) - 1: bpy.ops.object.modifier_move_down({'object': sh}, modifier=am.name) if False else mods.move(mods.find(am.name), len(mods) - 1)
for m in mods:
    if m.type == 'MIRROR': m.use_mirror_vertex_groups = True
print('RIG mods', [m.type for m in mods], 'groups', [g.name for g in sh.vertex_groups])
arm.hide_select = True
bpy.ops.object.select_all(action='DESELECT'); sh.select_set(True); bpy.context.view_layer.objects.active = sh
bpy.ops.wm.save_mainfile()

# Готовит эльфа для браузера: убирает лишнее, запекает модификаторы, привязывает доспехи к костям,
# упрощает материалы MPFB, ужимает текстуры и пишет GLB. Исходный .blend не сохраняется.
import bpy,json,sys
OUT=sys.argv[sys.argv.index('--')+1]
D=bpy.data;dg=bpy.context.evaluated_depsgraph_get
rig=D.objects['Elf.body.rig']
log={}
for n in ['Camera','Light','Key','Fill','Rim','EmberLight','SmokeVolume','Elf.teeth_base','Elf.tongue01']:
    if n in D.objects: D.objects.remove(D.objects[n],do_unlink=True)

def bake(o,keep_armature=False):
    arm=[m for m in o.modifiers if m.type=='ARMATURE']
    for m in arm: m.show_viewport=False
    if o.type=='MESH' and o.data.shape_keys: pass
    ev=o.evaluated_get(dg())
    me=D.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg())
    if o.type=='MESH':
        o.data=me
        for m in list(o.modifiers):
            if m.type!='ARMATURE': o.modifiers.remove(m)
        for m in arm: m.show_viewport=True
        return o
    nob=D.objects.new(o.name+'_mesh',me);nob.matrix_world=o.matrix_world.copy()
    for c in o.users_collection: c.objects.link(nob)
    D.objects.remove(o,do_unlink=True);return nob

# тело и костюм: маски и сабдив запекаются, скелет остаётся
for n in ['Elf.body','Elf.male_casualsuit04']:
    o=D.objects[n];bake(o);log[n]=len(o.data.polygons)
for n in ['Elf.eyebrow010','Elf.eyelashes02','Elf.high-poly','Elf.long01']:
    o=D.objects[n]
    if o.data.shape_keys: o.shape_key_clear()
    for m in list(o.modifiers): o.modifiers.remove(m)
# доспехи и сигарета: запечь и посадить на кости
B=lambda b:b if b in rig.data.bones else 'spine01'
attach={'Breastplate':'spine02','Emblem':'spine02','EmblemWingL':'spine02','EmblemWingR':'spine02',
  'Pauldron_L_0':'shoulder01.L','Pauldron_L_1':'shoulder01.L','Pauldron_L_2':'shoulder01.L',
  'Pauldron_R_0':'shoulder01.R','Pauldron_R_1':'shoulder01.R','Pauldron_R_2':'shoulder01.R',
  'CigFilter':'head','CigBody':'head','CigEmber':'head','CigAsh':'head'}
for n in list(attach)+[n+'_Trim' for n in attach if n.startswith(('Breastplate','Pauldron'))]:
    if n not in D.objects: continue
    o=D.objects[n];bone=attach.get(n,attach.get(n.replace('_Trim','')))
    o=bake(o);mw=o.matrix_world.copy()
    o.parent=rig;o.parent_type='BONE';o.parent_bone=B(bone);o.matrix_world=mw
    log[o.name]=[bone,len(o.data.polygons)]
for o in D.objects:
    if o.type=='CURVE': D.objects.remove(o,do_unlink=True)

# материалы MPFB → простой Principled с картинкой
def simple(m,img=None,normal=None,rough=.6,alpha=False,color=None):
    nt=m.node_tree;nt.nodes.clear();out=nt.nodes.new('ShaderNodeOutputMaterial');bs=nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bs.outputs[0],out.inputs[0]);bs.inputs['Roughness'].default_value=rough
    if color: bs.inputs['Base Color'].default_value=color
    if img:
        t=nt.nodes.new('ShaderNodeTexImage');t.image=D.images[img];nt.links.new(t.outputs['Color'],bs.inputs['Base Color'])
        if alpha: nt.links.new(t.outputs['Alpha'],bs.inputs['Alpha'])
    if normal:
        t=nt.nodes.new('ShaderNodeTexImage');t.image=D.images[normal];t.image.colorspace_settings.name='Non-Color'
        nm=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(t.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs[0],bs.inputs['Normal'])
simple(D.materials['Elf.body'],'young_lightskinned_male_diffuse.png',rough=.5)
simple(D.materials['Elf.high-poly'],color=(0.12,0.25,0.5,1),rough=.1)
simple(D.materials['Elf.long01'],'long01_diffuse.png',rough=.55,alpha=True)
simple(D.materials['Elf.eyebrow010'],'eyebrow010.png',alpha=True)
simple(D.materials['Elf.eyelashes02'],'eyelashes02.png',alpha=True)
simple(D.materials['Elf.male_casualsuit04'],'male_casualsuit04_diffuse.png','male_casualsuit04_normal.png',rough=.7)
SIZE={'young_lightskinned_male_diffuse.png':1024,'long01_diffuse.png':1024,'male_casualsuit04_diffuse.png':1024,'male_casualsuit04_normal.png':512,'eyebrow010.png':256,'eyelashes02.png':256}
for n,s in SIZE.items():
    im=D.images[n];im.reload();im.scale(s,s);log[n]=list(im.size)

keep=[o for o in D.objects if o.type in('MESH','ARMATURE')]
bpy.ops.object.select_all(action='DESELECT')
for o in keep: o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',use_selection=True,export_apply=False,export_animations=False,export_morph=False,
  export_yup=True,export_image_format='WEBP',export_image_quality=82,export_texcoords=True,export_normals=True,export_tangents=False,export_skins=True,export_cameras=False,export_lights=False)
log['objects']=[o.name for o in keep];log['tris']=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in keep if o.type=='MESH')
open(OUT+'.json','w').write(json.dumps(log,indent=0))

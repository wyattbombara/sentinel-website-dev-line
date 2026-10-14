"""Author Sentinel's still environment using the supplied mask geometry.
Run in portable Blender: blender --background --threads 2 --python design/render-scene.py
"""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'img' / 'scene'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.threads_mode = 'FIXED'
scene.render.threads = 2
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.006, .008, .01)

def material(name, color, metal=0, rough=.4):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    return mat

mask_mat = material('Graphite ceramic / amber reflection', (.11,.12,.14), .72, .27)
floor_mat = material('Obsidian ground', (.014,.019,.023), .48, .35)
fragment_mat = material('Disguise fragments', (.035,.044,.049), .65, .25)
ring_mat = material('Brushed amber', (.3,.14,.035), .8, .34)

bpy.ops.import_scene.gltf(filepath=str(ROOT / 'assets/models/scam.glb'))
meshes = [o for o in scene.objects if o.type == 'MESH']
corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
lo = Vector(tuple(min(c[i] for c in corners) for i in range(3)))
hi = Vector(tuple(max(c[i] for c in corners) for i in range(3)))
center = (lo + hi)/2
scale = 3.1 / max((hi - lo).z, .01)
bpy.ops.object.empty_add(type='PLAIN_AXES')
mask_rig = bpy.context.object
mask_rig.name = 'Sentinel mask / supplied geometry'
for obj in meshes:
    world = obj.matrix_world.copy()
    obj.parent = mask_rig
    obj.matrix_world = world
    obj.data.materials.clear()
    obj.data.materials.append(mask_mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
mask_rig.scale = (scale,scale,scale)
mask_rig.location = Vector((2.05,0,1.0)) - center*scale
mask_rig.rotation_euler = (math.radians(-8), math.radians(-13), math.radians(-12))

bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-1.1))
ground = bpy.context.object
ground.name = 'Quiet reflective ground'
ground.data.materials.append(floor_mat)

random.seed(13)
for i in range(9):
    x = 3.4 + random.uniform(-.15,2.3)
    y = random.uniform(.3,2.2)
    z = random.uniform(-.6,2.6)
    size = random.uniform(.13,.48)
    vertices = [(-size,0,-size*.5),(size,0,0),(size*.3,.07,size),(-size*.3,.08,size*.4)]
    mesh = bpy.data.meshes.new(f'Disguise shard {i+1:02}')
    mesh.from_pydata(vertices, [], [(0,1,2),(0,2,3),(3,2,1),(3,1,0)])
    obj = bpy.data.objects.new(mesh.name,mesh)
    scene.collection.objects.link(obj)
    obj.location = (x,y,z)
    obj.rotation_euler = tuple(random.uniform(-.6,.6) for _ in range(3))
    obj.data.materials.append(fragment_mat)
    bevel = obj.modifiers.new('Fine edge','BEVEL')
    bevel.width=.008
    bevel.segments=2

for radius, thickness in [(2.7,.009),(2.95,.004)]:
    bpy.ops.mesh.primitive_torus_add(major_radius=radius,minor_radius=thickness,major_segments=128,minor_segments=6,location=(2.05,.6,-1.088))
    bpy.context.object.name = 'Trace / ground reflection'
    bpy.context.object.data.materials.append(ring_mat)

def light(name, location, energy, color, size, target):
    data = bpy.data.lights.new(name,'AREA')
    data.energy=energy
    data.color=color
    data.shape='DISK'
    data.size=size
    obj = bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=location
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

key = light('Amber / reveal', (0,-3,4.5), 950, (1,.44,.1), 4, (2,0,1))
rim = light('Cool / silhouette', (4,2.5,3.5), 1300, (.38,.69,1), 3, (2,0,1))
fill = light('Soft front', (2,-4,2.6), 220, (.77,.84,1), 3, (2,0,1))
edge = light('Warm edge', (6,-1,1), 500, (1,.53,.2), 2, (2,0,1))
bpy.ops.object.camera_add()
camera=bpy.context.object
camera.name='Sentinel composition / desktop'
scene.camera=camera
camera.data.type='ORTHO'
camera.data.lens=50

def compose(portrait):
    if portrait:
        camera.location=(2.3,-10,3.2)
        target=Vector((2.1,0,.6))
        camera.data.ortho_scale=7.5
        scene.render.resolution_x=900
        scene.render.resolution_y=1200
    else:
        camera.location=(0,-10,3.0)
        target=Vector((.1,0,.6))
        camera.data.ortho_scale=10.3
        scene.render.resolution_x=1600
        scene.render.resolution_y=1000
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_percentage=100

for theme in ['dark','light']:
    if theme=='light':
        floor_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.62,.61,.55,1)
        floor_mat.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.12
        mask_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.37,.39,.4,1)
        fragment_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.22,.24,.26,1)
        scene.world.color=(.2,.2,.2)
        key.data.energy=700
        key.data.color=(1,.82,.55)
        rim.data.energy=700
        fill.data.energy=500
    for portrait in [False,True]:
        compose(portrait)
        name=f'sentinel-{theme}-{"portrait" if portrait else "desktop"}'
        scene.render.filepath=str(OUT / f'{name}.png')
        if theme=='dark' and not portrait:
            bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'design/sentinel-reveal.blend'))
        bpy.ops.render.render(write_still=True)
print('Sentinel authored environment rendered in both themes and orientations.')

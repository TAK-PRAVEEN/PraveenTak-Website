"""
Matte stone that disintegrates into grains (ref: dark rock sphere with sparkle).
Frame 1 = solid rock, last frame = fully scattered dust. The site plays the
sequence forward on hover and backward on leave (slowly).

  "D:/Blender/blender-5.2.2-windows-x64/blender.exe" -b --factory-startup \
      --python scripts/render-rock.py -- --frames 48 --size 720 --out scratch/rock/rock_

Geometry Nodes: rock faces dissolve at random while grains distributed on the
surface fly outward along their normals with a little turbulence.
"""

import argparse
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--frames", type=int, default=48)
ap.add_argument("--size", type=int, default=720)
ap.add_argument("--samples", type=int, default=64)
ap.add_argument("--only", type=str, default="", help="comma list of frames to render (test)")
a = ap.parse_args(argv)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.refresh_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
sc.cycles.device = "GPU"
sc.cycles.samples = a.samples
sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = a.size
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_mode = "RGBA"
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = "AgX - Medium High Contrast"

# ---------- rock mesh: lumpy, faceted ----------
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=6, radius=1.0)
rock = bpy.context.active_object
for name, kind, scale, strength in [("lumps", "CLOUDS", 0.8, 0.32), ("facets", "VORONOI", 0.45, 0.06), ("grit", "CLOUDS", 0.12, 0.012)]:
    t = bpy.data.textures.new(name, type=kind)
    t.noise_scale = scale
    m = rock.modifiers.new(name, "DISPLACE")
    m.texture, m.strength = t, strength
bpy.ops.object.modifier_apply(modifier="lumps")
bpy.ops.object.modifier_apply(modifier="facets")
bpy.ops.object.modifier_apply(modifier="grit")
bpy.ops.object.shade_smooth()
rock.rotation_euler = (math.radians(14), math.radians(-18), math.radians(8))

# ---------- material: matte charcoal with fine sparkle ----------
mat = bpy.data.materials.new("Stone")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.022, 0.022, 0.024, 1)
bsdf.inputs["Roughness"].default_value = 0.88
spark = nt.nodes.new("ShaderNodeTexVoronoi")
spark.inputs["Scale"].default_value = 260.0
dist = nt.nodes.new("ShaderNodeMath")
dist.operation = "LESS_THAN"
dist.inputs[1].default_value = 0.09
nt.links.new(spark.outputs["Distance"], dist.inputs[0])
bsdf.inputs["Emission Color"].default_value = (1, 1, 1, 1)
emis = nt.nodes.new("ShaderNodeMath")
emis.operation = "MULTIPLY"
emis.inputs[1].default_value = 4.0
nt.links.new(dist.outputs[0], emis.inputs[0])
nt.links.new(emis.outputs[0], bsdf.inputs["Emission Strength"])
rock.data.materials.append(mat)

# ---------- geometry nodes: dissolve + grains ----------
ng = bpy.data.node_groups.new("Disintegrate", "GeometryNodeTree")
ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
N = ng.nodes
L = ng.links
gi = N.new("NodeGroupInput")
go = N.new("NodeGroupOutput")
val = N.new("ShaderNodeValue")  # scatter 0..1 (animated)
val.name = "Scatter"

# rock faces vanish at random as scatter rises
rnd_face = N.new("FunctionNodeRandomValue")
rnd_face.data_type = "FLOAT"
rnd_face.inputs["Seed"].default_value = 3
thr = N.new("ShaderNodeMath"); thr.operation = "MULTIPLY"; thr.inputs[1].default_value = 1.35
L.new(val.outputs[0], thr.inputs[0])
lt = N.new("ShaderNodeMath"); lt.operation = "LESS_THAN"
L.new(rnd_face.outputs["Value"], lt.inputs[0]); L.new(thr.outputs[0], lt.inputs[1])
dele = N.new("GeometryNodeDeleteGeometry"); dele.domain = "FACE"
L.new(gi.outputs[0], dele.inputs["Geometry"]); L.new(lt.outputs[0], dele.inputs["Selection"])

# grains on the surface
dist_n = N.new("GeometryNodeDistributePointsOnFaces")
dist_n.inputs["Density"].default_value = 1700.0
L.new(gi.outputs[0], dist_n.inputs["Mesh"])
rnd_amt = N.new("FunctionNodeRandomValue"); rnd_amt.data_type = "FLOAT"
rnd_amt.inputs["Min"].default_value = 0.15; rnd_amt.inputs["Max"].default_value = 0.85; rnd_amt.inputs["Seed"].default_value = 11
rnd_vec = N.new("FunctionNodeRandomValue"); rnd_vec.data_type = "FLOAT_VECTOR"
rnd_vec.inputs["Min"].default_value = (-1, -1, -1); rnd_vec.inputs["Max"].default_value = (1, 1, 1); rnd_vec.inputs["Seed"].default_value = 5
# per-grain delay so they peel off progressively: k = clamp(scatter*1.6 - delay)
delay = N.new("FunctionNodeRandomValue"); delay.data_type = "FLOAT"
delay.inputs["Min"].default_value = 0.0; delay.inputs["Max"].default_value = 0.6; delay.inputs["Seed"].default_value = 9
s16 = N.new("ShaderNodeMath"); s16.operation = "MULTIPLY"; s16.inputs[1].default_value = 1.6
L.new(val.outputs[0], s16.inputs[0])
sub = N.new("ShaderNodeMath"); sub.operation = "SUBTRACT"; sub.use_clamp = True
L.new(s16.outputs[0], sub.inputs[0]); L.new(delay.outputs["Value"], sub.inputs[1])
# offset = (normal * amt + rndvec*0.45 + (0,-0.25,0)*k) * k
nscale = N.new("ShaderNodeVectorMath"); nscale.operation = "SCALE"
L.new(dist_n.outputs["Normal"], nscale.inputs[0]); L.new(rnd_amt.outputs["Value"], nscale.inputs["Scale"])
tscale = N.new("ShaderNodeVectorMath"); tscale.operation = "SCALE"; tscale.inputs["Scale"].default_value = 0.25
L.new(rnd_vec.outputs["Value"], tscale.inputs[0])
add = N.new("ShaderNodeVectorMath"); add.operation = "ADD"
L.new(nscale.outputs[0], add.inputs[0]); L.new(tscale.outputs[0], add.inputs[1])
kscale = N.new("ShaderNodeVectorMath"); kscale.operation = "SCALE"
L.new(add.outputs[0], kscale.inputs[0]); L.new(sub.outputs[0], kscale.inputs["Scale"])
setp = N.new("GeometryNodeSetPosition")
L.new(dist_n.outputs["Points"], setp.inputs["Geometry"]); L.new(kscale.outputs[0], setp.inputs["Offset"])

ico = N.new("GeometryNodeMeshIcoSphere"); ico.inputs["Radius"].default_value = 0.011; ico.inputs["Subdivisions"].default_value = 1
gsize = N.new("FunctionNodeRandomValue"); gsize.data_type = "FLOAT"
gsize.inputs["Min"].default_value = 0.5; gsize.inputs["Max"].default_value = 1.4; gsize.inputs["Seed"].default_value = 2
inst = N.new("GeometryNodeInstanceOnPoints")
L.new(setp.outputs[0], inst.inputs["Points"]); L.new(ico.outputs["Mesh"], inst.inputs["Instance"])
L.new(gsize.outputs["Value"], inst.inputs["Scale"])
smat = N.new("GeometryNodeSetMaterial"); smat.inputs["Material"].default_value = mat
L.new(inst.outputs[0], smat.inputs["Geometry"])

join = N.new("GeometryNodeJoinGeometry")
L.new(dele.outputs[0], join.inputs[0]); L.new(smat.outputs[0], join.inputs[0])
L.new(join.outputs[0], go.inputs[0])
mod = rock.modifiers.new("Disintegrate", "NODES")
mod.node_group = ng

# animate scatter 0 -> 1 (ease in/out)
F = a.frames
for f, v in [(1, 0.0), (F, 1.0)]:
    val.outputs[0].default_value = v
    val.outputs[0].keyframe_insert("default_value", frame=f)

# ---------- light: soft studio, upper-left key (matte look) ----------
def area(name, loc, rot, size, energy):
    d = bpy.data.lights.new(name, "AREA"); d.size = size; d.energy = energy
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o)
    o.location = loc; o.rotation_euler = [math.radians(r) for r in rot]

area("Key", (-3.5, -3.0, 3.5), (50, 0, -45), 4.0, 900)
area("Fill", (3.5, -2.5, 0.5), (80, 0, 50), 5.0, 160)
area("Rim", (0.5, 3.5, 2.0), (-60, 0, 180), 3.0, 350)
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.55, 0.55, 0.56, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35

cd = bpy.data.cameras.new("Cam"); cd.lens = 70
cam = bpy.data.objects.new("Cam", cd); bpy.context.collection.objects.link(cam)
cam.location = (0, -10.5, 0.3); cam.rotation_euler = (math.radians(88), 0, 0)
sc.camera = cam

sc.frame_start, sc.frame_end = 1, F
sc.render.filepath = a.out
if a.only:
    for f in [int(x) for x in a.only.split(",")]:
        sc.frame_set(f)
        sc.render.filepath = f"{a.out}{f:04d}"
        bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(animation=True)
print("RENDERED", a.out)

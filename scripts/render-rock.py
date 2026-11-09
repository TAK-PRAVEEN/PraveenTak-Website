"""
About-page rock (ref: Praveen's video): faceted sphere -> lumpy stone -> the
surface peels into particle membranes -> they unfold into ink/smoke wisps.

Deterministic per frame (no cached simulation), so the site can scrub it both
ways: hover plays forward, leaving plays back.

  "D:/Blender/blender-5.2.2-windows-x64/blender.exe" -b --factory-startup \
      --python scripts/render-rock.py -- --frames 60 --size 720 --out scratch/rock/rock_
  # test: specific timeline points T in 0..1
  ... -- --test 0,0.2,0.4,0.6,0.85 --size 400 --out scratch/rockt/r_

Geometry Nodes, driven by one value T (0..1):
  - low-poly ico (T < 0.12) morphs into a displaced stone (0.05..0.25)
  - stone faces dissolve (0.22..0.5) while dense surface points appear
  - points are advected through a chain of noise steps whose strength grows
    with T -> smooth membranes that stretch into curling wisps
  - points thin out at the end (fade)
"""

import argparse
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--frames", type=int, default=60)
ap.add_argument("--size", type=int, default=720)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--points", type=float, default=26000.0, help="surface point density")
ap.add_argument("--test", type=str, default="", help="comma list of T values to render as stills")
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
sc.view_settings.look = "AgX - Base Contrast"

# ---------- materials ----------
def mat_stone():
    m = bpy.data.materials.new("Stone")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.045, 0.045, 0.048, 1)  # dark grey, facets stay visible
    b.inputs["Roughness"].default_value = 0.9
    nt = m.node_tree
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.inputs["Scale"].default_value = 300.0
    lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = 0.08
    mu = nt.nodes.new("ShaderNodeMath"); mu.operation = "MULTIPLY"; mu.inputs[1].default_value = 2.5
    nt.links.new(v.outputs["Distance"], lt.inputs[0]); nt.links.new(lt.outputs[0], mu.inputs[0])
    b.inputs["Emission Color"].default_value = (1, 1, 1, 1)
    nt.links.new(mu.outputs[0], b.inputs["Emission Strength"])
    return m


def mat_ash():
    """Soot particles: dark, partly transparent so overlapping sheets build density."""
    m = bpy.data.materials.new("Ash")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse"); dif.inputs["Color"].default_value = (0.006, 0.006, 0.007, 1)
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader"); mix.inputs["Fac"].default_value = 0.55
    nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(dif.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


STONE, ASH = mat_stone(), mat_ash()

# ---------- base object (geometry is generated in nodes) ----------
bpy.ops.mesh.primitive_plane_add(size=0.01)
obj = bpy.context.active_object
obj.data.materials.append(STONE)
obj.data.materials.append(ASH)

ng = bpy.data.node_groups.new("RockToSmoke", "GeometryNodeTree")
ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
N, L = ng.nodes, ng.links
go = N.new("NodeGroupOutput")
T = N.new("ShaderNodeValue"); T.name = "T"


def mnode(op, a_=None, b_=None, clamp=False):
    n = N.new("ShaderNodeMath"); n.operation = op; n.use_clamp = clamp
    for i, x in enumerate((a_, b_)):
        if x is None:
            continue
        if isinstance(x, (int, float)):
            n.inputs[i].default_value = x
        else:
            L.new(x, n.inputs[i])
    return n.outputs[0]


def ramp(lo, hi):
    """clamp((T - lo) / (hi - lo))"""
    return mnode("MULTIPLY", mnode("SUBTRACT", T.outputs[0], lo), 1.0 / (hi - lo), clamp=True)


def vmath(op, a_, b_=None, scale=None):
    n = N.new("ShaderNodeVectorMath"); n.operation = op
    L.new(a_, n.inputs[0])
    if b_ is not None:
        if isinstance(b_, tuple):
            n.inputs[1].default_value = b_
        else:
            L.new(b_, n.inputs[1])
    if scale is not None:
        if isinstance(scale, (int, float)):
            n.inputs["Scale"].default_value = scale
        else:
            L.new(scale, n.inputs["Scale"])
    return n.outputs[0]


# 1. faceted low-poly sphere, visible only at the very start
ico_lo = N.new("GeometryNodeMeshIcoSphere"); ico_lo.inputs["Radius"].default_value = 1.0; ico_lo.inputs["Subdivisions"].default_value = 2
del_lo = N.new("GeometryNodeDeleteGeometry"); del_lo.domain = "FACE"
L.new(ico_lo.outputs["Mesh"], del_lo.inputs["Geometry"])
L.new(mnode("GREATER_THAN", T.outputs[0], 0.1), del_lo.inputs["Selection"])
flat = N.new("GeometryNodeSetShadeSmooth"); flat.inputs["Shade Smooth"].default_value = False
L.new(del_lo.outputs[0], flat.inputs["Geometry"])

# 2. stone: dense sphere displaced by noise (amount grows 0.05..0.25)
ico = N.new("GeometryNodeMeshIcoSphere"); ico.inputs["Radius"].default_value = 1.0; ico.inputs["Subdivisions"].default_value = 6
pos = N.new("GeometryNodeInputPosition")
nz = N.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 1.6; nz.inputs["Detail"].default_value = 4.0
L.new(pos.outputs[0], nz.inputs["Vector"])
lump = mnode("MULTIPLY", mnode("SUBTRACT", nz.outputs["Fac"], 0.5), ramp(0.04, 0.25))
lump = mnode("MULTIPLY", lump, 0.75)
nrm = N.new("GeometryNodeInputNormal")
setp_rock = N.new("GeometryNodeSetPosition")
L.new(ico.outputs["Mesh"], setp_rock.inputs["Geometry"])
L.new(vmath("SCALE", nrm.outputs[0], scale=lump), setp_rock.inputs["Offset"])
# dissolve rock faces 0.22..0.5 (random order), hidden before the low-poly hands over
rnd = N.new("FunctionNodeRandomValue"); rnd.data_type = "FLOAT"; rnd.inputs["Seed"].default_value = 4
gone = mnode("LESS_THAN", rnd.outputs["Value"], ramp(0.22, 0.5))
before = mnode("LESS_THAN", T.outputs[0], 0.1)
del_rock = N.new("GeometryNodeDeleteGeometry"); del_rock.domain = "FACE"
L.new(setp_rock.outputs[0], del_rock.inputs["Geometry"])
L.new(mnode("MAXIMUM", gone, before), del_rock.inputs["Selection"])
smooth = N.new("GeometryNodeSetShadeSmooth")
L.new(del_rock.outputs[0], smooth.inputs["Geometry"])

# 3. ash points from the stone surface, appearing from 0.2
dist = N.new("GeometryNodeDistributePointsOnFaces")
dist.inputs["Density"].default_value = a.points
L.new(setp_rock.outputs[0], dist.inputs["Mesh"])
appear = mnode("LESS_THAN", N.new("FunctionNodeRandomValue").outputs["Value"], ramp(0.18, 0.42))
# advection: 8 chained noise steps, strength grows with T (membranes -> wisps)
flow = ramp(0.22, 1.0)
flow = mnode("POWER", flow, 1.3)
geo = dist.outputs["Points"]
for k in range(12):
    p = N.new("GeometryNodeInputPosition")
    n = N.new("ShaderNodeTexNoise")
    n.noise_dimensions = "4D"
    n.inputs["Scale"].default_value = 0.3 * (1.18 ** k)  # big sheets first, then finer curls
    n.inputs["Detail"].default_value = 1.0
    n.inputs["W"].default_value = k * 1.7
    L.new(p.outputs[0], n.inputs["Vector"])
    v = vmath("SUBTRACT", n.outputs["Color"], (0.5, 0.5, 0.5))
    v = vmath("ADD", v, (0.0, 0.0, 0.025))  # gentle rise, like smoke
    off = vmath("SCALE", v, scale=mnode("MULTIPLY", flow, 3.4 / (1.0 + 0.12 * k)))
    sp = N.new("GeometryNodeSetPosition")
    L.new(geo, sp.inputs["Geometry"]); L.new(off, sp.inputs["Offset"])
    geo = sp.outputs[0]
# keep only appeared points; thin out at the end
rfade = N.new("FunctionNodeRandomValue"); rfade.data_type = "FLOAT"; rfade.inputs["Seed"].default_value = 21
fade = mnode("LESS_THAN", rfade.outputs["Value"], ramp(0.7, 1.0))
hide = mnode("MAXIMUM", mnode("SUBTRACT", 1.0, appear), fade)
del_pts = N.new("GeometryNodeDeleteGeometry"); del_pts.domain = "POINT"
L.new(geo, del_pts.inputs["Geometry"]); L.new(hide, del_pts.inputs["Selection"])
rad = N.new("GeometryNodeSetPointRadius"); rad.inputs["Radius"].default_value = 0.0035
L.new(del_pts.outputs[0], rad.inputs["Points"])
m_ash = N.new("GeometryNodeSetMaterial"); m_ash.inputs["Material"].default_value = ASH
L.new(rad.outputs[0], m_ash.inputs["Geometry"])
m_st = N.new("GeometryNodeSetMaterial"); m_st.inputs["Material"].default_value = STONE
join_st = N.new("GeometryNodeJoinGeometry")
L.new(flat.outputs[0], join_st.inputs[0]); L.new(smooth.outputs[0], join_st.inputs[0])
L.new(join_st.outputs[0], m_st.inputs["Geometry"])

join = N.new("GeometryNodeJoinGeometry")
L.new(m_st.outputs[0], join.inputs[0]); L.new(m_ash.outputs[0], join.inputs[0])
L.new(join.outputs[0], go.inputs[0])
mod = obj.modifiers.new("RockToSmoke", "NODES")
mod.node_group = ng
obj.rotation_euler = (math.radians(15), math.radians(-20), 0)

# ---------- studio light (matte grey look from the ref) ----------
def area(name, loc, rot, size, energy):
    d = bpy.data.lights.new(name, "AREA"); d.size = size; d.energy = energy
    o = bpy.data.objects.new(name, d); bpy.context.collection.objects.link(o)
    o.location = loc; o.rotation_euler = [math.radians(r) for r in rot]

area("Key", (-3.5, -3.5, 4.0), (48, 0, -42), 5.0, 1100)
area("Fill", (4.0, -3.0, 0.5), (80, 0, 52), 6.0, 260)
area("Top", (0, 0, 6), (0, 0, 0), 5.0, 300)
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.6, 0.6, 0.61, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45

cd = bpy.data.cameras.new("Cam"); cd.lens = 60
cam = bpy.data.objects.new("Cam", cd); bpy.context.collection.objects.link(cam)
cam.location = (0, -9.0, 0.3); cam.rotation_euler = (math.radians(88), 0, 0)
sc.camera = cam

if a.test:
    for i, t in enumerate(float(x) for x in a.test.split(",")):
        T.outputs[0].default_value = t
        sc.render.filepath = f"{a.out}{i:02d}"
        bpy.ops.render.render(write_still=True)
else:
    F = a.frames
    sc.frame_start, sc.frame_end = 1, F
    for f in range(1, F + 1):
        T.outputs[0].default_value = (f - 1) / (F - 1)
        T.outputs[0].keyframe_insert("default_value", frame=f)
    sc.render.filepath = a.out
    bpy.ops.render.render(animation=True)
print("RENDERED", a.out)

"""Share-card laptop: procedural laptop on a black plinth with a site screenshot on the screen (transparent PNG).
blender -b -P scripts/og-laptop.py -- <screen.png> <out.png> <W> <H> [samples]   (screen: light-mode hero, 2880x1800, reduced motion)
Then: node scripts/og-compose.mjs <dir with lap-final.png> <out-2x.png>, downscale to public/og.png (1200x630).
"""
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
SCREEN, OUT, W, H = argv[0], argv[1], int(argv[2]), int(argv[3])
SAMPLES = int(argv[4]) if len(argv) > 4 else 128

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def mat(name, color, metal=0.0, rough=0.4, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    if coat:
        p.inputs["Coat Weight"].default_value = coat
    return m


def box(name, size, loc, material, bevel=0.0, segs=6):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width, b.segments, b.limit_method = bevel, segs, "ANGLE"
    o.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return o


alu = mat("alu", (0.045, 0.045, 0.05), metal=1.0, rough=0.28)
dark = mat("deck", (0.02, 0.02, 0.022), rough=0.5)
glass = mat("bezel", (0.004, 0.004, 0.005), rough=0.06, coat=1.0)
plinth = mat("plinth", (0.012, 0.012, 0.013), rough=0.55)

# ---- base (3.04 x 2.12 x 0.14) ----
BW, BD, BH = 3.04, 2.12, 0.14
box("base", (BW, BD, BH), (0, 0, BH / 2), alu, bevel=0.05)
box("deck", (BW - 0.36, BD - 0.9, 0.004), (0, 0.22, BH + 0.001), dark)  # keyboard well
box("pad", (1.1, 0.62, 0.003), (0, -0.62, BH + 0.0005), mat("pad", (0.5, 0.5, 0.52), metal=1, rough=0.35))
# front notch
box("notch", (0.5, 0.06, 0.03), (0, -BD / 2 + 0.02, BH - 0.01), dark)

# ---- lid on a hinge at the back edge ----
LH, LT = 2.02, 0.05
bpy.ops.object.empty_add(location=(0, BD / 2 - 0.04, BH + 0.02))
hinge = bpy.context.object
lid = box("lid", (BW, LT, LH), (0, BD / 2 - 0.04, BH + 0.02 + LH / 2), alu, bevel=0.03)
bez = box("bezel", (BW - 0.04, 0.004, LH - 0.04), (0, BD / 2 - 0.04 - LT / 2 - 0.002, BH + 0.02 + LH / 2), glass)
# screen 16:10
SW, SH = 2.86, 2.86 / 1.6
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, BD / 2 - 0.04 - LT / 2 - 0.0045, BH + 0.02 + LH / 2 - 0.02))
scr = bpy.context.object
scr.scale = (SW, SH, 1)
scr.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(scale=True, rotation=True)
sm = bpy.data.materials.new("screen")
sm.use_nodes = True
nt = sm.node_tree
# Screen = the image as pure light (no reflections washing it out), with a faint glass sheen.
nt.nodes.remove(nt.nodes["Principled BSDF"])
em = nt.nodes.new("ShaderNodeEmission")
tex = nt.nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load(SCREEN)
tex.interpolation = "Cubic"
nt.links.new(tex.outputs["Color"], em.inputs["Color"])
em.inputs["Strength"].default_value = 1.0
gl = nt.nodes.new("ShaderNodeBsdfGlossy")
gl.inputs["Roughness"].default_value = 0.08
mix = nt.nodes.new("ShaderNodeMixShader")
mix.inputs[0].default_value = 0.0
nt.links.new(em.outputs[0], mix.inputs[1])
nt.links.new(gl.outputs[0], mix.inputs[2])
nt.links.new(mix.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
scr.data.materials.append(sm)
# UVs of the default plane already map 0..1; plane faces -y after the rotation -> flip so the image reads correctly
for o in (lid, bez, scr):
    o.parent = hinge
    o.matrix_parent_inverse = hinge.matrix_world.inverted()
hinge.rotation_euler = (math.radians(-14), 0, 0)  # open ~104 deg

# ---- plinth ----
box("plinth", (5.4, 3.6, 2.4), (0.6, 0.2, -1.2), plinth, bevel=0.01, segs=2)

# ---- lights ----
def area(name, loc, target, size, energy, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object
    l.data.size, l.data.energy, l.data.color = size, energy, color
    d = Vector(target) - Vector(loc)
    l.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return l

area("key", (-5, -4, 7), (0, 0, 0.8), 5, 900)
area("rim", (-5, 4, 3), (0, 0.8, 1), 4, 3000, (1.0, 0.36, 0.12))
area("rim2", (5, 3.5, 2.5), (0, 0.8, 1), 3, 1200, (1.0, 0.45, 0.2))  # orange rim (site accent)
area("fill", (6, -3, 2), (0, 0, 1), 6, 250)
area("top", (0, -1, 8), (0, 0, 0), 4, 300)

w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.055, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.35

# ---- camera ----
bpy.ops.object.camera_add(location=(3.3, -6.6, 0.75))
cam = bpy.context.object
cam.data.lens = 50
d = Vector((0.15, 0.4, 1.05)) - cam.location
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
sc.camera = cam

r = sc.render
r.engine = "CYCLES"
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices:
                    d.use = True
                sc.cycles.device = "GPU"
                print("GPU:", kind)
                break
        except Exception:
            pass
except Exception:
    pass
r.film_transparent = True
r.resolution_x, r.resolution_y, r.resolution_percentage = W, H, 100
sc.view_settings.view_transform = "Standard"
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.filepath = OUT
bpy.ops.render.render(write_still=True)
print("DONE", OUT)

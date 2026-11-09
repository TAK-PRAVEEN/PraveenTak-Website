"""
Render a liquid-chrome sculpture with Blender (headless, Cycles on GPU).

  "D:/Blender/blender-5.2.2-windows-x64/blender.exe" -b --factory-startup \
      --python scripts/render-sculpture.py -- --tint "#A78BFA" --out public/media/sculpture-lavender.png

Produces a transparent PNG (studio-lit chrome with thin-film iridescence) that
the site can place over Paper or Ink. Everything is procedural: no HDRI or
model files needed. DESIGN.md §7 (3D production).
"""

import argparse
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--tint", default="#A78BFA")
ap.add_argument("--out", required=True)
ap.add_argument("--size", type=int, default=1600)
ap.add_argument("--samples", type=int, default=192)
ap.add_argument("--seed", type=int, default=7)
a = ap.parse_args(argv)


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb) + (1.0,)


# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.refresh_devices()
for d in prefs.devices:
    d.use = d.type in ("OPTIX",)
scene.cycles.device = "GPU"
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = a.size
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"

# ---------- sculpture: a sphere melted by layered noise ----------
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1.0)
obj = bpy.context.active_object
obj.scale = (1.35, 0.9, 1.0)
for i, (size, strength) in enumerate([(1.4, 0.55), (0.55, 0.16)]):
    tex = bpy.data.textures.new(f"melt{i}", type="CLOUDS")
    tex.noise_scale = size
    tex.noise_depth = 2
    tex.noise_basis = "BLENDER_ORIGINAL"
    mod = obj.modifiers.new(f"Displace{i}", "DISPLACE")
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = 0.5
    mod.texture_coords = "LOCAL"
twist = obj.modifiers.new("Twist", "SIMPLE_DEFORM")
twist.deform_method = "TWIST"
twist.angle = math.radians(70)
twist.deform_axis = "Z"
obj.modifiers.new("Smooth", "SUBSURF").levels = 2
bpy.ops.object.shade_smooth()
obj.rotation_euler = (math.radians(18), math.radians(-12), math.radians(28))

mat = bpy.data.materials.new("LiquidChrome")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = hex_rgb(a.tint)
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.07
if "Thin Film Thickness" in bsdf.inputs:  # Blender 4.2+: soap-film iridescence
    bsdf.inputs["Thin Film Thickness"].default_value = 420.0
    bsdf.inputs["Thin Film IOR"].default_value = 1.45
obj.data.materials.append(mat)

# ---------- studio light: softboxes give chrome its long highlights ----------
def softbox(name, loc, rot, size, energy, color=(1, 1, 1)):
    bpy.ops.object.light_add(type="AREA", location=loc, rotation=[math.radians(r) for r in rot])
    L = bpy.context.active_object
    L.name = name
    L.data.shape = "RECTANGLE"
    L.data.size, L.data.size_y = size
    L.data.energy = energy
    L.data.color = color
    return L

softbox("Key", (3.5, -3.0, 3.0), (55, 0, 50), (4.0, 1.2), 900)
softbox("Rim", (-3.5, 2.5, 1.5), (70, 0, -130), (5.0, 0.6), 700)
softbox("Top", (0, 0, 5), (0, 0, 0), (3.0, 3.0), 350)
softbox("Fill", (-2.5, -4.0, -1.0), (100, 0, -30), (3.0, 3.0), 160, color=hex_rgb(a.tint)[:3])

# World: soft grey gradient so the metal has something to reflect (not visible: film is transparent).
world = bpy.data.worlds.new("Studio")
scene.world = world
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes["Background"]
grad = nt.nodes.new("ShaderNodeTexGradient")
ramp = nt.nodes.new("ShaderNodeValToRGB")
coord = nt.nodes.new("ShaderNodeTexCoord")
mapping = nt.nodes.new("ShaderNodeMapping")
mapping.inputs["Rotation"].default_value = (0, math.radians(90), 0)
ramp.color_ramp.elements[0].color = (0.02, 0.02, 0.025, 1)
ramp.color_ramp.elements[1].color = (0.85, 0.85, 0.86, 1)
nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
nt.links.new(mapping.outputs["Vector"], grad.inputs["Vector"])
nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.8

# ---------- camera ----------
bpy.ops.object.camera_add(location=(0, -6.2, 0.6), rotation=(math.radians(85), 0, 0))
cam = bpy.context.active_object
cam.data.lens = 70
scene.camera = cam

scene.render.filepath = a.out
bpy.ops.render.render(write_still=True)
print("RENDERED", a.out)

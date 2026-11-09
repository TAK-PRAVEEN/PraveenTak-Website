"""
Render liquid-chrome sculptures with Blender (headless, Cycles on GPU/OptiX).

  BLENDER="D:/Blender/blender-5.2.2-windows-x64/blender.exe"
  # still
  $BLENDER -b --factory-startup --python scripts/render-sculpture.py -- \
      --tint "#386BFF" --out public/media/sculpture-blue.png
  # 90-frame turntable (frames -> out_####.png), for scroll-scrubbed rotation
  $BLENDER -b --factory-startup --python scripts/render-sculpture.py -- \
      --tint "#386BFF" --frames 90 --size 900 --out "scratch/turn/blue_"
  # 3D chrome lettering
  $BLENDER -b --factory-startup --python scripts/render-sculpture.py -- \
      --shape text --text "PT" --tint "#FF5A1F" --out public/media/chrome-pt.png

Shapes:
  ribbon  folded liquid ribbon (a twisted, banked loop) — the art-exhibition look
  text    extruded, bevelled 3D lettering in the same material
Everything is procedural: no HDRI or model files. Transparent PNG output so the
site can place renders over Paper or Ink. DESIGN.md §7 (3D production).
"""

import argparse
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--shape", choices=["ribbon", "text"], default="ribbon")
ap.add_argument("--text", default="PT")
ap.add_argument("--tint", default="#A78BFA")
ap.add_argument("--out", required=True)
ap.add_argument("--size", type=int, default=1600)
ap.add_argument("--samples", type=int, default=160)
ap.add_argument("--frames", type=int, default=0, help="render an N-frame 360° turntable instead of a still")
ap.add_argument("--seed", type=int, default=7)
a = ap.parse_args(argv)


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb) + (1.0,)


TINT = hex_rgb(a.tint)

# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.refresh_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"
scene.cycles.samples = a.samples
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = scene.render.resolution_y = a.size
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"


# ---------- material: tinted liquid chrome with soap-film iridescence ----------
def chrome_material():
    mat = bpy.data.materials.new("LiquidChrome")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    # Facing ratio: pale core, saturated tint toward the silhouette (like the reference).
    fres = nodes.new("ShaderNodeLayerWeight")
    fres.inputs["Blend"].default_value = 0.35
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = tuple(0.55 + 0.45 * c for c in TINT[:3]) + (1,)
    ramp.color_ramp.elements[1].color = TINT
    links.new(fres.outputs["Facing"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.05
    if "Thin Film Thickness" in bsdf.inputs:
        bsdf.inputs["Thin Film Thickness"].default_value = 380.0
        bsdf.inputs["Thin Film IOR"].default_value = 1.4
    return mat


def ribbon():
    """A banked, self-crossing loop extruded into a thick ribbon, then melted."""
    curve = bpy.data.curves.new("ribbon", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 48
    spline = curve.splines.new("NURBS")
    n = 18
    spline.points.add(n - 1)
    for i in range(n):
        t = i / n * math.tau
        r = 1.15 + 0.35 * math.sin(2 * t)
        x = r * math.cos(t)
        y = 0.85 * r * math.sin(t)
        z = 0.75 * math.sin(3 * t + 0.6)
        spline.points[i].co = (x, y, z, 1)
        spline.points[i].tilt = 2.2 * math.sin(t * 1.5) + t * 0.5
    spline.use_cyclic_u = True
    spline.order_u = 4
    curve.extrude = 0.42
    curve.bevel_depth = 0.07
    curve.bevel_resolution = 6
    curve.twist_mode = "MINIMUM"
    obj = bpy.data.objects.new("Sculpture", curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    solid = obj.modifiers.new("Thick", "SOLIDIFY")
    solid.thickness = 0.06
    tex = bpy.data.textures.new("melt", type="CLOUDS")
    tex.noise_scale = 0.9
    disp = obj.modifiers.new("Melt", "DISPLACE")
    disp.texture = tex
    disp.strength = 0.12
    obj.modifiers.new("Smooth", "SUBSURF").levels = 2
    bpy.ops.object.shade_smooth()
    obj.rotation_euler = (math.radians(58), math.radians(-8), math.radians(24))
    return obj


def text_object():
    curve = bpy.data.curves.new("type", "FONT")
    curve.body = a.text
    for f in ("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        try:
            curve.font = bpy.data.fonts.load(f)
            break
        except RuntimeError:
            continue
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.extrude = 0.22
    curve.bevel_depth = 0.035
    curve.bevel_resolution = 5
    curve.size = 1.9
    obj = bpy.data.objects.new("Sculpture", curve)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler = (math.radians(78), math.radians(0), math.radians(-14))
    return obj


obj = ribbon() if a.shape == "ribbon" else text_object()
obj.data.materials.append(chrome_material())

# Pivot for the turntable: parent the sculpture so its own tilt is preserved.
pivot = bpy.data.objects.new("Pivot", None)
bpy.context.collection.objects.link(pivot)
obj.parent = pivot


# ---------- studio light: long softboxes draw chrome's flowing highlights ----------
def softbox(name, loc, rot, size, energy, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.shape = "RECTANGLE"
    data.size, data.size_y = size
    data.energy = energy
    data.color = color
    L = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(L)
    L.location = loc
    L.rotation_euler = [math.radians(r) for r in rot]


softbox("Key", (3.6, -3.2, 3.2), (52, 0, 48), (5.0, 0.8), 1100)
softbox("Strip", (-4.0, -1.0, 2.4), (62, 0, -70), (6.0, 0.35), 900)
softbox("Top", (0, 0.5, 5.0), (0, 0, 0), (3.5, 3.5), 380)
softbox("Tint", (-2.6, -3.8, -1.6), (105, 0, -32), (3.0, 3.0), 260, color=TINT[:3])
softbox("Back", (0.5, 4.5, 1.0), (-75, 0, 180), (6.0, 1.0), 500)

# World: dark-to-light gradient the metal can reflect (film is transparent, so it never shows).
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
ramp.color_ramp.elements[0].color = (0.015, 0.015, 0.02, 1)
ramp.color_ramp.elements[1].color = (0.9, 0.9, 0.92, 1)
nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
nt.links.new(mapping.outputs["Vector"], grad.inputs["Vector"])
nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.9

# ---------- camera ----------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 62
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (0, -7.2, 0.5)
cam.rotation_euler = (math.radians(86), 0, 0)
scene.camera = cam

if a.frames > 0:
    scene.frame_start, scene.frame_end = 1, a.frames
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert("rotation_euler", frame=1)
    pivot.rotation_euler = (0, 0, math.tau * a.frames / (a.frames + 1))
    pivot.keyframe_insert("rotation_euler", frame=a.frames)
    for fc in pivot.animation_data.action.fcurves if hasattr(pivot.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    scene.render.filepath = a.out
    bpy.ops.render.render(animation=True)
else:
    scene.render.filepath = a.out
    bpy.ops.render.render(write_still=True)
print("RENDERED", a.out)

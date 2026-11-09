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
ap.add_argument("--shape", choices=["ribbon", "text", "orb"], default="ribbon")
ap.add_argument("--text", default="PT")
ap.add_argument("--tint", default="#A78BFA")
ap.add_argument("--out", required=True)
ap.add_argument("--size", type=int, default=1600)
ap.add_argument("--samples", type=int, default=160)
ap.add_argument("--frames", type=int, default=0, help="render an N-frame 360° turntable instead of a still")
ap.add_argument("--spin", choices=["turntable", "bangle"], default="turntable",
                help="turntable: rotate about the world vertical; bangle: the ring revolves about its own axis, like a bracelet on a wrist")
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--orb-style", choices=["chrome", "glass"], default="chrome")
ap.add_argument("--wavy", type=int, default=0, help="1 = wavy liquid silhouette on the glass orb")
ap.add_argument("--wires", type=int, default=0, help="glowing filament strands inside the orb (ref: wire sphere)")
ap.add_argument("--core", type=float, default=0.55, help="how pale the facing core is (1 = white, 0 = full tint)")
ap.add_argument("--film", type=float, default=380.0, help="thin-film thickness in nm (0 = off; it shifts hues toward blue)")
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
    ramp.color_ramp.elements[0].color = tuple(a.core + (1 - a.core) * c for c in TINT[:3]) + (1,)
    ramp.color_ramp.elements[1].color = TINT
    links.new(fres.outputs["Facing"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 1.0
    bsdf.inputs["Roughness"].default_value = 0.05
    if "Thin Film Thickness" in bsdf.inputs and a.film > 0:
        bsdf.inputs["Thin Film Thickness"].default_value = a.film
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


FLOW = None  # empty whose orbit drives the orb's flowing surface (loops seamlessly)


def orb():
    """Orb in two styles (refs: liquid chrome ball / glass bubble orb).
    chrome: smooth large liquid waves, silver. glass: clear smoky glass with bubble craters."""
    global FLOW
    bpy.ops.mesh.primitive_uv_sphere_add(segments=160, ring_count=80, radius=1.15)
    o = bpy.context.active_object
    FLOW = bpy.data.objects.new("Flow", None)
    bpy.context.collection.objects.link(FLOW)
    if a.orb_style == "chrome":
        # Crinkled liquid (ref B): soft marble ripples on a slow swell.
        t = bpy.data.textures.new("ripples", type="MARBLE")
        t.marble_type, t.noise_basis_2 = "SHARP", "SIN"
        t.noise_scale, t.turbulence, t.noise_depth = 0.42, 4.0, 1
        d = o.modifiers.new("Ripples", "DISPLACE")
        d.texture, d.texture_coords, d.texture_coords_object = t, "OBJECT", FLOW
        d.strength, d.mid_level = 0.075, 0.5
        t2 = bpy.data.textures.new("swell", type="CLOUDS")
        t2.noise_scale, t2.noise_depth = 0.7, 1
        d2 = o.modifiers.new("Swell", "DISPLACE")
        d2.texture, d2.texture_coords, d2.texture_coords_object = t2, "OBJECT", FLOW
        d2.strength, d2.mid_level = 0.09, 0.5
    else:
        t = bpy.data.textures.new("cells", type="VORONOI")
        t.noise_scale = 0.58
        t.distance_metric = "DISTANCE"
        d = o.modifiers.new("Cells", "DISPLACE")
        d.texture, d.texture_coords = t, "LOCAL"
        d.strength, d.mid_level = -0.085, 0.0
        t2 = bpy.data.textures.new("ripple", type="CLOUDS")
        t2.noise_scale, t2.noise_depth = 0.35, 2
        d2 = o.modifiers.new("Ripple", "DISPLACE")
        d2.texture, d2.texture_coords, d2.texture_coords_object = t2, "OBJECT", FLOW
        d2.strength, d2.mid_level = 0.012, 0.5
        # Wavy, liquid silhouette (ref B's edge) — optional.
        if a.wavy:
            tw = bpy.data.textures.new("edgeSwell", type="CLOUDS")
            tw.noise_scale, tw.noise_depth = 0.7, 1
            dw = o.modifiers.new("EdgeSwell", "DISPLACE")
            dw.texture, dw.texture_coords, dw.texture_coords_object = tw, "OBJECT", FLOW
            dw.strength, dw.mid_level = 0.11, 0.5
            tr = bpy.data.textures.new("edgeRipple", type="MARBLE")
            tr.marble_type, tr.noise_basis_2 = "SOFT", "SIN"
            tr.noise_scale, tr.turbulence, tr.noise_depth = 0.45, 3.0, 1
            dr = o.modifiers.new("EdgeRipple", "DISPLACE")
            dr.texture, dr.texture_coords, dr.texture_coords_object = tr, "OBJECT", FLOW
            dr.strength, dr.mid_level = 0.045, 0.5
    o.modifiers.new("Smooth", "SUBSURF").levels = 2
    bpy.ops.object.shade_smooth()
    o.rotation_euler = (math.radians(18), math.radians(-24), 0)
    return o


WIRES = None


def wires(n, radius=0.98):
    """Glowing filaments swirling inside the sphere: streamlines of a smooth flow field."""
    import random
    global WIRES
    rng = random.Random(a.seed)
    cu = bpy.data.curves.new("wires", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.0009
    cu.bevel_resolution = 1
    # Vortex swirl (ref: wire sphere): strands wrap around a tilted axis and are pulled
    # toward the shell, curving like fingerprint ridges; a twist makes them sweep inward.
    ax = (0.25, 0.35, 0.9)
    al = math.sqrt(sum(c * c for c in ax))
    ax = tuple(c / al for c in ax)
    def field(x, y, z):
        cx = ax[1] * z - ax[2] * y
        cy = ax[2] * x - ax[0] * z
        cz = ax[0] * y - ax[1] * x
        r = math.sqrt(x * x + y * y + z * z) or 1
        k = 0.55 * math.sin(2.2 * x + 1.4 * y)  # gentle wobble
        pull = 0.55 * (r - 0.15)  # spiral inward to a bright knot
        return (cx + k * x / r - pull * x / r, cy + k * y / r - pull * y / r, cz + k * z / r - pull * z / r)
    for _ in range(n):
        # start anywhere inside, more near the shell (as in the reference)
        while True:
            p = [rng.uniform(-1, 1) for _ in range(3)]
            r = math.sqrt(sum(c * c for c in p))
            if 0.7 < r < 1.0:
                break
        p = [c * radius for c in p]
        pts = []
        for _ in range(110):
            pts.append(tuple(p))
            v = field(*p)
            l = math.sqrt(sum(c * c for c in v)) or 1
            p = [p[k] + 0.045 * v[k] / l for k in range(3)]
            r = math.sqrt(sum(c * c for c in p))
            if r > radius:  # slide along the inner shell
                p = [c * radius / r for c in p]
        sp = cu.splines.new("NURBS")
        sp.points.add(len(pts) - 1)
        for k, q in enumerate(pts):
            sp.points[k].co = (*q, 1)
        sp.order_u = 4
    ob = bpy.data.objects.new("Wires", cu)
    bpy.context.collection.objects.link(ob)
    m = bpy.data.materials.new("Filament")
    m.use_nodes = True
    nodes = m.node_tree.nodes
    for nd in list(nodes):
        nodes.remove(nd)
    em = nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (1, 1, 1, 1)
    em.inputs["Strength"].default_value = 0.55
    out = nodes.new("ShaderNodeOutputMaterial")
    m.node_tree.links.new(em.outputs[0], out.inputs[0])
    cu.materials.append(m)
    WIRES = ob
    return ob


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
    curve.size = 3.3
    obj = bpy.data.objects.new("Sculpture", curve)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler = (math.radians(78), math.radians(0), math.radians(-14))
    return obj


obj = {"ribbon": ribbon, "text": text_object, "orb": orb}[a.shape]()
obj.data.materials.append(chrome_material())

if a.shape == "orb" and a.wires > 0:
    wires(a.wires)

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

if a.shape == "orb":
    m = obj.data.materials[0]
    b = m.node_tree.nodes["Principled BSDF"]
    for l in list(b.inputs["Base Color"].links):
        m.node_tree.links.remove(l)
    if a.orb_style == "chrome":
        # Ref B: silver chrome in a soft studio (black floor -> bright sky) - big soft highlights.
        b.inputs["Base Color"].default_value = (0.9, 0.9, 0.92, 1)
        b.inputs["Metallic"].default_value = 1.0
        b.inputs["Roughness"].default_value = 0.1
        if "Thin Film Thickness" in b.inputs:
            b.inputs["Thin Film Thickness"].default_value = 0.0
        b.inputs["Roughness"].default_value = 0.12
        # Bright silver room with a few dark bands (ref B reads silver with dark wavy lines).
        ramp.color_ramp.elements[0].color = (0.35, 0.35, 0.36, 1)
        ramp.color_ramp.elements[1].color = (1.3, 1.3, 1.32, 1)
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.wave_type, wave.bands_direction = "BANDS", "Z"
        wave.inputs["Scale"].default_value = 1.4
        wave.inputs["Distortion"].default_value = 0.8
        darkb = nt.nodes.new("ShaderNodeValToRGB")
        de = darkb.color_ramp.elements
        de[0].position, de[0].color = 0.0, (0.03, 0.03, 0.03, 1)
        de[1].position, de[1].color = 0.25, (1, 1, 1, 1)
        gen = nt.nodes.new("ShaderNodeTexCoord")
        nt.links.new(gen.outputs["Generated"], wave.inputs["Vector"])
        nt.links.new(wave.outputs["Fac"], darkb.inputs["Fac"])
        mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"
        mul.inputs["Factor"].default_value = 1.0
        nt.links.new(ramp.outputs["Color"], mul.inputs[6])
        nt.links.new(darkb.outputs["Color"], mul.inputs[7])
        nt.links.new(mul.outputs[2], bg.inputs["Color"])
    else:
        # Ref A: clear glass, dark smoky surroundings, orange + blue light catching the craters.
        b.inputs["Base Color"].default_value = (0.95, 0.97, 1.0, 1)
        b.inputs["Metallic"].default_value = 0.0
        b.inputs["Roughness"].default_value = 0.02
        b.inputs["Transmission Weight"].default_value = 1.0
        b.inputs["IOR"].default_value = 1.12  # thin shell: wires inside stay readable
        if "Thin Film Thickness" in b.inputs:
            b.inputs["Thin Film Thickness"].default_value = 0.0  # no rainbow patches (ref A is clear smoky glass)
        ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1)
        ramp.color_ramp.elements[1].color = (0.75, 0.77, 0.8, 1)
        # Bubble craters as surface relief (silhouette stays a clean circle, like ref A).
        nt2 = m.node_tree
        vor = nt2.nodes.new("ShaderNodeTexVoronoi")
        vor.feature = "SMOOTH_F1"
        vor.inputs["Scale"].default_value = 3.4
        vor.inputs["Smoothness"].default_value = 1.0
        bump = nt2.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 1.0
        bump.inputs["Distance"].default_value = 0.4
        nt2.links.new(vor.outputs["Distance"], bump.inputs["Height"])
        # fine crinkles on top of the craters (ref A's busy interior)
        crk = nt2.nodes.new("ShaderNodeTexNoise"); crk.inputs["Scale"].default_value = 22.0; crk.inputs["Detail"].default_value = 6.0
        bump2 = nt2.nodes.new("ShaderNodeBump"); bump2.inputs["Strength"].default_value = 0.12; bump2.inputs["Distance"].default_value = 0.05
        nt2.links.new(crk.outputs["Fac"], bump2.inputs["Height"])
        nt2.links.new(bump.outputs["Normal"], bump2.inputs["Normal"])
        nt2.links.new(bump2.outputs["Normal"], b.inputs["Normal"])
        # busy grey surroundings for the glass to refract (instead of a flat gradient)
        envn = nt.nodes.new("ShaderNodeTexNoise"); envn.inputs["Scale"].default_value = 6.0; envn.inputs["Detail"].default_value = 8.0
        envr = nt.nodes.new("ShaderNodeValToRGB")
        envr.color_ramp.elements[0].color = (0.06, 0.065, 0.08, 1); envr.color_ramp.elements[1].color = (0.8, 0.82, 0.88, 1)
        envr.color_ramp.elements[0].position = 0.42; envr.color_ramp.elements[1].position = 0.68
        nt.links.new(envn.outputs["Fac"], envr.inputs["Fac"])
        nt.links.new(envr.outputs["Color"], bg.inputs["Color"])
        softbox("GlintOrange", (-2.6, 1.5, 0.4), (80, 0, -130), (3.0, 0.3), 900, color=(1.0, 0.45, 0.15))
        softbox("GlintBlue", (2.6, 1.8, 1.0), (75, 0, 130), (3.0, 0.3), 900, color=(0.3, 0.5, 1.0))
        scene.cycles.transmission_bounces = 12
        CLOSE_UP = True
        scene.cycles.max_bounces = 16

# ---------- camera ----------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 62
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (0, -7.2, 0.5)
if globals().get("CLOSE_UP"):
    # "Inside" view: the glass sphere fills the frame like a lens (ref A).
    cam.location = (0, -4.1, 0.3)
    cam_data.lens = 50
cam.rotation_euler = (math.radians(86), 0, 0)
scene.camera = cam

if a.frames > 0:
    scene.frame_start, scene.frame_end = 1, a.frames
    # Bangle: move the sculpture's tilt onto the pivot, then spin the sculpture about its
    # own loop axis (local Z) — the ring revolves around its hole like a bracelet on a wrist.
    spinner = pivot
    if a.spin == "bangle":
        pivot.rotation_euler = obj.rotation_euler.copy()
        obj.rotation_euler = (0, 0, 0)
        spinner = obj
    base = spinner.rotation_euler.copy()
    spinner.keyframe_insert("rotation_euler", frame=1)
    spinner.rotation_euler = (base[0], base[1], base[2] + math.tau * a.frames / (a.frames + 1))
    spinner.keyframe_insert("rotation_euler", frame=a.frames)
    pivot = spinner
    # Wires counter-rotate slowly inside the glass (one full turn per loop -> seamless).
    if WIRES is not None:
        WIRES.rotation_euler = (0.3, 0.0, 0.0)
        WIRES.keyframe_insert("rotation_euler", frame=1)
        WIRES.rotation_euler = (0.3, 0.0, -math.tau * a.frames / (a.frames + 1))
        WIRES.keyframe_insert("rotation_euler", frame=a.frames)
    # Orb: the flow empty travels a closed circle, so the liquid surface loops seamlessly.
    if FLOW is not None:
        for f in range(1, a.frames + 1):
            ang = math.tau * (f - 1) / a.frames
            FLOW.location = (0.55 * math.cos(ang), 0.55 * math.sin(ang), 0.3 * math.sin(2 * ang))
            FLOW.keyframe_insert("location", frame=f)
    for fc in pivot.animation_data.action.fcurves if hasattr(pivot.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    scene.render.filepath = a.out
    bpy.ops.render.render(animation=True)
else:
    scene.render.filepath = a.out
    bpy.ops.render.render(write_still=True)
print("RENDERED", a.out)

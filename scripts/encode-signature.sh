#!/usr/bin/env bash
# Re-encode the original Name.gif signature (DESIGN.md §6C, decision D3).
# Same frames, timing and lettering — only the colour changes to charcoal #171719.
# Outputs to public/media/:
#   signature.webm         VP9 + alpha  (Chrome, Edge, Firefox)
#   signature.webp         animated WebP + alpha (Safari, which lacks VP9 alpha)
#   signature-still.webp   frame 200: first style fully written (poster / reduced motion)
# Requires ffmpeg with libvpx-vp9 and libwebp. Run from the repo root.
set -euo pipefail
SRC=reference/images/Name.gif
OUT=public/media
# Crop = union bounding box of every frame's alpha (x 25–1881, y 270–789), padded to even.
VF="format=rgba,crop=1880:536:16:262,lutrgb=r=23:g=23:b=25,scale=1200:-2:flags=lanczos"
# WebM only: VP9 decodes "transparent" alpha as 1/255, which tinted a faint box on
# the page. Giving near-transparent pixels the paper colour (#F0F0EE) makes that
# residue invisible on Paper — the only surface the signature sits on.
VF_WEBM="format=rgba,crop=1880:536:16:262,scale=1200:-2:flags=lanczos,geq=r='if(gt(alpha(X\,Y)\,6)\,23\,240)':g='if(gt(alpha(X\,Y)\,6)\,23\,240)':b='if(gt(alpha(X\,Y)\,6)\,25\,238)':a='alpha(X\,Y)'"
mkdir -p "$OUT"
ffmpeg -v error -y -i "$SRC" -vf "$VF_WEBM,format=yuva420p" -c:v libvpx-vp9 -b:v 0 -crf 36 \
  -auto-alt-ref 0 -row-mt 1 -deadline good -cpu-used 2 -an "$OUT/signature.webm"
ffmpeg -v error -y -i "$SRC" -vf "$VF" -c:v libwebp_anim -lossless 0 -q:v 60 \
  -compression_level 6 -loop 0 "$OUT/signature.webp"
ffmpeg -v error -y -i "$SRC" -vf "select=eq(n\,200),$VF" -frames:v 1 -c:v libwebp -q:v 80 "$OUT/signature-still.webp"
ls -la "$OUT"/signature*

#!/usr/bin/env bash
# Convert Blender renders (transparent PNG) into web assets under public/media/.
#   bash scripts/prepare-renders.sh <render-dir> <turntable-dir>
# <render-dir>     sculpture-blue.png, sculpture-lavender.png, chrome-pt.png
# <turntable-dir>  blue_0001.png … blue_0090.png  (from render-sculpture.py --frames 90)
# Requires ffmpeg with libwebp. Output keeps alpha.
set -euo pipefail
R="${1:?render dir}"
T="${2:?turntable dir}"
OUT=public/media
mkdir -p "$OUT/turntable"

webp() { # in out width quality
  ffmpeg -v error -y -i "$1" -vf "scale=$3:-1:flags=lanczos,format=yuva420p" -c:v libwebp -q:v "$4" -compression_level 6 "$2"
}

webp "$R/sculpture-blue.png" "$OUT/sculpture-blue.webp" 1200 80
webp "$R/sculpture-lavender.png" "$OUT/sculpture-lavender.webp" 1200 80
webp "$R/chrome-pt.png" "$OUT/chrome-pt.webp" 1200 82

i=0
for f in $(ls "$T"/blue_*.png | sort); do
  webp "$f" "$OUT/turntable/blue-$(printf %02d $i).webp" 720 72
  i=$((i + 1))
done
echo "turntable frames: $i"
du -ch "$OUT"/turntable/*.webp | tail -1
ls -la "$OUT"/sculpture-*.webp "$OUT"/chrome-pt.webp

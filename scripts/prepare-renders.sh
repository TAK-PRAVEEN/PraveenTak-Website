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

# Stills are optional: only converted when present in <render-dir>.
for n in sculpture-blue sculpture-lavender; do
  [ -f "$R/$n.png" ] && webp "$R/$n.png" "$OUT/$n.webp" 1200 80
done

# One ffmpeg call for the whole sequence (90 launches took ~13 min on Windows).
# Usage extra: PREFIX=orb bash scripts/prepare-renders.sh <render-dir> <turntable-dir>
PREFIX="${PREFIX:-orb}"
first=$(ls "$T"/*_*.png | sort | head -1)
pattern="$(dirname "$first")/$(basename "$first" | sed -E 's/[0-9]{4}\.png$/%04d.png/')"
start=$(basename "$first" | grep -oE '[0-9]{4}' | tail -1)
ffmpeg -v error -y -start_number "$((10#$start))" -i "$pattern"   -vf "scale=720:-1:flags=lanczos,format=yuva420p" -c:v libwebp -q:v 72 -compression_level 6   -start_number 0 "$OUT/turntable/$PREFIX-%02d.webp"
i=$(ls "$OUT"/turntable/"$PREFIX"-*.webp | wc -l)
echo "turntable frames: $i"
du -ch "$OUT"/turntable/"$PREFIX"-*.webp | tail -1
ls -la "$OUT"/sculpture-*.webp

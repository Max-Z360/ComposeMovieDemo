#!/usr/bin/env bash
# Contact sheet + keyframes for review.
# Usage: tools/sheet.sh [frames_dir] [out_dir] [fps] [every_seconds] [cols]
# Produces: out_dir/sheet.png (grid of one frame per N seconds, labelled with time)
#           out_dir/key_<t>s.png full-res copies of the same frames
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRAMES="${1:-$ROOT/frames}"
OUTD="${2:-$ROOT/out/review}"
FPS="${3:-30}"
EVERY="${4:-1}"
COLS="${5:-6}"
mkdir -p "$OUTD"
rm -f "$OUTD"/key_*.png "$OUTD"/tile_*.png
FIRST=$(ls "$FRAMES" | grep -E '^f[0-9]{5}\.(png|jpg)$' | sort | head -1)
EXT="${FIRST##*.}"
N=$(ls "$FRAMES" | grep -cE '^f[0-9]{5}\.(png|jpg)$')
STEP=$(python3 -c "print(int(round($FPS*$EVERY)))")
i=0; k=0
FONT=$(fc-match -f '%{file}' 'DejaVu Sans')
while [ $i -lt $N ]; do
  src=$(printf "%s/f%05d.%s" "$FRAMES" "$i" "$EXT")
  t=$(python3 -c "print('%.1f' % ($i/$FPS))")
  cp "$src" "$OUTD/key_${t}s.png"
  ffmpeg -y -hide_banner -loglevel error -i "$src" -vf "scale=640:-1,drawtext=fontfile=$FONT:text='${t}s':x=12:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8" "$OUTD/tile_$(printf %04d $k).png"
  i=$((i+STEP)); k=$((k+1))
done
ROWS=$(python3 -c "import math;print(math.ceil($k/$COLS))")
ffmpeg -y -hide_banner -loglevel error -framerate 1 -i "$OUTD/tile_%04d.png" -vf "tile=${COLS}x${ROWS}:padding=6:margin=6:color=0x202020" -frames:v 1 "$OUTD/sheet.png"
rm -f "$OUTD"/tile_*.png
echo "sheet: $OUTD/sheet.png ($k tiles, every ${EVERY}s); keyframes: $OUTD/key_*.png"

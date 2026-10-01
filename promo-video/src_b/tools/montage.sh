#!/usr/bin/env bash
# montage.sh <dir_with_t*.jpg> <out.png> [cols] [tilewidth]
set -euo pipefail
D="$1"; OUT="$2"; COLS="${3:-4}"; TW="${4:-640}"
TMP=$(mktemp -d)
FONT=$(fc-match -f '%{file}' 'DejaVu Sans')
k=0
for f in $(ls "$D"/t*.jpg | sort); do
  b=$(basename "$f" .jpg); lab=$(echo "$b" | sed 's/^t0*//; s/^\./0./')
  ffmpeg -y -loglevel error -i "$f" -vf "scale=${TW}:-1,drawtext=fontfile=$FONT:text='${lab}s':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=5" "$TMP/$(printf %04d $k).png"
  k=$((k+1))
done
ROWS=$(( (k + COLS - 1) / COLS ))
ffmpeg -y -loglevel error -framerate 1 -i "$TMP/%04d.png" -vf "tile=${COLS}x${ROWS}:padding=4:margin=4:color=0x202020" -frames:v 1 "$OUT"
rm -rf "$TMP"; echo "$OUT ($k tiles)"

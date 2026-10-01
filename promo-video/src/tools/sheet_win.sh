#!/usr/bin/env bash
# Windowed variant of tools/sheet.sh (the original always starts at f00000).
# Usage: sheet_win.sh FRAMES OUT FPS EVERY COLS START END
set -euo pipefail
FRAMES="$1"; OUTD="$2"; FPS="$3"; EVERY="$4"; COLS="$5"; START="$6"; END="$7"
mkdir -p "$OUTD"; rm -f "$OUTD"/tile_* "$OUTD"/key_*
EXT=png; compgen -G "$FRAMES/f*.jpg" >/dev/null && EXT=jpg
FONT=$(fc-match -f '%{file}' 'DejaVu Sans')
i=$(python3 -c "print(int(round($START*$FPS)))"); last=$(python3 -c "print(int(round($END*$FPS)))")
STEP=$(python3 -c "print(max(1,int(round($FPS*$EVERY))))"); k=0
while [ $i -le $last ]; do
  src=$(printf "%s/f%05d.%s" "$FRAMES" "$i" "$EXT"); [ -f "$src" ] || { i=$((i+STEP)); continue; }
  t=$(python3 -c "print('%.2f' % ($i/$FPS))")
  ffmpeg -y -hide_banner -loglevel error -i "$src" -vf "scale=480:-1,drawtext=fontfile=$FONT:text='${t}s f$i':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=5" "$OUTD/tile_$(printf %04d $k).png"
  i=$((i+STEP)); k=$((k+1))
done
ROWS=$(python3 -c "import math;print(math.ceil($k/$COLS))")
ffmpeg -y -hide_banner -loglevel error -framerate 1 -i "$OUTD/tile_%04d.png" -vf "tile=${COLS}x${ROWS}:padding=4:margin=4:color=0x202020" -frames:v 1 "$OUTD/sheet.png"
rm -f "$OUTD"/tile_*.png; echo "$OUTD/sheet.png ($k tiles)"

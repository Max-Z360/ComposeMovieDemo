#!/usr/bin/env bash
# Assemble frames (+ optional audio) into an H.264 MP4.
# Usage: tools/encode.sh [frames_dir] [out.mp4] [audio.wav|none] [fps] [crf]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRAMES="${1:-$ROOT/frames}"
OUT="${2:-$ROOT/out/final.mp4}"
AUDIO="${3:-$ROOT/audio/track.wav}"
FPS="${4:-30}"
CRF="${5:-17}"
mkdir -p "$(dirname "$OUT")"

# detect extension + first frame number
FIRST=$(ls "$FRAMES" | grep -E '^f[0-9]{5}\.(png|jpg)$' | sort | head -1)
[ -n "$FIRST" ] || { echo "no frames in $FRAMES" >&2; exit 1; }
EXT="${FIRST##*.}"
START=$((10#${FIRST:1:5}))

VF="format=yuv420p"
if [ -f "$AUDIO" ] && [ "$AUDIO" != "none" ]; then
  ffmpeg -y -hide_banner -loglevel error -stats \
    -framerate "$FPS" -start_number "$START" -i "$FRAMES/f%05d.$EXT" \
    -i "$AUDIO" \
    -c:v libx264 -preset slow -crf "$CRF" -vf "$VF" -profile:v high -level 4.1 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUT"
else
  ffmpeg -y -hide_banner -loglevel error -stats \
    -framerate "$FPS" -start_number "$START" -i "$FRAMES/f%05d.$EXT" \
    -c:v libx264 -preset slow -crf "$CRF" -vf "$VF" -profile:v high -level 4.1 \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -movflags +faststart "$OUT"
fi
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of default=nw=1 "$OUT"
echo "wrote $OUT"

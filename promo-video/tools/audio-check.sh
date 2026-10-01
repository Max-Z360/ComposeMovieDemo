#!/usr/bin/env bash
# Loudness + clipping report for a WAV/MP4. Usage: tools/audio-check.sh audio/track.wav
set -euo pipefail
F="${1:-audio/track.wav}"
echo "== $F"
ffprobe -v error -show_entries stream=codec_name,sample_rate,channels:format=duration -of default=nw=1 "$F"
echo "-- EBU R128 (target: I around -14..-16 LUFS, true peak <= -1 dBTP)"
ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:" | tail -3
echo "-- astats (peak level dB, RMS, flat/clipped samples)"
ffmpeg -hide_banner -nostats -i "$F" -af astats=measure_overall=Peak_level+RMS_level+Flat_factor+Peak_count+DC_offset:measure_perchannel=none -f null - 2>&1 | grep -E "Peak level|RMS level|Flat factor|Peak count|DC offset"
echo "-- silence check (any gaps > 1.5s below -50dB?)"
ffmpeg -hide_banner -nostats -i "$F" -af silencedetect=n=-50dB:d=1.5 -f null - 2>&1 | grep -E "silence_(start|end)" || echo "no long silences"

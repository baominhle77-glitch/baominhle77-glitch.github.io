#!/usr/bin/env bash
set -euo pipefail
# Native FFmpeg is supplied by @remotion/compositor, not the apt ffmpeg package.
# Bound mirror retries so setup cannot silently consume the render budget.
b_native_start=$(date +%s)
echo "B_NATIVE_START $(date -u +%FT%TZ)"
b_native_packages=(pkg-config libcairo2-dev libpango1.0-dev)
if [[ "${1:-manim}" == "browser" ]]; then
  b_native_packages=(libnss3 libatk-bridge2.0-0 libgbm1 libxkbcommon0 libasound2t64 libxcomposite1 libxdamage1 libxrandr2)
fi
b_native_missing=()
for b_native_pkg in "${b_native_packages[@]}"; do
  if [[ "$(dpkg-query -W -f='${Status}' "$b_native_pkg" 2>/dev/null || true)" != 'install ok installed' ]]; then
    b_native_missing+=("$b_native_pkg")
  fi
done
if ((${#b_native_missing[@]})); then
  b_native_sources=()
  if [[ -f /etc/apt/sources.list.d/ubuntu.sources ]]; then
    b_native_sources=(-o Dir::Etc::sourcelist=sources.list.d/ubuntu.sources -o Dir::Etc::sourceparts=-)
  fi
  timeout 100s sudo apt-get "${b_native_sources[@]}" -o Acquire::Retries=1 -o Acquire::http::Timeout=15 -o Acquire::https::Timeout=15 update
  timeout 240s sudo apt-get -o Acquire::Retries=1 -o Acquire::http::Timeout=20 -o Acquire::https::Timeout=20 install -y --no-install-recommends "${b_native_missing[@]}"
fi
echo "B_NATIVE_END elapsed_s=$(( $(date +%s) - b_native_start ))"

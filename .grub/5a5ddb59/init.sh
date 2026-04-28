#!/usr/bin/env bash
set -euo pipefail

# Grub harness 启动脚本（get-bearings 协议）。请将下方烟测替换为项目专属命令，
# 用来证明应用仍能端到端启动。

echo "=== grub bearings ==="
pwd
echo "--- recent commits ---"
git log --oneline -n 20 2>/dev/null || true
echo "--- working tree ---"
git status --short 2>/dev/null || true
echo "--- progress tail ---"
tail -n 40 "D:\\Projects\\Pencil\\Asgard-platform\\.grub\\5a5ddb59\\progress-log.md" 2>/dev/null || true
echo "--- feature progress ---"
node -e "try{const l=require("D:\\Projects\\Pencil\\Asgard-platform\\.grub\\5a5ddb59\\feature-list.json");const p=l.features.filter(f=>f.passes).length;console.log(p+'/'+l.features.length+' passing');}catch(e){console.log('feature-list.json unavailable');}" 2>/dev/null || true
echo "--- project smoke (override below) ---"
# TODO: 项目专属烟测命令（tests、curl、tsc --noEmit 等）

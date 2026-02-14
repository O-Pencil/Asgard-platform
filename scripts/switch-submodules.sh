#!/bin/bash

# 自动切换子模块到指定分支的脚本
# 用法:
#   ./scripts/switch-submodules.sh [branch-name]  - 切换到指定分支
#   ./scripts/switch-submodules.sh init [branch-name] - 初始化并切换到指定分支
# 默认切换到 feat/ai 分支

ACTION=""
BRANCH=""

if [ "$1" = "init" ]; then
    ACTION="init"
    BRANCH=${2:-feat/ai}
else
    ACTION="switch"
    BRANCH=${1:-feat/ai}
fi

echo "操作: $ACTION | 分支: $BRANCH"
echo "================================"

if [ "$ACTION" = "init" ]; then
    echo "初始化子模块..."
    git submodule update --init --remote
    echo ""
fi

# 获取所有子模块路径
SUBMODULES=$(git config --file .gitmodules --get-regexp path | awk '{print $2}')

for submodule in $SUBMODULES; do
    echo ""
    echo "处理子模块: $submodule"

    if [ -d "$submodule" ]; then
        cd "$submodule"

        # 检查是否已切换到目标分支
        current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        if [ "$current_branch" = "$BRANCH" ]; then
            echo "  ✓ 已在分支 $BRANCH"
        else
            # 检查分支是否存在
            if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
                git checkout "$BRANCH"
                echo "  ✓ 已切换到 $BRANCH"
            else
                # 尝试从远程获取分支
                echo "  ! 本地分支不存在，尝试从远程获取..."
                if git fetch origin "$BRANCH" 2>/dev/null; then
                    git checkout -b "$BRANCH" "origin/$BRANCH"
                    echo "  ✓ 已创建并切换到远程分支 $BRANCH"
                else
                    echo "  ✗ 远程分支 origin/$BRANCH 不存在"
                fi
            fi
        fi

        cd - > /dev/null
    else
        echo "  ✗ 子模块目录不存在: $submodule"
    fi
done

echo ""
echo "================================"
echo "完成！当前子模块状态:"
git submodule status

#!/bin/bash

# 自动切换子模块到指定分支的脚本
# 用法: ./scripts/switch-submodules.sh [branch-name]
# 默认切换到 feat/ai 分支

BRANCH=${1:-feat/ai}

echo "切换所有子模块到分支: $BRANCH"
echo "================================"

# 获取所有子模块路径
SUBMODULES=$(git config --file .gitmodules --get-regexp path | awk '{print $2}')

for submodule in $SUBMODULES; do
    echo ""
    echo "处理子模块: $submodule"

    if [ -d "$submodule" ]; then
        cd "$submodule"

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

        cd - > /dev/null
    else
        echo "  ✗ 子模块目录不存在: $submodule"
    fi
done

echo ""
echo "================================"
echo "完成！当前子模块状态:"
git submodule status

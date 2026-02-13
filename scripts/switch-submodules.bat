@echo off
REM 自动切换子模块到指定分支的脚本 (Windows)
REM 用法: scripts\switch-submodules.bat [branch-name]
REM 默认切换到 feat/ai 分支

set BRANCH=%1
if "%BRANCH%"=="" set BRANCH=feat/ai

echo 切换所有子模块到分支: %BRANCH%
echo ========================================
echo.

for /f "tokens=2 delims= " %%i in ('git config --file .gitmodules --get-regexp path') do (
    echo 处理子模块: %%i
    if exist "%%i" (
        cd %%i
        git checkout %BRANCH% 2>nul
        if errorlevel 1 (
            echo   ! 本地分支不存在，尝试从远程获取...
            git fetch origin %BRANCH% 2>nul
            if not errorlevel 1 (
                git checkout -b %BRANCH% origin/%BRANCH%
                echo   ^+ 已创建并切换到远程分支 %BRANCH%
            ) else (
                echo   x 远程分支 origin/%BRANCH% 不存在
            )
        ) else (
            echo   ^+ 已切换到 %BRANCH%
        )
        cd ..
    ) else (
        echo   x 子模块目录不存在: %%i
    )
    echo.
)

echo ========================================
echo 完成！当前子模块状态:
git submodule status

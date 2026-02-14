@echo off
REM 自动切换子模块到指定分支的脚本 (Windows)
REM 用法:
REM   scripts\switch-submodules.bat [branch-name]  - 切换到指定分支
REM   scripts\switch-submodules.bat init [branch-name] - 初始化并切换到指定分支
REM 默认切换到 feat/ai 分支

set ACTION=switch
set BRANCH=feat/ai

if "%1"=="" goto run
if "%1"=="init" (
    set ACTION=init
    set BRANCH=%2
    if "%BRANCH%"=="" set BRANCH=feat/ai
) else (
    set BRANCH=%1
)

:run
echo 操作: %ACTION% ^| 分支: %BRANCH%
echo ========================================
echo.

if "%ACTION%"=="init" (
    echo 初始化子模块...
    git submodule update --init --remote
    echo.
)

for /f "tokens=2 delims= " %%i in ('git config --file .gitmodules --get-regexp path') do (
    echo 处理子模块: %%i
    if exist "%%i" (
        cd %%i
        for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%b
        if /i "%CURRENT_BRANCH%"=="%BRANCH%" (
            echo   ^+ 已在分支 %BRANCH%
        ) else (
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

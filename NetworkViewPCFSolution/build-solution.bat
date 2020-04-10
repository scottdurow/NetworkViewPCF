@echo off
set package_root=..\
REM Find the spkl in the package folder (irrespective of version)
For /R %package_root% %%G IN (spkl.exe) do (
	IF EXIST "%%G" (set spkl_path=%%G
	goto :continue)
	)

:continue
@echo Using '%spkl_path%' 

REM Build PCF Control
msbuild "NetworkView2Solution.cdsproj" /t:build /restore /p:configuration=Release

if errorlevel 1 (
echo Error Code=%errorlevel%
exit /b %errorlevel%
)

REM Copy built files to solution package folder ready to be packed
xcopy "..\NetworkViewPCF\out\controls\NetworkView" "solution_package\Controls\dev1_dev1.NetworkView\" /Y

if errorlevel 1 (
echo Error Code=%errorlevel%
exit /b %errorlevel%
)

REM spkl instrument [path] [connection-string] [/p:release]
"%spkl_path%" pack "%cd%" "" %*

if errorlevel 1 (
echo Error Code=%errorlevel%
exit /b %errorlevel%
)



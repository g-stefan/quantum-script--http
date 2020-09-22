@echo off
rem Public domain
rem http://unlicense.org/
rem Created by Grigore Stefan <g_stefan@yahoo.com>

SETLOCAL ENABLEDELAYEDEXPANSION

echo -^> git-release quantum-script-extension-http

if not exist release\ echo Error - no release & exit 1

set PROJECT=quantum-script-extension-http
if not exist source\%PROJECT%.version.ini echo Error - no version & exit 1
FOR /F "tokens=* USEBACKQ" %%F IN (`xyo-version --no-bump --get "--version-file=source\%PROJECT%.version.ini" %PROJECT%`) DO (
	SET VERSION=%%F
)

echo -^> release %PROJECT% v%VERSION%

git pull --tags origin master
git rev-parse --quiet "v%VERSION%" 1>NUL 2>NUL
if not errorlevel 1 goto tagExists
git tag -a v%VERSION% -m "v%VERSION%"
git push --tags
echo Create release %PROJECT% v%VERSION%
github-release release --repo %PROJECT% --tag v%VERSION% --name "v%VERSION%" --description "Release"
pushd release
for /r %%i in (*.7z) do echo Upload %%~nxi & github-release upload --repo %PROJECT% --tag v%VERSION% --name "%%~nxi" --file "%%i"
for /r %%i in (*.csv) do echo Upload %%~nxi & github-release upload --repo %PROJECT% --tag v%VERSION% --name "%%~nxi" --file "%%i"
popd

goto :eof

:tagExists
echo Release already exists
exit 0

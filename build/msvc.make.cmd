@echo off
rem Public domain
rem http://unlicense.org/
rem Created by Grigore Stefan <g_stefan@yahoo.com>

set ACTION=%1
if "%1" == "" set ACTION=make

echo - %BUILD_PROJECT% ^> %ACTION%

goto cmdXDefined
:cmdX
%*
if errorlevel 1 goto cmdXError
goto :eof
:cmdXError
echo "Error: %ACTION%"
exit 1
:cmdXDefined

call :cmdX file-to-cs --touch=source/quantum-script-extension-http.cpp --file-in=source/quantum-script-extension-http.js --file-out=source/quantum-script-extension-http.src --is-string --name=extensionHTTPSource
call :cmdX xyo-cc --mode=%ACTION% @build/source/quantum-script-extension-http.static.compile
call :cmdX xyo-cc --mode=%ACTION% @build/source/quantum-script-extension-http.dynamic.compile

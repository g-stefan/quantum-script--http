#!/bin/sh
# Public domain
# http://unlicense.org/
# Created by Grigore Stefan <g_stefan@yahoo.com>

ACTION=$1
if [ "$ACTION" = "" ]; then
	ACTION=make
fi

echo "-> $ACTION quantum-script-extension-http"

cmdX(){
	if ! "$@" ; then
		echo "Error: $ACTION"
		exit 1
	fi
}

cmdX file-to-cs --touch=source/quantum-script-extension-http.cpp --file-in=source/quantum-script-extension-http.js --file-out=source/quantum-script-extension-http.src --is-string --name=extensionHTTPSource
cmdX xyo-cc --mode=$ACTION @util/quantum-script-extension-http.static.compile.info
cmdX xyo-cc --mode=$ACTION @util/quantum-script-extension-http.dynamic.compile.info

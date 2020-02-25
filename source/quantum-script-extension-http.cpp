//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "quantum-script-extension-http-license.hpp"
#include "quantum-script-extension-http.hpp"
#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_NO_VERSION
#include "quantum-script-extension-http-version.hpp"
#endif

#include "quantum-script-extension-http.src"

//#define QUANTUM_SCRIPT_VM_DEBUG_RUNTIME

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace HTTP {

				using namespace XYO;
				using namespace Quantum::Script;

				void registerInternalExtension(Executive *executive) {
					executive->registerInternalExtension("HTTP", initExecutive);
				};

				void initExecutive(Executive *executive, void *extensionId) {

					String info = "HTTP\r\n";
					info << License::shortContent();

					executive->setExtensionName(extensionId, "HTTP");
					executive->setExtensionInfo(extensionId, info);
#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_NO_VERSION
					executive->setExtensionVersion(extensionId, Extension::HTTP::Version::versionWithBuild());
#endif
					executive->setExtensionPublic(extensionId, true);

					executive->compileStringX(extensionHTTPSource);

				};

			};
		};
	};
};

#ifdef XYO_COMPILE_DYNAMIC_LIBRARY
extern "C" QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT void quantumScriptExtension(Quantum::Script::Executive *executive, void *extensionId) {
	Quantum::Script::Extension::HTTP::initExecutive(executive, extensionId);
};
#endif


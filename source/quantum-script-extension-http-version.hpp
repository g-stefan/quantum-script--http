//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020-2021 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_HPP
#define QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_HPP

#define QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_ABCD                 2,4,0,21
#define QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_STR                 "2.4.0"
#define QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_STR_BUILD           "21"
#define QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_STR_DATETIME        "2021-11-22 17:08:00"

#ifndef XYO_RC

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP__EXPORT_HPP
#include "quantum-script-extension-http--export.hpp"
#endif

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace HTTP {
				namespace Version {
					QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT const char *version();
					QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT const char *build();
					QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT const char *versionWithBuild();
					QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT const char *datetime();
				};
			};
		};
	};
};

#endif
#endif


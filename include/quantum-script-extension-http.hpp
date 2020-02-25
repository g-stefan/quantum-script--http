//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_HPP
#define QUANTUM_SCRIPT_EXTENSION_HTTP_HPP

#ifndef QUANTUM_SCRIPT_HPP
#include "quantum-script.hpp"
#endif

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP__EXPORT_HPP
#include "quantum-script-extension-http--export.hpp"
#endif

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_COPYRIGHT_HPP
#include "quantum-script-extension-http-copyright.hpp"
#endif

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_LICENSE_HPP
#include "quantum-script-extension-http-license.hpp"
#endif

#ifndef QUANTUM_SCRIPT_EXTENSION_HTTP_VERSION_HPP
#include "quantum-script-extension-http-version.hpp"
#endif

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace HTTP {

				using namespace Quantum::Script;

				QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT void initExecutive(Executive *executive, void *extensionId);
				QUANTUM_SCRIPT_EXTENSION_HTTP_EXPORT void registerInternalExtension(Executive *executive);

			};
		};
	};
};

#endif


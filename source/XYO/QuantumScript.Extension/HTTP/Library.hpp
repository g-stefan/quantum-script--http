// Quantum Script Extension HTTP
// Copyright (c) 2022 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2022 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY_HPP
#define XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY_HPP

#ifndef XYO_QUANTUMSCRIPT_EXTENSION_HTTP_DEPENDENCY_HPP
#	include <XYO/QuantumScript.Extension/HTTP/Dependency.hpp>
#endif

namespace XYO::QuantumScript::Extension::HTTP {

	XYO_QUANTUMSCRIPT_EXTENSION_HTTP_EXPORT void initExecutive(Executive *executive, void *extensionId);
	XYO_QUANTUMSCRIPT_EXTENSION_HTTP_EXPORT void registerInternalExtension(Executive *executive);

};

#endif

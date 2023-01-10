// Quantum Script Extension HTTP
// Copyright (c) 2016-2023 Grigore Stefan <g_stefan@yahoo.com>
// MIT License (MIT) <http://opensource.org/licenses/MIT>
// SPDX-FileCopyrightText: 2016-2023 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: MIT

#include <XYO/QuantumScript.Extension/HTTP/Library.hpp>
#include <XYO/QuantumScript.Extension/HTTP/Copyright.hpp>
#include <XYO/QuantumScript.Extension/HTTP/License.hpp>
#include <XYO/QuantumScript.Extension/HTTP/Version.hpp>
#include <XYO/QuantumScript.Extension/HTTP/Library.Source.cpp>

namespace XYO::QuantumScript::Extension::HTTP {

	void registerInternalExtension(Executive *executive) {
		executive->registerInternalExtension("HTTP", initExecutive);
	};

	void initExecutive(Executive *executive, void *extensionId) {

		String info = "HTTP\r\n";
		info << License::shortLicense();

		executive->setExtensionName(extensionId, "HTTP");
		executive->setExtensionInfo(extensionId, info);
		executive->setExtensionVersion(extensionId, Extension::HTTP::Version::versionWithBuild());
		executive->setExtensionPublic(extensionId, true);
		
		executive->compileStringX(librarySource);
	};

};

#ifdef XYO_COMPILE_DYNAMIC_LIBRARY
extern "C" XYO_QUANTUMSCRIPT_EXTENSION_HTTP_EXPORT void quantumScriptExtension(XYO::QuantumScript::Executive *executive, void *extensionId) {
	XYO::QuantumScript::Extension::HTTP::initExecutive(executive, extensionId);
};
#endif

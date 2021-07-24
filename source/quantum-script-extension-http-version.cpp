//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020-2021 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

#include "quantum-script-extension-http-version.hpp"

namespace Quantum {
	namespace Script {
		namespace Extension {
			namespace HTTP {
				namespace Version {

					static const char *version_ = "2.0.0";
					static const char *build_ = "10";
					static const char *versionWithBuild_ = "2.0.0.10";
					static const char *datetime_ = "2021-07-23 16:34:03";

					const char *version() {
						return version_;
					};
					const char *build() {
						return build_;
					};
					const char *versionWithBuild() {
						return versionWithBuild_;
					};
					const char *datetime() {
						return datetime_;
					};

				};
			};
		};
	};
};




//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020 Grigore Stefan <g_stefan@yahoo.com>
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

					static const char *version_ = "1.2.0";
					static const char *build_ = "4";
					static const char *versionWithBuild_ = "1.2.0.4";
					static const char *datetime_ = "2020-09-21 17:40:08";

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




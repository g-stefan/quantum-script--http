# Getting started

## 1. Build and install

The extension is built with [fabricare](https://github.com/g-stefan/fabricare),
the build tool used by all XYO C++ projects. `quantum-script` (and everything
below it: `xyo-system`, `xyo-encoding`, ...) and `quantum-script--console`
must be installed to the SDK first. From the repository root:

```bash
fabricare make       # build into output/
fabricare install    # copy output/{bin,include,lib} to ~/.fabricare/<platform>
fabricare clean      # remove output/ and temp/
```

Before every `make`, `fabricare/make.prepare.js` turns
`source/XYO/QuantumScript.Extension/HTTP/Library.js` into
`Library.Source.cpp` (`file-to-cs`), so the script is compiled into the
library: edit `Library.js`, then build.

The library project is `quantum-script--http` with `"make": "dll-or-lib"`:

| Platform | Result | Use it when |
|----------|--------|-------------|
| dynamic (`~/.fabricare/win64-msvc-2026`, ...) | `quantum-script--http.dll` / `libquantum-script--http.so` | scripts run by `quantum-script`, or a host using the engine DLL |
| static (`~/.fabricare/win64-msvc-2026.static`, ...) | static library | self-contained hosts that register the extension as internal |

At run time `HTTP` needs the `File`, `Socket`, `URL`, `JSON` and `Buffer`
extensions too (it runs `Script.requireExtension` for them while it
initializes). They are **not** build dependencies in `fabricare.json`;
install `quantum-script--file`, `quantum-script--socket`,
`quantum-script--url`, `quantum-script--json` and `quantum-script--buffer`
to the same SDK.

`fabricare test` builds `test/test.01.cpp`, a host that registers `HTTP`
and its dependencies as internal extensions and links the library just
built in `output/`, and runs `test/test.01.js` (argument handling, no
server needed). To see what is sent on the wire, test with a script against
a local server (see [Recipes](recipes.md#test-against-a-local-server)).

## 2. Use it from a script

```javascript
Script.requireExtension("Console");
Script.requireExtension("HTTP");

var result = HTTP.json("http://127.0.0.1:8080/api/echo", {name: "test", count: 3});
if (Script.isNull(result)) {
	Console.writeLn("cannot connect");
} else if (Script.isUndefined(result)) {
	Console.writeLn("the response is not JSON");
} else {
	Console.writeLn(JSON.encode(result));
};

var text = HTTP.post("http://127.0.0.1:8080/notes", "hello");
Console.writeLn(text);

if (HTTP.downloadFile("http://127.0.0.1:8080/files/data.zip", "data.zip")) {
	Console.writeLn("saved data.zip");
};
```

Run it with:

```bash
quantum-script http-example.js
```

`Script.requireExtension("HTTP")` looks for an external
`quantum-script--http` library first (next to the interpreter, next to the
script, the include paths), then for an internal extension registered by the
host. Loading twice does nothing. A missing extension throws
`Unable to open "HTTP"`; a missing dependency throws the same error for
`File`, `Socket`, `URL` or `JSON`.

After it loads, the globals `HTTP`, `File`, `Socket`, `URL`, `JSON` and
`Buffer` exist. `Shell` is loaded by `HTTP.downloadFile` when it is called
without a file name (it uses `Shell.getFileName`); a host must then have
`Shell` available, otherwise that call throws `Unable to open "Shell"`.

### Which hosts have it

| Host | `HTTP` |
|------|--------|
| `quantum-script`, dynamic SDK | yes, `quantum-script--http.dll` / `.so` with its dependency DLLs |
| `quantum-script`, static SDK (`win64-msvc-2026.static`) | no: `Unable to open "HTTP"` |
| fabricare build scripts | no: fabricare is static and does not embed `HTTP` |
| magnet (`quantum-script--magnet`) | yes, internal (with `File`, `Socket`, `URL`, `JSON`, `Shell`, `OpenSSL` / `HTTPS`) |
| your own host | when it registers `HTTP` and its dependencies (section 3) |

In fabricare scripts run a separate `quantum-script` process when you need
HTTP.

## 3. Register it in a C++ host

A host that embeds Quantum Script makes `HTTP` available as an internal
extension by registering it, together with every extension `Library.js`
requires, in the init callback:

```cpp
#include <XYO/QuantumScript.hpp>
#include <XYO/QuantumScript.Extension/Console.hpp>
#include <XYO/QuantumScript.Extension/Buffer.hpp>
#include <XYO/QuantumScript.Extension/File.hpp>
#include <XYO/QuantumScript.Extension/Socket.hpp>
#include <XYO/QuantumScript.Extension/URL.hpp>
#include <XYO/QuantumScript.Extension/JSON.hpp>
#include <XYO/QuantumScript.Extension/Shell.hpp>
#include <XYO/QuantumScript.Extension/HTTP.hpp>

using namespace XYO::QuantumScript;

void initExecutive(Executive *executive) {
	Extension::Console::registerInternalExtension(executive);
	Extension::Buffer::registerInternalExtension(executive);
	Extension::File::registerInternalExtension(executive);
	Extension::Socket::registerInternalExtension(executive);
	Extension::URL::registerInternalExtension(executive);
	Extension::JSON::registerInternalExtension(executive);
	Extension::Shell::registerInternalExtension(executive);   // optional, for downloadFile without a file name
	Extension::HTTP::registerInternalExtension(executive);
};

int main(int cmdN, char *cmdS[]) {
	if (ExecutiveX::initExecutive(cmdN, cmdS, initExecutive)) {
		if (!ExecutiveX::executeString(
		        "Script.requireExtension(\"Console\");"
		        "Script.requireExtension(\"HTTP\");"
		        "Console.writeLn(HTTP.post(\"http://127.0.0.1:8080/\", \"hello\"));")) {
			printf("%s\n", (ExecutiveX::getError()).value());
			printf("%s", (ExecutiveX::getStackTrace()).value());
		};
		ExecutiveX::endProcessing();
	};
	return 0;
};
```

Registering only makes the extension *available*: scripts still call
`Script.requireExtension("HTTP")`. With the DLL build of the engine an
external `quantum-script--http.dll` found on the include path wins over the
internal one for `requireExtension`; use
`Script.requireInternalExtension("HTTP")` to force the internal one.

In the host's `fabricare.json` list every extension you register, because
`quantum-script--http` only brings `quantum-script` and
`quantum-script--console`:

```json
{
	"name": "my-host",
	"make": "exe",
	"sourcePath": "XYO/MyHost",
	"dependency": [
		"quantum-script--http",
		"quantum-script--buffer",
		"quantum-script--file",
		"quantum-script--socket",
		"quantum-script--url",
		"quantum-script--json",
		"quantum-script--shell"
	]
}
```

## 4. Static builds

There is no separate `quantum-script--http.static` project. On a static
fabricare platform the same `quantum-script--http` project is built as a
static library (`dll-or-lib`), the `quantumScriptExtension` DLL entry point
is left out (it is compiled only with `XYO_PLATFORM_COMPILE_DYNAMIC_LIBRARY`
and without `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY`), and the host
registers the extension and its dependencies with `registerInternalExtension`
(section 3). `quantum-script--magnet` is an example of a host that does this.

## 5. Threads

Each thread that runs scripts has its own engine, so every thread loads the
extension itself with `Script.requireExtension("HTTP")` and gets its own
`HTTP` object and its own 128 KB `HTTP.buffer`. A request blocks the thread
that makes it until the server closes the connection; run slow downloads in
a `Thread` or `Job` when the script must keep working meanwhile.

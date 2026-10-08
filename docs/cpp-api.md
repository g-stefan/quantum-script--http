# C++ API

For hosts that embed Quantum Script and for maintainers of the extension.
Read the `quantum-script` repository's `docs/embedding.md` and
`docs/writing-extensions.md` first: extensions, `Executive` and
`compileStringX` work the same way here.

## Headers and namespace

```cpp
#include <XYO/QuantumScript.Extension/HTTP.hpp>   // Library.hpp

using namespace XYO::QuantumScript;
```

Namespace: `XYO::QuantumScript::Extension::HTTP`. Export macro:
`XYO_QUANTUMSCRIPT_EXTENSION_HTTP_EXPORT`:

| Define | Effect |
|--------|--------|
| `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_INTERNAL` (or `QUANTUM_SCRIPT__HTTP_INTERNAL`, set by fabricare while building the DLL) | export macro = `XYO_PLATFORM_LIBRARY_EXPORT` |
| none | export macro = `XYO_PLATFORM_LIBRARY_IMPORT` (consumers of the DLL) |
| `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY` | export macro empty, no `quantumScriptExtension` entry point (sources compiled into another library) |
| `XYO_PLATFORM_COMPILE_STATIC` (static platforms) | `XYO_PLATFORM_LIBRARY_EXPORT` / `IMPORT` are empty |

The `quantumScriptExtension` entry point is compiled only when
`XYO_PLATFORM_COMPILE_DYNAMIC_LIBRARY` is defined and
`XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY` is not.

## Registering the extension

```cpp
void Extension::HTTP::registerInternalExtension(Executive *executive);
void Extension::HTTP::initExecutive(Executive *executive, void *extensionId);
```

- `registerInternalExtension` registers `"HTTP"` as an internal extension;
  call it from the host's init callback (see
  [Getting started](getting-started.md#3-register-it-in-a-c-host)).
- `initExecutive` is the extension's init function, run by the engine when a
  script first requires `HTTP` in a thread. It sets the extension name, info
  (`"HTTP"` plus the short license text), version and public flag, then
  compiles and runs the script library:

  ```cpp
  executive->compileStringX(librarySource);   // Library.js
  ```

  Do not call it directly.
- The DLL build also exports
  `extern "C" void quantumScriptExtension(Executive *, void *)`, which
  forwards to `initExecutive`; it is what `Script.requireExtension` looks up
  in `quantum-script--http.dll`.

### Dependencies at run time

`Library.js` starts with:

```javascript
Script.requireExtension("File");
Script.requireExtension("Socket");
Script.requireExtension("URL");
Script.requireExtension("JSON");
```

(`File` and `Socket` require `Buffer` in turn). A host that registers `HTTP`
as internal must register these too, or make their DLLs loadable, otherwise
the first `Script.requireExtension("HTTP")` throws
`Unable to open "File"` (or the next missing one). `Shell` is loaded by
`HTTP.downloadFile` when no file name is given (register it with
`ShellFind`, which it requires), but is not required by the library. `quantum-script--http`'s `fabricare.json` only depends on
`quantum-script` and `quantum-script--console`, so a host's
`fabricare.json` must list `quantum-script--buffer`, `quantum-script--file`,
`quantum-script--socket`, `quantum-script--url`, `quantum-script--json`
(and `quantum-script--shell`) itself. `quantum-script--magnet` registers all
of them.

## How it works

The extension has no native functions. Everything script-visible is in
`HTTP/Library.js`:

| Script symbol | Implementation |
|---------------|----------------|
| `HTTP` | `HTTP = {};` (replaces any existing global `HTTP`) |
| `HTTP.buffer` | `new Buffer(128 * 1024)` |
| `HTTP.decodeHeaderLine` | `indexOf(":")`, `substring`, `trim` |
| `HTTP.json`, `post`, `postRequest`, `downloadFile` | `URL.getSchemeName` / `getHostNameAndPort` / `getPathAndFileName` / `getQuery`, `new Socket()`, `openClient`, `writeLn` / `write`, `readLn(1024)` for headers, `readToBuffer(this.buffer, contentLength)` for the body, `Convert.toString(buffer)` or `File.writeFromBuffer` |

`fabricare/make.prepare.js` runs, before every `fabricare make`:

```
file-to-cs --touch=Library.cpp --file-in=Library.js --file-out=Library.Source.cpp --is-string --name=librarySource
```

`Library.Source.cpp` is generated (a `static const char librarySource[]`
array, `#include`d by `Library.cpp`): change `Library.js`, then build.
`--touch=Library.cpp` makes the build recompile `Library.cpp`.

There is no C++ HTTP API: C++ code that needs a request either runs a script
(`ExecutiveX::executeString`) or calls the script function through
`functionApply` (after a script ran `Script.requireExtension("HTTP")` in
this thread):

```cpp
TPointer<Variable> http = Context::getGlobalObject()->getPropertyBySymbol(Context::getSymbol("HTTP"));
TPointer<Variable> post = http->getPropertyBySymbol(Context::getSymbol("post"));
TPointer<VariableArray> arguments(VariableArray::newArray());
arguments->index(0) = VariableString::newVariable("http://127.0.0.1:8080/");
arguments->index(1) = VariableString::newVariable("hello");
TPointer<Variable> body = post->functionApply(http, arguments);   // this_ must be HTTP
```

For native HTTP in C++ use `XYO::Networking::Socket` from `xyo-networking`
directly.

## Notes for maintainers

- New functions go in `Library.js` as `HTTP.name = function(...) { ... };`.
  Then update `README.md`, `docs/script-api.md`, `docs/reference.md` and the
  skill in `.claude/skills/quantum-script--http/`.
- Keep the API in step with `HTTPS` in `quantum-script--openssl`
  (`OpenSSL/Library.js`): it is a copy of this code on top of
  `OpenSSL.sslConnect`, with the same argument order (except the unused
  `extra` argument of `HTTPS.downloadFile`).
- Known behavior that callers rely on or work around (change only
  deliberately, and document it):
  - requests are HTTP/1.0 with `Connection: close` (changed from HTTP/1.1
    in 4.0.0 to avoid chunked transfer encoding, see `CHANGELOG.md`);
  - the status code is ignored; `downloadFile` returns `true` for error
    pages;
  - a URL without `://` returns `null` / `false` like any other non
    `http://` URL;
  - `headers` is one string written with `writeLn`;
  - `postRequest` writes the fixed, non RFC 7578 multipart layout shared
    with `HTTPS.postRequest`;
  - `Content-Length` is matched in any case;
  - an IPv6 host without port gets `:80`;
  - `downloadFile` loads `Shell` for the default file name and closes the
    connection when it is done.
- Test changes with `fabricare test` (`test/test.01.*`: a host that runs
  `test/test.01.js` against the library in `output/`; add checks with
  `check(name, value, expected)`), and with the local echo server in
  [Recipes](recipes.md#test-against-a-local-server). The installed
  `quantum-script` loads the installed DLL, not `output/bin`.
- The `README.md` of the repository lists the public functions; keep it in
  step with `Library.js`.

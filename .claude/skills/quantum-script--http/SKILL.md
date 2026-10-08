---
name: quantum-script--http
description: >-
  How to use the Quantum Script HTTP extension (quantum-script--http), the
  plain http:// client loaded with Script.requireExtension("HTTP") (also
  loads File, Socket, URL, JSON, Buffer; Shell on demand): HTTP.json(url, data,
  headers, mode) (JSON.encode body, POST default, returns decoded JSON,
  undefined when the body is not JSON, null when not connected),
  HTTP.post(url, data, headers, mode) (String body, text/plain unless a
  Content-Type header is given, returns the body text or null),
  HTTP.postRequest (one multipart field "request", fixed non RFC 7578
  layout), HTTP.downloadFile(url, fileName, headers, mode, content) (GET
  default, true / false, true also for 404 pages, default file name loads
  Shell), HTTP.decodeHeaderLine, HTTP.buffer; HTTP/1.0 with Connection:
  close, status code ignored, no redirects / TLS / timeouts; the headers
  argument is one string joined with "\r\n" and never ends with "\r\n"; URL
  without "://" returns null / false; JSON.encode sends non-ASCII as \xHH (not standard
  JSON); recipes (query strings, GET JSON, form post, Basic / Bearer auth,
  standard JSON, multipart upload, safe download with SHA256, status /
  headers / timeout with Socket, HTTPS from OpenSSL, local echo server);
  hosts (quantum-script dynamic, magnet; not fabricare, not static
  quantum-script); the C++ side (registerInternalExtension plus Buffer,
  File, Socket, URL, JSON, Library.js compiled to Library.Source.cpp). Use
  when writing or reviewing Quantum Script or magnet code that calls HTTP or
  makes web requests, C++ code that includes
  <XYO/QuantumScript.Extension/HTTP.hpp>, a fabricare.json depending on
  "quantum-script--http", or when working inside the quantum-script--http
  repository.
---

# quantum-script--http

HTTP client extension of Quantum Script (see the `quantum-script` skill for
the language and its differences from JavaScript, and the
`quantum-script--socket`, `quantum-script--url`, `quantum-script--json`
skills for the extensions it is built on; their rules apply). Purpose:
**one-call HTTP requests from scripts** — call a JSON service, post text or
a form, download a file — over plain `http://`. The whole extension is
`source/XYO/QuantumScript.Extension/HTTP/Library.js` (~330 lines of Quantum
Script); when in doubt read it.

Full documentation: `docs/` in the quantum-script--http repository
(`X:\Storage\XYO\Gitea\CPP\quantum-script--http\docs` on this machine):
README (purpose), getting-started (build, hosts, C++ registration),
**script-api** (exact request sent, response handling, results, limits),
**recipes** (query strings, GET JSON, auth, form, standard JSON, multipart,
safe download, status / timeout with Socket, HTTPS, local test server),
cpp-api, reference (result table by situation). Read the matching page when
you need more than this summary.

## Script API

```javascript
Script.requireExtension("HTTP");                 // also File, Socket, URL, JSON, Buffer

var v = HTTP.json("http://127.0.0.1:8080/api", {a: 1});            // POST JSON -> decoded value
//   undefined: body empty / not JSON (error page, redirect); null: no connection, not http://
var t = HTTP.post("http://127.0.0.1:8080/x", "text");              // POST text/plain -> String or null
var f = HTTP.post(url, "a=1&b=2", "Content-Type: application/x-www-form-urlencoded");
var g = HTTP.post(url, "", "Accept: application/json", "GET");     // GET, then JSON.decode(g)
var r = HTTP.postRequest(url, "payload");                          // multipart field "request" -> String or null
var ok = HTTP.downloadFile("http://127.0.0.1:8080/a.zip", "a.zip"); // GET -> true / false
HTTP.decodeHeaderLine("Content-Length: 12\r\n");                   // ["Content-Length", "12"]; false if no ":"
HTTP.buffer;                                                       // Buffer 128 KB, reused by every call
```

Every request: `MODE path?query HTTP/1.0`, `Host`, `Connection: close`,
your headers, body; response headers read with `readLn(1024)` until
`"\r\n"`; body read by `Content-Length` (any case) or until the server
closes.

## Hard rules

1. **Status codes are ignored.** A `404` / `500` body is returned like a
   `200` one; `downloadFile` returns `true` and saves the error page. No
   redirects. Check the content (JSON fields, size, `SHA256.fileHash`), or
   use the `Socket` recipe (`docs/recipes.md`) for status and headers.
2. **Three kinds of result.** `json`: value / `undefined` (not JSON) /
   `null` (not connected — but also a JSON `null` body). `post`,
   `postRequest`: String (maybe `""`) / `null`. `downloadFile`: `true` /
   `false`. Test with `Script.isNull`, `Script.isUndefined`, never `if (r)`
   (`""`, `0`, `false` are valid bodies).
3. **Only `http://`.** `https://` returns `null` / `false`: use
   `Script.requireExtension("OpenSSL")` and `HTTPS.json / post /
   postRequest / downloadFile` (same arguments, but
   `HTTPS.downloadFile(url, fileName, headers, mode, extra, content)`).
4. **A URL without `://` returns `null` / `false`** like any other non
   `http://` URL (older builds threw `"toUpperCaseASCII" is not a
   function`; validate with `Script.isNull(URL.getSchemeName(url))` when the
   script must also run on them).
5. **`headers` is one String**, lines joined with `"\r\n"`, **no trailing
   `"\r\n"`** (it ends the header block early and the body is lost). Arrays
   are not accepted: `[...].join("\r\n")`. URL user info is not sent: add
   `"Authorization: Basic " + Base64.encode("user:pass")` yourself.
6. **Content-Type**: `json` always sends `application/json` (yours would be
   a second header); `post` adds `text/plain` unless `headers` contains
   `Content-Type:` (case sensitive); `downloadFile` adds none and **no
   `Content-Length` for `content`** — put it in `headers`.
7. **`HTTP.json` always sends a body** (`null` for missing data, also with
   `"GET"`). For a clean GET of JSON: `JSON.decode(HTTP.post(url, "",
   headers, "GET"))`.
8. **`JSON.encode` writes non-ASCII as `\xHH`** (`"ă"` → `"\xC4\x83"`),
   which non-XYO servers reject. For them convert with the
   `jsonEncodeStandard` recipe and send with `HTTP.post(url, text,
   "Content-Type: application/json")`.
9. **`post` / `postRequest` data must be a String** (`data.length` is the
   `Content-Length`; a number sends `Content-Length: undefined`). Strings
   are bytes; nothing is transcoded or encoded — encode query values with
   `URL.encodeComponent`.
10. **`postRequest` is not standard multipart** (delimiters without `--`,
    no closing `--`); only for servers written for it (same format as
    `HTTPS.postRequest`). For real forms build the body with `--boundary`
    lines and send it with `HTTP.post` (recipe in `docs/recipes.md`).
11. **`downloadFile` without `fileName`** uses `Shell.getFileName(path)`
    and loads `Shell` itself (a host without `Shell` throws
    `Unable to open "Shell"`); a path ending in `/` gives no name and
    `false`. The file is created before the body
    arrives: download to `name.part`, verify, then `Shell.rename`.
12. **Call as methods**: `HTTP.json(...)`, never a detached
    `var f = HTTP.json` (the functions use `this`).
13. **Everything blocks, no timeouts.** Connect and reads wait until the
    server answers or closes. For timeouts use `Socket` + `waitToRead`, or
    run requests in a `Thread` / `Job`. Each thread requires `HTTP` itself
    and has its own `HTTP.buffer`.
14. **Default port 80** is added when the host has no port, IPv6 literals
    included (`http://[::1]/` connects to `[::1]:80`).
15. **Hosts**: dynamic `quantum-script` (needs the `File`, `Socket`, `URL`,
    `JSON`, `Buffer` DLLs too) and magnet (internal). **Not** fabricare
    build scripts and not the static `quantum-script`
    (`Unable to open "HTTP"`): run a separate `quantum-script` process there.
16. Quantum Script syntax: `typeof(x)` with parentheses, `var` only, blocks
    end with `};`, `substring(start, length)`, no `text[i]` indexing, no hex
    literals, `throw(new Error("..."))` (`Error("...")` without `new`
    throws `setPropertyBySymbol` instead of your message).

## Patterns

```javascript
// query string
var q = "q=" + URL.encodeComponent("a b") + "&lang=ro";
var res = HTTP.json("http://127.0.0.1:8080/search?" + q, null, null, "GET");

// result checks
if (Script.isNull(res)) { throw(new Error("connection failed")); };
if (Script.isUndefined(res)) { throw(new Error("not JSON")); };

// several headers
var headers = ["Authorization: Bearer " + token, "Accept: application/json"].join("\r\n");

// verified download
Script.requireExtension("Shell");
Script.requireExtension("SHA256");
if (!HTTP.downloadFile(url, "app.zip.part")) { throw(new Error("cannot connect")); };
if (SHA256.fileHash("app.zip.part") != expected) { Shell.remove("app.zip.part"); throw(new Error("bad download")); };
Shell.remove("app.zip"); Shell.rename("app.zip.part", "app.zip");
```

Test against a local echo server (`docs/recipes.md`, Python
`http.server`) to see exactly what is sent.

## C++

```cpp
#include <XYO/QuantumScript.Extension/HTTP.hpp>
using namespace XYO::QuantumScript;

void initExecutive(Executive *executive) {                  // host init callback
	Extension::Buffer::registerInternalExtension(executive);
	Extension::File::registerInternalExtension(executive);
	Extension::Socket::registerInternalExtension(executive);
	Extension::URL::registerInternalExtension(executive);
	Extension::JSON::registerInternalExtension(executive);
	Extension::Shell::registerInternalExtension(executive);  // optional: downloadFile default name
	Extension::HTTP::registerInternalExtension(executive);  // scripts still requireExtension("HTTP")
};
```

- `fabricare.json` dependency `"quantum-script--http"` brings only
  `quantum-script` and `quantum-script--console`; also list
  `quantum-script--buffer`, `--file`, `--socket`, `--url`, `--json`
  (`--shell`) when registering them. `dll-or-lib`: static library on static
  platforms, no `.static` project, no `quantumScriptExtension` entry point
  there (`XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY` also removes it).
- No native functions and no C++ HTTP API: `initExecutive` sets metadata and
  runs `executive->compileStringX(librarySource)`. From C++ call the script
  function with `functionApply(http, arguments)` (this = `HTTP`) or use
  `XYO::Networking::Socket`.

## Working in this repository

- Build: `fabricare make`, `fabricare test`, `fabricare install` (see the
  `fabricare` skill). `quantum-script` and `quantum-script--console` must be
  installed first; the run-time dependencies (`--buffer`, `--file`,
  `--socket`, `--url`, `--json`, `--shell`, `--shellfind`) to test.
  `test/test.01.cpp` is a host that runs `test/test.01.js` (argument
  handling, no server) against the library in `output/`; add checks with
  `check(name, value, expected)`. For what goes on the wire use the local
  echo server from `docs/recipes.md`.
- `fabricare/make.prepare.js` regenerates `HTTP/Library.Source.cpp` from
  `HTTP/Library.js` (`file-to-cs ... --name=librarySource`) before each
  build. Edit `Library.js`, never `Library.Source.cpp`.
- Keep `HTTPS` in `quantum-script--openssl` (`OpenSSL/Library.js`, a copy of
  this code over `OpenSSL.sslConnect`) in step when changing behavior.
  `quantum-script--magnet` registers `HTTP` as internal.
- Behavior changes: update `README.md`, `docs/script-api.md`,
  `docs/reference.md`, `docs/recipes.md` when relevant, `CHANGELOG.md`, and
  this skill.
- Code style: tabs (width 8), `.clang-format`, CRLF, statements and blocks
  end with `};`, camelCase. SPDX header: MIT for `source/` and `docs/`,
  Unlicense for `test/`, `fabricare/` and `.claude/` (see `.reuse/dep5`).

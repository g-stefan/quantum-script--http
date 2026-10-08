# API reference

## Script

Available after `Script.requireExtension("HTTP")` (which also loads `File`,
`Socket`, `URL`, `JSON` and `Buffer`). Call the functions as methods of
`HTTP`: they use `this`.

| Symbol | Returns | Notes |
|--------|---------|-------|
| `HTTP` | Object | plain object |
| `HTTP.buffer` | Buffer | 128 KB read buffer, shared by every call in this thread |
| `HTTP.decodeHeaderLine(headerLine)` | `[name, value]` or `false` | split at the first `:` (position > 0), value trimmed |
| `HTTP.json(url, data, headers, mode)` | decoded value, `undefined`, or `null` | body `JSON.encode(data)`, `Content-Type: application/json`; default `POST`; `undefined` = body not JSON; `null` = no connection / not `http://` |
| `HTTP.post(url, data, headers, mode)` | String or `null` | `data` must be a String; `Content-Type: text/plain` unless `headers` contains `Content-Type:`; default `POST` |
| `HTTP.postRequest(url, data, headers, mode)` | String or `null` | `data` as multipart field `request`, fixed boundary, non-standard layout; default `POST` |
| `HTTP.downloadFile(url, fileName, headers, mode, content)` | `true` / `false` | body to `fileName` (default: file name of the URL path, loads `Shell`); default `GET`; `content` sent without `Content-Length`; `true` also for error pages |

### Arguments

| Argument | Rules |
|----------|-------|
| `url` | `http://` (any case), host, optional `:port` (default 80), path, optional `?query`; sent unencoded; `https://` and no `://` → `null` / `false` |
| `headers` | `null` / `undefined`, or one String of header lines joined with `"\r\n"`, without a trailing `"\r\n"` |
| `mode` | HTTP method, upper-cased; `null` / `undefined` → default |
| `data` | `json`: any value; `post` / `postRequest`: String (bytes) |

### Results by situation

| Situation | `json` | `post`, `postRequest` | `downloadFile` |
|-----------|--------|-----------------------|----------------|
| `200` with a JSON body | value | body text | `true`, file written |
| `200` with a non-JSON body | `undefined` | body text | `true` |
| `404` / `500` with a body | `undefined` (or the JSON error object) | body text | `true`, the error page is the file |
| `302` / `204`, empty body | `undefined` | `""` | `true`, empty file |
| connection dropped early | decode of the partial body (usually `undefined`) | partial text | `true`, partial file |
| connection refused, unknown host | `null` | `null` | `false` |
| `https://...`, `ftp://...` | `null` | `null` | `false` |
| `http:///path` (empty host) | `null` | `null` | `false` |
| `"example.com/path"` (no `://`) | `null` | `null` | `false` |
| `fileName` cannot be opened | — | — | `false` |
| no `fileName`, URL path ends in `/` | — | — | `false` |
| no `fileName`, `Shell` not available | — | — | throws |

### Requests sent

| Function | Request |
|----------|---------|
| `json` | `MODE path[?query] HTTP/1.0`, `Host`, *headers*, `Connection: close`, `Content-Type: application/json`, `Content-Length: n`, empty line, JSON body |
| `post` | `MODE path[?query] HTTP/1.0`, `Host`, *headers*, `Connection: close`, [`Content-Type: text/plain`], `Content-Length: n`, empty line, `data` |
| `postRequest` | `MODE path[?query] HTTP/1.0`, `Host`, *headers*, `Connection: close`, `Content-Type: multipart/form-data; boundary=---===68b0...56b4`, `Content-Length: n`, empty line, boundary, `Content-Disposition: form-data; name="request"`, empty line, `data`, boundary |
| `downloadFile` | `MODE path[?query] HTTP/1.0`, `Host`, `Connection: close`, *headers*, empty line, [`content`] |

### Errors

| Message | Cause |
|---------|-------|
| `Unable to open "HTTP"` | the extension library was not found and no internal one is registered (static `quantum-script`, fabricare) |
| `Unable to open "File"` / `"Socket"` / `"URL"` / `"JSON"` | a dependency of `HTTP` is missing |
| `Unable to open "Shell"` | `downloadFile` without `fileName` in a host without the `Shell` extension |
| `"decodeHeaderLine" is not a function` | a function was called detached from `HTTP` (`var f = HTTP.json; f(...)`) |

Network problems never throw: they give `null` / `false`.

## Hosts

| Host | `HTTP` |
|------|--------|
| `quantum-script`, dynamic SDK | yes (DLL, with the `File`, `Socket`, `URL`, `JSON`, `Buffer` DLLs) |
| `quantum-script`, static SDK | no |
| fabricare build scripts | no |
| magnet | yes, internal |

## C++

Namespace `XYO::QuantumScript::Extension::HTTP`, umbrella header
`<XYO/QuantumScript.Extension/HTTP.hpp>`.

### Library (`HTTP/Library.hpp`)

| Symbol | Notes |
|--------|-------|
| `void registerInternalExtension(Executive *executive)` | register `"HTTP"` as an internal extension (register `Buffer`, `File`, `Socket`, `URL`, `JSON` too) |
| `void initExecutive(Executive *executive, void *extensionId)` | extension init, run by the engine: metadata, then `compileStringX(librarySource)` |
| `extern "C" void quantumScriptExtension(Executive *, void *)` | DLL entry point (not in static builds) |

### Metadata

| Symbol | Notes |
|--------|-------|
| `Version::version()`, `Version::build()`, `Version::versionWithBuild()`, `Version::datetime()` | from `version.json` |
| `Copyright::copyright()`, `Copyright::publisher()`, `Copyright::company()`, `Copyright::contact()` | |
| `License::license()`, `License::shortLicense()` | MIT text |

`Version`, `Copyright` and `License` exist in every XYO library: qualify them
(`Extension::HTTP::Version::versionWithBuild()`).

### Build configuration

| Name | Meaning |
|------|---------|
| `quantum-script--http` | fabricare project, `dll-or-lib`; dependencies `quantum-script`, `quantum-script--console` |
| `fabricare/make.prepare.js` | `file-to-cs`: `Library.js` → `Library.Source.cpp` (`librarySource`) |
| `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_EXPORT` | export / import macro |
| `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_INTERNAL` | defined while building the DLL (from `QUANTUM_SCRIPT__HTTP_INTERNAL`) |
| `XYO_QUANTUMSCRIPT_EXTENSION_HTTP_LIBRARY` | empty export macro, no DLL entry point |

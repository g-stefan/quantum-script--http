# Quantum Script Extension HTTP — Documentation

`quantum-script--http` is the **plain HTTP client of Quantum Script**.
Loaded with `Script.requireExtension("HTTP")`, it adds an `HTTP` object to
scripts with a few one-call helpers: send JSON and get JSON back, post text
and get the response text, post a single multipart field, and download a
URL to a file.

The extension is written in Quantum Script itself (`HTTP/Library.js`,
compiled into the library). Each call opens a TCP connection with the
`Socket` extension, writes an **HTTP/1.0** request with
`Connection: close`, reads the response headers to find `Content-Length`,
reads the body and closes the connection.

- **`HTTP.json(url, data, headers, mode)`** — send `JSON.encode(data)`
  (`POST` by default), return the decoded JSON response.
- **`HTTP.post(url, data, headers, mode)`** — send a text body
  (`text/plain` unless you give a `Content-Type`), return the response body
  as a string.
- **`HTTP.postRequest(url, data, headers, mode)`** — send `data` as a
  multipart field named `request` in the fixed format also used by
  `HTTPS.postRequest`, return the response body.
- **`HTTP.downloadFile(url, fileName, headers, mode, content)`** — write the
  response body to a file (`GET` by default), return `true` / `false`.
- **`HTTP.decodeHeaderLine(line)`** and **`HTTP.buffer`** — the helpers the
  functions above use.

```
scripts: quantum-script .js, magnet, hosts that register the extension
quantum-script--http      <-- this extension: HTTP.json / post / postRequest / downloadFile (Library.js)
quantum-script--socket    (Socket: TCP connection)      quantum-script--url  (URL: scheme, host, path, query)
quantum-script--json      (JSON: encode / decode)       quantum-script--file (File: write the download)
quantum-script--buffer    (Buffer: 128 KB read buffer, loaded by Socket and File)
quantum-script            (Executive, script engine)
xyo-networking, xyo-system, xyo-encoding, ... , xyo-platform
```

## Why it exists

| Need | What `HTTP` gives |
|------|-------------------|
| Call a JSON web service from a script (build servers, local tools, internal APIs) | `HTTP.json(url, data)`, one call, decoded result |
| Post text, form data or a hand made body | `HTTP.post(url, body, "Content-Type: ...")` |
| Fetch a file (release archive, data file) to disk | `HTTP.downloadFile(url, fileName)`, any size, streamed through a 128 KB buffer |
| Talk to a server with custom methods or headers | `mode` (`"PUT"`, `"DELETE"`, ...) and `headers` on every function |
| Same code for TLS endpoints | the `OpenSSL` extension defines `HTTPS.json` / `post` / `postRequest` / `downloadFile` with the same shape |

It is deliberately small: no TLS, no redirects, no status code, no
response headers, no timeouts, no keep-alive, no chunked transfer. When you
need any of those, use `Socket` directly (see
[Recipes](recipes.md#full-response-status-headers-timeout)) or `HTTPS`
from `quantum-script--openssl` for TLS.

## Concepts at a glance

| Need | Use | Notes |
|------|-----|-------|
| Load the extension | `Script.requireExtension("HTTP");` | also loads `File`, `Socket`, `URL`, `JSON`, `Buffer` (`Shell` only when `downloadFile` needs it) |
| JSON request / response | `HTTP.json(url, data)` | `POST`, `Content-Type: application/json`; result `undefined` when the body is not JSON |
| JSON with another method | `HTTP.json(url, data, null, "PUT")` | `mode` is upper-cased; `data` is always sent, `null` if missing |
| Text body | `HTTP.post(url, text)` | `Content-Type: text/plain` unless `headers` contains `Content-Type:` |
| Download | `HTTP.downloadFile(url, "file.zip")` | `true` also for `404` pages: check the content |
| Extra headers | `"X-A: 1\r\nX-B: 2"` | one string, lines joined with `"\r\n"`, **no** trailing `"\r\n"` |
| Connection failed / not `http://` | `null` (`json`, `post`, `postRequest`), `false` (`downloadFile`) | also for a URL without `://` |
| TLS | `Script.requireExtension("OpenSSL")`, `HTTPS.json(...)` | `HTTP.*` returns `null` / `false` for `https://` |

Read [Script API](script-api.md) before relying on a result: the functions
ignore the HTTP status code, so an error page is returned (or saved) like
any other body.

## Contents

| Document | What it covers |
|----------|----------------|
| [Getting started](getting-started.md) | Build and install, load the extension from a script, which hosts have it, register it in a C++ host, threads |
| [Script API](script-api.md) | Every function: the exact request it sends, how the response is read, return values, errors, limits |
| [Recipes](recipes.md) | Query strings, form posts, standard JSON for non-ASCII text, multipart uploads, safe downloads, status code and timeouts with `Socket`, HTTPS, testing against a local server |
| [C++ API](cpp-api.md) | `registerInternalExtension`, `initExecutive`, the dependencies a host must register, how `Library.js` is built in, notes for maintainers |
| [API reference](reference.md) | Every script and C++ symbol on one page |

Quantum Script itself (the language, `Script.requireExtension`, embedding,
writing extensions) is documented in the `quantum-script` repository,
`docs/`; `Socket`, `URL`, `JSON`, `File` and `Buffer` in their own
repositories (`quantum-script--socket`, `quantum-script--url`, ...),
`docs/`.

## Source map

```
source/XYO/QuantumScript.Extension/HTTP.hpp            umbrella header, include this from C++
source/XYO/QuantumScript.Extension/HTTP.Amalgam.cpp    the whole extension in one translation unit
source/XYO/QuantumScript.Extension/HTTP/
    Dependency.hpp                                     <XYO/QuantumScript.hpp>, export macro
    Library.js                                         the HTTP object: every script function
    Library.Source.cpp                                 generated from Library.js (librarySource)
    Library[.hpp/.cpp]                                 initExecutive, registerInternalExtension,
                                                       quantumScriptExtension DLL entry point
    Copyright / License / Version                      library metadata
fabricare/make.prepare.js                              file-to-cs: Library.js -> Library.Source.cpp
```

## AI assistant skill

A Claude Code skill describing how to use this extension lives in
[`.claude/skills/quantum-script--http/`](../.claude/skills/quantum-script--http/SKILL.md).
It is picked up automatically inside this repository; copy the folder to
`~/.claude/skills/` to have it available in the projects that use `HTTP`
(Quantum Script tools, magnet scripts, hosts, other extensions).

# Quantum Script Extension HTTP

Quantum Script extension
- Plain `http://` client for scripts: one call per request, HTTP/1.0 with
`Connection: close`.
- Send JSON and get the decoded JSON answer (`HTTP.json`).
- Post text, form data or any hand made body and get the response text
(`HTTP.post`, `HTTP.postRequest`).
- Download a URL to a file of any size (`HTTP.downloadFile`).
- Custom methods (`PUT`, `DELETE`, ...) and headers on every call.

```javascript
Script.requireExtension("HTTP");

HTTP;
HTTP.buffer;
HTTP.decodeHeaderLine(headerLine);
HTTP.json(url,data,headers,mode);
HTTP.downloadFile(url,fileName,headers,mode,content);
HTTP.postRequest(url,data,headers,mode);
HTTP.post(url,data,headers,mode);
```

Written in Quantum Script on top of `quantum-script--socket`,
`quantum-script--url`, `quantum-script--json` and `quantum-script--file`,
part of the XYO C++ SDK. For `https://` use `HTTPS` from
`quantum-script--openssl`.

## Documentation

- [Overview](docs/README.md) - purpose and design
- [Getting started](docs/getting-started.md) - build, load from a script, hosts, register in a C++ host, static builds
- [Script API](docs/script-api.md) - every function: the request sent, how the response is read, results, limits
- [Recipes](docs/recipes.md) - query strings, JSON, auth, forms, multipart, safe downloads, status code and timeouts, HTTPS, local testing
- [C++ API](docs/cpp-api.md) - `registerInternalExtension`, run-time dependencies, `Library.js`, notes for maintainers
- [API reference](docs/reference.md)

A Claude Code skill for this extension is in
[.claude/skills/quantum-script--http](.claude/skills/quantum-script--http/SKILL.md).

## License

Copyright (c) 2016-2026 Grigore Stefan
Licensed under the [MIT](LICENSE) license.

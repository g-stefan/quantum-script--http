# Script API

```javascript
Script.requireExtension("HTTP");

HTTP;                                                     // plain object, typeof(HTTP) == "Object"
HTTP.buffer;                                              // Buffer, size 128 * 1024, shared by all calls
HTTP.decodeHeaderLine(headerLine);                        // [name, value] or false
HTTP.json(url, data, headers, mode);                      // decoded JSON, undefined, or null
HTTP.post(url, data, headers, mode);                      // response body String, or null
HTTP.postRequest(url, data, headers, mode);               // response body String, or null
HTTP.downloadFile(url, fileName, headers, mode, content); // true / false
```

All functions use `this` (`this.buffer`, `this.decodeHeaderLine`): call them
as `HTTP.name(...)`. A detached copy (`var f = HTTP.json; f(...)`) throws
`"decodeHeaderLine" is not a function`.

## Common behavior

Every request function works the same way:

1. **URL checks.** `URL.getSchemeName(url).toUpperCaseASCII()` must be
   `"HTTP"` (any case: `HTTP://` works). Anything else — `https://`,
   `ftp://` — and a URL **without `://`** return `null` (`downloadFile`:
   `false`). An empty host (`http:///x`) returns `null` / `false`.
2. **Address.** The socket connects to `URL.getHostNameAndPort(url)`, with
   `":80"` appended when there is no port, also for an IPv6 literal
   (`http://[::1]/` connects to `[::1]:80`). Name resolution and connect
   block with no timeout.
3. **Request line.** `MODE path?query HTTP/1.0`, where `path` is
   `URL.getPathAndFileName(url)` and `?query` is added when
   `URL.getQuery(url)` is not empty. Nothing is encoded for you (build query
   values with `URL.encodeComponent`). A `#fragment` is sent as part of the
   path when the URL has no query (`/a#frag`). `mode` is upper-cased; missing
   (`null` / `undefined`) means `POST` for `json` / `post` / `postRequest`
   and `GET` for `downloadFile`. Any method text is accepted.
4. **Headers.** `Host: <host[:port] as written in the URL>`, then the
   function's own headers and your `headers` (order below), then an empty
   line. User info in the URL (`http://user:pass@host/`) is **not** sent:
   add an `Authorization` header yourself.
5. **Response.** Header lines are read with `socket.readLn(1024)` until an
   empty line (`"\r\n"`) or the end of the stream. Only `Content-Length`
   (any case) is used; everything else, including the status line, is
   ignored. The body is then read into `HTTP.buffer` (128 KB at a time) until
   `Content-Length` bytes arrived, or — without that header — until the
   server closes the connection (it does: the request says
   `Connection: close`).
6. **No status code check.** A `404`, `500` or `302` answer is handled like
   `200`: its body is returned or saved. Redirects are not followed.

### The `headers` argument

`headers` is **one string** written with `socket.writeLn(headers)`. For
several headers join the lines with `"\r\n"`:

```javascript
var headers = ["Authorization: Bearer " + token, "Accept: application/json"].join("\r\n");
```

Never end it with `"\r\n"`: `writeLn` adds another line end, the empty line
ends the header block early, and the function's own headers
(`Connection`, `Content-Type`, `Content-Length`) and the body are sent as
garbage after it. A server then sees no body (tested: `HTTP.json(url, {x: 1},
"X-A: 1\r\n")` reaches the server with only `Host` and `X-A`). An array or
object is converted with `toString` (`"a,b"`, `"Object"`), not as lines.

| Function | Header order |
|----------|--------------|
| `json` | `Host`, *headers*, `Connection: close`, `Content-Type: application/json`, `Content-Length` |
| `post` | `Host`, *headers*, `Connection: close`, `Content-Type: text/plain` (only when *headers* has no `Content-Type:`), `Content-Length` |
| `postRequest` | `Host`, *headers*, `Connection: close`, `Content-Type: multipart/form-data; boundary=...`, `Content-Length` |
| `downloadFile` | `Host`, `Connection: close`, *headers* (no `Content-Type` / `Content-Length` added) |

A `Content-Type` passed to `json` or `postRequest` is sent **in addition** to
theirs (two `Content-Type` headers). The test in `post` is case sensitive:
`content-type: ...` in lower case still gets `Content-Type: text/plain`
added.

### Bodies are bytes

Strings are byte strings: `data.length` is the byte count written to
`Content-Length`, and nothing is transcoded. UTF-8 text from scripts is sent
as UTF-8. Response bodies are returned as received; `Convert.toString`
turns each 128 KB buffer into string bytes, zero bytes included.

## `HTTP.json(url, data, headers, mode)`

Sends `JSON.encode(data)` as the body and returns `JSON.decode` of the
response body.

```javascript
var user = HTTP.json("http://127.0.0.1:8080/api/user", {id: 42});
var list = HTTP.json("http://127.0.0.1:8080/api/items?page=2", null, null, "GET");
var done = HTTP.json("http://127.0.0.1:8080/api/item/7", {state: "done"}, "Authorization: Bearer " + token, "PUT");
```

| Argument | Meaning |
|----------|---------|
| `url` | `http://host[:port]/path[?query]` |
| `data` | any value; always encoded and sent, also for `GET` (`undefined` / `null` → body `null`, 4 bytes) |
| `headers` | optional extra header lines (see above) |
| `mode` | optional method, default `"POST"` |

| Result | When |
|--------|------|
| decoded value (`Object`, `Array`, `String`, number, `true` / `false`, `null` for a `null` body) | the body is JSON (`JSON.decode` is lenient: text after the first value is ignored) |
| `undefined` | the body is empty or not JSON — typical for error pages (`404 not here`), redirects, `204` |
| `null` | not an `http://` URL (also without `://`), empty host, or the connection failed |

`null` is ambiguous: it is both "no connection" and a JSON body `null`. When
that matters, use `HTTP.post` and decode yourself.

**Non-ASCII text is not sent as standard JSON.** `JSON.encode` writes every
byte outside printable ASCII as a C escape (`"ă"` → `"\xC4\x83"`). `JSON.decode`
reads that back, but strict JSON parsers (Python, browsers, jq, most web
frameworks) reject `\x`. For servers outside the XYO stack, convert the
text and send it with `HTTP.post` — see
[Recipes](recipes.md#standard-json-for-non-ascii-text). Responses with
`\uXXXX` escapes or raw UTF-8 are decoded correctly.

## `HTTP.post(url, data, headers, mode)`

Sends `data` as the body and returns the response body as a string.

```javascript
var reply = HTTP.post("http://127.0.0.1:8080/log", "line of text");
var form = HTTP.post("http://127.0.0.1:8080/login", "user=ana&pass=x", "Content-Type: application/x-www-form-urlencoded");
var json = JSON.decode(HTTP.post(url, jsonText, "Content-Type: application/json"));
var page = HTTP.post("http://127.0.0.1:8080/", "", null, "GET");   // GET with an empty body
```

| Argument | Meaning |
|----------|---------|
| `data` | a **String** (a number has no `length`: `Content-Length: undefined` is sent and the server rejects it) |
| `headers` | optional; include `Content-Type: ...` to replace `text/plain` |
| `mode` | optional method, default `"POST"` |

| Result | When |
|--------|------|
| String (possibly `""`) | the server answered; the body of any status code |
| `null` | not an `http://` URL (also without `://`), empty host, or the connection failed |

## `HTTP.postRequest(url, data, headers, mode)`

Sends `data` wrapped as one multipart field named `request` and returns the
response body as a string (results as for `post`). The body is exactly:

```
Content-Type: multipart/form-data; boundary=---===68b0cd10b99337fb5ae7bf88dd0c34e39ce26281ae8351a70ed0a0394e1a56b4

---===68b0cd10b99337fb5ae7bf88dd0c34e39ce26281ae8351a70ed0a0394e1a56b4\r\n
Content-Disposition: form-data; name="request"\r\n
\r\n
<data>---===68b0cd10b99337fb5ae7bf88dd0c34e39ce26281ae8351a70ed0a0394e1a56b4
```

This is **not** RFC 7578 multipart: the delimiter lines lack the leading
`--`, there is no line end before the final boundary and no closing `--`.
Standard parsers (PHP, Python, most frameworks) do not find the field.
`HTTPS.postRequest` in `quantum-script--openssl` sends the same format, so
it is meant for servers written to read it (or that read the raw body). For
a normal form upload build the body yourself and send it with `HTTP.post`
([Recipes](recipes.md#multipart-form-upload)). `data` must not contain the
boundary text.

## `HTTP.downloadFile(url, fileName, headers, mode, content)`

Writes the response body to `fileName` and returns `true`.

```javascript
Script.requireExtension("Shell");                                    // only for the default file name
HTTP.downloadFile("http://127.0.0.1:8080/files/data.zip", "data.zip");
HTTP.downloadFile("http://127.0.0.1:8080/files/data.zip");           // saves as "data.zip"
HTTP.downloadFile(url, "report.json", "Content-Type: application/json\r\nContent-Length: " + body.length, "POST", body);
```

| Argument | Meaning |
|----------|---------|
| `fileName` | target file, relative to the process working directory; created or truncated. Missing → `Shell.getFileName(URL.getPathAndFileName(url))` (`Shell` is loaded for that; a path ending in `/` gives no name and `false`, without connecting) |
| `headers` | optional extra header lines |
| `mode` | optional method, default `"GET"` |
| `content` | optional request body, written as is after the headers. **No `Content-Length` is added**: put it in `headers` |

| Result | When |
|--------|------|
| `true` | connected and `fileName` was opened: the body of **any** status code was written (a `404` page is saved as the file), possibly incomplete if the connection dropped |
| `false` | not an `http://` URL, empty host, connection failed, or `fileName` could not be opened (missing folder, no permission); no file is created |
| throws | no `fileName` and the `Shell` extension is not available (`Unable to open "Shell"`) |

Binary data is written unchanged (tested with a 300 000 byte body larger
than `HTTP.buffer`). The file is opened before the body arrives, so a failed
transfer leaves a partial file. Verify downloads (size, `SHA256.fileHash`) and
download to a temporary name first — see
[Recipes](recipes.md#safe-download).

## `HTTP.decodeHeaderLine(headerLine)`

Splits a header line at its first `:`.

| Call | Result |
|------|--------|
| `HTTP.decodeHeaderLine("Content-Type:  text/html \r\n")` | `["Content-Type", "text/html"]` (value trimmed, name kept as is) |
| `HTTP.decodeHeaderLine("HTTP/1.0 200 OK\r\n")` | `false` (no `:`) |
| `HTTP.decodeHeaderLine(":x")` | `false` (`:` at position 0) |

## `HTTP.buffer`

A `Buffer` of `128 * 1024` bytes created when the extension loads. Every call
reads the response into it; after a call `HTTP.buffer.length` is the size of
the last chunk. Do not keep references to its content between calls, and do
not resize it while a request runs. Each thread has its own.

## Limits

| Not supported | Instead |
|---------------|---------|
| TLS / `https://` (returns `null` / `false`) | `HTTPS.*` from `quantum-script--openssl` |
| Status code, response headers | `Socket` ([recipe](recipes.md#full-response-status-headers-timeout)) |
| Redirects (`301`, `302`, ...) | read `Location` with the `Socket` recipe and call again |
| Timeouts (connect and reads block until the server closes) | `Socket.waitToRead` in the `Socket` recipe; run requests in a `Thread` / `Job` |
| Chunked transfer, keep-alive, HTTP/1.1 | not needed: requests are HTTP/1.0 with `Connection: close`, so servers answer with a plain body and close |
| Proxies, cookies, compression | headers by hand (`Cookie: ...`); no `Accept-Encoding` is sent, so servers answer uncompressed |
| Streaming upload of large files | `Socket.writeFromBuffer` with `File.readToBuffer` |

Header parsing details: a header line longer than 1024 bytes is read in
pieces (harmless, unless a piece boundary leaves a lone `"\r\n"`, which ends
the headers early); a server that ends headers with a bare `"\n"` line is not
detected and its body is read as headers.

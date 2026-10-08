# Recipes

Every recipe was run with `quantum-script` against a local Python server.
They assume:

```javascript
Script.requireExtension("Console");
Script.requireExtension("Shell");
Script.requireExtension("HTTP");
```

Quantum Script rules apply (see the `quantum-script` documentation): `var`
only, `typeof(x)` with parentheses, statements and blocks end with `;`,
`substring(start, length)` takes a length, no hex number literals (`32`, not
`0x20`), and strings cannot be indexed with `text[i]` (use
`text.substring(i, 1)`).

## Query strings

`HTTP` sends the URL as written; encode every name and value with
`URL.encodeComponent`.

```javascript
function buildQuery(params) {
	var query = "";
	for (var name in params) {
		if (query != "") {
			query += "&";
		};
		query += URL.encodeComponent(name) + "=" + URL.encodeComponent(params[name]);
	};
	return query;
};

var url = "http://127.0.0.1:8080/search?" + buildQuery({q: "a b", lang: "ro"});
// http://127.0.0.1:8080/search?q=a%20b&lang=ro
```

## GET a JSON resource

`HTTP.json` always sends a body. For a plain `GET` use `HTTP.post` with an
empty body and decode the answer yourself — this also tells "no connection"
apart from "not JSON":

```javascript
function getJSON(url, headers) {
	var text = HTTP.post(url, "", headers, "GET");
	if (Script.isNull(text)) {
		throw(new Error("cannot connect to " + url));
	};
	var value = JSON.decode(text);
	if (Script.isUndefined(value)) {
		throw(new Error("not JSON from " + url + ": " + text.substring(0, 200)));
	};
	return value;
};

var items = getJSON("http://127.0.0.1:8080/api/items?page=2", "Accept: application/json");
```

## POST JSON and check the result

```javascript
var result = HTTP.json("http://127.0.0.1:8080/api/jobs", {name: "build", priority: 2});
if (Script.isNull(result)) {
	throw(new Error("connection failed"));
};
if (Script.isUndefined(result)) {
	throw(new Error("server did not answer with JSON (error page?)"));
};
if (!Script.isUndefined(result.error)) {
	throw(new Error("server error: " + result.error));
};
```

The status code is not available: let the server put errors in the JSON
body, or use the [Socket recipe](#full-response-status-headers-timeout).

## Several headers, authentication

```javascript
Script.requireExtension("Base64");

var headers = [
	"Authorization: Basic " + Base64.encode("user:secret"),
	"Accept: application/json",
	"X-Request-Id: 1234"
].join("\r\n");                                 // no trailing "\r\n"

var reply = HTTP.json("http://127.0.0.1:8080/api/me", null, headers, "GET");

var bearer = "Authorization: Bearer " + token;  // token from a file or the environment, never from the script text
```

Plain HTTP sends credentials in clear text: use them only on `127.0.0.1`,
a private network, or switch to `HTTPS` (below).

## Form post

```javascript
var body = buildQuery({user: "ana", note: "x&y=z"});   // user=ana&note=x%26y%3Dz
var text = HTTP.post("http://127.0.0.1:8080/form", body, "Content-Type: application/x-www-form-urlencoded");
```

## Standard JSON for non-ASCII text

`JSON.encode` writes bytes outside printable ASCII as `\xHH`, which most
servers reject. This helper turns the output into standard JSON (raw UTF-8,
`\u00HH` for control bytes); send it with `HTTP.post`:

```javascript
function jsonEncodeStandard(value) {
	var text = JSON.encode(value);
	var out = "";
	var start = 0;
	var scan = 0;
	var index;
	var hex;
	var code;
	for (;;) {
		index = text.indexOf("\\", scan);
		if (index < 0) {
			break;
		};
		if (text.substring(index + 1, 1) != "x") {
			scan = index + 2;                    // \\ \" \n \r \t stay as they are
			continue;
		};
		hex = text.substring(index + 2, 2);
		code = Convert.toNumber("0x" + hex);
		out += text.substring(start, index - start);
		if (code < 32 || code == 127) {
			out += "\\u00" + hex;
		} else {
			out += Convert.toString(Buffer.fromHex(hex));
		};
		scan = index + 4;
		start = scan;
	};
	return out + text.substring(start);
};

var text = HTTP.post("http://127.0.0.1:8080/api/notes", jsonEncodeStandard({title: "Notă în română"}), "Content-Type: application/json");
var reply = JSON.decode(text);
```

The output parses with Python's `json.loads` and decodes back to the same
value with `JSON.decode`.

## Multipart form upload

`HTTP.postRequest` uses a fixed, non-standard multipart layout (see
[Script API](script-api.md#httppostrequesturl-data-headers-mode)). For
servers that expect RFC 7578 `multipart/form-data`, build the body:

```javascript
function multipartBody(boundary, fields) {
	var out = "";
	for (var name in fields) {
		out += "--" + boundary + "\r\n";
		out += "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n";
		out += fields[name] + "\r\n";
	};
	return out + "--" + boundary + "--\r\n";
};

var boundary = "qs-boundary-5f1c0e9a7b3d";      // must not occur in the field values
var text = HTTP.post("http://127.0.0.1:8080/upload",
	multipartBody(boundary, {request: "payload", other: "2"}),
	"Content-Type: multipart/form-data; boundary=" + boundary);
```

For a file field add `; filename="name.bin"` to the disposition and a
`Content-Type: application/octet-stream` line, and use
`Shell.fileGetContents(fileName)` as the value (the whole file is held in
memory).

## Safe download

`downloadFile` returns `true` for error pages and partial transfers. Download
to a temporary name, verify, then rename:

```javascript
Script.requireExtension("SHA256");

function download(url, fileName, expectedSHA256) {
	var temp = fileName + ".part";
	Shell.remove(temp);
	if (!HTTP.downloadFile(url, temp)) {
		return false;
	};
	if (!Script.isNil(expectedSHA256)) {
		if (SHA256.fileHash(temp) != expectedSHA256.trim().toLowerCaseASCII()) {
			Shell.remove(temp);
			return false;
		};
	};
	Shell.remove(fileName);
	return Shell.rename(temp, fileName);
};

if (!download("http://127.0.0.1:8080/release/app.zip", "app.zip", expected)) {
	throw(new Error("download failed or checksum mismatch"));
};
```

Without a published checksum, at least check the size
(`Shell.getFileSize(temp)`) or the first bytes of the file (a zip starts with
`PK`, an HTML error page with `<`).

## Full response: status, headers, timeout

When you need the status code, the response headers, redirects or a
timeout, talk HTTP with `Socket` directly. `timeout` is in seconds for each
wait for data (`null` = wait forever); the result is `undefined` when the
connection fails, times out or the answer is not HTTP.

```javascript
function httpRequest(url, method, headers, body, timeout) {
	var socket = new Socket();
	var host = URL.getHostNameAndPort(url);
	var target = URL.getPathAndFileNameWithQuery(url);
	var result = {status: 0, headers: {}, body: ""};
	var wait = Script.isNil(timeout) ? -1 : timeout * 1000000;
	var data;
	var index;
	if (Script.isNull(host)) {
		return undefined;
	};
	if (host.indexOf(":") < 0) {
		host += ":80";
	};
	if (Script.isNull(target)) {
		target = "/";
	};
	if (!socket.openClient(host)) {
		return undefined;
	};
	socket.writeLn((Script.isNil(method) ? "GET" : method) + " " + target + " HTTP/1.0");
	socket.writeLn("Host: " + URL.getHostNameAndPort(url));
	socket.writeLn("Connection: close");
	if (!Script.isNil(headers)) {
		socket.writeLn(headers);
	};
	if (!Script.isNil(body)) {
		socket.writeLn("Content-Length: " + body.length);
	};
	socket.writeLn("");
	if (!Script.isNil(body)) {
		socket.write(body);
	};
	for (;;) {
		if (wait >= 0 && socket.waitToRead(wait) != 1) {
			socket.close();
			return undefined;
		};
		data = socket.read(32768);
		if (!Script.isString(data)) {
			break;
		};
		result.body += data;
	};
	socket.close();
	index = result.body.indexOf("\r\n\r\n");
	if (index < 0) {
		return undefined;
	};
	var head = result.body.substring(0, index).split("\r\n");
	result.body = result.body.substring(index + 4);
	result.status = Convert.toNumber(head[0].split(" ")[1]);
	for (var k = 1; k < head.length; ++k) {
		index = head[k].indexOf(":");
		if (index > 0) {
			result.headers[head[k].substring(0, index).toLowerCaseASCII()] = head[k].substring(index + 1).trim();
		};
	};
	return result;
};

var r = httpRequest("http://127.0.0.1:8080/missing", "GET", null, null, 10);
// r.status == 404, r.headers["content-length"] == "8", r.body == "not here"

r = httpRequest("http://127.0.0.1:8080/old");
if (r.status == 301 || r.status == 302) {
	r = httpRequest("http://127.0.0.1:8080" + r.headers["location"]);   // relative Location
};
```

The connect itself (`openClient`) still has no timeout. The whole response
is held in memory; for large files use `HTTP.downloadFile`.

## HTTPS

TLS is in `quantum-script--openssl`. It defines an `HTTPS` object with the
same functions and the same rules (default port 443):

```javascript
Script.requireExtension("OpenSSL");

var reply = HTTPS.json("https://api.example.com/v1/status", null, null, "GET");
HTTPS.downloadFile("https://example.com/file.zip", "file.zip");
```

Note the extra argument of `HTTPS.downloadFile(url, fileName, headers, mode,
extra, content)`: `extra` is unused, and the request body `content` is the
6th argument there, the 5th in `HTTP.downloadFile`.

To accept both schemes:

```javascript
function api(url, data) {
	if (URL.getSchemeName(url).toLowerCaseASCII() == "https") {
		return HTTPS.json(url, data);
	};
	return HTTP.json(url, data);
};
```

## Test against a local server

`fabricare test` only checks argument handling. A small Python server that
echoes the request is enough to see exactly what the extension sends:

```python
# echo.py — python echo.py 8080
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

class Echo(BaseHTTPRequestHandler):
    def handle_any(self):
        n = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(n) if n else b''
        out = json.dumps({'method': self.command, 'path': self.path,
                          'headers': [[k, v] for k, v in self.headers.items()],
                          'body': body.decode('latin-1')}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(out)))
        self.end_headers()
        self.wfile.write(out)
    do_GET = do_POST = do_PUT = do_DELETE = do_PATCH = handle_any

HTTPServer(('127.0.0.1', int(sys.argv[1])), Echo).serve_forever()
```

```javascript
Script.requireExtension("Console");
Script.requireExtension("HTTP");
Console.writeLn(JSON.encodeWithIndentation(HTTP.json("http://127.0.0.1:8080/echo?a=1", {x: 1})));
```

`python -m http.server 8080` serves the current folder for download tests.

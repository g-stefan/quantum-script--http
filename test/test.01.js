// Created by Grigore Stefan <g_stefan@yahoo.com>
// Public domain (Unlicense) <http://unlicense.org>
// SPDX-FileCopyrightText: 2016-2026 Grigore Stefan <g_stefan@yahoo.com>
// SPDX-License-Identifier: Unlicense

// Offline tests: argument handling, no server needed

Script.requireExtension("Console");
Script.requireExtension("HTTP");

function check(name, value, expected) {
	if (value !== expected) {
		Console.writeLn("test " + name + ": [" + value + "], expected [" + expected + "]");
		throw "test 01 failed";
	};
};

// helpers
check("decodeHeaderLine", HTTP.decodeHeaderLine("Content-Length: 12\r\n").join("|"), "Content-Length|12");
check("decodeHeaderLine.lower", HTTP.decodeHeaderLine("content-length:7").join("|"), "content-length|7");
check("decodeHeaderLine.none", HTTP.decodeHeaderLine("HTTP/1.0 200 OK\r\n"), false);
check("decodeHeaderLine.empty-name", HTTP.decodeHeaderLine(": x"), false);
check("buffer", HTTP.buffer.size, 128 * 1024);

// a URL without "://" returns null / false, it does not throw
check("json.no-scheme", HTTP.json("not a url", {}), null);
check("post.no-scheme", HTTP.post("not a url", "x"), null);
check("postRequest.no-scheme", HTTP.postRequest("not a url", "x"), null);
check("downloadFile.no-scheme", HTTP.downloadFile("not a url", "x.html"), false);

// only http://
check("json.https", HTTP.json("https://127.0.0.1/", {}), null);
check("post.https", HTTP.post("https://127.0.0.1/", "x"), null);
check("postRequest.https", HTTP.postRequest("https://127.0.0.1/", "x"), null);
check("downloadFile.https", HTTP.downloadFile("https://127.0.0.1/", "x.html"), false);
check("json.ftp", HTTP.json("ftp://127.0.0.1/", {}), null);

// connection refused
check("json.refused", HTTP.json("http://127.0.0.1:1/", {}), null);
check("post.refused", HTTP.post("http://127.0.0.1:1/", "x"), null);
check("postRequest.refused", HTTP.postRequest("http://127.0.0.1:1/", "x"), null);
check("downloadFile.refused", HTTP.downloadFile("http://127.0.0.1:1/x.html", "x.html"), false);

// the default file name loads Shell when needed
check("shell.before", typeof(Shell), "undefined");
check("downloadFile.default-name", HTTP.downloadFile("http://127.0.0.1:1/x.txt"), false);
check("shell.after", typeof(Shell), "Object");
// a path ending in "/" has no file name
check("downloadFile.no-file-name", HTTP.downloadFile("http://127.0.0.1:1/"), false);

Console.writeLn("-> test 01 ok");

//
// Quantum Script Extension HTTP
//
// Copyright (c) 2020-2021 Grigore Stefan <g_stefan@yahoo.com>
// Created by Grigore Stefan <g_stefan@yahoo.com>
//
// MIT License (MIT) <http://opensource.org/licenses/MIT>
//

Script.requireExtension("File");
Script.requireExtension("Socket");
Script.requireExtension("URL");
Script.requireExtension("JSON");

HTTP = {};

HTTP.buffer = new Buffer(128 * 1024);

HTTP.decodeHeaderLine = function(headerLine) {
	var x = headerLine.indexOf(":");
	if(x > 0) {
		return [headerLine.substring(0, x), headerLine.substring(x + 1).trim()];
	};
	return false;
};

HTTP.json = function(url, data, headers, mode) {
	var socket = new Socket();
	var decodedResponse;
	var contentLength;
	var host;
	var json = JSON.encode(data);
	var response;
	var header;

	if(URL.getSchemeName(url).toUpperCaseAscii() != "HTTP") {
		return null;
	};
	host = URL.getHostNameAndPort(url);
	if(!host) {
		return null;
	};

	if(host.indexOf(":") < 0) {
		host += ":80";
	};

	if(Script.isNil(mode)) {
		mode = "POST";
	};
	mode = mode.toUpperCaseAscii();

	if(socket.openClient(host)) {
		contentLength = Infinity;
		if(URL.getQuery(url)) {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + "?" + URL.getQuery(url) + " HTTP/1.1");
		} else {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + " HTTP/1.1");
		};
		socket.writeLn("Host: " + URL.getHostNameAndPort(url));
		if(!Script.isNil(headers)) {
			socket.writeLn(headers);
		};
		socket.writeLn("Connection: close");
		socket.writeLn("Content-Type: application/json");
		socket.writeLn("Content-Length: " + json.length);
		socket.writeLn("");
		socket.write(json);
		for(;;) {
			response = socket.readLn(1024);
			if(Script.isUndefined(response)) {
				break;
			};
			if(response.length == 0) {
				break;
			};
			if(response === "\r\n") {
				break;
			};
			decodedResponse = .decodeHeaderLine(response);
			if(decodedResponse) {
				if(decodedResponse[0] == "Content-Length") {
					contentLength = Convert.toNumber(decodedResponse[1]);
				};
			};
		};
		json = "";
		while(contentLength) {
			if(socket.readToBuffer(.buffer, contentLength)) {
				json += Convert.toString(.buffer);
				contentLength -= .buffer.length;
			} else {
				break;
			};
		};
		socket.close();
		return JSON.decode(json);
	};
	return null;
};

HTTP.downloadFile = function(url, fileName, headers, mode, content) {
	var socket = new Socket();
	var decodedResponse;
	var contentLength;
	var host;
	var response;
	var file;

	if(Script.isNil(fileName)) {
		fileName = Shell.getFileName(URL.getPathAndFileName(url));
	};

	if(URL.getSchemeName(url).toUpperCaseAscii() != "HTTP") {
		return false;
	};

	host = URL.getHostNameAndPort(url);
	if(!host) {
		return false;
	};

	if(host.indexOf(":") < 0) {
		host += ":80";
	};

	if(Script.isNil(mode)) {
		mode = "GET";
	};
	mode = mode.toUpperCaseAscii();

	if(socket.openClient(host)) {
		contentLength = Infinity;
		if(URL.getQuery(url)) {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + "?" + URL.getQuery(url) + " HTTP/1.1");
		} else {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + " HTTP/1.1");
		};
		socket.writeLn("Host: " + URL.getHostNameAndPort(url));
		socket.writeLn("Connection: close");
		if(!Script.isNil(headers)) {
			socket.writeLn(headers);
		};
		socket.writeLn("");
		if(!Script.isNil(content)) {
			socket.write(content);
		};
		for(;;) {
			response = socket.readLn(1024);
			if(Script.isUndefined(response)) {
				break;
			};
			if(response.length == 0) {
				break;
			};
			if(response === "\r\n") {
				break;
			};
			decodedResponse = .decodeHeaderLine(response);
			if(decodedResponse) {
				if(decodedResponse[0] == "Content-Length") {
					contentLength = Convert.toNumber(decodedResponse[1]);
				};
			};
		};
		file = new File();
		if(file.openWrite(fileName)) {
			while(contentLength) {
				if(socket.readToBuffer(.buffer, contentLength)) {
					file.writeFromBuffer(.buffer);
					contentLength -= .buffer.length;
				} else {
					break;
				};
			};
			file.close();
			return true;
		};
	};
	return false;
};

HTTP.post = function(url, data, headers, mode) {
	var socket = new Socket();
	var decodedResponse;
	var contentLength;
	var host;
	var response;
	var header;

	if(URL.getSchemeName(url).toUpperCaseAscii() != "HTTP") {
		return null;
	};
	host = URL.getHostNameAndPort(url);
	if(!host) {
		return null;
	};

	if(host.indexOf(":") < 0) {
		host += ":80";
	};

	if(Script.isNil(mode)) {
		mode = "POST";
	};
	mode = mode.toUpperCaseAscii();

	if(socket.openClient(host)) {
		contentLength = Infinity;
		if(URL.getQuery(url)) {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + "?" + URL.getQuery(url) + " HTTP/1.1");
		} else {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + " HTTP/1.1");
		};
		socket.writeLn("Host: " + URL.getHostNameAndPort(url));
		if(!Script.isNil(headers)) {
			socket.writeLn(headers);
		};

		socket.writeLn("Connection: close");
		if(Script.isNil(headers)) {
			socket.writeLn("Content-Type: text/plain");
		} else {
			if(headers.indexOf("Content-Type:") < 0) {
				socket.writeLn("Content-Type: text/plain");
			};
		};
		socket.writeLn("Content-Length: " + data.length + "\r\n");
		socket.write(data);

		for(;;) {
			response = socket.readLn(1024);
			if(Script.isUndefined(response)) {
				break;
			};
			if(response.length == 0) {
				break;
			};
			if(response === "\r\n") {
				break;
			};
			decodedResponse = .decodeHeaderLine(response);
			if(decodedResponse) {
				if(decodedResponse[0] == "Content-Length") {
					contentLength = Convert.toNumber(decodedResponse[1]);
				};
			};
		};
		data = "";
		while(contentLength) {
			if(socket.readToBuffer(.buffer, contentLength)) {
				data += Convert.toString(.buffer);
				contentLength -= .buffer.length;
			} else {
				break;
			};
		};
		socket.close();
		return data;
	};
	return null;
};

HTTP.postRequest = function(url, data, headers, mode) {
	var socket = new Socket();
	var decodedResponse;
	var contentLength;
	var host;
	var response;
	var header;

	if(URL.getSchemeName(url).toUpperCaseAscii() != "HTTP") {
		return null;
	};
	host = URL.getHostNameAndPort(url);
	if(!host) {
		return null;
	};

	if(host.indexOf(":") < 0) {
		host += ":80";
	};

	if(Script.isNil(mode)) {
		mode = "POST";
	};
	mode = mode.toUpperCaseAscii();

	if(socket.openClient(host)) {
		contentLength = Infinity;
		if(URL.getQuery(url)) {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + "?" + URL.getQuery(url) + " HTTP/1.1");
		} else {
			socket.writeLn(mode + " " + URL.getPathAndFileName(url) + " HTTP/1.1");
		};
		socket.writeLn("Host: " + URL.getHostNameAndPort(url));
		if(!Script.isNil(headers)) {
			socket.writeLn(headers);
		};

		var strBoundary = "---===68b0cd10b99337fb5ae7bf88dd0c34e39ce26281ae8351a70ed0a0394e1a56b4";
		var strContentDisposition = "Content-Disposition: form-data; name=\"request\"";

		socket.writeLn("Connection: close");
		socket.writeLn("Content-Type: multipart/form-data; boundary=" + strBoundary);
		socket.writeLn("Content-Length: " + (data.length + (strBoundary.length) * 2 + strContentDisposition.length + 2 + 4) + "\r\n");
		socket.writeLn(strBoundary);
		socket.writeLn(strContentDisposition + "\r\n");
		socket.write(data);
		socket.write(strBoundary);

		for(;;) {
			response = socket.readLn(1024);
			if(Script.isUndefined(response)) {
				break;
			};
			if(response.length == 0) {
				break;
			};
			if(response === "\r\n") {
				break;
			};
			decodedResponse = .decodeHeaderLine(response);
			if(decodedResponse) {
				if(decodedResponse[0] == "Content-Length") {
					contentLength = Convert.toNumber(decodedResponse[1]);
				};
			};
		};
		data = "";
		while(contentLength) {
			if(socket.readToBuffer(.buffer, contentLength)) {
				data += Convert.toString(.buffer);
				contentLength -= .buffer.length;
			} else {
				break;
			};
		};
		socket.close();
		return data;
	};
	return null;
};

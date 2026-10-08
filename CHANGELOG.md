# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- A URL without `://` returns `null` / `false` instead of throwing.
- The `Content-Length` response header is recognized in any case.
- `HTTP.downloadFile` closes the connection when done.
- `HTTP.downloadFile` without a file name loads `Shell` itself; a URL path without a file name returns `false`.
- An IPv6 host without a port gets the default port 80.

### Added

- `test/test.01`: offline tests run by `fabricare test`.

## [4.0.0] - 2023-02-09

### Changed

- HTTP/1.1 to HTTP/1.0 because of [Chunked transfer encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding).


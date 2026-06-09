# Chitanda IP Site

[![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2Fpackage.json&query=%24.version&label=version&style=flat-square&color=2563eb)](package.json)
[![Top language](https://img.shields.io/github/languages/top/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site)
[![License](https://img.shields.io/github/license/violetaini/chitanda-ip-site?style=flat-square)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site/graphs/contributors)
[![Commit activity](https://img.shields.io/github/commit-activity/m/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site/commits/main)
[![Repo size](https://img.shields.io/github/repo-size/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site)
[![Stars](https://img.shields.io/github/stars/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site/stargazers)
[![Forks](https://img.shields.io/github/forks/violetaini/chitanda-ip-site?style=flat-square)](https://github.com/violetaini/chitanda-ip-site/forks)

[English](README.md) | [简体中文](README_zh.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md)

React + Vite front end for [ip.chitanda.net](https://ip.chitanda.net/). The site provides browser-side IP detection, IP geolocation lookup, WebRTC/STUN network checks, CDN node lookup, DNS exit lookup, API documentation, and a service-status dashboard.

## Features

- Multi-language routes and localized UI for Simplified Chinese, Traditional Chinese, Japanese, and English.
- Browser preference redirect with a saved language preference override.
- IP detection from domestic, international, Google, and independent probe endpoints.
- IP lookup with map fallback handling.
- WebRTC/STUN public candidate detection.
- Browser latency, CDN node, and DNS exit lookup tools.
- Service status dashboard generated from official public status APIs.

## Routes

```text
/                         Home and IP detection
/webrtc/                  WebRTC/STUN network check
/latency/                 Browser latency test
/cdn-node-lookup/         CDN edge node lookup
/dns-exit-lookup/         DNS resolver exit lookup
/status/                  Service status dashboard
/docs/api/                Public API documentation
/zh-tw/, /ja/, /en/       Localized route prefixes
```

## Multilingual Support

The app ships with four locale variants:

| Locale | Route Prefix | Button Label |
| --- | --- | --- |
| Simplified Chinese | `/` | `语言` |
| Traditional Chinese | `/zh-tw/` | `語言` |
| Japanese | `/ja/` | `言語` |
| English | `/en/` | `lang` |

When a visitor opens an unprefixed route, the early language script checks a saved `localStorage` preference first, then falls back to the browser language list. Existing prefixed routes are left unchanged.

## Requirements

- Node.js 20 or newer
- npm

## Development

```bash
npm install
npm run dev
```

The development server binds to `127.0.0.1` by default.

## Configuration

Copy `.env.example` to `.env.local` and fill in only the values you need.

```text
VITE_GEOIP_BASE                 GeoIP API endpoint override
VITE_INTERNATIONAL_ENDPOINT     International IP probe endpoint
VITE_DEFAULT_PROBE_ENDPOINT     Independent IP probe endpoint
VITE_TENCENT_MAP_KEY            Optional Tencent Maps key
VITE_GOOGLE_MAPS_EMBED_KEY      Optional Google Maps Embed key
```

When `VITE_GEOIP_BASE` is not set, local development uses the public Chitanda GeoIP endpoint and production uses the same-origin `/api/geoip` path.

## Build

```bash
npm run build
```

The build step first generates `public/status/data.json`, then builds the Vite app, then copies localized route entry files into `dist/`.

## Status Data

To refresh only the service-status JSON:

```bash
npm run status:data
```

The status script aggregates public status APIs from OpenAI, Anthropic, Cloudflare, GitHub, Vercel, and other services. The generated dashboard uses embedded initial data and refreshes `/status/data.json` in the browser.

## Automation

Pushes to `main` run GitHub Actions, build the Vite app, package `dist`, and publish the build artifacts to GitHub Releases.

## License

This project is open source under the [MIT License](LICENSE).

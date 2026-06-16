<div align="center">

<img src="public/avatar.webp" alt="Chitanda IP" width="120" />

# **Chitanda IP Site**

[![Version](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Fversion.json&cacheSeconds=3600)](package.json)
[![JavaScript](https://img.shields.io/badge/JavaScript-React%20%2B%20Vite-f7df1e?style=for-the-badge)](https://github.com/violetaini/chitanda-ip-site)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Contributors](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Fcontributors.json&cacheSeconds=3600)](https://github.com/violetaini/chitanda-ip-site/graphs/contributors)
[![Commit activity](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Fcommit-activity.json&cacheSeconds=3600)](https://github.com/violetaini/chitanda-ip-site/commits/main)
[![Repo size](https://img.shields.io/endpoint?style=for-the-badge&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Frepo-size.json&cacheSeconds=3600)](https://github.com/violetaini/chitanda-ip-site)
[![Stars](https://img.shields.io/endpoint?style=for-the-badge&logo=github&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Fstars.json&cacheSeconds=3600)](https://github.com/violetaini/chitanda-ip-site/stargazers)
[![Forks](https://img.shields.io/endpoint?style=for-the-badge&logo=github&url=https%3A%2F%2Fraw.githubusercontent.com%2Fvioletaini%2Fchitanda-ip-site%2Fmain%2F.github%2Fbadges%2Fforks.json&cacheSeconds=3600)](https://github.com/violetaini/chitanda-ip-site/forks)

</div>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README_zh.md">简体中文</a> |
  <a href="README_zh-TW.md">繁體中文</a> |
  <a href="README_ja.md">日本語</a>
</p>

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
VITE_SITE_NAME                  Site display name
VITE_HERO_TITLE_PREFIX          Home hero title left text
VITE_HERO_TITLE_SEPARATOR       Home hero title middle text
VITE_HERO_TITLE_SUFFIX          Home hero title right text
VITE_SITE_HOSTNAME              Production hostname
VITE_PUBLIC_BASE_URL            Public site URL used in API docs
VITE_SITE_AVATAR_PATH           Top-left avatar asset path
VITE_SITE_FAVICON_PATH          Browser favicon path
VITE_LOCALE_STORAGE_KEY         Browser language preference key
VITE_GEOIP_BASE                 GeoIP API endpoint override
VITE_INTERNATIONAL_ENDPOINT     International IP probe endpoint
VITE_DEFAULT_PROBE_ENDPOINT     Independent IP probe endpoint
VITE_TENCENT_MAP_KEY            Optional Tencent Maps key
VITE_GOOGLE_MAPS_EMBED_KEY      Optional Google Maps Embed key
VITE_OWN_STUN_NAME              Optional self-owned STUN display name
VITE_OWN_STUN_URL               Optional self-owned STUN URL
VITE_OWN_STUN_REGION            Optional self-owned STUN region
VITE_CDN_TENCENT_PROBE_URL      Optional self-owned Tencent CDN probe URL
VITE_CDN_ALIYUN_PROBE_URL       Optional self-owned Alibaba Cloud ESA probe URL
```

When `VITE_GEOIP_BASE` is not set, local development uses the public Chitanda GeoIP endpoint and production uses the same-origin `/api/geoip` path.

For a fork or self-hosted build, edit `.env.production` before running `npm run build` or the GitHub Actions release workflow. The checked-in file keeps Chitanda's public defaults, so changing it is enough for the normal deployment surface: site name, hero title, domain, public API base URL, avatar/favicon paths, GeoIP and probe endpoints, public browser map keys, optional public STUN, and optional CDN probes. `.env.production.local` has higher priority and is ignored by git, so use it only for local or private server builds that you intentionally do not publish as GitHub Release artifacts.

**Every `VITE_*` value is browser-visible after build.** Do not commit private map keys or self-owned STUN IPs to the public repository or GitHub Release builds. Keep `VITE_TENCENT_MAP_KEY`, `VITE_GOOGLE_MAPS_EMBED_KEY`, and `VITE_OWN_STUN_URL` empty in committed env files. Use only public, domain-restricted browser keys here; values that must remain private need a server-side proxy instead of a Vite env variable.

Repository badges, license/copyright text, package metadata, and release artifact names are source-maintenance fields and are not part of the env customization layer.

## Self-hosted GeoAPI

This repository publishes the front end. If you keep the default Chitanda endpoints, you do not need to run your own GeoAPI. For a self-hosted deployment, use the fully open-source API project:

https://github.com/violetaini/chitanda-geoip-api

That project contains the Node.js API service, database downloader, systemd/Nginx examples, and a daily GitHub Actions workflow that packages the service with public IP databases into a Release asset. After deploying it, point `VITE_GEOIP_BASE` to your API before building this front end.

Required endpoints:

```text
GET /api/geoip
GET /api/geoip/{ip}
GET /api/myip
GET /api/health
```

The GeoIP response should include the fields used by the UI: `ip`, `country_code`, `country`, `region`, `city`, `asn`, `organization`, `isp`, `latitude`, `longitude`, `timezone`, `offset`, and `continent_code`.

A typical setup is:

1. Run a small server-side API, for example a Node.js service, on `127.0.0.1`.
2. Load MaxMind-compatible City and ASN MMDB databases for global lookup.
3. Optionally add `ip2region` xdb data for better Mainland China province, city, and ISP text.
4. Add a city-center fallback table when your database returns a city without coordinates.
5. Reverse proxy `/api/geoip`, `/api/myip`, and `/api/health` from Nginx or another edge server to the local API.
6. Set `VITE_GEOIP_BASE` to the public API base URL if it is not served from the same origin.

The recommended shortcut is to download the latest `chitanda-geoip-api-with-data.tar.gz` asset from `chitanda-geoip-api` Releases. It already contains the API source, deployment examples, and the public database files needed to start the service.

Database download credentials, paid database licenses, private probe endpoints, and server keys must stay on the server side. Do not put them in `VITE_*` variables because Vite exposes those values to browsers after build.

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

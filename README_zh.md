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

[ip.chitanda.net](https://ip.chitanda.net/) 的 React + Vite 前端。项目提供浏览器侧 IP 检测、IP 归属查询、WebRTC/STUN 网络检测、CDN 节点查询、DNS 出口查询、API 文档和服务状态面板。

## 功能

- 支持简体中文、繁体中文、日语和英语的多语言路由与界面。
- 根据浏览器首选语言自动跳转，并优先使用用户保存的语言偏好。
- 支持国内、境外、Google、独立探针四路 IP 检测。
- 支持 IP 归属查询和地图降级策略。
- 支持 WebRTC/STUN 公网候选地址检测。
- 支持浏览器延迟、CDN 节点和 DNS 出口查询工具。
- 服务状态面板由多个公开官方状态 API 聚合生成。

## 路由

```text
/                         首页和 IP 检测
/webrtc/                  WebRTC/STUN 网络检测
/latency/                 浏览器延迟测试
/cdn-node-lookup/         CDN 边缘节点查询
/dns-exit-lookup/         DNS 递归出口查询
/status/                  服务状态面板
/docs/api/                公开 API 文档
/zh-tw/, /ja/, /en/       本地化路由前缀
```

## 多语言支持

| 语言 | 路由前缀 | 语言按钮 |
| --- | --- | --- |
| 简体中文 | `/` | `语言` |
| 繁體中文 | `/zh-tw/` | `語言` |
| 日本語 | `/ja/` | `言語` |
| English | `/en/` | `lang` |

访问无语言前缀路径时，早期语言脚本会先读取 `localStorage` 中保存的语言偏好；没有保存偏好时，再按浏览器语言列表匹配。已有语言前缀的路径不会被二次跳转。

## 环境要求

- Node.js 20 或更新版本
- npm

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认绑定 `127.0.0.1`。

## 配置

复制 `.env.example` 为 `.env.local`，按需填写配置。

```text
VITE_GEOIP_BASE                 GeoIP API 地址覆盖
VITE_INTERNATIONAL_ENDPOINT     境外 IP 探针地址
VITE_DEFAULT_PROBE_ENDPOINT     独立 IP 探针地址
VITE_TENCENT_MAP_KEY            可选的腾讯地图 Key
VITE_GOOGLE_MAPS_EMBED_KEY      可选的 Google Maps Embed Key
```

未设置 `VITE_GEOIP_BASE` 时，本地开发使用公开 Chitanda GeoIP 接口，生产环境使用同源 `/api/geoip`。

## 构建

```bash
npm run build
```

构建流程会先生成 `public/status/data.json`，再构建 Vite 应用，并把本地化入口文件复制到 `dist/`。

## 服务状态数据

仅刷新服务状态 JSON：

```bash
npm run status:data
```

状态脚本会聚合 OpenAI、Anthropic、Cloudflare、GitHub、Vercel 等服务的公开状态 API。状态面板使用内嵌首屏数据，并在浏览器中刷新 `/status/data.json`。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

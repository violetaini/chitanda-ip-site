<div align="center">

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
VITE_SITE_NAME                  站点显示名称
VITE_HERO_TITLE_PREFIX          首页大标题左侧文字
VITE_HERO_TITLE_SEPARATOR       首页大标题中间文字
VITE_HERO_TITLE_SUFFIX          首页大标题右侧文字
VITE_SITE_HOSTNAME              生产环境主机名
VITE_PUBLIC_BASE_URL            API 文档使用的公开站点地址
VITE_SITE_AVATAR_PATH           左上角头像资源路径
VITE_SITE_FAVICON_PATH          浏览器 favicon 路径
VITE_LOCALE_STORAGE_KEY         浏览器语言偏好存储 key
VITE_GEOIP_BASE                 GeoIP API 地址覆盖
VITE_INTERNATIONAL_ENDPOINT     境外 IP 探针地址
VITE_DEFAULT_PROBE_ENDPOINT     独立 IP 探针地址
VITE_TENCENT_MAP_KEY            可选的腾讯地图 Key
VITE_GOOGLE_MAPS_EMBED_KEY      可选的 Google Maps Embed Key
VITE_OWN_STUN_NAME              可选自有 STUN 显示名称
VITE_OWN_STUN_URL               可选自有 STUN 地址
VITE_OWN_STUN_REGION            可选自有 STUN 区域
VITE_CDN_TENCENT_PROBE_URL      可选自有腾讯 CDN 探针地址
VITE_CDN_ALIYUN_PROBE_URL       可选自有阿里云 ESA 探针地址
```

未设置 `VITE_GEOIP_BASE` 时，本地开发使用公开 Chitanda GeoIP 接口，生产环境使用同源 `/api/geoip`。

别人 fork 或自部署时，修改 `.env.production` 后再执行 `npm run build` 或 GitHub Actions 发布构建即可。仓库内的 `.env.production` 保留本站公开默认值，普通部署可通过它覆盖站点名、首页大标题、域名、公开 API 基础地址、头像/favicon、GeoIP 与探针端点、公开浏览器地图 Key、可选公开 STUN、可选 CDN 探针。`.env.production.local` 优先级更高且被 git 忽略，只用于本地或明确不会发布到 GitHub Release 的私有服务器构建。

**所有 `VITE_*` 值在构建后都会进入浏览器包。** 不要把私有地图 Key 或自建 STUN IP 提交到公开仓库或 GitHub Release 构建里。已提交的环境文件中 `VITE_TENCENT_MAP_KEY`、`VITE_GOOGLE_MAPS_EMBED_KEY` 和 `VITE_OWN_STUN_URL` 必须保持空；这里仅适合放公开、已限制域名的浏览器 Key，真正需要保密的值必须走服务端代理，不能放 Vite 环境变量。

仓库徽章、许可证/版权文字、package 元信息和 Release 产物名称属于源码维护项，不纳入 env 自定义层。

## 自建 GeoAPI

这个仓库发布的是前端。如果继续使用 Chitanda 默认接口，不需要自己搭建 GeoAPI；如果要自部署，请使用完全开源的 API 项目：

https://github.com/violetaini/chitanda-geoip-api

这个项目包含 Node.js API 服务、数据库下载脚本、systemd/Nginx 示例，以及每天自动打包公开 IP 库到 GitHub Release 的工作流。部署完成后，在构建本站前把 `VITE_GEOIP_BASE` 指向你的 API。

需要支持的接口：

```text
GET /api/geoip
GET /api/geoip/{ip}
GET /api/myip
GET /api/health
```

GeoIP 返回值应包含前端使用的字段：`ip`、`country_code`、`country`、`region`、`city`、`asn`、`organization`、`isp`、`latitude`、`longitude`、`timezone`、`offset`、`continent_code`。

常见搭建方式：

1. 在服务端运行一个本地 API，例如 Node.js 服务，监听 `127.0.0.1`。
2. 使用兼容 MaxMind 的 City 和 ASN MMDB 数据库做全球查询。
3. 可选接入 `ip2region` xdb，优化中国大陆省市和运营商文本。
4. 当数据库返回城市但缺少经纬度时，用城市中心点表补坐标。
5. 用 Nginx 或其他边缘服务把 `/api/geoip`、`/api/myip`、`/api/health` 反代到本地 API。
6. 如果 API 不和前端同源，在构建前设置 `VITE_GEOIP_BASE` 为公开 API 基础地址。

推荐的省事方式是直接下载 `chitanda-geoip-api` Releases 里的最新 `chitanda-geoip-api-with-data.tar.gz`。它已经包含 API 源码、部署示例和启动服务所需的公开数据库文件。

数据库下载凭据、付费数据库授权、私有探针地址和服务器密钥必须留在服务端。不要把它们放进 `VITE_*` 变量，因为 Vite 构建后这些值会暴露给浏览器。

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

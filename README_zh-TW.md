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

[English](README.md) | [简体中文](README_zh.md) | [繁體中文](README_zh-TW.md) | [日本語](README_ja.md)

[ip.chitanda.net](https://ip.chitanda.net/) 的 React + Vite 前端。專案提供瀏覽器端 IP 偵測、IP 歸屬查詢、WebRTC/STUN 網路偵測、CDN 節點查詢、DNS 出口查詢、API 文件與服務狀態面板。

## 功能

- 支援簡體中文、繁體中文、日語與英語的多語言路由與介面。
- 依瀏覽器首選語言自動跳轉，並優先使用使用者保存的語言偏好。
- 支援國內、境外、Google、獨立探針四路 IP 偵測。
- 支援 IP 歸屬查詢與地圖降級策略。
- 支援 WebRTC/STUN 公網候選位址偵測。
- 支援瀏覽器延遲、CDN 節點與 DNS 出口查詢工具。
- 服務狀態面板由多個公開官方狀態 API 聚合生成。

## 路由

```text
/                         首頁與 IP 偵測
/webrtc/                  WebRTC/STUN 網路偵測
/latency/                 瀏覽器延遲測試
/cdn-node-lookup/         CDN 邊緣節點查詢
/dns-exit-lookup/         DNS 遞迴出口查詢
/status/                  服務狀態面板
/docs/api/                公開 API 文件
/zh-tw/, /ja/, /en/       本地化路由前綴
```

## 多語言支援

| 語言 | 路由前綴 | 語言按鈕 |
| --- | --- | --- |
| 简体中文 | `/` | `语言` |
| 繁體中文 | `/zh-tw/` | `語言` |
| 日本語 | `/ja/` | `言語` |
| English | `/en/` | `lang` |

訪問無語言前綴路徑時，早期語言腳本會先讀取 `localStorage` 中保存的語言偏好；沒有保存偏好時，再依瀏覽器語言列表匹配。已有語言前綴的路徑不會被二次跳轉。

## 環境需求

- Node.js 20 或更新版本
- npm

## 本地開發

```bash
npm install
npm run dev
```

開發伺服器預設綁定 `127.0.0.1`。

## 設定

複製 `.env.example` 為 `.env.local`，按需填寫設定。

```text
VITE_SITE_NAME                  站點顯示名稱
VITE_HERO_TITLE_PREFIX          首頁大標題左側文字
VITE_HERO_TITLE_SEPARATOR       首頁大標題中間文字
VITE_HERO_TITLE_SUFFIX          首頁大標題右側文字
VITE_SITE_HOSTNAME              生產環境主機名
VITE_PUBLIC_BASE_URL            API 文件使用的公開站點位址
VITE_SITE_AVATAR_PATH           左上角頭像資源路徑
VITE_SITE_FAVICON_PATH          瀏覽器 favicon 路徑
VITE_LOCALE_STORAGE_KEY         瀏覽器語言偏好儲存 key
VITE_GEOIP_BASE                 GeoIP API 位址覆寫
VITE_INTERNATIONAL_ENDPOINT     境外 IP 探針位址
VITE_DEFAULT_PROBE_ENDPOINT     獨立 IP 探針位址
VITE_TENCENT_MAP_KEY            可選的騰訊地圖 Key
VITE_GOOGLE_MAPS_EMBED_KEY      可選的 Google Maps Embed Key
VITE_OWN_STUN_NAME              可選自有 STUN 顯示名稱
VITE_OWN_STUN_URL               可選自有 STUN 位址
VITE_OWN_STUN_REGION            可選自有 STUN 區域
VITE_CDN_TENCENT_PROBE_URL      可選自有騰訊 CDN 探針位址
VITE_CDN_ALIYUN_PROBE_URL       可選自有阿里雲 ESA 探針位址
```

未設定 `VITE_GEOIP_BASE` 時，本地開發使用公開 Chitanda GeoIP 介面，生產環境使用同源 `/api/geoip`。

別人 fork 或自部署時，修改 `.env.production` 後再執行 `npm run build` 或 GitHub Actions 發布建置即可。倉庫內的 `.env.production` 保留本站公開預設值，普通部署可透過它覆蓋站點名、首頁大標題、網域、公開 API 基礎地址、頭像/favicon、GeoIP 與探針端點、公開瀏覽器地圖 Key、可選公開 STUN、可選 CDN 探針。`.env.production.local` 優先級更高且被 git 忽略，只用於本地或明確不會發布到 GitHub Release 的私有伺服器建置。

**所有 `VITE_*` 值在建置後都會進入瀏覽器包。** 不要把私有地圖 Key 或自建 STUN IP 提交到公開倉庫或 GitHub Release 建置裡。已提交的環境文件中 `VITE_TENCENT_MAP_KEY`、`VITE_GOOGLE_MAPS_EMBED_KEY` 和 `VITE_OWN_STUN_URL` 必須保持空；這裡只適合放公開、已限制網域的瀏覽器 Key，真正需要保密的值必須走服務端代理，不能放 Vite 環境變數。

倉庫徽章、授權/版權文字、package 元資訊和 Release 產物名稱屬於源碼維護項，不納入 env 自定義層。

## 建置

```bash
npm run build
```

建置流程會先生成 `public/status/data.json`，再建置 Vite 應用，並把本地化入口檔案複製到 `dist/`。

## 服務狀態資料

僅刷新服務狀態 JSON：

```bash
npm run status:data
```

狀態腳本會聚合 OpenAI、Anthropic、Cloudflare、GitHub、Vercel 等服務的公開狀態 API。狀態面板使用內嵌首屏資料，並在瀏覽器中刷新 `/status/data.json`。

## 授權

本專案基於 [MIT License](LICENSE) 開源。

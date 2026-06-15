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

[ip.chitanda.net](https://ip.chitanda.net/) 向けの React + Vite フロントエンドです。ブラウザ側の IP 検出、IP 位置情報検索、WebRTC/STUN ネットワークチェック、CDN ノード検索、DNS 出口検索、API ドキュメント、サービス状態ダッシュボードを提供します。

## 機能

- 簡体字中国語、繁体字中国語、日本語、英語の多言語ルートと UI。
- ブラウザの優先言語に基づく自動リダイレクトと、保存済み言語設定の優先利用。
- 国内、国際、Google、独立プローブによる IP 検出。
- IP 位置情報検索と地図フォールバック。
- WebRTC/STUN の公開候補アドレス検出。
- ブラウザ遅延、CDN ノード、DNS 出口検索ツール。
- 複数の公開公式ステータス API から生成されるサービス状態ダッシュボード。

## ルート

```text
/                         ホームと IP 検出
/webrtc/                  WebRTC/STUN ネットワークチェック
/latency/                 ブラウザ遅延テスト
/cdn-node-lookup/         CDN エッジノード検索
/dns-exit-lookup/         DNS 再帰出口検索
/status/                  サービス状態ダッシュボード
/docs/api/                公開 API ドキュメント
/zh-tw/, /ja/, /en/       ローカライズ済みルート接頭辞
```

## 多言語対応

| 言語 | ルート接頭辞 | 言語ボタン |
| --- | --- | --- |
| 简体中文 | `/` | `语言` |
| 繁體中文 | `/zh-tw/` | `語言` |
| 日本語 | `/ja/` | `言語` |
| English | `/en/` | `lang` |

言語接頭辞のないルートにアクセスした場合、早期言語スクリプトはまず `localStorage` に保存された言語設定を確認します。保存済み設定がない場合は、ブラウザの言語リストに基づいて一致する言語へ移動します。すでに言語接頭辞があるルートでは追加のリダイレクトは行いません。

## 必要環境

- Node.js 20 以降
- npm

## 開発

```bash
npm install
npm run dev
```

開発サーバーは既定で `127.0.0.1` にバインドされます。

## 設定

`.env.example` を `.env.local` にコピーし、必要な値だけ設定してください。

```text
VITE_SITE_NAME                  サイト表示名
VITE_HERO_TITLE_PREFIX          ホームヒーロー見出しの左テキスト
VITE_HERO_TITLE_SEPARATOR       ホームヒーロー見出しの中央テキスト
VITE_HERO_TITLE_SUFFIX          ホームヒーロー見出しの右テキスト
VITE_SITE_HOSTNAME              本番ホスト名
VITE_PUBLIC_BASE_URL            API ドキュメントで使う公開サイト URL
VITE_SITE_AVATAR_PATH           左上のアバター画像パス
VITE_SITE_FAVICON_PATH          ブラウザ favicon パス
VITE_LOCALE_STORAGE_KEY         ブラウザ言語設定の保存 key
VITE_GEOIP_BASE                 GeoIP API エンドポイントの上書き
VITE_INTERNATIONAL_ENDPOINT     国際 IP プローブエンドポイント
VITE_DEFAULT_PROBE_ENDPOINT     独立 IP プローブエンドポイント
VITE_TENCENT_MAP_KEY            任意の Tencent Maps キー
VITE_GOOGLE_MAPS_EMBED_KEY      任意の Google Maps Embed キー
VITE_OWN_STUN_NAME              任意の自前 STUN 表示名
VITE_OWN_STUN_URL               任意の自前 STUN URL
VITE_OWN_STUN_REGION            任意の自前 STUN リージョン
VITE_CDN_TENCENT_PROBE_URL      任意の自前 Tencent CDN プローブ URL
VITE_CDN_ALIYUN_PROBE_URL       任意の自前 Alibaba Cloud ESA プローブ URL
```

`VITE_GEOIP_BASE` が未設定の場合、ローカル開発では公開 Chitanda GeoIP エンドポイントを使用し、本番環境では同一オリジンの `/api/geoip` を使用します。

Fork やセルフホストでは、`npm run build` または GitHub Actions のリリースビルド前に `.env.production` を編集してください。コミット済みの `.env.production` にはこのサイトの公開デフォルトが入っており、通常のデプロイではサイト名、ヒーロータイトル、ドメイン、公開 API ベース URL、avatar/favicon、GeoIP とプローブエンドポイント、公開ブラウザー用の地図 Key、任意の公開 STUN、任意の CDN プローブをここで上書きできます。`.env.production.local` は優先度が高く git に無視されるため、ローカルまたは GitHub Release に公開しない非公開サーバービルドだけに使います。

**すべての `VITE_*` 値はビルド後にブラウザー配信物へ入ります。** 非公開の地図 Key や自前 STUN IP を公開リポジトリや GitHub Release ビルドにコミットしないでください。コミット済み env ファイルでは `VITE_TENCENT_MAP_KEY`、`VITE_GOOGLE_MAPS_EMBED_KEY`、`VITE_OWN_STUN_URL` を空のままにします。ここに置けるのは公開されてもよい、ドメイン制限済みのブラウザー Key だけです。秘密にする必要がある値は Vite 環境変数ではなく、サーバー側プロキシで扱ってください。

リポジトリバッジ、ライセンス/著作権文言、package メタデータ、Release 成果物名はソース管理項目であり、env カスタマイズ層の対象外です。

## セルフホスト GeoAPI

このリポジトリはフロントエンドを公開しています。既定の Chitanda エンドポイントを使う場合、自前の GeoAPI は不要です。セルフホストする場合は、互換 HTTP サービスを用意し、ビルド前に `VITE_GEOIP_BASE` をその API に向けてください。

必要なエンドポイント：

```text
GET /api/geoip
GET /api/geoip/{ip}
GET /api/myip
GET /api/health
```

GeoIP レスポンスには UI が使うフィールドを含めます：`ip`、`country_code`、`country`、`region`、`city`、`asn`、`organization`、`isp`、`latitude`、`longitude`、`timezone`、`offset`、`continent_code`。

一般的な構成：

1. サーバー側で Node.js などのローカル API を `127.0.0.1` に起動します。
2. グローバル検索には MaxMind 互換の City と ASN MMDB データベースを読み込みます。
3. 中国大陸の省市と ISP 表記を改善する場合は、任意で `ip2region` xdb を追加します。
4. データベースが都市名だけ返し座標を返さない場合に備え、都市中心点のフォールバック表を用意します。
5. Nginx などで `/api/geoip`、`/api/myip`、`/api/health` をローカル API にリバースプロキシします。
6. API がフロントエンドと同一オリジンでない場合は、公開 API ベース URL を `VITE_GEOIP_BASE` に設定してからビルドします。

データベースのダウンロード認証情報、有料データベースのライセンス、非公開プローブ、サーバー鍵はサーバー側に置いてください。`VITE_*` 変数はビルド後にブラウザーへ公開されるため、秘密情報を入れないでください。

## ビルド

```bash
npm run build
```

ビルド処理では、まず `public/status/data.json` を生成し、その後 Vite アプリをビルドして、ローカライズ済みルートエントリを `dist/` にコピーします。

## サービス状態データ

サービス状態 JSON のみを更新する場合：

```bash
npm run status:data
```

ステータススクリプトは OpenAI、Anthropic、Cloudflare、GitHub、Vercel などの公開ステータス API を集約します。ダッシュボードは埋め込み初期データを使用し、ブラウザ側で `/status/data.json` を更新します。

## ライセンス

このプロジェクトは [MIT License](LICENSE) のもとで公開されています。

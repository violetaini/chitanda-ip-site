# Chitanda IP Site

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
VITE_GEOIP_BASE                 GeoIP API エンドポイントの上書き
VITE_INTERNATIONAL_ENDPOINT     国際 IP プローブエンドポイント
VITE_DEFAULT_PROBE_ENDPOINT     独立 IP プローブエンドポイント
VITE_TENCENT_MAP_KEY            任意の Tencent Maps キー
VITE_GOOGLE_MAPS_EMBED_KEY      任意の Google Maps Embed キー
```

`VITE_GEOIP_BASE` が未設定の場合、ローカル開発では公開 Chitanda GeoIP エンドポイントを使用し、本番環境では同一オリジンの `/api/geoip` を使用します。

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

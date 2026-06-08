import { mkdir, readFile, writeFile } from 'node:fs/promises';

const rootIndex = 'dist/index.html';
const statusData = 'dist/status/data.json';

const routes = [
  { dir: 'dist/status', title: '服务状态 - Chitanda IP', injectStatusData: true },
  { dir: 'dist/webrtc', title: 'WebRTC IP 检测 - Chitanda IP' },
  { dir: 'dist/latency', title: '延迟测试 - Chitanda IP' },
  { dir: 'dist/cdn-node-lookup', title: 'CDN 命中节点查询 - Chitanda IP' },
  { dir: 'dist/dns-exit-lookup', title: 'DNS 出口查询 - Chitanda IP' },
  { dir: 'dist/docs/api', title: 'API 文档 - Chitanda IP' },
  { dir: 'dist/zh-tw', title: 'Chitanda IP' },
  { dir: 'dist/zh-tw/status', title: '服務狀態 - Chitanda IP', injectStatusData: true },
  { dir: 'dist/zh-tw/webrtc', title: 'WebRTC IP 檢測 - Chitanda IP' },
  { dir: 'dist/zh-tw/latency', title: '延遲測試 - Chitanda IP' },
  { dir: 'dist/zh-tw/cdn-node-lookup', title: 'CDN 命中節點查詢 - Chitanda IP' },
  { dir: 'dist/zh-tw/dns-exit-lookup', title: 'DNS 出口查詢 - Chitanda IP' },
  { dir: 'dist/zh-tw/docs/api', title: 'API 文件 - Chitanda IP' },
  { dir: 'dist/ja', title: 'Chitanda IP' },
  { dir: 'dist/ja/status', title: 'サービス状態 - Chitanda IP', injectStatusData: true },
  { dir: 'dist/ja/webrtc', title: 'WebRTC IP チェック - Chitanda IP' },
  { dir: 'dist/ja/latency', title: '遅延テスト - Chitanda IP' },
  { dir: 'dist/ja/cdn-node-lookup', title: 'CDN ノード検索 - Chitanda IP' },
  { dir: 'dist/ja/dns-exit-lookup', title: 'DNS 出口検索 - Chitanda IP' },
  { dir: 'dist/ja/docs/api', title: 'API ドキュメント - Chitanda IP' },
  { dir: 'dist/en', title: 'Chitanda IP' },
  { dir: 'dist/en/status', title: 'Service Status - Chitanda IP', injectStatusData: true },
  { dir: 'dist/en/webrtc', title: 'WebRTC IP Check - Chitanda IP' },
  { dir: 'dist/en/latency', title: 'Latency Test - Chitanda IP' },
  { dir: 'dist/en/cdn-node-lookup', title: 'CDN Node Lookup - Chitanda IP' },
  { dir: 'dist/en/dns-exit-lookup', title: 'DNS Exit Lookup - Chitanda IP' },
  { dir: 'dist/en/docs/api', title: 'API Docs - Chitanda IP' }
];

function escapeInlineJson(json) {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

async function main() {
  const html = await readFile(rootIndex, 'utf8');
  let statusDataScript = '';

  try {
    const json = await readFile(statusData, 'utf8');
    statusDataScript = `\n    <script id="__status_initial_data__">window.__STATUS_INITIAL_DATA__=${escapeInlineJson(json.trim())};</script>`;
  } catch {
    statusDataScript = '';
  }

  await Promise.all(routes.map(async (route) => {
    const indexPath = `${route.dir}/index.html`;
    const routeHtml = html
      .replace('<title>Chitanda IP</title>', `<title>${route.title}</title>`)
      .replace('</head>', `${route.injectStatusData ? statusDataScript : ''}\n  </head>`);

    await mkdir(route.dir, { recursive: true });
    await writeFile(indexPath, routeHtml);
    console.log(`wrote ${indexPath}`);
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

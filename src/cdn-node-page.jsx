import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Loader2,
  Network,
  RefreshCw,
} from 'lucide-react';
import { useI18n } from './i18n.jsx';
import { SITE_CONFIG } from './site-config.js';

const PROBE_TIMEOUT = 8000;
const PROBE_CONCURRENCY = 6;
const PROBE_RETRY_DELAYS = [260, 720];
const iconFromDomain = (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`;

function decodeBase64(value) {
  if (!value) return '';
  try {
    const decoded = atob(value);
    return /^[\w .:-]+$/.test(decoded) ? decoded : '';
  } catch {
    return '';
  }
}

function lastFastlyNode(headers) {
  const parts = headers.get('x-served-by')?.split('-');
  return parts?.length ? parts[parts.length - 1] : '';
}

function parseJsDelivr(headers) {
  const server = headers.get('server');
  if (server?.toLowerCase().includes('cloudflare')) {
    const ray = headers.get('cf-ray');
    return `Cloudflare${ray ? `, ${ray.split('-')[1] || ''}` : ''}`.trim();
  }
  if (headers.get('x-id') && headers.get('x-cached-since')) return 'G-Core Lab';
  const node = lastFastlyNode(headers);
  return `Fastly${node ? `, ${node}` : ''}`;
}

function parseBunny(headers) {
  const pieces = headers.get('server')?.split('-') || [];
  return pieces.length >= 3 ? `${pieces[1]}-${pieces[2]}` : '';
}

function parseAkamai(headers) {
  return headers.get('x-cache2')?.split('|')[2]?.trim() || '';
}

function parseAkamaiGrn(headers) {
  const grn = headers.get('akamai-grn') || '';
  const hex = grn.match(/^0\.([0-9a-f]{8})\./i)?.[1];
  if (hex) {
    return hex.match(/../g)?.reverse().map((part) => Number.parseInt(part, 16)).join('.') || '';
  }

  const timing = headers.get('server-timing') || '';
  const edgeNumber = timing.match(/desc="[^_]+_(\d+)_/)?.[1];
  if (!edgeNumber) return '';
  return Number(edgeNumber)
    .toString(16)
    .padStart(8, '0')
    .match(/../g)
    ?.reverse()
    .map((part) => Number.parseInt(part, 16))
    .join('.') || '';
}

function parseCacheFly(headers) {
  return headers.get('x-cf1')?.split(':')[4]?.split('.')[1] || '';
}

function parseZenlayer(headers) {
  return headers.get('via')?.match(/\s[A-Z]+\.\w+/g)?.map((item) => item.trim()).join(', ') || '';
}

function parseByteDance(headers) {
  const via = headers.get('via');
  if (!via) return '';
  const dotIndex = via.indexOf('.');
  return dotIndex >= 0 ? via.slice(dotIndex + 1).trim() : via.trim();
}

function parseViaNodes(headers) {
  const via = headers.get('via') || headers.get('x-via') || '';
  return [...via.matchAll(/-(\w+)-/g)].map((match) => match[1]).join(', ');
}

function parseNetease(headers) {
  return [headers.get('cdn-source'), headers.get('cdn-ip')].filter(Boolean).join(', ');
}

function parseCloudflareTrace(text) {
  const fields = Object.fromEntries(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('='))
  );
  return fields.colo || '';
}

function parseOwnedCdnNode(headers) {
  return headers.get('x-cdn-node') || '';
}

function parseAliyunEsa(headers) {
  const node = parseOwnedCdnNode(headers);
  const viaNode = headers.get('via')?.match(/ens-cache\d+\.[^\[,]+/)?.[0] || '';
  return viaNode || node;
}

const cdnProbes = [
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    familyKey: 'cdn.families.anycast',
    method: 'GET',
    url: 'https://ip.skk.moe/cdn-cgi/trace',
    parseText: parseCloudflareTrace,
    icon: '/status/favicons/cloudflare.svg',
    tone: 'orange',
  },
  {
    id: 'cloudflare-cn',
    name: 'Cloudflare 中国网络',
    nameEn: 'Cloudflare China Network',
    familyKey: 'cdn.families.cloudflareCn',
    method: 'GET',
    url: 'https://perfops.cloudflareperf.com/cdn-cgi/trace',
    parseText: parseCloudflareTrace,
    icon: '/status/favicons/cloudflare.svg',
    tone: 'orange',
  },
  {
    id: 'fastly',
    name: 'Fastly',
    familyKey: 'cdn.families.edgeCache',
    url: 'https://fastly.jsdelivr.net/npm/react@18/umd/react.production.min.js',
    parseHeaders: lastFastlyNode,
    icon: iconFromDomain('fastly.com'),
    tone: 'red',
  },
  {
    id: 'jsdelivr',
    name: 'jsDelivr',
    familyKey: 'cdn.families.multiCdn',
    url: 'https://cdn.jsdelivr.net/npm/latency-test@1.0.0/generate_200',
    parseHeaders: parseJsDelivr,
    icon: iconFromDomain('jsdelivr.com'),
    tone: 'green',
  },
  {
    id: 'cloudfront',
    name: 'AWS CloudFront',
    family: 'Amazon POP',
    url: 'https://djlzvy5xcvhxt.cloudfront.net/500b-bench.jpg',
    parseHeaders: (headers) => headers.get('x-amz-cf-pop')?.split(';')[0] || '',
    icon: iconFromDomain('aws.amazon.com'),
    tone: 'orange',
  },
  {
    id: 'gcp',
    name: 'GCP Anycast LB',
    family: 'Google Cloud',
    method: 'GET',
    url: 'https://global.gcping.com/api/ping',
    parseText: (text) => text.trim(),
    icon: iconFromDomain('cloud.google.com'),
    tone: 'blue',
  },
  {
    id: 'akamai',
    name: 'Akamai',
    family: 'Akamai Edge',
    url: 'https://perfopsrum.akamaized.net/500b-bench.jpg',
    parseHeaders: parseAkamai,
    icon: iconFromDomain('akamai.com'),
    tone: 'blue',
  },
  {
    id: 'akamai-video',
    name: 'Akamai 音视频',
    nameEn: 'Akamai Media',
    familyKey: 'cdn.families.akamaiVideo',
    url: 'https://perfopsrum.akamaized.net/500b-bench.jpg',
    parseHeaders: parseAkamai,
    icon: iconFromDomain('akamai.com'),
    tone: 'blue',
  },
  {
    id: 'akamai-eip',
    name: 'Akamai Edge IP Binding',
    family: 'Edge IP',
    url: 'https://perfopsrum-eip.akamaized.net/500b-bench.jpg',
    parseHeaders: parseAkamai,
    icon: iconFromDomain('akamai.com'),
    tone: 'blue',
  },
  {
    id: 'bunny-standard',
    name: 'Bunny Standard',
    family: 'Bunny CDN',
    url: 'https://test.b-cdn.net',
    parseHeaders: parseBunny,
    icon: iconFromDomain('bunny.net'),
    tone: 'amber',
  },
  {
    id: 'bunny-volume',
    name: 'Bunny Volume',
    family: 'Bunny Storage',
    url: 'https://testvideo.b-cdn.net',
    parseHeaders: parseBunny,
    icon: iconFromDomain('bunny.net'),
    tone: 'amber',
  },
  {
    id: 'cdn77',
    name: 'CDN77',
    family: 'CDN77 POP',
    url: 'https://1596384882.rsc.cdn77.org/500b-bench.jpg',
    parseHeaders: (headers) => headers.get('x-77-pop') || '',
    icon: iconFromDomain('cdn77.com'),
    tone: 'yellow',
  },
  {
    id: 'edgeone',
    name: 'Tencent EdgeOne Static',
    familyKey: 'cdn.families.edgeoneCn',
    url: 'https://eo-static-perfops2.qcloudcdn.com/500b-bench.jpg',
    parseHeaders: (headers) => decodeBase64(headers.get('xcc')),
    icon: iconFromDomain('edgeone.ai'),
    tone: 'blue',
  },
  {
    id: 'edgeone-owned',
    name: 'Tencent EdgeOne',
    familyKey: 'cdn.families.ownedEdgeone',
    url: SITE_CONFIG.tencentCdnProbeUrl,
    parseHeaders: parseOwnedCdnNode,
    icon: iconFromDomain('edgeone.ai'),
    tone: 'blue',
  },
  {
    id: 'aliyun-esa',
    name: 'Alibaba Cloud ESA',
    familyKey: 'cdn.families.aliyunEsa',
    url: SITE_CONFIG.aliyunCdnProbeUrl,
    parseHeaders: parseAliyunEsa,
    icon: iconFromDomain('alibabacloud.com'),
    tone: 'orange',
  },
  {
    id: 'cachefly',
    name: 'CacheFly',
    family: 'CacheFly POP',
    url: 'https://cdnperf.cachefly.net/500b-bench.jpg',
    parseHeaders: parseCacheFly,
    icon: iconFromDomain('cachefly.com'),
    tone: 'slate',
  },
  {
    id: 'medianova',
    name: 'Medianova',
    family: 'Medianova Edge',
    url: 'https://medianova-cdnvperf.mncdn.com/500b-bench.jpg',
    parseHeaders: (headers) => headers.get('x-edge-location') || '',
    icon: iconFromDomain('medianova.com'),
    tone: 'red',
  },
  {
    id: 'zenlayer',
    name: 'Zenlayer',
    family: 'Zenlayer Edge',
    url: 'https://test-perfops.ecn.zenlayer.net/500b-bench.jpg',
    parseHeaders: parseZenlayer,
    icon: iconFromDomain('zenlayer.com'),
    tone: 'cyan',
  },
  {
    id: 'melbicom',
    name: 'Melbicom',
    family: 'Swifty CDN',
    url: 'https://perfops.swiftycdn.net/500b-sw-bench.jpg',
    parseHeaders: (headers) => headers.get('x-swifty-node') || '',
    icon: iconFromDomain('melbicom.net'),
    tone: 'green',
  },
  {
    id: 'bytedance-cn',
    name: '字节跳动',
    nameEn: 'ByteDance',
    family: 'BytePlus / 火山',
    familyEn: 'BytePlus / Volcano Engine',
    url: 'https://perfops.byte-test.com/500b-bench.jpg',
    parseHeaders: parseByteDance,
    icon: iconFromDomain('bytedance.com'),
    tone: 'blue',
  },
  {
    id: 'bytedance-global',
    name: '字节跳动 海外',
    nameEn: 'ByteDance Global',
    family: 'BytePlus Global',
    url: 'https://perfops2.byte-test.com/500b-bench.jpg',
    parseHeaders: parseByteDance,
    icon: iconFromDomain('bytedance.com'),
    tone: 'blue',
  },
  {
    id: 'netease',
    name: '网易',
    nameEn: 'NetEase',
    family: 'NOS CDN',
    url: 'https://necaptcha.nosdn.127.net/ab7f4275c1744aa28e0a8f3a1c58c532.png',
    parseHeaders: parseNetease,
    icon: '/status/favicons/netease.svg',
    tone: 'red',
  },
  {
    id: 'quantil',
    name: '网宿 QUANTIL',
    nameEn: 'QUANTIL',
    family: 'QUANTIL',
    url: 'https://cdnperf-rum.quantil.com/500b-bench.jpg',
    parseHeaders: parseViaNodes,
    icon: '/status/favicons/quantil.svg',
    tone: 'red',
  },
  {
    id: 'cdnetworks',
    name: '网宿 CDNetworks',
    nameEn: 'CDNetworks',
    family: 'CDNetworks',
    url: 'https://cdnperf-rum.cdnetworks.net/500b-bench.jpg',
    parseHeaders: parseViaNodes,
    icon: iconFromDomain('cdnetworks.com'),
    tone: 'violet',
  },
];

const activeCdnProbes = cdnProbes.filter((probe) => probe.url);

async function requestWithTimeout(probe) {
  const controller = new AbortController();
  const startedAt = performance.now();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT);

  try {
    let lastError;

    for (let attempt = 0; attempt <= PROBE_RETRY_DELAYS.length; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, PROBE_RETRY_DELAYS[attempt - 1]));
      }

      const target = attempt === 0
        ? `${probe.url}${probe.url.includes('?') ? '&' : '?'}_=${Date.now()}`
        : probe.url;

      try {
        const response = await fetch(target, {
          method: probe.method || 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value = probe.parseText
          ? probe.parseText(await response.text())
          : probe.parseHeaders?.(response.headers);
        if (!value) throw new Error('node-missing');
        return {
          state: 'ready',
          node: value,
          latency: Math.max(1, Math.round(performance.now() - startedAt)),
          source: 'browser',
        };
      } catch (error) {
        lastError = error;
        if (error?.name === 'AbortError') throw error;
      }
    }

    throw lastError || new Error('fetch-failed');
  } catch (error) {
    return {
      state: 'error',
      error: error?.name === 'AbortError' ? 'request-timeout' : (error?.message || 'fetch-failed'),
      latency: Math.max(1, Math.round(performance.now() - startedAt)),
    };
  } finally {
    window.clearTimeout(timer);
  }
}

function stateLabel(state, t) {
  if (state === 'ready') return t('cdn.hit');
  if (state === 'error') return t('cdn.unreadable');
  if (state === 'loading') return t('common.detect');
  return t('common.pending');
}

function errorLabel(error, t) {
  if (error === 'node-missing') return t('cdn.nodeMissing');
  if (error === 'request-timeout') return t('cdn.requestTimeout');
  if (error === 'fetch-failed') return t('cdn.fetchFailed');
  return error || t('cdn.fetchFailed');
}

function CdnGlyph({ probe }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`cdn-glyph cdn-glyph--${probe.tone}`}>
      {!failed && probe.icon ? (
        <img src={probe.icon} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <Cloud size={24} aria-hidden="true" />
      )}
    </span>
  );
}

function CdnNodeCard({ probe, result }) {
  const { locale, t } = useI18n();
  const state = result?.state || 'idle';
  const ready = state === 'ready';
  const name = locale.startsWith('zh') ? probe.name : (probe.nameEn || probe.name);
  const family = probe.familyKey ? t(probe.familyKey) : (locale.startsWith('zh') ? probe.family : (probe.familyEn || probe.family));
  const fallback = errorLabel(result?.error, t) || stateLabel(state, t);
  return (
    <article className={`cdn-node-card cdn-node-card--${probe.tone} ${state}`}>
      <div className="cdn-node-card__head">
        <CdnGlyph probe={probe} />
        <div>
          <h2>{name}</h2>
          <p>{family}</p>
        </div>
      </div>

      <div className={`cdn-node-value ${state}`}>
        {state === 'loading' && <Loader2 className="spin" size={20} />}
        {ready && <CheckCircle2 size={20} />}
        {state === 'error' && <AlertTriangle size={20} />}
        <strong title={ready ? result.node : fallback}>
          {ready ? result.node : fallback}
        </strong>
      </div>

      <div className="cdn-node-meta">
        <span>{result?.latency ? `${result.latency} ms` : t('cdn.realtimeProbe')}</span>
        <b>{probe.method || 'HEAD'}</b>
      </div>
    </article>
  );
}

function CdnMetric({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`cdn-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  );
}

export function CdnNodePage() {
  const { t } = useI18n();
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const stats = useMemo(() => {
    const items = Object.values(results);
    const ready = items.filter((item) => item.state === 'ready').length;
    const error = items.filter((item) => item.state === 'error').length;
    const loading = items.filter((item) => item.state === 'loading').length;
    return { ready, error, loading, total: activeCdnProbes.length };
  }, [results]);

  async function runAll() {
    if (running) return;
    setRunning(true);
    setResults(Object.fromEntries(activeCdnProbes.map((probe) => [probe.id, { state: 'loading' }])));

    for (let index = 0; index < activeCdnProbes.length; index += PROBE_CONCURRENCY) {
      const batch = activeCdnProbes.slice(index, index + PROBE_CONCURRENCY);
      await Promise.all(batch.map(async (probe) => {
        const result = await requestWithTimeout(probe);
        setResults((current) => ({
          ...current,
          [probe.id]: result,
        }));
      }));
    }

    setRunning(false);
  }

  useEffect(() => {
    document.title = t('cdn.pageTitle');
    runAll();
  }, [t]);

  return (
    <section className="cdn-node-page">
      <section className="cdn-node-hero">
        <div>
          <span className="section-kicker"><Network size={16} /> CDN Node Lookup</span>
          <h1>{t('cdn.heroTitle')}</h1>
          <p>{t('cdn.heroCopy')}</p>
        </div>
        <button className="cdn-node-run-button" type="button" onClick={runAll} disabled={running}>
          {running ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          {running ? t('common.detect') : t('nav.rerun')}
        </button>
      </section>

      <section className="cdn-node-metrics">
        <CdnMetric icon={Cloud} label={t('cdn.probes')} value={t('common.count', { count: stats.total })} tone="neutral" />
        <CdnMetric icon={CheckCircle2} label={t('cdn.success')} value={t('common.count', { count: stats.ready })} tone={stats.ready ? 'safe' : 'neutral'} />
        <CdnMetric icon={Loader2} label={t('common.detect')} value={t('common.count', { count: stats.loading })} tone={stats.loading ? 'running' : 'neutral'} />
        <CdnMetric icon={AlertTriangle} label={t('cdn.unreadable')} value={t('common.count', { count: stats.error })} tone={stats.error ? 'warn' : 'neutral'} />
      </section>

      <section className="cdn-node-grid" aria-label={t('cdn.gridAria')}>
        {activeCdnProbes.map((probe) => (
          <CdnNodeCard
            key={probe.id}
            probe={probe}
            result={results[probe.id]}
          />
        ))}
      </section>
    </section>
  );
}

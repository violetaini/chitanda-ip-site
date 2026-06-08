import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Gauge,
  Loader2,
  RefreshCw,
  Timer,
  Wifi,
} from 'lucide-react';
import { useI18n } from './i18n.jsx';

const WARMUP_ROUNDS = 2;
const SAMPLE_ROUNDS = 15;
const ROUND_CONCURRENCY = 4;
const ROUND_GAP = 200;
const PROBE_TIMEOUT = 2000;
const iconFromDomain = (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`;

const latencyTargets = [
  {
    id: 'baidu',
    name: '百度',
    nameEn: 'Baidu',
    group: '国内',
    url: 'https://www.baidu.com/favicon.ico',
    icon: iconFromDomain('baidu.com'),
    tone: 'blue',
  },
  {
    id: 'douyin',
    name: '抖音',
    nameEn: 'Douyin',
    group: '国内',
    url: 'https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico',
    icon: 'https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico',
    tone: 'slate',
  },
  {
    id: 'qq',
    name: 'QQ',
    group: '国内',
    url: 'https://qzonestyle.gtimg.cn/qzone/qzact/act/external/tiqq/logo.png',
    icon: iconFromDomain('qq.com'),
    tone: 'cyan',
  },
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    nameEn: 'Bilibili',
    group: '国内',
    url: 'https://www.bilibili.com/favicon.ico',
    icon: iconFromDomain('bilibili.com'),
    tone: 'pink',
  },
  {
    id: 'zhihu',
    name: '知乎',
    nameEn: 'Zhihu',
    group: '国内',
    url: 'https://static.zhihu.com/heifetz/favicon.ico',
    icon: 'https://static.zhihu.com/heifetz/favicon.ico',
    tone: 'blue',
  },
  {
    id: 'tencent',
    name: '腾讯',
    nameEn: 'Tencent',
    group: '国内',
    url: 'https://www.tencent.com/favicon.ico',
    icon: iconFromDomain('tencent.com'),
    tone: 'cyan',
  },
  {
    id: 'github',
    name: 'GitHub',
    group: '开发',
    url: 'https://github.githubassets.com/favicons/favicon.svg',
    icon: iconFromDomain('github.com'),
    tone: 'slate',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    group: '国际',
    url: 'https://www.microsoft.com/favicon.ico',
    icon: iconFromDomain('microsoft.com'),
    tone: 'green',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    group: 'CDN',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/simple-icons/13.21.0/cloudflare.svg',
    icon: iconFromDomain('cloudflare.com'),
    tone: 'orange',
  },
  {
    id: 'fastly',
    name: 'Fastly',
    group: 'CDN',
    url: 'https://www.fastly.com/favicon.ico',
    icon: iconFromDomain('fastly.com'),
    tone: 'red',
  },
  {
    id: 'jsdelivr',
    name: 'jsDelivr',
    group: 'CDN',
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/jsdelivr.svg',
    icon: iconFromDomain('jsdelivr.com'),
    tone: 'green',
  },
  {
    id: 'apple',
    name: 'Apple',
    group: '国际',
    url: 'https://www.apple.com/favicon.ico',
    icon: iconFromDomain('apple.com'),
    tone: 'slate',
  },
];

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cacheBustedUrl(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function findTiming(url, fallbackDuration) {
  const entries = performance.getEntriesByName(url, 'resource');
  const entry = entries[entries.length - 1];
  if (!entry) return fallbackDuration;

  const responseStart = Number(entry.responseStart);
  const fetchStart = Number(entry.fetchStart);
  if (responseStart > 0 && fetchStart >= 0 && responseStart >= fetchStart) {
    return responseStart - fetchStart;
  }

  const responseEnd = Number(entry.responseEnd);
  const startTime = Number(entry.startTime);
  if (responseEnd > 0 && startTime >= 0 && responseEnd >= startTime) {
    return responseEnd - startTime;
  }

  return fallbackDuration;
}

function probeImage(url, signal) {
  return new Promise((resolve) => {
    const target = cacheBustedUrl(url);
    const startedAt = performance.now();
    const image = new Image();
    let settled = false;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      window.clearTimeout(timer);
    };

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      const elapsed = performance.now() - startedAt;
      const measured = ok ? findTiming(target, elapsed) : elapsed;
      cleanup();
      resolve({
        ok,
        latency: Math.max(1, Math.round(measured)),
      });
    };

    const abort = () => {
      image.src = '';
      finish(false);
    };

    const timer = window.setTimeout(() => finish(false), PROBE_TIMEOUT);
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    signal?.addEventListener('abort', abort, { once: true });
    image.src = target;
  });
}

function summarize(samples) {
  const total = samples.length;
  const values = samples.filter((sample) => sample.ok).map((sample) => sample.latency).sort((a, b) => a - b);
  const loss = total ? ((total - values.length) / total) * 100 : 0;
  const median = values.length ? values[Math.floor(values.length / 2)] : null;
  return {
    total,
    ok: values.length,
    median,
    fastest: values[0] ?? null,
    slowest: values[values.length - 1] ?? null,
    loss,
  };
}

async function measureTarget(target, signal, emit) {
  const samples = [];
  const totalRounds = WARMUP_ROUNDS + SAMPLE_ROUNDS;

  for (let round = 0; round < totalRounds; round += 1) {
    if (signal.aborted) break;
    const warmup = round < WARMUP_ROUNDS;
    const batch = await Promise.all(
      Array.from({ length: ROUND_CONCURRENCY }, () => probeImage(target.url, signal))
    );

    if (!warmup) samples.push(...batch);
    emit({
      state: 'running',
      progress: Math.min(100, Math.round(((round + 1) / totalRounds) * 100)),
      summary: summarize(samples),
    });

    if (round < totalRounds - 1) await sleep(ROUND_GAP);
  }

  return {
    state: signal.aborted ? 'idle' : 'ready',
    progress: signal.aborted ? 0 : 100,
    summary: summarize(samples),
  };
}

function formatMs(value) {
  return Number.isFinite(value) ? `${value} ms` : '--';
}

function formatLoss(value) {
  return Number.isFinite(value) ? `${value.toFixed(value >= 10 ? 0 : 1)}%` : '--';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function latencyScore(median) {
  if (!Number.isFinite(median)) return 0;
  if (median <= 80) return 100;
  if (median <= 160) return 100 - ((median - 80) / 80) * 20;
  if (median <= 300) return 80 - ((median - 160) / 140) * 30;
  if (median <= 700) return 50 - ((median - 300) / 400) * 30;
  return 10;
}

function getQuality(summary, t) {
  if (!summary?.total) {
    return { score: 0, label: t('latency.warmup'), tone: 'idle' };
  }

  if (!summary.ok) {
    return { score: 0, label: t('latency.unreachable'), tone: 'bad' };
  }

  const score = Math.round(clamp(latencyScore(summary.median) - (summary.loss || 0) * 1.8, 0, 100));
  if (score >= 85) return { score, label: t('latency.excellent'), tone: 'excellent' };
  if (score >= 68) return { score, label: t('latency.good'), tone: 'good' };
  if (score >= 45) return { score, label: t('latency.normal'), tone: 'normal' };
  if (score > 0) return { score, label: t('latency.poor'), tone: 'poor' };
  return { score, label: t('latency.unreachable'), tone: 'bad' };
}

function stateLabel(result, t) {
  if (result?.state === 'ready') return result.summary?.ok ? t('common.complete') : t('latency.timeout');
  if (result?.state === 'running') return t('common.detect');
  return t('common.pending');
}

function LatencyMetric({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`latency-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  );
}

function LatencyBadge({ target }) {
  const [failed, setFailed] = useState(false);
  const icon = target.icon || target.url;

  return (
    <span className={`latency-badge latency-badge--${target.tone}`}>
      {!failed && icon ? (
        <img src={icon} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        target.name.slice(0, 1)
      )}
    </span>
  );
}

function targetGroupLabel(group, t) {
  if (group === '国内') return t('webrtc.domestic');
  if (group === '国际') return t('webrtc.global');
  if (group === '开发') return 'Dev';
  return group;
}

function targetName(target, locale) {
  return locale.startsWith('zh') ? target.name : (target.nameEn || target.name);
}

function LatencyRow({ target, result }) {
  const { locale, t } = useI18n();
  const summary = result?.summary || {};
  const quality = getQuality(summary, t);
  const running = result?.state === 'running';
  const ready = result?.state === 'ready';
  const failed = ready && !summary.ok;

  return (
    <tr className={running ? 'running' : ready ? 'ready' : ''}>
      <td data-label={t('latency.target')}>
        <div className="latency-target-cell">
          <LatencyBadge target={target} />
          <div>
            <strong>{targetName(target, locale)}</strong>
            <span>{targetGroupLabel(target.group, t)}</span>
          </div>
        </div>
      </td>
      <td data-label={t('latency.state')}>
        <span className={`latency-state ${running ? 'running' : failed ? 'error' : ready ? 'ready' : ''}`}>
          {running && <Loader2 className="spin" size={14} />}
          {ready && !failed && <CheckCircle2 size={14} />}
          {failed && <AlertTriangle size={14} />}
          {stateLabel(result, t)}
        </span>
      </td>
      <td data-label={t('latency.median')}>{formatMs(summary.median)}</td>
      <td data-label={t('latency.fastest')}>{formatMs(summary.fastest)}</td>
      <td data-label={t('latency.slowest')}>{formatMs(summary.slowest)}</td>
      <td data-label={t('latency.packetLoss')}>{formatLoss(summary.loss)}</td>
      <td data-label={t('latency.quality')}>
        <div className={`latency-quality latency-quality--${quality.tone}`} title={t('latency.linkQuality', { name: targetName(target, locale), score: quality.score })}>
          <div className="latency-quality-head">
            <strong>{quality.label}</strong>
            <span>{quality.score}</span>
          </div>
          <div className="latency-quality-bar" aria-label={t('latency.linkQuality', { name: targetName(target, locale), score: quality.score })}>
            <span style={{ width: `${quality.score}%` }} />
          </div>
        </div>
      </td>
    </tr>
  );
}

export function LatencyPage() {
  const { t } = useI18n();
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const runRef = useRef(null);

  const stats = useMemo(() => {
    const rows = latencyTargets.map((target) => results[target.id]).filter(Boolean);
    const ready = rows.filter((row) => row.state === 'ready').length;
    const loading = rows.filter((row) => row.state === 'running').length;
    const medians = rows
      .filter((row) => row.state === 'ready' && Number.isFinite(row.summary?.median))
      .map((row) => row.summary.median)
      .sort((a, b) => a - b);
    const lossValues = rows
      .filter((row) => row.state === 'ready' && Number.isFinite(row.summary?.loss))
      .map((row) => row.summary.loss);
    const averageLoss = lossValues.length
      ? lossValues.reduce((sum, value) => sum + value, 0) / lossValues.length
      : 0;

    return {
      ready,
      loading,
      fastestMedian: medians[0] ?? null,
      averageLoss,
      total: latencyTargets.length,
    };
  }, [results]);

  async function runAll() {
    runRef.current?.abort();
    const controller = new AbortController();
    runRef.current = controller;
    setRunning(true);
    setResults(Object.fromEntries(latencyTargets.map((target) => [target.id, {
      state: 'running',
      progress: 0,
      summary: summarize([]),
    }])));

    await Promise.all(latencyTargets.map(async (target) => {
      const result = await measureTarget(target, controller.signal, (next) => {
        setResults((current) => ({
          ...current,
          [target.id]: next,
        }));
      });
      if (!controller.signal.aborted) {
        setResults((current) => ({
          ...current,
          [target.id]: result,
        }));
      }
    }));

    if (!controller.signal.aborted) setRunning(false);
  }

  useEffect(() => {
    document.title = t('latency.pageTitle');
    runAll();
    return () => {
      runRef.current?.abort();
    };
  }, [t]);

  return (
    <section className="latency-page">
      <section className="latency-hero">
        <div>
          <span className="section-kicker"><Gauge size={16} /> Browser Latency</span>
          <h1>{t('latency.heroTitle')}</h1>
          <p>{t('latency.heroCopy')}</p>
        </div>
        <button className="latency-run-button" type="button" onClick={runAll} disabled={running}>
          {running ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          {running ? t('common.detect') : t('nav.rerun')}
        </button>
      </section>

      <section className="latency-metrics">
        <LatencyMetric icon={Globe2} label={t('latency.targets')} value={t('common.count', { count: stats.total })} />
        <LatencyMetric icon={CheckCircle2} label={t('latency.completed')} value={t('common.count', { count: stats.ready })} tone={stats.ready ? 'safe' : 'neutral'} />
        <LatencyMetric icon={Timer} label={t('latency.lowestMedian')} value={formatMs(stats.fastestMedian)} tone={stats.fastestMedian ? 'detected' : 'neutral'} />
        <LatencyMetric icon={Wifi} label={t('latency.averageLoss')} value={formatLoss(stats.averageLoss)} tone={stats.averageLoss ? 'warn' : 'safe'} />
      </section>

      <section className="latency-results-card">
        <div className="latency-section-head">
          <div>
            <span className="section-kicker"><Activity size={16} /> HTTP Timing</span>
            <h2>{t('latency.results')}</h2>
          </div>
          <small>{stats.loading ? t('latency.runningCount', { count: stats.loading }) : stats.ready ? t('latency.completeCount', { count: stats.ready }) : t('common.waitingDetect')}</small>
        </div>

        <div className="latency-table-wrap">
          <table className="latency-table">
            <thead>
              <tr>
                <th>{t('latency.target')}</th>
                <th>{t('latency.state')}</th>
                <th>{t('latency.median')}</th>
                <th>{t('latency.fastest')}</th>
                <th>{t('latency.slowest')}</th>
                <th>{t('latency.packetLoss')}</th>
                <th>{t('latency.quality')}</th>
              </tr>
            </thead>
            <tbody>
              {latencyTargets.map((target) => (
                <LatencyRow key={target.id} target={target} result={results[target.id]} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

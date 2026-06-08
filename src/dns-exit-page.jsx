import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Globe2,
  Loader2,
  Network,
  RefreshCw,
  Server,
} from 'lucide-react';
import { useI18n } from './i18n.jsx';
import { normalizePoliticalName } from './political-names.js';

const GEOIP_BASE = import.meta.env.VITE_GEOIP_BASE
  || (window.location.hostname === 'ip.chitanda.net' ? '/api/geoip' : 'https://ip.chitanda.net/geoip');

const TOKEN_ALPHABET = 'useandom2619834075pxbfghjklqvwyzrict';
const PROVIDER_TIMEOUT = 9000;
const SHORT_PAUSE = 140;
const TAIPEI_CN_NAME = String.fromCharCode(21488, 21271);
const TAIWAN_CN_NAME = String.fromCharCode(21488, 28286);

const dnsProviders = [
  { id: 'alibaba', label: 'Alibaba DNS Detect', short: 'alibaba', region: 'domestic', attempts: 4 },
  { id: 'ipapi', label: 'ip-api EDNS', short: 'ipapi', region: 'international', attempts: 4 },
  { id: 'surfshark', label: 'Surfshark DNS', short: 'surfshark', region: 'international', attempts: 4 },
  { id: 'browserleaks', label: 'BrowserLeaks DNS', short: 'browserleaks', region: 'international', attempts: 6 },
  { id: 'ipleak', label: 'IPLeak DNS', short: 'ipleaks', region: 'international', attempts: 8 },
];

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function randomToken(length = 32) {
  return Array.from({ length }, () => TOKEN_ALPHABET[Math.floor(Math.random() * TOKEN_ALPHABET.length)]).join('');
}

function requestJson(url, { timeout = PROVIDER_TIMEOUT, signal, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });

  return fetch(url, {
    signal: controller.signal,
    cache: 'no-store',
    headers: { accept: 'application/json', ...headers },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .finally(() => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    });
}

function requestJsonp(urlFactory, { timeout = PROVIDER_TIMEOUT, signal } = {}) {
  return new Promise((resolve, reject) => {
    const callbackRoot = '__chitanda_dns_jsonp_callbacks__';
    const callbackName = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let settled = false;

    window[callbackRoot] ||= {};

    const cleanup = () => {
      script.remove();
      delete window[callbackRoot][callbackName];
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      handler(value);
    };

    const onAbort = () => settle(reject, new DOMException('request-canceled', 'AbortError'));
    const timer = window.setTimeout(() => settle(reject, new Error('request-timeout')), timeout);

    window[callbackRoot][callbackName] = (payload) => settle(resolve, payload);
    script.async = true;
    script.src = urlFactory(`window.${callbackRoot}.${callbackName}`);
    script.onerror = () => settle(reject, new Error('jsonp-failed'));
    signal?.addEventListener('abort', onAbort, { once: true });
    document.body.append(script);
  });
}

function currentGeoEndpoint() {
  return GEOIP_BASE.replace(/\/$/, '');
}

async function enrichIp(ip, signal, locale) {
  try {
    return await requestJson(`${currentGeoEndpoint()}/${encodeURIComponent(ip)}`, {
      timeout: 6500,
      signal,
      headers: { 'accept-language': locale },
    });
  } catch {
    return null;
  }
}

function isIpv4(ip) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(ip || ''));
}

function isIpv6(ip) {
  return String(ip || '').includes(':');
}

function ipVersion(ip) {
  if (isIpv4(ip)) return 4;
  if (isIpv6(ip)) return 6;
  return 0;
}

function normalizeCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

function cleanLocation(...pieces) {
  return pieces
    .flat()
    .map((piece) => normalizePoliticalName(piece))
    .filter(Boolean)
    .join(' ');
}

function formatGeo(data) {
  if (!data) return '';
  return cleanLocation(data.country, data.region, data.city, data.isp || data.organization || data.asn_organization);
}

function formatAlibaba(content) {
  if (!content) return '';
  return cleanLocation(content.dnsProvince, content.dnsCity, content.dnsOperator);
}

function formatSurfshark(entry) {
  if (!entry) return '';
  return cleanLocation(entry.Country, entry.City, entry.ISP);
}

function makeRecord({ ip, type, provider, countryCode = '', geolocation = '' }) {
  if (!ip) return null;
  return {
    ip,
    types: new Set([type]),
    providers: new Set([provider]),
    countryCode: normalizeCountryCode(countryCode),
    geolocation: normalizePoliticalName(geolocation),
    geo: null,
  };
}

function mergeRecordMap(current, incoming) {
  if (!incoming) return current;
  const next = new Map(current);
  const existing = next.get(incoming.ip);
  if (!existing) {
    next.set(incoming.ip, incoming);
    return next;
  }

  incoming.types.forEach((type) => existing.types.add(type));
  incoming.providers.forEach((provider) => existing.providers.add(provider));
  if (!existing.countryCode && incoming.countryCode) existing.countryCode = incoming.countryCode;
  if (!existing.geolocation && incoming.geolocation) existing.geolocation = incoming.geolocation;
  if (!existing.geo && incoming.geo) existing.geo = incoming.geo;
  next.set(incoming.ip, existing);
  return next;
}

function mergeGeoIntoMap(current, ip, geo) {
  if (!geo) return current;
  const next = new Map(current);
  const existing = next.get(ip);
  if (!existing) return current;
  next.set(ip, {
    ...existing,
    countryCode: existing.countryCode || normalizeCountryCode(geo.country_code),
    geolocation: existing.geolocation || formatGeo(geo),
    geo,
  });
  return next;
}

async function runAlibaba(signal, emit) {
  let count = 0;
  for (let index = 0; index < 4; index += 1) {
    if (signal.aborted) return count;
    try {
      const stamp = `${Date.now()}-${randomToken(16)}`;
      const data = await requestJsonp((callback) => (
        `https://${stamp}.dns-detect.alicdn.com/api/detect/DescribeDNSLookup?cb=${callback}`
      ), { signal });
      const content = data?.content;
      const record = makeRecord({
        ip: content?.ldns,
        type: 'domestic',
        provider: 'alibaba',
        countryCode: content?.dnsCountry,
        geolocation: formatAlibaba(content),
      });
      if (record) {
        emit(record);
        count += 1;
      }
    } catch {}
    await sleep(800);
  }
  return count;
}

async function runIpApi(signal, emit) {
  let count = 0;
  for (let index = 0; index < 4; index += 1) {
    if (signal.aborted) return count;
    try {
      const data = await requestJson(`https://${randomToken(32)}.edns.ip-api.com/json?lang=zh-CN`, { signal });
      const record = makeRecord({
        ip: data?.dns?.ip,
        type: 'international',
        provider: 'ipapi',
        geolocation: data?.dns?.geo,
      });
      if (record) {
        emit(record);
        count += 1;
      }
    } catch {}
    await sleep(SHORT_PAUSE);
  }
  return count;
}

async function runSurfshark(signal, emit) {
  let count = 0;
  for (let index = 0; index < 4; index += 1) {
    if (signal.aborted) return count;
    for (const version of [4, 6]) {
      if (signal.aborted) return count;
      try {
        const data = await requestJson(`https://${Date.now()}-${randomToken(8)}.ipv${version}.surfsharkdns.com`, { signal });
        Object.entries(data || {}).forEach(([ip, entry]) => {
          const record = makeRecord({
            ip,
            type: 'international',
            provider: 'surfshark',
            countryCode: entry?.CountryCode,
            geolocation: formatSurfshark(entry),
          });
          if (record) {
            emit(record);
            count += 1;
          }
        });
      } catch {}
    }
    await sleep(SHORT_PAUSE);
  }
  return count;
}

async function runBrowserLeaks(signal, emit) {
  let count = 0;
  const domains = [
    [4, 'net'],
    [6, 'net'],
    [4, 'org'],
    [6, 'org'],
  ];

  for (let round = 0; round < 2; round += 1) {
    for (const [version, tld] of domains) {
      if (signal.aborted) return count;
      try {
        const data = await requestJson(`https://${randomToken(12)}.dns${version}.browserleaks.${tld}`, { signal });
        Object.entries(data || {}).forEach(([ip, details]) => {
          const pieces = Array.isArray(details) ? details : [];
          const record = makeRecord({
            ip,
            type: 'international',
            provider: 'browserleaks',
            countryCode: pieces[0],
            geolocation: cleanLocation(pieces.slice(1)),
          });
          if (record) {
            emit(record);
            count += 1;
          }
        });
      } catch {}
    }
    await sleep(SHORT_PAUSE);
  }
  return count;
}

async function runIpLeak(signal, emit) {
  let count = 0;
  const batchToken = randomToken(40);
  for (let index = 1; index <= 8; index += 1) {
    if (signal.aborted) return count;
    try {
      const data = await requestJson(`https://${batchToken}-${index}.ipleak.net/dnsdetection/`, { signal });
      const ips = data && !Array.isArray(data) ? Object.keys(data.ip || {}) : [];
      ips.forEach((ip) => {
        const record = makeRecord({
          ip,
          type: 'international',
          provider: 'ipleaks',
        });
        if (record) {
          emit(record);
          count += 1;
        }
      });
    } catch {}
    await sleep(SHORT_PAUSE);
  }
  return count;
}

const providerRunners = {
  alibaba: runAlibaba,
  ipapi: runIpApi,
  surfshark: runSurfshark,
  browserleaks: runBrowserLeaks,
  ipleak: runIpLeak,
};

function DnsMetric({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`dns-exit-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <label>{label}</label>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function TypeBadge({ type }) {
  const { t } = useI18n();
  return <span className={`dns-type-badge ${type}`}>{type === 'domestic' ? t('dns.domestic') : t('dns.international')}</span>;
}

function inferCountryCode(row) {
  const explicit = normalizeCountryCode(row.countryCode || row.geo?.country_code);
  if (explicit) return explicit;

  const location = String(row.geolocation || '').toLowerCase();
  if (/hong kong|香港/.test(location)) return 'HK';
  if (/singapore|新加坡/.test(location)) return 'SG';
  if (/united states|美国|los angeles|california|iowa/.test(location)) return 'US';
  if (/china|中国|beijing|北京市|tianjin|chinanet|cnisp/.test(location)) return 'CN';
  if (/taiwan|taipei/.test(location) || location.includes(TAIPEI_CN_NAME) || location.includes(TAIWAN_CN_NAME)) return 'TW';
  return '';
}

function countryName(row, code, t, locale) {
  if (code === 'TW') return locale.startsWith('zh') ? '中国台湾' : 'Taiwan, China';
  if (row.geo?.country || row.geo?.region) {
    return cleanLocation(row.geo.country, row.geo.region);
  }
  return normalizePoliticalName(row.geolocation || code || t('common.unknown'));
}

function flagSource(code) {
  if (code === 'TW') return '/flags/tw.svg';
  if (!code) return '';
  return `https://circle-flags.cdn.skk.moe/flags/${code.toLowerCase()}.svg`;
}

function CountryFlag({ row }) {
  const { locale, t } = useI18n();
  const code = inferCountryCode(row);
  const src = flagSource(code);
  const label = countryName(row, code, t, locale);

  return (
    <span className={`dns-country-flag dns-country-flag--${code ? code.toLowerCase() : 'unknown'}`} title={label} aria-label={label}>
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <span aria-hidden="true">?</span>
      )}
    </span>
  );
}

export function DnsExitPage() {
  const { locale, t } = useI18n();
  const [state, setState] = useState('idle');
  const [records, setRecords] = useState(new Map());
  const [providerStates, setProviderStates] = useState(() => (
    Object.fromEntries(dnsProviders.map((provider) => [provider.id, { state: 'idle', count: 0 }]))
  ));
  const runRef = useRef(null);

  const rows = useMemo(() => (
    [...records.values()]
      .map((record) => ({
        ...record,
        types: [...record.types],
        providers: [...record.providers],
      }))
      .sort((a, b) => {
        const domesticA = a.types.includes('domestic');
        const domesticB = b.types.includes('domestic');
        if (domesticA !== domesticB) return domesticA ? -1 : 1;
        if (ipVersion(a.ip) !== ipVersion(b.ip)) return ipVersion(a.ip) === 4 ? -1 : 1;
        return a.ip.localeCompare(b.ip);
      })
  ), [records]);

  const providerStats = useMemo(() => dnsProviders.map((provider) => ({
    ...provider,
    ...(providerStates[provider.id] || { state: 'idle', count: 0 }),
  })), [providerStates]);

  const runningProviders = providerStats.filter((provider) => provider.state === 'running').length;
  const readyProviders = providerStats.filter((provider) => provider.state === 'ready').length;
  const domesticCount = rows.filter((row) => row.types.includes('domestic')).length;

  async function runLookup() {
    runRef.current?.abort();
    const controller = new AbortController();
    runRef.current = controller;

    setState('running');
    setRecords(new Map());
    setProviderStates(Object.fromEntries(dnsProviders.map((provider) => [provider.id, { state: 'running', count: 0 }])));

    const emit = (record) => {
      setRecords((current) => mergeRecordMap(current, record));
      enrichIp(record.ip, controller.signal, locale).then((geo) => {
        if (!controller.signal.aborted) {
          setRecords((current) => mergeGeoIntoMap(current, record.ip, geo));
        }
      });
    };

    await Promise.all(dnsProviders.map(async (provider) => {
      const runner = providerRunners[provider.id];
      let count = 0;
      try {
        count = await runner(controller.signal, emit);
      } catch {}
      if (!controller.signal.aborted) {
        setProviderStates((current) => ({
          ...current,
          [provider.id]: { state: count ? 'ready' : 'empty', count },
        }));
      }
    }));

    if (!controller.signal.aborted) setState('complete');
  }

  useEffect(() => {
    document.title = t('dns.pageTitle');
    runLookup();
    return () => runRef.current?.abort();
  }, [locale, t]);

  return (
    <section className="dns-exit-page">
      <section className="dns-exit-hero">
        <div>
          <span className="section-kicker"><Server size={16} /> DNS Exit Lookup</span>
          <h1>{t('dns.heroTitle')}</h1>
          <p>{t('dns.heroCopy')}</p>
        </div>
        <button className="dns-exit-run-button" type="button" onClick={runLookup} disabled={state === 'running'}>
          {state === 'running' ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          {state === 'running' ? t('common.detect') : state === 'idle' ? t('webrtc.start') : t('nav.rerun')}
        </button>
      </section>

      <section className="dns-exit-metrics">
        <DnsMetric icon={Network} label={t('dns.dnsExit')} value={state === 'running' ? t('dns.discovered', { count: rows.length }) : t('common.count', { count: rows.length })} tone={rows.length ? 'safe' : 'neutral'} />
        <DnsMetric icon={Globe2} label={t('dns.domesticInternational')} value={`${domesticCount} / ${Math.max(0, rows.length - domesticCount)}`} tone={rows.length ? 'detected' : 'neutral'} />
        <DnsMetric icon={CheckCircle2} label={t('dns.readyProviders')} value={`${readyProviders}/${dnsProviders.length}`} tone={readyProviders ? 'safe' : 'neutral'} />
        <DnsMetric icon={Loader2} label={t('common.detect')} value={t('common.count', { count: runningProviders })} tone={runningProviders ? 'running' : 'neutral'} />
      </section>

      <section className="dns-exit-results-card">
        <div className="dns-exit-section-head">
          <div>
            <span className="section-kicker"><Globe2 size={16} /> Resolver IP</span>
            <h2>{t('dns.results')}</h2>
          </div>
          <small>{state === 'running' ? t('common.realtime') : rows.length ? t('common.rows', { count: rows.length }) : t('common.waitingDetect')}</small>
        </div>

        <div className="dns-exit-table-wrap">
          <table className="dns-exit-table">
            <thead>
              <tr>
                <th>{t('dns.dnsExit')} IP</th>
                <th>{t('dns.type')}</th>
                <th>Geolocation</th>
                <th>{t('dns.countryRegion')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row) => (
                <tr key={row.ip}>
                  <td data-label={`${t('dns.dnsExit')} IP`}><strong className={ipVersion(row.ip) === 6 ? 'ipv6' : ''}>{row.ip}</strong></td>
                  <td data-label={t('dns.type')}>
                    <div className="dns-type-list">{row.types.map((type) => <TypeBadge key={type} type={type} />)}</div>
                  </td>
                  <td data-label="Geolocation">{row.geolocation || t('dns.loadingGeo')}</td>
                  <td data-label={t('dns.countryRegion')}>
                    <CountryFlag row={row} />
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4">
                    <div className="dns-exit-empty">
                      {state === 'running' ? <Loader2 className="spin" size={22} /> : <Server size={22} />}
                      <strong>{state === 'running' ? t('dns.waitingDns') : t('common.noResult')}</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

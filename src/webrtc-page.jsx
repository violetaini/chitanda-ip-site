import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Loader2,
  Network,
  RadioTower,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { useI18n } from './i18n.jsx';
import { normalizeLocationPieces, normalizePoliticalName } from './political-names.js';
import { getGeoipBase, SITE_CONFIG } from './site-config.js';

const GEOIP_BASE = getGeoipBase();

const STUN_SERVERS = [
  ...(SITE_CONFIG.ownStunUrl ? [{
    id: 'own-stun',
    name: SITE_CONFIG.ownStunName,
    region: SITE_CONFIG.ownStunRegion,
    urls: SITE_CONFIG.ownStunUrl
  }] : []),
  { id: 'cn-miwifi', name: '小米路由器', region: 'domestic', urls: 'stun:stun.miwifi.com:3478' },
  { id: 'cn-bilibili', name: 'Bilibili', region: 'domestic', urls: 'stun:39.107.142.158:3478' },
  { id: 'cn-hitv', name: '芒果 TV', region: 'domestic', urls: 'stun:stun.hitv.com:3478' },
  { id: 'global-google', name: 'Google STUN', region: 'global', urls: 'stun:stun.l.google.com:19302' },
  { id: 'global-freeswitch', name: 'FreeSWITCH', region: 'global', urls: 'stun:stun.freeswitch.org:3478' },
  { id: 'global-cloudflare', name: 'Cloudflare', region: 'global', urls: 'stun:stun.cloudflare.com:3478' },
  { id: 'global-twilio', name: 'Twilio Global', region: 'global', urls: 'stun:global.stun.twilio.com:3478' }
];

const SCAN_TIMEOUT = 6500;
const DOMESTIC_STUN_COUNT = STUN_SERVERS.filter((server) => server.region === 'domestic').length;
const GLOBAL_STUN_COUNT = STUN_SERVERS.length - DOMESTIC_STUN_COUNT;

function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), options.timeout || 7500);

  return fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      accept: 'application/json',
      ...(options.headers || {})
    }
  })
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.json();
    })
    .finally(() => window.clearTimeout(timer));
}

function currentGeoEndpoint() {
  return GEOIP_BASE.replace(/\/$/, '');
}

function ipGeoEndpoint(ip) {
  return `${currentGeoEndpoint()}/${encodeURIComponent(ip)}`;
}

async function getHttpExit(locale) {
  return requestJson(currentGeoEndpoint(), {
    headers: { 'accept-language': locale },
    timeout: 7500
  });
}

async function enrichIp(ip, locale) {
  return requestJson(ipGeoEndpoint(ip), {
    headers: { 'accept-language': locale },
    timeout: 7500
  });
}

function isValidIpv4(value) {
  const parts = String(value || '').split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function isValidIpv6(value) {
  const input = String(value || '').toLowerCase();
  if (!input.includes(':')) return false;
  if (!/^[0-9a-f:.]+$/i.test(input)) return false;
  const halves = input.split('::');
  if (halves.length > 2) return false;
  const hasCompression = halves.length === 2;
  let groupCount = 0;

  for (const half of halves) {
    if (!half) continue;
    const pieces = half.split(':');
    if (pieces.some((piece) => piece === '')) return false;

    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (piece.includes('.')) {
        if (index !== pieces.length - 1 || !isValidIpv4(piece)) return false;
        groupCount += 2;
      } else {
        if (!/^[0-9a-f]{1,4}$/i.test(piece)) return false;
        groupCount += 1;
      }
    }
  }

  return hasCompression ? groupCount < 8 : groupCount === 8;
}

function getIpVersion(value) {
  if (isValidIpv4(value)) return 4;
  if (isValidIpv6(value)) return 6;
  return 0;
}

function isPrivateIpv4(ip) {
  if (!isValidIpv4(ip)) return false;
  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isPrivateIpv6(ip) {
  const value = String(ip || '').toLowerCase();
  return value === '::'
    || value === '::1'
    || value.startsWith('fe80:')
    || value.startsWith('fc')
    || value.startsWith('fd');
}

function isPublicIp(ip) {
  const version = getIpVersion(ip);
  if (version === 4) return !isPrivateIpv4(ip);
  if (version === 6) return !isPrivateIpv6(ip);
  return false;
}

function findIpInCandidate(candidateText, explicitAddress) {
  if (getIpVersion(explicitAddress)) return explicitAddress;

  const ipv4 = candidateText.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/);
  if (ipv4?.[0] && getIpVersion(ipv4[0])) return ipv4[0];

  const ipv6Candidates = candidateText.match(/\b(?:[a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}\b/ig) || [];
  return ipv6Candidates.find((value) => getIpVersion(value)) || '';
}

function parseIceCandidate(candidate, server) {
  const text = String(candidate?.candidate || '');
  if (!text) return null;

  const tokens = text.trim().split(/\s+/);
  const typeIndex = tokens.indexOf('typ');
  const explicitAddress = candidate?.address || candidate?.ip || tokens[4] || '';
  const ip = findIpInCandidate(text, explicitAddress);
  if (!ip) return null;

  const type = candidate?.type || (typeIndex >= 0 ? tokens[typeIndex + 1] : '') || 'unknown';
  const protocol = String(candidate?.protocol || tokens[2] || '').toUpperCase();
  const port = candidate?.port || tokens[5] || '';

  return {
    ip,
    version: getIpVersion(ip),
    public: isPublicIp(ip),
    type,
    protocol,
    port,
    source: server.name,
    sourceId: server.id,
    region: server.region,
    raw: text
  };
}

function runStunProbe(server) {
  return new Promise((resolve) => {
    if (!window.RTCPeerConnection) {
      resolve({ server, status: 'unsupported', candidates: [], error: '浏览器不支持 RTCPeerConnection' });
      return;
    }

    const candidates = [];
    let peer = null;
    let channel = null;
    let finished = false;

    const finish = (status = 'complete', error = '') => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      try { channel?.close(); } catch {}
      try { peer?.close(); } catch {}
      resolve({ server, status, candidates, error });
    };

    const timeout = window.setTimeout(() => finish('timeout'), SCAN_TIMEOUT);

    try {
      peer = new RTCPeerConnection({
        iceServers: [{ urls: server.urls }],
        iceCandidatePoolSize: 0
      });

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          finish('complete');
          return;
        }

        const parsed = parseIceCandidate(event.candidate, server);
        if (parsed) candidates.push(parsed);
      };

      peer.onicegatheringstatechange = () => {
        if (peer?.iceGatheringState === 'complete') finish('complete');
      };

      channel = peer.createDataChannel('chitanda-webrtc-probe');
      peer.createOffer()
        .then((offer) => peer.setLocalDescription(offer))
        .catch((error) => finish('error', error?.message || 'STUN 探测失败'));
    } catch (error) {
      finish('error', error?.message || 'STUN 探测失败');
    }
  });
}

function aggregateCandidates(probes) {
  const byIp = new Map();

  for (const probe of probes) {
    for (const candidate of probe.candidates || []) {
      if (!candidate.public && candidate.type !== 'relay') continue;
      const current = byIp.get(candidate.ip) || {
        ip: candidate.ip,
        version: candidate.version,
        public: candidate.public,
        types: new Set(),
        protocols: new Set(),
        ports: new Set(),
        sources: new Set(),
        regions: new Set(),
        sourceGroups: {
          domestic: new Set(),
          global: new Set()
        },
        raw: candidate.raw
      };

      current.types.add(candidate.type);
      if (candidate.protocol) current.protocols.add(candidate.protocol);
      if (candidate.port) current.ports.add(String(candidate.port));
      current.sources.add(candidate.source);
      const region = candidate.region === 'domestic' ? 'domestic' : 'global';
      current.regions.add(region);
      current.sourceGroups[region].add(candidate.source);
      current.public = current.public || candidate.public;
      byIp.set(candidate.ip, current);
    }
  }

  return [...byIp.values()]
    .map((entry) => ({
      ...entry,
      types: [...entry.types],
      protocols: [...entry.protocols],
      ports: [...entry.ports],
      sources: [...entry.sources],
      regions: [...entry.regions],
      sourceGroups: {
        domestic: [...entry.sourceGroups.domestic],
        global: [...entry.sourceGroups.global]
      }
    }))
    .sort((a, b) => Number(b.public) - Number(a.public) || a.ip.localeCompare(b.ip));
}

function candidateTypeLabel(types, t) {
  if (types.includes('relay')) return t('webrtc.relay');
  if (types.includes('srflx')) return t('webrtc.public');
  if (types.includes('prflx')) return t('webrtc.peer');
  if (types.includes('host')) return t('webrtc.host');
  return t('webrtc.candidate');
}

function sourceSummary(entry, t) {
  const groups = [];
  const domesticCount = entry.sourceGroups?.domestic?.length || 0;
  const globalCount = entry.sourceGroups?.global?.length || 0;
  if (domesticCount) groups.push(`${t('webrtc.domestic')} ${domesticCount}`);
  if (globalCount) groups.push(`${t('webrtc.global')} ${globalCount}`);
  return groups.join(' · ') || entry.sources.join(' / ');
}

function sourceTitle(entry) {
  return entry.sources.join(' / ');
}

function serverAddressLabel(urls) {
  return String(urls || '').replace(/^stun:/, '');
}

function publicCandidatesForProbe(probe) {
  const byIp = new Map();
  for (const candidate of probe?.candidates || []) {
    if (!candidate.public && candidate.type !== 'relay') continue;
    if (!byIp.has(candidate.ip)) byIp.set(candidate.ip, candidate);
  }
  return [...byIp.values()].sort((a, b) => a.ip.localeCompare(b.ip));
}

function formatLocation(data, t) {
  if (!data) return t('common.unknownLocation');
  return normalizeLocationPieces([data.country, data.region, data.city]).join(' · ') || t('common.unknownLocation');
}

function formatOrg(data, t) {
  if (!data) return t('common.unknownNetwork');
  return normalizePoliticalName(data.isp || data.organization || data.asn_organization || t('common.unknownNetwork'));
}

function statusLabel(status, t) {
  if (status === 'running') return t('common.detect');
  if (status === 'complete') return t('common.complete');
  if (status === 'timeout') return t('common.timeout');
  if (status === 'unsupported') return t('webrtc.unsupported');
  if (status === 'error') return t('common.failed');
  return t('common.pending');
}

function statusHint(status, detected = false, t) {
  if (status === 'complete') return detected ? t('webrtc.detected') : t('webrtc.notFound');
  if (status === 'timeout') return t('webrtc.noResponse');
  if (status === 'unsupported') return t('common.unavailable');
  if (status === 'error') return t('common.failed');
  if (status === 'running') return t('common.detect');
  return t('common.pending');
}

function WebRtcMetric({ icon: Icon, label, value, tone = 'neutral' }) {
  return (
    <div className={`webrtc-metric ${tone}`}>
      <span><Icon size={18} /></span>
      <label>{label}</label>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function scanNotice(state, entries, unsupported, error, t) {
  if (state === 'running') {
    return {
      tone: 'neutral',
      icon: Loader2,
      spin: true,
      title: t('webrtc.noticeRunningTitle'),
      summary: t('webrtc.noticeRunningCopy')
    };
  }

  if (state === 'error') {
    return {
      tone: 'warn',
      icon: AlertTriangle,
      title: t('webrtc.noticeFailedTitle'),
      summary: error || t('webrtc.noticeFailedCopy')
    };
  }

  if (unsupported) {
    return {
      tone: 'warn',
      icon: AlertTriangle,
      title: t('webrtc.noticeUnsupportedTitle'),
      summary: t('webrtc.noticeUnsupportedCopy')
    };
  }

  const publicCount = entries.filter((entry) => entry.public).length;
  if (!publicCount) {
    return {
      tone: 'neutral',
      icon: RadioTower,
      title: t('webrtc.noticeEmptyTitle'),
      summary: t('webrtc.noticeEmptyCopy')
    };
  }

  return {
    tone: 'detected',
    icon: CheckCircle2,
    title: t('webrtc.noticeDetectedTitle', { count: publicCount }),
    summary: t('webrtc.noticeDetectedCopy')
  };
}

function ScanNoticeIcon({ notice }) {
  const Icon = notice.icon;
  return <Icon className={notice.spin ? 'spin' : ''} size={24} />;
}

function StunStatusIcon({ status, detected = false }) {
  if (status === 'running') return <Loader2 className="spin" size={16} />;
  if (status === 'complete' && detected) return <CheckCircle2 size={16} />;
  if (status === 'timeout' || status === 'error' || status === 'unsupported') return <AlertTriangle size={16} />;
  return <RadioTower size={16} />;
}

function ipTextClass(ip) {
  return getIpVersion(ip) === 6 ? 'ipv6' : 'ipv4';
}

export function WebRtcPage() {
  const { locale, t } = useI18n();
  const [state, setState] = useState('idle');
  const [httpExit, setHttpExit] = useState(null);
  const [entries, setEntries] = useState([]);
  const [probes, setProbes] = useState([]);
  const [error, setError] = useState('');
  const [copiedIp, setCopiedIp] = useState('');

  const unsupported = probes.some((probe) => probe.status === 'unsupported');
  const notice = useMemo(() => (
    scanNotice(state, entries, unsupported, error, t)
  ), [entries, error, state, unsupported, t]);
  const publicCount = entries.filter((entry) => entry.public).length;
  const settledProbes = probes.filter((probe) => ['complete', 'timeout', 'error', 'unsupported'].includes(probe.status));
  const domesticDone = settledProbes.filter((probe) => probe.server.region === 'domestic').length;
  const globalDone = settledProbes.filter((probe) => probe.server.region === 'global').length;
  const geoByIp = useMemo(() => new Map(entries.map((entry) => [entry.ip, entry.geo])), [entries]);
  const probeRows = useMemo(() => STUN_SERVERS.map((server) => {
    const probe = probes.find((item) => item.server.id === server.id);
    const status = state === 'running' && !probe ? 'running' : probe?.status || 'idle';
    const candidates = publicCandidatesForProbe(probe);
    const detected = candidates.length > 0;
    const statusTone = status === 'complete' ? (detected ? 'detected' : 'empty') : status;
    return { server, status, statusTone, detected, candidates };
  }), [probes, state]);

  async function runScan() {
    if (state === 'running') return;
    setState('running');
    setError('');
    setEntries([]);
    setProbes([]);
    setCopiedIp('');

    try {
      const httpPromise = getHttpExit(locale).catch(() => null);
      const probeResults = await Promise.all(STUN_SERVERS.map((server) => runStunProbe(server)));
      setProbes(probeResults);

      const currentHttpExit = await httpPromise;
      setHttpExit(currentHttpExit);

      const aggregated = aggregateCandidates(probeResults);
      const enriched = await Promise.all(aggregated.map(async (entry) => {
        try {
          return { ...entry, geo: await enrichIp(entry.ip, locale) };
        } catch {
          return { ...entry, geo: null };
        }
      }));

      setEntries(enriched);
      setState('complete');
    } catch (scanError) {
      setError(scanError?.message || t('webrtc.noticeFailedCopy'));
      setState('error');
    }
  }

  function copyIp(ip) {
    navigator.clipboard?.writeText(ip);
    setCopiedIp(ip);
    window.setTimeout(() => setCopiedIp(''), 1400);
  }

  return (
    <section className="webrtc-page">
      <section className="webrtc-hero">
        <div>
          <span className="section-kicker"><RadioTower size={16} /> WebRTC</span>
          <h1>{t('webrtc.heroTitle')}</h1>
          <p>{t('webrtc.heroCopy')}</p>
        </div>
        <button className="webrtc-run-button" type="button" onClick={runScan} disabled={state === 'running'}>
          {state === 'running' ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          {state === 'idle' ? t('webrtc.start') : state === 'running' ? t('common.detect') : t('webrtc.rerun')}
        </button>
      </section>

      <section className="webrtc-metrics">
        <WebRtcMetric
          icon={Globe2}
          label={t('webrtc.httpsExit')}
          value={httpExit?.ip || (state === 'running' ? t('webrtc.fetching') : t('webrtc.notDetected'))}
          tone={httpExit?.ip ? 'safe' : 'neutral'}
        />
        <WebRtcMetric
          icon={RadioTower}
          label={t('webrtc.stunPublicIp')}
          value={state === 'running' ? t('webrtc.probing') : t('common.count', { count: publicCount })}
          tone={publicCount ? 'detected' : 'neutral'}
        />
        <WebRtcMetric
          icon={Network}
          label={t('webrtc.domesticStun')}
          value={probes.length ? `${domesticDone}/${DOMESTIC_STUN_COUNT}` : t('webrtc.pendingCount', { count: DOMESTIC_STUN_COUNT })}
          tone={domesticDone ? 'safe' : 'neutral'}
        />
        <WebRtcMetric
          icon={Network}
          label={t('webrtc.globalStun')}
          value={probes.length ? `${globalDone}/${GLOBAL_STUN_COUNT}` : t('webrtc.pendingCount', { count: GLOBAL_STUN_COUNT })}
          tone={globalDone ? 'safe' : 'neutral'}
        />
      </section>

      {state !== 'idle' && (
        <section className={`webrtc-verdict ${notice.tone} is-visible`}>
          <span><ScanNoticeIcon notice={notice} /></span>
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.summary}</p>
          </div>
        </section>
      )}

      <section className="webrtc-grid">
        <div className="webrtc-results-card">
          <div className="webrtc-section-head">
            <div>
              <span className="section-kicker"><Wifi size={16} /> WebRTC IP</span>
              <h2>{t('webrtc.results')}</h2>
            </div>
            <small>{state === 'complete' ? `${publicCount} IP` : state === 'running' ? t('common.detect') : t('common.waitingDetect')}</small>
          </div>

          <div className="webrtc-table-wrap">
            <table className="webrtc-stun-table">
              <thead>
                <tr>
                  <th>STUN Server</th>
                  <th>{t('webrtc.node')}</th>
                  <th>{t('webrtc.state')}</th>
                  <th>IP</th>
                  <th>Geolocation</th>
                </tr>
              </thead>
              <tbody>
                {probeRows.map((row) => (
                  <tr className={`webrtc-stun-row ${row.status} ${row.statusTone}`} key={row.server.id}>
                    <td className="webrtc-server-address" data-label="STUN Server">{serverAddressLabel(row.server.urls)}</td>
                    <td data-label={t('webrtc.node')}>
                      <div className="webrtc-server-meta">
                        <em className={`webrtc-region ${row.server.region}`}>
                          {row.server.region === 'domestic' ? t('webrtc.domestic') : t('webrtc.global')}
                        </em>
                        <span>{row.server.name}</span>
                      </div>
                    </td>
                    <td data-label={t('webrtc.state')}>
                      <span className={`webrtc-stun-state ${row.statusTone}`} title={statusLabel(row.status, t)}>
                        <StunStatusIcon status={row.status} detected={row.detected} />
                        <b>{statusHint(row.status, row.detected, t)}</b>
                      </span>
                    </td>
                    <td data-label="IP">
                      <div className="webrtc-table-values">
                        {row.candidates.length ? row.candidates.map((candidate) => (
                          <button
                            className={`webrtc-table-ip ip-text ${ipTextClass(candidate.ip)}`}
                            type="button"
                            key={candidate.ip}
                            title={t('common.clickCopyIp')}
                            onClick={() => copyIp(candidate.ip)}
                          >
                            {copiedIp === candidate.ip ? t('common.copied') : candidate.ip}
                          </button>
                        )) : (
                          <span className="webrtc-table-muted">
                            {statusHint(row.status, false, t)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Geolocation">
                      <div className="webrtc-table-values">
                        {row.candidates.length ? row.candidates.map((candidate) => (
                          <span key={candidate.ip}>{formatLocation(geoByIp.get(candidate.ip), t)}</span>
                        )) : (
                          <span className="webrtc-table-muted">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
}

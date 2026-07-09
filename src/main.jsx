import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Code2,
  Globe2,
  HelpCircle,
  Loader2,
  LocateFixed,
  MapPin,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Wifi,
  XCircle
} from 'lucide-react';
import './styles.css';
import { SiteFooter, SiteTopbar } from './site-topbar.jsx';
import { handleAppLinkClick, scrollToHash } from './navigation.js';
import { I18nProvider, stripLocaleFromPathname, useI18n } from './i18n.jsx';
import { normalizeLocationPieces, normalizePoliticalName } from './political-names.js';
import { getGeoipBase, SITE_CONFIG } from './site-config.js';

const ROUTE_CHUNK_RELOAD_KEY = 'chitanda-route-chunk-reloaded';

const routeModules = {
  cdn: () => import('./cdn-node-page.jsx').then((module) => ({ default: module.CdnNodePage })),
  dns: () => import('./dns-exit-page.jsx').then((module) => ({ default: module.DnsExitPage })),
  latency: () => import('./latency-page.jsx').then((module) => ({ default: module.LatencyPage })),
  status: () => import('./status-page.jsx').then((module) => ({ default: module.StatusPage })),
  webrtc: () => import('./webrtc-page.jsx').then((module) => ({ default: module.WebRtcPage }))
};

const CdnNodePage = lazy(routeModules.cdn);
const DnsExitPage = lazy(routeModules.dns);
const LatencyPage = lazy(routeModules.latency);
const StatusPage = lazy(routeModules.status);
const WebRtcPage = lazy(routeModules.webrtc);

const GEOIP_BASE = getGeoipBase();
const INTERNATIONAL_ENDPOINT = SITE_CONFIG.internationalEndpoint;
const DEFAULT_PROBE_ENDPOINT = SITE_CONFIG.defaultProbeEndpoint;
const PCONLINE_ENDPOINT = 'https://whois.pconline.com.cn/ipJson.jsp';
const QQ_NEWS_ENDPOINT = 'https://r.inews.qq.com/api/ip2city?otype=jsonp';
const UPYUN_ENDPOINT = 'https://pubstatic.b0.upaiyun.com/?_upnode';
const IPIP_ENDPOINT = 'https://myip.ipip.net/json';
const GOOGLE_ENDPOINTS = [
  'https://ipcelou-298103.appspot.com/api/ip',
  'https://groovy-student-432.appspot.com'
];
const GOOGLE_MAP_PROBE_IMAGE = 'https://www.google.com/favicon.ico';
const TENCENT_MAP_KEY = SITE_CONFIG.tencentMapKey;
const GOOGLE_MAPS_EMBED_KEY = SITE_CONFIG.googleMapsEmbedKey;
const TENCENT_MAP_SCRIPT_TIMEOUT_MS = 8000;
const TENCENT_MAP_TILE_TIMEOUT_MS = 7000;
const MAINLAND_CHINA_REGION_CODES = new Set(['CN']);
const NON_MAINLAND_CHINA_REGION_CODES = new Set(['HK', 'MO', 'TW']);
const CHINA_TW_REGION_NAME = `中国${String.fromCharCode(21488, 28286)}`;

let tencentMapScriptPromise;
let googleMapAvailability = 'unknown';
let googleMapAvailabilityPromise;

function getProbeDefinitions(t) {
  return [
    {
      id: 'local',
      title: t('probe.localTitle'),
      short: t('probe.localShort'),
      endpoint: PCONLINE_ENDPOINT,
      color: 'emerald',
      description: t('probe.localDescription'),
      icon: Wifi
    },
    {
      id: 'international',
      title: t('probe.internationalTitle'),
      short: t('probe.internationalShort'),
      endpoint: INTERNATIONAL_ENDPOINT,
      color: 'blue',
      description: t('probe.internationalDescription'),
      icon: Globe2
    },
    {
      id: 'google',
      title: t('probe.googleTitle'),
      short: t('probe.googleShort'),
      endpoint: 'App Engine',
      color: 'amber',
      description: t('probe.googleDescription'),
      icon: Sparkles
    },
    {
      id: 'default',
      title: t('probe.defaultTitle'),
      short: t('probe.defaultShort'),
      endpoint: DEFAULT_PROBE_ENDPOINT,
      color: 'violet',
      description: t('probe.defaultDescription'),
      icon: Route
    }
  ];
}

function withTimeout(promise, timeout = 7500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(new DOMException('请求超时', 'TimeoutError')), timeout);
  return {
    signal: controller.signal,
    run: async (factory) => {
      try {
        return await factory(controller.signal);
      } finally {
        window.clearTimeout(timer);
      }
    }
  };
}

function usePageMotion(motionKey) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)');
    if (!finePointer.matches) return undefined;

    let frame = 0;
    let lastParticle = 0;
    const root = document.documentElement;
    const colors = ['#64d2ff', '#ff7eb3', '#93c5fd'];

    const move = (event) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        root.style.setProperty('--cursor-x', `${event.clientX}px`);
        root.style.setProperty('--cursor-y', `${event.clientY}px`);
        root.dataset.cursor = 'visible';

        const now = performance.now();
        if (now - lastParticle > 82) {
          lastParticle = now;
          const id = `${now}-${Math.random()}`;
          const driftX = (Math.random() - 0.5) * 26;
          const driftY = (Math.random() - 0.5) * 26;
          setParticles((current) => [
            ...current.slice(-9),
            {
              id,
              x: event.clientX,
              y: event.clientY,
              driftX,
              driftY,
              color: colors[Math.floor(Math.random() * colors.length)]
            }
          ]);
          window.setTimeout(() => {
            setParticles((current) => current.filter((particle) => particle.id !== id));
          }, 720);
        }
      });
    };

    const press = () => {
      root.dataset.cursorActive = 'true';
    };

    const release = () => {
      root.dataset.cursorActive = 'false';
    };

    const leave = () => {
      root.dataset.cursor = 'hidden';
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    document.addEventListener('pointerleave', leave);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      document.removeEventListener('pointerleave', leave);
      delete root.dataset.cursor;
      delete root.dataset.cursorActive;
    };
  }, [motionKey]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const targets = document.querySelectorAll('.section-heading, .probe-card, .verdict-card, .api-panel, .lookup-page-head, .lookup-result-shell, .lookup-result-card, .lookup-detail-card, .location-map-card, .api-docs-hero, .api-endpoint-card, .api-terminal-card, .api-field-card, .webrtc-hero, .webrtc-metrics, .webrtc-verdict, .webrtc-results-card, .webrtc-node-card, .webrtc-note, .latency-hero, .latency-metrics, .latency-results-card, .cdn-node-hero, .cdn-node-metrics, .cdn-node-grid, .dns-exit-hero, .dns-exit-metrics, .dns-exit-results-card, .status-hero, .status-overall, .status-alert, .status-browser, .error-page-hero');
    if (!targets.length) return undefined;

    root.classList.add('motion-ready');

    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return () => root.classList.remove('motion-ready');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.04,
      rootMargin: '0px 0px 18% 0px'
    });

    targets.forEach((target) => observer.observe(target));
    const fallbackTimer = window.setTimeout(() => {
      targets.forEach((target) => target.classList.add('is-visible'));
    }, 1200);

    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
      root.classList.remove('motion-ready');
    };
  }, [motionKey]);

  return particles;
}

async function fetchJson(url, options = {}) {
  const timeout = withTimeout(null, options.timeout || 7500);
  try {
    return await timeout.run(async (signal) => {
      const response = await fetch(url, {
        ...options,
        signal,
        headers: {
          accept: 'application/json',
          ...(options.headers || {})
        }
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response.json();
    });
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw new Error('请求超时');
    }
    throw error;
  }
}

function loadPconlineJsonp() {
  return new Promise((resolve, reject) => {
    const previous = window.IPCallBack;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('国内访问检测超时'));
    }, 7500);

    function cleanup() {
      window.clearTimeout(timer);
      script.remove();
      if (previous) {
        window.IPCallBack = previous;
      } else {
        delete window.IPCallBack;
      }
    }

    window.IPCallBack = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.src = `${PCONLINE_ENDPOINT}?_=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('国内访问检测失败'));
    };
    document.head.appendChild(script);
  });
}

function extractIp(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload.trim();
  if (payload.ip) return String(payload.ip).trim();
  if (payload.origin) return String(payload.origin).split(',')[0].trim();
  if (payload.query) return String(payload.query).trim();
  if (payload.remote_addr) return String(payload.remote_addr).trim();
  if (payload.data?.Remote_addr) return String(payload.data.Remote_addr).trim();
  return '';
}

function isValidIpv4(value) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

function isValidIpv6(value) {
  const input = value.toLowerCase();
  if (!input.includes(':')) return false;
  if (!/^[0-9a-f:.]+$/i.test(input)) return false;

  const halves = input.split('::');
  if (halves.length > 2) return false;
  const hasCompression = halves.length === 2;
  let groupCount = 0;

  for (let halfIndex = 0; halfIndex < halves.length; halfIndex += 1) {
    const half = halves[halfIndex];
    if (!half) continue;

    const pieces = half.split(':');
    if (pieces.some((piece) => piece === '')) return false;

    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      if (piece.includes('.')) {
        const isLastPiece = halfIndex === halves.length - 1 && index === pieces.length - 1;
        if (!isLastPiece || !isValidIpv4(piece)) return false;
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

function getIpTextClass(value) {
  const version = getIpVersion(String(value || '').trim());
  if (version === 6) return 'ipv6';
  if (version === 4) return 'ipv4';
  return 'plain';
}

function validateIpInput(rawValue, t) {
  const value = rawValue.trim();
  if (!value) {
    return { valid: false, message: t('lookup.emptyMessage'), value };
  }

  const version = getIpVersion(value);
  if (!version) {
    return { valid: false, message: t('lookup.invalidMessage'), value };
  }

  return { valid: true, value, version };
}

function hasCoordinate(data) {
  return Number.isFinite(Number(data?.latitude)) && Number.isFinite(Number(data?.longitude));
}

function getCoordinate(data) {
  if (!hasCoordinate(data)) return null;
  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude)
  };
}

function isMainlandChinaRegion(data) {
  const code = String(data?.country_code || '').toUpperCase();
  if (MAINLAND_CHINA_REGION_CODES.has(code)) return true;
  if (NON_MAINLAND_CHINA_REGION_CODES.has(code)) return false;
  const name = normalizePoliticalName(data?.country || '');
  return /中国大陆|中国/.test(name) && !/香港|澳门/.test(name) && !name.includes(CHINA_TW_REGION_NAME);
}

function loadProbeImage(url, timeout = 3200) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('google map probe timeout'));
    }, timeout);

    function cleanup() {
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
    }

    image.onload = () => {
      cleanup();
      resolve(true);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('google map probe failed'));
    };
    image.referrerPolicy = 'no-referrer';
    image.src = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  });
}

function detectGoogleMapAvailability() {
  if (googleMapAvailability !== 'unknown') {
    return Promise.resolve(googleMapAvailability);
  }

  if (!googleMapAvailabilityPromise) {
    googleMapAvailabilityPromise = loadProbeImage(GOOGLE_MAP_PROBE_IMAGE)
      .then(() => {
        googleMapAvailability = 'available';
        return googleMapAvailability;
      })
      .catch(() => {
        googleMapAvailability = 'blocked';
        return googleMapAvailability;
      });
  }

  return googleMapAvailabilityPromise;
}

function useGoogleMapAvailability() {
  const [state, setState] = useState(googleMapAvailability === 'unknown' ? 'checking' : googleMapAvailability);

  useEffect(() => {
    let disposed = false;
    detectGoogleMapAvailability().then((nextState) => {
      if (!disposed) setState(nextState);
    });
    return () => {
      disposed = true;
    };
  }, []);

  return state;
}

function selectLocationMapProvider(result, googleState, t) {
  if (googleState === 'available') {
    return {
      id: 'google',
      name: 'Google Maps',
      badge: t('map.googleBadge')
    };
  }

  if (isMainlandChinaRegion(result) && TENCENT_MAP_KEY) {
    return {
      id: 'tencent',
      name: t('map.tencentName'),
      badge: googleState === 'checking' ? t('map.domesticChecking') : t('map.domesticBadge')
    };
  }

  return {
    id: 'bing',
    name: 'Bing Maps',
    badge: isMainlandChinaRegion(result) && !TENCENT_MAP_KEY ? t('map.domesticBackup') : t('map.globalBackup')
  };
}

function loadTencentMapScript() {
  if (window.TMap?.Map) return Promise.resolve(window.TMap);
  if (!TENCENT_MAP_KEY) return Promise.reject(new Error('missing tencent map key'));

  if (!tencentMapScriptPromise) {
    tencentMapScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-tencent-map-sdk="true"]');
      let timer;

      const cleanup = () => {
        window.clearTimeout(timer);
      };

      const fail = (script) => {
        cleanup();
        tencentMapScriptPromise = null;
        script?.remove();
        reject(new Error('tencent map sdk failed'));
      };

      const succeed = () => {
        cleanup();
        if (window.TMap?.Map) {
          resolve(window.TMap);
        } else {
          fail(existing);
        }
      };

      if (existing) {
        timer = window.setTimeout(() => fail(existing), TENCENT_MAP_SCRIPT_TIMEOUT_MS);
        existing.addEventListener('load', succeed, { once: true });
        existing.addEventListener('error', () => fail(existing), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.dataset.tencentMapSdk = 'true';
      script.async = true;
      script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${encodeURIComponent(TENCENT_MAP_KEY)}`;
      timer = window.setTimeout(() => fail(script), TENCENT_MAP_SCRIPT_TIMEOUT_MS);
      script.onload = () => {
        cleanup();
        if (window.TMap?.Map) {
          resolve(window.TMap);
        } else {
          fail(script);
        }
      };
      script.onerror = () => fail(script);
      document.head.appendChild(script);
    });
  }

  return tencentMapScriptPromise;
}

function waitForTencentMapTiles(map) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer;

    const cleanup = () => {
      window.clearTimeout(timer);
      if (typeof map.off === 'function') {
        map.off('tilesloaded', handleReady);
      }
    };

    const settle = (callback) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const handleReady = () => settle(resolve);

    timer = window.setTimeout(() => {
      settle(() => reject(new Error('tencent map tiles timeout')));
    }, TENCENT_MAP_TILE_TIMEOUT_MS);

    if (typeof map.on === 'function') {
      map.on('tilesloaded', handleReady);
    } else {
      window.requestAnimationFrame(() => window.requestAnimationFrame(handleReady));
    }
  });
}

function loadWrappedJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement('script');
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('国内访问检测超时'));
    }, 7500);

    function cleanup() {
      window.clearTimeout(timer);
      script.remove();
      delete window[callbackName];
    }

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callbackName}&_=${Date.now()}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('国内访问检测失败'));
    };
    document.head.appendChild(script);
  });
}

async function getDomesticIp() {
  const attempts = [
    async () => loadWrappedJsonp(QQ_NEWS_ENDPOINT),
    async () => fetchJson(`${UPYUN_ENDPOINT}&_t=${Date.now()}`),
    async () => fetchJson(IPIP_ENDPOINT),
    async () => loadPconlineJsonp()
  ];

  let lastError;
  for (const attempt of attempts) {
    try {
      const data = await attempt();
      const ip = extractIp(data);
      if (ip) return ip;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('国内访问检测失败');
}

async function getPconlineIp() {
  return getDomesticIp();
}

async function getEndpointIp(endpoint, options = {}) {
  const data = await fetchJson(endpoint, options);
  return extractIp(data);
}

async function getGoogleIp() {
  const shuffled = [...GOOGLE_ENDPOINTS].sort(() => Math.random() - 0.5);
  const attempts = shuffled.map((endpoint) => (
    getEndpointIp(endpoint, { timeout: 4200 }).then((ip) => {
      if (!ip) throw new Error('');
      return { ip, endpoint };
    })
  ));

  try {
    return await Promise.any(attempts);
  } catch {
    throw new Error('');
  }
}

async function enrichIp(ip, locale = 'zh-CN') {
  const endpoint = `${GEOIP_BASE.replace(/\/$/, '')}/${encodeURIComponent(ip)}`;
  return fetchJson(endpoint, {
    headers: { 'accept-language': locale },
    timeout: 7500
  });
}

function sameIp(a, b) {
  return Boolean(a && b && a === b);
}

function classifyRoute(results, t) {
  const local = results.local?.data?.ip;
  const international = results.international?.data?.ip;
  const google = results.google?.data?.ip;
  const fallback = results.default?.data?.ip;

  if (!fallback) {
    return {
      tone: 'unknown',
      label: t('verdict.unknownLabel'),
      summary: t('verdict.unknownSummary')
    };
  }

  if (sameIp(fallback, local)) {
    return {
      tone: 'local',
      label: t('verdict.localLabel'),
      summary: t('verdict.localSummary')
    };
  }

  if (sameIp(fallback, international) || sameIp(fallback, google)) {
    return {
      tone: 'remote',
      label: t('verdict.remoteLabel'),
      summary: t('verdict.remoteSummary')
    };
  }

  return {
    tone: 'mixed',
    label: t('verdict.mixedLabel'),
    summary: t('verdict.mixedSummary')
  };
}

function formatLocation(data, t) {
  if (!data) return t('common.noLocation');
  return normalizeLocationPieces([data.country, data.region, data.city]).join(' · ') || t('common.unknownLocation');
}

function formatOrg(data, t) {
  if (!data) return t('common.noNetwork');
  return normalizePoliticalName(data.isp || data.organization || data.asn_organization || t('common.unknownNetwork'));
}

function formatAsn(data, t) {
  return data?.asn ? `AS${data.asn}` : t('common.unknown');
}

function formatCoordinate(data, t) {
  if (typeof data?.latitude !== 'number' || typeof data?.longitude !== 'number') return t('common.unknown');
  return `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
}

function parseHashRoute() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('lookup')) {
    const [, queryString = ''] = hash.split('?');
    const params = new URLSearchParams(queryString);
    return {
      page: 'lookup',
      ip: params.get('ip') || ''
    };
  }
  return { page: 'home', ip: '' };
}

function useHashRoute() {
  const [route, setRoute] = useState(parseHashRoute);

  useEffect(() => {
    const update = () => setRoute(parseHashRoute());
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return route;
}

function usePathname() {
  const [pathname, setPathname] = useState(() => stripLocaleFromPathname(window.location.pathname));

  useEffect(() => {
    const update = () => setPathname(stripLocaleFromPathname(window.location.pathname));
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return pathname;
}

function normalizeRoutePath(pathname = '/') {
  const normalized = (pathname || '/')
    .replace(/\/index\.html$/i, '/')
    .replace(/\.html$/i, '')
    .replace(/\/+$/g, '');
  return normalized || '/';
}

function matchesRoutePath(pathname, routePath) {
  const normalized = normalizeRoutePath(pathname);
  return normalized === routePath || normalized.startsWith(`${routePath}/`);
}

function explicitErrorTypeFromPathname(pathname) {
  const normalized = normalizeRoutePath(pathname);
  if (normalized === '/403') return '403';
  if (normalized === '/404') return '404';
  return '';
}

function staticErrorTypeOverride() {
  const forcedType = window.__STATIC_ERROR_PAGE__;
  if (forcedType !== '403' && forcedType !== '404') return '';
  const forcedPath = window.__STATIC_ERROR_PAGE_PATH__;
  if (forcedPath && forcedPath !== window.location.pathname) return '';
  return forcedType;
}

function goToLookup(ip) {
  const value = ip.trim();
  if (!value) return;
  window.location.hash = `lookup?ip=${encodeURIComponent(value)}`;
}

function StatusIcon({ state }) {
  if (state === 'loading') return <Loader2 className="spin" size={18} />;
  if (state === 'ready') return <CheckCircle2 size={18} />;
  if (state === 'error') return <XCircle size={18} />;
  return <HelpCircle size={18} />;
}

function ProbeCard({ probe, result }) {
  const { t } = useI18n();
  const Icon = probe.icon;
  const state = result?.state || 'idle';
  const data = result?.data;
  const displayIp = data?.ip || (state === 'error' ? t('probe.missingIp') : '...');
  const ipTextClass = data?.ip ? getIpTextClass(data.ip) : 'plain';
  const locationText = formatLocation(data, t);
  const networkText = formatOrg(data, t);
  const asnText = data?.asn ? `AS${data.asn}` : t('common.unknown');
  const timezoneText = data?.timezone || t('common.unknown');
  const stateText = state === 'loading'
    ? t('common.detect')
    : state === 'ready'
      ? t('common.ready')
      : state === 'error'
        ? t('common.failed')
        : t('common.pending');

  return (
    <section className={`probe-card ${probe.color}`}>
      <div className="probe-card__head">
        <div className="probe-card__title">
          <span className="icon-wrap"><Icon size={20} /></span>
          <div>
            <h2>{probe.title}</h2>
            <p>{probe.description}</p>
          </div>
        </div>
        <span className={`status-pill ${state}`}>
          <StatusIcon state={state} />
          {stateText}
        </span>
      </div>

      <div className="ip-line">
        <span className={`ip-text ${ipTextClass}`} title={data?.ip || undefined}>{displayIp}</span>
        {data?.ip && (
          <button className="icon-button" title={t('common.copyIp')} onClick={() => navigator.clipboard?.writeText(data.ip)}>
            <Clipboard size={16} />
          </button>
        )}
      </div>

      <div className="meta-grid">
        <div>
          <label>{t('probe.location')}</label>
          <strong title={locationText}>{locationText}</strong>
        </div>
        <div>
          <label>{t('probe.network')}</label>
          <strong title={networkText}>{networkText}</strong>
        </div>
        <div>
          <label>ASN</label>
          <strong title={asnText}>{asnText}</strong>
        </div>
        <div>
          <label>{t('probe.timezone')}</label>
          <strong title={timezoneText}>{timezoneText}</strong>
        </div>
      </div>

    </section>
  );
}

function TencentLocationMap({ coordinate, onUnavailable, onPointerEnter, onPointerLeave, onPointerCancel }) {
  const { t } = useI18n();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onUnavailableRef = useRef(onUnavailable);
  const [state, setState] = useState(TENCENT_MAP_KEY ? 'loading' : 'missing-key');

  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  useEffect(() => {
    let disposed = false;

    if (!TENCENT_MAP_KEY) {
      setState('missing-key');
      onUnavailableRef.current?.();
      return undefined;
    }

    setState('loading');
    loadTencentMapScript()
      .then((TMap) => {
        if (disposed || !mapRef.current) return;
        const center = new TMap.LatLng(coordinate.latitude, coordinate.longitude);

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new TMap.Map(mapRef.current, {
            center,
            zoom: 10,
            pitch: 0,
            rotation: 0,
            viewMode: '2D',
            mapStyleId: 'style1'
          });
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(10);
        }

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new TMap.MultiMarker({
          map: mapInstanceRef.current,
          geometries: [{
            id: 'ip-location',
            position: center
          }]
        });

        return waitForTencentMapTiles(mapInstanceRef.current);
      })
      .then(() => {
        if (!disposed) {
          setState('ready');
        }
      })
      .catch(() => {
        if (!disposed) {
          setState('error');
          onUnavailableRef.current?.();
        }
      });

    return () => {
      disposed = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (mapInstanceRef.current?.destroy) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinate.latitude, coordinate.longitude]);

  return (
    <div
      className="location-map-stage"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
    >
      <div className="location-map-canvas" ref={mapRef} aria-label={t('map.tencentAria')} />
      {state !== 'ready' && (
        <div className="location-map-overlay">
          {state === 'loading' && <Loader2 className="spin" size={20} />}
          <span>
            {state === 'missing-key' || state === 'error' ? t('map.unavailable') : t('map.loading')}
          </span>
        </div>
      )}
    </div>
  );
}

function GoogleLocationMap({ coordinate, onPointerEnter, onPointerLeave, onPointerCancel }) {
  const { t } = useI18n();
  const query = `${coordinate.latitude},${coordinate.longitude}`;
  const src = GOOGLE_MAPS_EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(GOOGLE_MAPS_EMBED_KEY)}&q=${encodeURIComponent(query)}&zoom=10&maptype=roadmap`
    : `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=10&output=embed`;

  return (
    <div
      className="location-map-stage"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
    >
      <iframe
        title={t('map.googleTitle')}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

function BingLocationMap({ coordinate, onPointerEnter, onPointerLeave, onPointerCancel }) {
  const { t } = useI18n();
  const stageRef = useRef(null);
  const iframeRef = useCallback((node) => {
    if (!node) return;
    node.setAttribute('scrolling', 'no');
    node.style.overflow = 'hidden';
  }, []);
  const [size, setSize] = useState({ width: 960, height: 430 });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(280, Math.round(rect.height));
      setSize((current) => (
        current.width === width && current.height === height
          ? current
          : { width, height }
      ));
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const src = `https://www.bing.com/maps/embed?h=${size.height}&w=${size.width}&cp=${coordinate.latitude}~${coordinate.longitude}&lvl=10&typ=d&sty=r&src=SHELL&FORM=MBEDV8`;

  return (
    <div
      className="location-map-stage"
      ref={stageRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
    >
      <iframe
        ref={iframeRef}
        title={t('map.bingTitle')}
        src={src}
        loading="lazy"
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

function useCursorSuspension(suspended) {
  useEffect(() => {
    const root = document.documentElement;
    if (suspended) {
      root.dataset.cursorSuspended = 'true';
    } else {
      delete root.dataset.cursorSuspended;
    }

    return () => {
      delete root.dataset.cursorSuspended;
    };
  }, [suspended]);
}

function LocationMap({ result }) {
  const { t } = useI18n();
  const coordinate = getCoordinate(result);
  const googleMapState = useGoogleMapAvailability();
  const [forcedProvider, setForcedProvider] = useState(null);
  const [cursorSuspended, setCursorSuspended] = useState(false);
  const handleTencentMapUnavailable = useCallback(() => setForcedProvider('bing'), []);
  const suspendCursor = useCallback(() => setCursorSuspended(true), []);
  const resumeCursor = useCallback(() => setCursorSuspended(false), []);

  useCursorSuspension(cursorSuspended);

  useEffect(() => {
    setCursorSuspended(false);
    setForcedProvider(null);
  }, [result?.ip, result?.latitude, result?.longitude]);

  if (!coordinate) return null;

  const provider = forcedProvider === 'bing'
    ? { id: 'bing', name: 'Bing Maps', badge: t('map.backup') }
    : selectLocationMapProvider(result, googleMapState, t);
  const location = formatLocation(result, t);

  return (
    <section className="location-map-card is-visible">
      <div className="location-map-head">
        <div>
          <span className="section-kicker"><MapPin size={16} /> {t('map.online')}</span>
          <h2>{location}</h2>
          <p>{provider.name} · {formatCoordinate(result, t)}</p>
        </div>
        <span className="map-provider-badge">{provider.badge}</span>
      </div>
      {provider.id === 'tencent' ? (
        <TencentLocationMap
          coordinate={coordinate}
          onUnavailable={handleTencentMapUnavailable}
          onPointerEnter={suspendCursor}
          onPointerLeave={resumeCursor}
          onPointerCancel={resumeCursor}
        />
      ) : provider.id === 'google' ? (
        <GoogleLocationMap
          coordinate={coordinate}
          onPointerEnter={suspendCursor}
          onPointerLeave={resumeCursor}
          onPointerCancel={resumeCursor}
        />
      ) : (
        <BingLocationMap
          coordinate={coordinate}
          onPointerEnter={suspendCursor}
          onPointerLeave={resumeCursor}
          onPointerCancel={resumeCursor}
        />
      )}
    </section>
  );
}

function RouteVerdict({ verdict, results, probes }) {
  const { t } = useI18n();
  const resultItems = probes.map((probe) => {
    const state = results[probe.id]?.state || 'idle';
    return {
      ...probe,
      state,
      ip: results[probe.id]?.data?.ip || '-',
      ipClass: results[probe.id]?.data?.ip ? getIpTextClass(results[probe.id].data.ip) : 'plain',
      status: state === 'loading' ? t('common.detect') : state === 'error' ? t('probe.missingIp') : state === 'ready' ? t('common.ready') : t('common.pending')
    };
  });

  return (
    <section className={`verdict-card ${verdict.tone} is-visible`} data-stable-visible="true">
      <div className="verdict-copy">
        <span className="section-kicker"><Route size={16} /> {t('verdict.title')}</span>
        <div className="verdict-title-row">
          <h2>{verdict.label}</h2>
          <span className={`verdict-badge ${verdict.tone}`}>{verdict.tone === 'unknown' ? t('common.waiting') : t('common.compared')}</span>
        </div>
        <p>{verdict.summary}</p>
      </div>
      <div className="compare-list">
        {resultItems.map((probe) => {
          const Icon = probe.icon;
          return (
            <div key={probe.id} className={`compare-item ${probe.state}`}>
              <Icon size={18} />
              <span>{probe.short}</span>
              <strong className={`ip-text ${probe.ipClass}`} title={probe.ip !== '-' ? probe.ip : undefined}>{probe.ip}</strong>
              <small>{probe.status}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LookupSearchForm({ variant = 'hero', initialValue = '' }) {
  const { t } = useI18n();
  const [query, setQuery] = useState(initialValue);
  const [validationMessage, setValidationMessage] = useState('');
  const variantClass = `lookup-search-${variant}`;

  useEffect(() => {
    setQuery(initialValue);
    setValidationMessage('');
  }, [initialValue]);

  function submit(event) {
    event.preventDefault();
    const validation = validateIpInput(query, t);
    if (!validation.valid) {
      setValidationMessage(validation.message);
      return;
    }
    setValidationMessage('');
    goToLookup(validation.value);
  }

  return (
    <div className={`lookup-search-wrap ${variantClass}`}>
      <form className={`hero-status-strip lookup-search-strip ${variantClass}`} onSubmit={submit} noValidate>
        <div className="lookup-search-intro">
          <Search size={20} />
          <span>{t('lookup.title')}</span>
          <strong>{t('lookup.subtitle')}</strong>
        </div>
        <label className="lookup-search-field">
          <span>{t('lookup.ipAddress')}</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (validationMessage) setValidationMessage('');
            }}
            placeholder={t('lookup.placeholder')}
            aria-invalid={validationMessage ? 'true' : 'false'}
            aria-describedby={validationMessage ? `lookup-error-${variant}` : undefined}
          />
        </label>
        <button className="lookup-search-button" type="submit">
          <Search size={18} />
          {t('lookup.button')}
        </button>
      </form>
      {validationMessage && (
        <p className="lookup-validation" id={`lookup-error-${variant}`} role="alert">
          {validationMessage}
        </p>
      )}
    </div>
  );
}

function LookupResultPage({ ip }) {
  const { locale, localizedPath, t } = useI18n();
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const value = ip.trim();
    if (!value) {
      setState('idle');
      setResult(null);
      setError('');
      return undefined;
    }

    const validation = validateIpInput(value, t);
    if (!validation.valid) {
      setState('invalid');
      setResult(null);
      setError(validation.message);
      setCopied(false);
      return undefined;
    }

    let canceled = false;
    setState('loading');
    setError('');
    setResult(null);
    setCopied(false);

    enrichIp(value, locale)
      .then((data) => {
        if (canceled) return;
        setResult(data);
        setState('ready');
      })
      .catch((err) => {
        if (canceled) return;
        setError(err.message || t('common.failed'));
        setState('error');
      });

    return () => {
      canceled = true;
    };
  }, [ip, locale, t]);

  const detailRows = [
    [t('probe.timezone'), result?.timezone || t('common.unknown'), Globe2],
    [t('lookup.countryCode'), result?.country_code || t('common.unknown'), ShieldCheck],
    [t('lookup.organization'), result?.asn_organization || result?.organization || t('common.unknown'), Server],
    [t('lookup.coordinate'), formatCoordinate(result, t), LocateFixed]
  ];

  function copyIp() {
    if (!result?.ip) return;
    navigator.clipboard?.writeText(result.ip);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="lookup-page">
      <a className="back-link" href={localizedPath('/#home')} onClick={handleAppLinkClick}><ArrowRight size={16} /> {t('lookup.backHome')}</a>
      <div className="lookup-page-head">
        <span className="section-kicker"><Search size={16} /> {t('lookup.title')}</span>
        <h1>{ip ? t('lookup.resultTitle') : t('lookup.inputTitle')}</h1>
        <LookupSearchForm variant="compact" initialValue={ip} />
      </div>

      {state === 'loading' && (
        <div className="lookup-result-card loading is-visible">
          <Loader2 className="spin" size={28} />
          <strong>{t('lookup.querying')}</strong>
        </div>
      )}

      {state === 'invalid' && (
        <div className="lookup-result-card error is-visible">
          <XCircle size={30} />
          <strong>{t('lookup.invalidTitle')}</strong>
          <p>{error}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="lookup-result-card error is-visible">
          <XCircle size={30} />
          <strong>{t('lookup.notFoundTitle')}</strong>
          <p>{t('lookup.notFoundCopy')}</p>
        </div>
      )}

      {state === 'ready' && result && (
        <section className="lookup-result-shell is-visible">
          <div className="lookup-hero-result">
            <span className="lookup-eyebrow">{t('lookup.ipAddress')}</span>
            <button
              className={`lookup-ip-main ${getIpVersion(result.ip) === 6 ? 'ipv6' : 'ipv4'}`}
              type="button"
              onClick={copyIp}
              title={t('common.clickCopyIp')}
            >
              {result.ip}
            </button>
            <p>{copied ? t('common.copied') : t('lookup.copiedHint')}</p>
          </div>

          <div className="lookup-summary-band">
            <div>
              <span>{t('probe.location')}</span>
              <strong>{formatLocation(result, t)}</strong>
            </div>
            <div>
              <span>{t('probe.network')}</span>
              <strong>{formatOrg(result, t)}</strong>
            </div>
            <div>
              <span>ASN</span>
              <strong>{formatAsn(result, t)}</strong>
            </div>
          </div>

          <div className="lookup-detail-card is-visible">
            {detailRows.map(([label, value, Icon]) => (
              <div key={label}>
                <Icon size={18} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <LocationMap result={result} />
        </section>
      )}
    </section>
  );
}

const API_BASE_URL = SITE_CONFIG.publicBaseUrl;

function getApiEndpoints(t, locale) {
  const sampleCountry = locale.startsWith('zh') ? '美国' : 'United States';
  const sampleTimezone = locale.startsWith('zh') ? '美洲/芝加哥' : 'America/Chicago';
  return [
  {
    id: 'visitor',
    label: t('api.visitor'),
    method: 'GET',
    path: '/api/geoip',
    description: t('api.visitorDescription'),
    curl: `curl -fsS -H "Accept-Language: ${locale}" ${API_BASE_URL}/api/geoip`,
    response: `{"ip":"203.0.113.10","country":"${sampleCountry}","country_code":"US","asn":15169,"organization":"Google","latitude":37.751,"longitude":-97.822,"timezone":"${sampleTimezone}"}`,
    fieldGroups: [
      {
        title: t('api.identity'),
        fields: [
          ['ip', t('api.fieldVisitorIp')],
          ['continent_code', t('api.fieldContinent')]
        ]
      },
      {
        title: t('api.location'),
        fields: [
          ['country / country_code', t('api.fieldCountry')],
          ['region / city', t('api.fieldRegion')],
          ['latitude / longitude', t('api.fieldCoordinate')]
        ]
      },
      {
        title: t('api.network'),
        fields: [
          ['asn / asn_organization', t('api.fieldAsn')],
          ['isp / organization', t('api.fieldIsp')]
        ]
      },
      {
        title: t('api.time'),
        fields: [
          ['timezone / offset', t('api.fieldTimezone')]
        ]
      }
    ]
  },
  {
    id: 'lookup',
    label: t('api.lookup'),
    method: 'GET',
    path: '/api/geoip/{ip}',
    description: t('api.lookupDescription'),
    curl: `curl -fsS -H "Accept-Language: ${locale}" ${API_BASE_URL}/api/geoip/8.8.8.8`,
    response: `{"ip":"8.8.8.8","country":"${sampleCountry}","country_code":"US","asn":15169,"organization":"Google","latitude":37.751,"longitude":-97.822,"timezone":"${sampleTimezone}"}`,
    fieldGroups: [
      {
        title: t('api.target'),
        fields: [
          ['ip', t('api.fieldPathIp')]
        ]
      },
      {
        title: t('api.location'),
        fields: [
          ['country / country_code', t('api.fieldCountry')],
          ['region / city', t('api.fieldRegion')],
          ['latitude / longitude', t('api.fieldCoordinate')]
        ]
      },
      {
        title: t('api.network'),
        fields: [
          ['asn / asn_organization', t('api.fieldAsn')],
          ['isp / organization', t('api.fieldIsp')]
        ]
      },
      {
        title: t('api.localization'),
        fields: [
          ['timezone / offset', t('api.fieldTimezone')],
          ['Accept-Language', t('api.fieldAcceptLanguage')]
        ]
      }
    ]
  },
  {
    id: 'myip',
    label: t('api.myip'),
    method: 'GET',
    path: '/api/myip?format=text',
    description: t('api.myipDescription'),
    curl: `curl -fsS ${SITE_CONFIG.siteHostname}`,
    response: `203.0.113.10`,
    fieldGroups: [
      {
        title: t('api.textResponse'),
        fields: [
          ['body', t('api.fieldBody')],
          ['content-type', 'text/plain; charset=utf-8']
        ]
      },
      {
        title: t('api.useCases'),
        fields: [
          ['shell', t('api.fieldShell')],
          ['probe', t('api.fieldProbe')]
        ]
      }
    ]
  },
  {
    id: 'health',
    label: t('api.health'),
    method: 'GET',
    path: '/api/health',
    description: t('api.healthDescription'),
    curl: `curl -fsS ${API_BASE_URL}/api/health`,
    response: `{"ok":true,"opened_at":"2026-05-27T01:16:46.042Z"}`,
    fieldGroups: [
      {
        title: t('api.healthStatus'),
        fields: [
          ['ok', t('api.fieldOk')],
          ['opened_at', t('api.fieldOpenedAt')]
        ]
      },
      {
        title: t('api.monitoring'),
        fields: [
          ['HTTP 200', t('api.fieldHttp200')],
          ['body.ok', t('api.fieldBodyOk')]
        ]
      }
    ]
  }
  ];
}

function ApiTerminal({ endpoint }) {
  const [typedCommand, setTypedCommand] = useState('');
  const [typedResponse, setTypedResponse] = useState('');
  const [terminalPhase, setTerminalPhase] = useState('typing-command');

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTypedCommand(endpoint.curl);
      setTypedResponse(endpoint.response);
      setTerminalPhase('done');
      return undefined;
    }

    let commandIndex = 0;
    let responseIndex = 0;
    let commandTimer;
    let responseTimer;
    let outputDelayTimer;

    setTypedCommand('');
    setTypedResponse('');
    setTerminalPhase('typing-command');

    commandTimer = window.setInterval(() => {
      commandIndex += 1;
      setTypedCommand(endpoint.curl.slice(0, commandIndex));

      if (commandIndex >= endpoint.curl.length) {
        window.clearInterval(commandTimer);
        setTerminalPhase('waiting-output');
        outputDelayTimer = window.setTimeout(() => {
          setTerminalPhase('typing-output');
          responseTimer = window.setInterval(() => {
            responseIndex += 1;
            setTypedResponse(endpoint.response.slice(0, responseIndex));

            if (responseIndex >= endpoint.response.length) {
              window.clearInterval(responseTimer);
              setTerminalPhase('done');
            }
          }, 7);
        }, 140);
      }
    }, 14);

    return () => {
      window.clearInterval(commandTimer);
      window.clearInterval(responseTimer);
      window.clearTimeout(outputDelayTimer);
    };
  }, [endpoint.curl, endpoint.id, endpoint.response]);

  return (
    <section className="api-terminal-card" aria-label={endpoint.terminalAria}>
      <div className="api-terminal-screen">
        <div className={`terminal-session terminal-session--${terminalPhase}`} key={endpoint.id}>
          <div className="terminal-line">
            <span className="terminal-prompt">root@KSV2412250012-2:~# </span>
            <span className="terminal-command-text">{typedCommand}</span>
            {terminalPhase === 'typing-command' && <span className="terminal-cursor" aria-hidden="true" />}
          </div>
          <div className="terminal-output-line">{typedResponse}</div>
        </div>
      </div>
    </section>
  );
}

function ApiDocsPage() {
  const { locale, t } = useI18n();
  const apiEndpoints = useMemo(() => getApiEndpoints(t, locale).map((endpoint) => ({
    ...endpoint,
    terminalAria: t('api.terminalAria', { label: endpoint.label })
  })), [locale, t]);
  const [activeEndpointId, setActiveEndpointId] = useState(apiEndpoints[0].id);
  const activeEndpoint = apiEndpoints.find((endpoint) => endpoint.id === activeEndpointId) || apiEndpoints[0];

  return (
    <section className="api-docs-page">
      <section className="status-hero api-docs-hero">
        <span className="section-kicker"><BookOpen size={16} /> API Docs</span>
        <h1>{SITE_CONFIG.siteName} API</h1>
        <p>{t('api.heroCopy')}</p>
        <div className="api-base-strip">
          <span>Base URL</span>
          <code>{API_BASE_URL}</code>
        </div>
      </section>

      <section className="api-docs-grid" aria-label={t('api.endpointsAria')}>
        {apiEndpoints.map((endpoint) => (
          <button
            className={`api-endpoint-card ${endpoint.id === activeEndpoint.id ? 'active' : ''}`}
            key={endpoint.path}
            type="button"
            onClick={() => setActiveEndpointId(endpoint.id)}
            aria-pressed={endpoint.id === activeEndpoint.id}
          >
            <div>
              <span className="api-method">{endpoint.method}</span>
              <h2>{endpoint.label}</h2>
            </div>
            <code>{endpoint.path}</code>
            <p>{endpoint.description}</p>
          </button>
        ))}
      </section>

      <section className="api-docs-main">
        <ApiTerminal endpoint={activeEndpoint} key={activeEndpoint.id} />
      </section>

      <section className="api-field-card">
        <div className="api-section-head">
          <span className="section-kicker"><Code2 size={16} /> {t('api.responseFields')}</span>
          <h2>{activeEndpoint.label} · {t('api.responseFields')}</h2>
          <p><code>{activeEndpoint.path}</code></p>
        </div>
        <div className="api-field-groups">
          {activeEndpoint.fieldGroups.map((group) => (
            <article className="api-field-group" key={group.title}>
              <h3>{group.title}</h3>
              <div>
                {group.fields.map(([field, description]) => (
                  <p key={field}>
                    <code>{field}</code>
                    <span>{description}</span>
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ErrorPage({ statusCode }) {
  const { localizedPath, t } = useI18n();
  const isForbidden = statusCode === '403';
  const Icon = isForbidden ? ShieldCheck : Search;
  const pageTitle = isForbidden ? t('errorPage.forbiddenPageTitle') : t('errorPage.notFoundPageTitle');
  const kicker = isForbidden ? t('errorPage.forbiddenKicker') : t('errorPage.notFoundKicker');
  const title = isForbidden ? t('errorPage.forbiddenTitle') : t('errorPage.notFoundTitle');
  const copy = isForbidden ? t('errorPage.forbiddenCopy') : t('errorPage.notFoundCopy');

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  return (
    <section className={`error-page error-page--${statusCode}`} aria-labelledby="error-page-title">
      <section className="error-page-hero">
        <span className="section-kicker error-page-kicker"><Icon size={16} /> {kicker}</span>
        <div className="error-page-code" aria-hidden="true">{statusCode}</div>
        <h1 id="error-page-title">{title}</h1>
        <p>{copy}</p>
        <div className="error-page-actions">
          <a className="error-page-action error-page-action--primary" href={localizedPath('/#home')} onClick={handleAppLinkClick}>
            {t('errorPage.homeAction')} <ArrowRight size={16} />
          </a>
          <a className="error-page-action" href={localizedPath('/docs/api/')} onClick={handleAppLinkClick}>
            {t('errorPage.apiAction')} <BookOpen size={16} />
          </a>
          <a className="error-page-action" href={localizedPath('/status/')} onClick={handleAppLinkClick}>
            {t('errorPage.statusAction')} <Server size={16} />
          </a>
        </div>
      </section>
    </section>
  );
}

function isRouteChunkError(error) {
  const text = `${error?.name || ''} ${error?.message || ''}`;
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Load failed/i.test(text);
}

function RouteLoading() {
  const { t } = useI18n();
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <Loader2 className="spin" size={24} />
      <span>{t('common.loading')}</span>
    </div>
  );
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (!isRouteChunkError(error)) return;
    const routeKey = this.props.routeKey || window.location.pathname;
    const reloadKey = `${ROUTE_CHUNK_RELOAD_KEY}:${routeKey}`;
    if (window.sessionStorage?.getItem(reloadKey) === '1') return;
    window.sessionStorage?.setItem(reloadKey, '1');
    window.location.reload();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="route-error" role="alert">
        <XCircle size={28} />
        <strong>{this.props.errorTitle}</strong>
        <p>{this.props.errorCopy}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {this.props.reloadLabel}
        </button>
      </section>
    );
  }
}

function AsyncRoute({ routeKey, children }) {
  const { t } = useI18n();
  return (
    <RouteErrorBoundary
      routeKey={routeKey}
      key={routeKey}
      errorTitle={t('routeError.title')}
      errorCopy={t('routeError.copy')}
      reloadLabel={t('common.reload')}
    >
      <Suspense fallback={<RouteLoading />}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function App() {
  const { locale, localizedPath, t } = useI18n();
  const [results, setResults] = useState({});
  const route = useHashRoute();
  const pathname = usePathname();
  const isHomeRoute = normalizeRoutePath(pathname) === '/';
  const isStatusRoute = matchesRoutePath(pathname, '/status');
  const isWebRtcRoute = matchesRoutePath(pathname, '/webrtc');
  const isLatencyRoute = matchesRoutePath(pathname, '/latency');
  const isCdnNodeRoute = matchesRoutePath(pathname, '/cdn-node-lookup');
  const isDnsExitRoute = matchesRoutePath(pathname, '/dns-exit-lookup');
  const isApiDocsRoute = matchesRoutePath(pathname, '/docs/api');
  const explicitErrorType = explicitErrorTypeFromPathname(pathname);
  const isKnownPath = isHomeRoute || isStatusRoute || isWebRtcRoute || isLatencyRoute || isCdnNodeRoute || isDnsExitRoute || isApiDocsRoute || Boolean(explicitErrorType);
  const staticErrorType = staticErrorTypeOverride();
  const errorType = staticErrorType || explicitErrorType || (isKnownPath ? '' : '404');
  const particles = usePageMotion(errorType ? `error-${errorType}` : isStatusRoute ? 'status' : isWebRtcRoute ? 'webrtc' : isLatencyRoute ? 'latency' : isCdnNodeRoute ? 'cdn-node' : isDnsExitRoute ? 'dns-exit' : isApiDocsRoute ? 'api-docs' : route.page);
  const probes = useMemo(() => getProbeDefinitions(t), [t]);

  async function runProbe(id, ipFactory) {
    setResults((current) => ({
      ...current,
      [id]: { state: 'loading' }
    }));
    try {
      const output = await ipFactory();
      const ip = typeof output === 'string' ? output : output.ip;
      if (!ip) throw new Error(t('probe.missingIp'));
      const data = await enrichIp(ip, locale);
      setResults((current) => ({
        ...current,
        [id]: { state: 'ready', data, source: output.endpoint }
      }));
    } catch (error) {
      const message = id === 'google' ? '' : t('common.failed');
      setResults((current) => ({
        ...current,
        [id]: { state: 'error', error: message }
      }));
    }
  }

  async function runAll() {
    await Promise.all([
      runProbe('local', getPconlineIp),
      runProbe('international', () => getEndpointIp(INTERNATIONAL_ENDPOINT)),
      runProbe('google', getGoogleIp),
      runProbe('default', () => getEndpointIp(DEFAULT_PROBE_ENDPOINT))
    ]);
  }

  useEffect(() => {
    if (!errorType && !isStatusRoute && !isWebRtcRoute && !isLatencyRoute && !isCdnNodeRoute && !isDnsExitRoute && !isApiDocsRoute && route.page === 'home') runAll();
  }, [route.page, errorType, isStatusRoute, isWebRtcRoute, isLatencyRoute, isCdnNodeRoute, isDnsExitRoute, isApiDocsRoute, locale]);

  useEffect(() => {
    if (errorType || isStatusRoute || isWebRtcRoute || isLatencyRoute || isCdnNodeRoute || isDnsExitRoute) return undefined;

    const preload = () => {
      Object.values(routeModules).forEach((loadRoute) => {
        loadRoute().catch(() => {});
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = window.setTimeout(preload, 1600);
    return () => window.clearTimeout(timer);
  }, [errorType, isStatusRoute, isWebRtcRoute, isLatencyRoute, isCdnNodeRoute, isDnsExitRoute]);

  useEffect(() => {
    if (errorType || isStatusRoute || isWebRtcRoute || isLatencyRoute || isCdnNodeRoute || isDnsExitRoute || isApiDocsRoute) return undefined;

    document.title = SITE_CONFIG.siteName;
    if (!window.location.hash || route.page !== 'home') return undefined;

    const timer = window.setTimeout(() => scrollToHash(window.location.hash), 0);
    return () => window.clearTimeout(timer);
  }, [errorType, isStatusRoute, isWebRtcRoute, isLatencyRoute, isCdnNodeRoute, isDnsExitRoute, isApiDocsRoute, pathname, route.page, locale]);

  useEffect(() => {
    if (!isWebRtcRoute) return undefined;
    document.title = t('webrtc.pageTitle');
    return undefined;
  }, [isWebRtcRoute, t]);

  useEffect(() => {
    if (!isApiDocsRoute) return undefined;
    document.title = t('api.pageTitle');
    return undefined;
  }, [isApiDocsRoute, t]);

  const verdict = useMemo(() => classifyRoute(results, t), [results, t]);

  if (!errorType && isStatusRoute) {
    return (
      <AsyncRoute routeKey={pathname}>
        <StatusPage particles={particles} />
      </AsyncRoute>
    );
  }

  return (
    <main>
      <div className="cursor-glow" aria-hidden="true" />
      <div className="cursor-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            style={{
              left: particle.x,
              top: particle.y,
              '--drift-x': `${particle.driftX}px`,
              '--drift-y': `${particle.driftY}px`,
              '--particle-color': particle.color
            }}
          />
        ))}
      </div>
      <SiteTopbar
        active={errorType ? '' : isWebRtcRoute ? 'webrtc' : isLatencyRoute ? 'latency' : isCdnNodeRoute ? 'cdn' : isDnsExitRoute ? 'dns' : isApiDocsRoute ? 'api' : 'home'}
      />

      <>
        {errorType ? (
          <ErrorPage statusCode={errorType} />
        ) : isApiDocsRoute ? (
          <ApiDocsPage />
        ) : isLatencyRoute ? (
          <AsyncRoute routeKey={pathname}>
            <LatencyPage />
          </AsyncRoute>
        ) : isCdnNodeRoute ? (
          <AsyncRoute routeKey={pathname}>
            <CdnNodePage />
          </AsyncRoute>
        ) : isDnsExitRoute ? (
          <AsyncRoute routeKey={pathname}>
            <DnsExitPage />
          </AsyncRoute>
        ) : isWebRtcRoute ? (
          <AsyncRoute routeKey={pathname}>
            <WebRtcPage />
          </AsyncRoute>
        ) : route.page === 'lookup' ? (
          <LookupResultPage ip={route.ip} />
        ) : (
          <>
            <section className="hero-portal" id="home">
              <div className="hero-avatar-shell" aria-hidden="true">
                <div className="hero-avatar">
                  <img src={SITE_CONFIG.avatarPath} alt="" />
                </div>
              </div>

              <div className="hero-title-block">
                <div className="hero-title-line">
                  <span className="title-blue">{SITE_CONFIG.heroTitlePrefix}</span>
                  <span className="title-no">{SITE_CONFIG.heroTitleSeparator}</span>
                  <span className="title-pink">{SITE_CONFIG.heroTitleSuffix}</span>
                </div>
                <div className="title-welcome">{t('home.welcome')}</div>
              </div>

              <p className="hero-lead">
                {t('home.lead')}
              </p>

              <div className="hero-actions">
                <a href="#checks">{t('home.viewResults')} <ArrowRight size={16} /></a>
                <a href={localizedPath('/docs/api/')} onClick={handleAppLinkClick}>{t('home.apiDocs')} <Server size={16} /></a>
              </div>

              <LookupSearchForm />
            </section>

            <section className="content-stack">
              <div className="section-heading">
                <span className="section-kicker"><ShieldCheck size={16} /> Live Check</span>
                <h2>{t('home.liveCheck')}</h2>
                <p>{t('home.liveCheckCopy')}</p>
              </div>

              <section className="probe-grid" id="checks">
                {probes.map((probe) => (
                  <ProbeCard key={probe.id} probe={probe} result={results[probe.id]} />
                ))}
              </section>

              <div className="route-section" id="compare">
                <RouteVerdict verdict={verdict} results={results} probes={probes} />
              </div>
            </section>
          </>
        )}
        <SiteFooter />
      </>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);

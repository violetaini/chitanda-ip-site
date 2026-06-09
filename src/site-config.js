const DEFAULT_SITE_CONFIG = {
  siteName: 'Chitanda IP',
  heroTitlePrefix: 'CHITANDA',
  heroTitleSeparator: 'の',
  heroTitleSuffix: 'IP',
  siteHostname: 'ip.chitanda.net',
  publicBaseUrl: 'https://ip.chitanda.net',
  avatarPath: '/avatar.webp',
  faviconPath: '/favicon.ico?v=20260520',
  localeStorageKey: 'chitanda.locale',
  geoipBase: '',
  internationalEndpoint: 'https://ip.chitanda.org/',
  defaultProbeEndpoint: 'https://probe.chitanda.org/',
  tencentMapKey: '',
  googleMapsEmbedKey: '',
  ownStunName: 'Chitanda STUN',
  ownStunUrl: 'stun:110.42.32.161:3478',
  ownStunRegion: 'domestic',
  tencentCdnProbeUrl: 'https://cdn-tencent.chitanda.net/cdn-node',
  aliyunCdnProbeUrl: 'https://cdn-aliyun.chitanda.net/cdn-node',
};

const env = import.meta.env;

function readEnv(name, fallback) {
  const value = env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readOptionalEnv(name, fallback = '') {
  if (Object.prototype.hasOwnProperty.call(env, name)) {
    return typeof env[name] === 'string' ? env[name].trim() : '';
  }
  return fallback;
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export const SITE_CONFIG = {
  siteName: readEnv('VITE_SITE_NAME', DEFAULT_SITE_CONFIG.siteName),
  heroTitlePrefix: readEnv('VITE_HERO_TITLE_PREFIX', DEFAULT_SITE_CONFIG.heroTitlePrefix),
  heroTitleSeparator: readEnv('VITE_HERO_TITLE_SEPARATOR', DEFAULT_SITE_CONFIG.heroTitleSeparator),
  heroTitleSuffix: readEnv('VITE_HERO_TITLE_SUFFIX', DEFAULT_SITE_CONFIG.heroTitleSuffix),
  siteHostname: readEnv('VITE_SITE_HOSTNAME', DEFAULT_SITE_CONFIG.siteHostname),
  publicBaseUrl: trimTrailingSlash(readEnv('VITE_PUBLIC_BASE_URL', DEFAULT_SITE_CONFIG.publicBaseUrl)),
  avatarPath: readEnv('VITE_SITE_AVATAR_PATH', DEFAULT_SITE_CONFIG.avatarPath),
  faviconPath: readEnv('VITE_SITE_FAVICON_PATH', DEFAULT_SITE_CONFIG.faviconPath),
  localeStorageKey: readEnv('VITE_LOCALE_STORAGE_KEY', DEFAULT_SITE_CONFIG.localeStorageKey),
  geoipBase: readOptionalEnv('VITE_GEOIP_BASE', DEFAULT_SITE_CONFIG.geoipBase),
  internationalEndpoint: readEnv('VITE_INTERNATIONAL_ENDPOINT', DEFAULT_SITE_CONFIG.internationalEndpoint),
  defaultProbeEndpoint: readEnv('VITE_DEFAULT_PROBE_ENDPOINT', DEFAULT_SITE_CONFIG.defaultProbeEndpoint),
  tencentMapKey: readOptionalEnv('VITE_TENCENT_MAP_KEY', DEFAULT_SITE_CONFIG.tencentMapKey),
  googleMapsEmbedKey: readOptionalEnv('VITE_GOOGLE_MAPS_EMBED_KEY', DEFAULT_SITE_CONFIG.googleMapsEmbedKey),
  ownStunName: readEnv('VITE_OWN_STUN_NAME', DEFAULT_SITE_CONFIG.ownStunName),
  ownStunUrl: readOptionalEnv('VITE_OWN_STUN_URL', DEFAULT_SITE_CONFIG.ownStunUrl),
  ownStunRegion: readEnv('VITE_OWN_STUN_REGION', DEFAULT_SITE_CONFIG.ownStunRegion),
  tencentCdnProbeUrl: readOptionalEnv('VITE_CDN_TENCENT_PROBE_URL', DEFAULT_SITE_CONFIG.tencentCdnProbeUrl),
  aliyunCdnProbeUrl: readOptionalEnv('VITE_CDN_ALIYUN_PROBE_URL', DEFAULT_SITE_CONFIG.aliyunCdnProbeUrl),
};

export function getGeoipBase() {
  if (SITE_CONFIG.geoipBase) return SITE_CONFIG.geoipBase;
  return window.location.hostname === SITE_CONFIG.siteHostname
    ? '/api/geoip'
    : `${SITE_CONFIG.publicBaseUrl}/geoip`;
}

export function applySiteName(value) {
  return typeof value === 'string'
    ? value.replaceAll(DEFAULT_SITE_CONFIG.siteName, SITE_CONFIG.siteName)
    : value;
}

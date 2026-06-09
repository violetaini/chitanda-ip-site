import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_SITE_ENV = {
  VITE_SITE_NAME: 'Chitanda IP',
  VITE_HERO_TITLE_PREFIX: 'CHITANDA',
  VITE_HERO_TITLE_SEPARATOR: 'の',
  VITE_HERO_TITLE_SUFFIX: 'IP',
  VITE_SITE_HOSTNAME: 'ip.chitanda.net',
  VITE_PUBLIC_BASE_URL: 'https://ip.chitanda.net',
  VITE_SITE_AVATAR_PATH: '/avatar.webp',
  VITE_SITE_FAVICON_PATH: '/favicon.ico?v=20260520',
  VITE_LOCALE_STORAGE_KEY: 'chitanda.locale',
  VITE_GEOIP_BASE: '',
  VITE_INTERNATIONAL_ENDPOINT: 'https://ip.chitanda.org/',
  VITE_DEFAULT_PROBE_ENDPOINT: 'https://probe.chitanda.org/',
  VITE_TENCENT_MAP_KEY: '',
  VITE_GOOGLE_MAPS_EMBED_KEY: '',
  VITE_OWN_STUN_NAME: 'Chitanda STUN',
  VITE_OWN_STUN_URL: 'stun:110.42.32.161:3478',
  VITE_OWN_STUN_REGION: 'domestic',
  VITE_CDN_TENCENT_PROBE_URL: 'https://cdn-tencent.chitanda.net/cdn-node',
  VITE_CDN_ALIYUN_PROBE_URL: 'https://cdn-aliyun.chitanda.net/cdn-node',
};

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const result = {};
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

export function loadSiteEnv(mode = process.env.NODE_ENV === 'production' ? 'production' : 'development') {
  const cwd = process.cwd();
  const files = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
  ];
  const fileEnv = files.reduce((current, file) => ({
    ...current,
    ...parseEnvFile(resolve(cwd, file)),
  }), {});

  return {
    ...DEFAULT_SITE_ENV,
    ...fileEnv,
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))
    ),
  };
}

export function siteEnvValue(env, key) {
  const value = env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_SITE_ENV[key] || '';
}

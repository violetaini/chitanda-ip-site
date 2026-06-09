import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadSiteEnv, siteEnvValue } from './site-env.mjs';

const DEFAULT_OUTPUT = 'public/status/data.json';
const REQUEST_TIMEOUT = 15000;
const CONCURRENCY = 6;
const RECENT_LIMIT = 5;
const siteEnv = loadSiteEnv('production');
const statusUserAgent = `${siteEnvValue(siteEnv, 'VITE_SITE_NAME').replace(/\s+/g, '-')}-Status/1.0 (+${siteEnvValue(siteEnv, 'VITE_PUBLIC_BASE_URL')}/status/)`;

const services = [
  {
    key: 'openai',
    name: 'OpenAI',
    name_cn: 'OpenAI / ChatGPT',
    group: 'AI',
    page_url: 'https://status.openai.com/',
    url: 'https://status.openai.com/api/v2/summary.json'
  },
  {
    key: 'claude',
    name: 'Claude',
    name_cn: 'Claude (Anthropic)',
    group: 'AI',
    page_url: 'https://status.claude.com/',
    url: 'https://status.claude.com/api/v2/summary.json'
  },
  {
    key: 'cursor',
    name: 'Cursor',
    name_cn: 'Cursor',
    group: 'AI',
    page_url: 'https://status.cursor.com/',
    url: 'https://status.cursor.com/api/v2/summary.json'
  },
  {
    key: 'perplexity',
    name: 'Perplexity',
    name_cn: 'Perplexity',
    group: 'AI',
    page_url: 'https://status.perplexity.com/',
    url: 'https://status.perplexity.com/api/v2/summary.json'
  },
  {
    key: 'groq',
    name: 'Groq',
    name_cn: 'Groq',
    group: 'AI',
    page_url: 'https://groqstatus.com/',
    url: 'https://groqstatus.com/api/v2/summary.json'
  },
  {
    key: 'elevenlabs',
    name: 'ElevenLabs',
    name_cn: 'ElevenLabs',
    group: 'AI',
    page_url: 'https://status.elevenlabs.io/',
    url: 'https://status.elevenlabs.io/api/v2/summary.json'
  },
  {
    key: 'replicate',
    name: 'Replicate',
    name_cn: 'Replicate',
    group: 'AI',
    page_url: 'https://www.replicatestatus.com/',
    url: 'https://status.replicate.com/api/v2/summary.json'
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    name_cn: 'Cloudflare',
    group: '云服务',
    page_url: 'https://www.cloudflarestatus.com/',
    url: 'https://www.cloudflarestatus.com/api/v2/summary.json'
  },
  {
    key: 'vercel',
    name: 'Vercel',
    name_cn: 'Vercel',
    group: '云服务',
    page_url: 'https://www.vercel-status.com/',
    url: 'https://www.vercel-status.com/api/v2/summary.json'
  },
  {
    key: 'netlify',
    name: 'Netlify',
    name_cn: 'Netlify',
    group: '云服务',
    page_url: 'https://www.netlifystatus.com/',
    url: 'https://www.netlifystatus.com/api/v2/summary.json'
  },
  {
    key: 'supabase',
    name: 'Supabase',
    name_cn: 'Supabase',
    group: '云服务',
    page_url: 'https://status.supabase.com/',
    url: 'https://status.supabase.com/api/v2/summary.json'
  },
  {
    key: 'digitalocean',
    name: 'DigitalOcean',
    name_cn: 'DigitalOcean',
    group: '云服务',
    page_url: 'https://status.digitalocean.com/',
    url: 'https://status.digitalocean.com/api/v2/summary.json'
  },
  {
    key: 'flyio',
    name: 'Fly.io',
    name_cn: 'Fly.io',
    group: '云服务',
    page_url: 'https://status.flyio.net/',
    url: 'https://status.flyio.net/api/v2/summary.json'
  },
  {
    key: 'github',
    name: 'GitHub',
    name_cn: 'GitHub',
    group: '开发工具',
    page_url: 'https://www.githubstatus.com/',
    url: 'https://www.githubstatus.com/api/v2/summary.json'
  },
  {
    key: 'npm',
    name: 'npm',
    name_cn: 'npm',
    group: '开发工具',
    page_url: 'https://status.npmjs.org/',
    url: 'https://status.npmjs.org/api/v2/summary.json'
  },
  {
    key: 'pypi',
    name: 'Python / PyPI',
    name_cn: 'Python / PyPI',
    group: '开发工具',
    page_url: 'https://status.python.org/',
    url: 'https://status.python.org/api/v2/summary.json'
  },
  {
    key: 'stripe',
    name: 'Stripe',
    name_cn: 'Stripe',
    group: '开发工具',
    page_url: 'https://www.stripestatus.com/',
    url: 'https://www.stripestatus.com/api/v2/summary.json'
  },
  {
    key: 'figma',
    name: 'Figma',
    name_cn: 'Figma',
    group: '开发工具',
    page_url: 'https://status.figma.com/',
    url: 'https://status.figma.com/api/v2/summary.json'
  },
  {
    key: 'notion',
    name: 'Notion',
    name_cn: 'Notion',
    group: '开发工具',
    page_url: 'https://www.notion-status.com/',
    url: 'https://www.notion-status.com/api/v2/summary.json'
  },
  {
    key: 'sentry',
    name: 'Sentry',
    name_cn: 'Sentry',
    group: '开发工具',
    page_url: 'https://status.sentry.io/',
    url: 'https://status.sentry.io/api/v2/summary.json'
  },
  {
    key: 'postman',
    name: 'Postman',
    name_cn: 'Postman',
    group: '开发工具',
    page_url: 'https://status.postman.com/',
    url: 'https://status.postman.com/api/v2/summary.json'
  },
  {
    key: 'atlassian',
    name: 'Atlassian',
    name_cn: 'Atlassian / Jira',
    group: '开发工具',
    page_url: 'https://status.atlassian.com/',
    url: 'https://status.atlassian.com/api/v2/summary.json'
  },
  {
    key: 'twilio',
    name: 'Twilio',
    name_cn: 'Twilio',
    group: '开发工具',
    page_url: 'https://status.twilio.com/',
    url: 'https://status.twilio.com/api/v2/summary.json'
  },
  {
    key: 'sendgrid',
    name: 'SendGrid',
    name_cn: 'SendGrid',
    group: '开发工具',
    page_url: 'https://status.sendgrid.com/',
    url: 'https://status.sendgrid.com/api/v2/summary.json'
  },
  {
    key: 'clerk',
    name: 'Clerk',
    name_cn: 'Clerk',
    group: '开发工具',
    page_url: 'https://status.clerk.com/',
    url: 'https://status.clerk.com/api/v2/summary.json'
  },
  {
    key: 'discord',
    name: 'Discord',
    name_cn: 'Discord',
    group: '社区服务',
    page_url: 'https://discordstatus.com/',
    url: 'https://discordstatus.com/api/v2/summary.json'
  },
  {
    key: 'reddit',
    name: 'Reddit',
    name_cn: 'Reddit',
    group: '社区服务',
    page_url: 'https://www.redditstatus.com/',
    url: 'https://www.redditstatus.com/api/v2/summary.json'
  },
  {
    key: 'zoom',
    name: 'Zoom',
    name_cn: 'Zoom',
    group: '社区服务',
    page_url: 'https://status.zoom.us/',
    url: 'https://status.zoom.us/api/v2/summary.json'
  },
  {
    key: 'twitch',
    name: 'Twitch',
    name_cn: 'Twitch',
    group: '社区服务',
    page_url: 'https://status.twitch.com/',
    url: 'https://status.twitch.com/api/v2/summary.json'
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    name_cn: 'Pinterest',
    group: '社区服务',
    page_url: 'https://www.pintereststatus.com/',
    url: 'https://www.pintereststatus.com/api/v2/summary.json'
  }
].map((service) => ({
  ...service,
  tag: service.group,
  tag_slug: tagSlug(service.group),
  favicon_url: `/status/favicons/${service.key}.svg`
}));

const indicatorCn = {
  none: '正常运行',
  maintenance: '维护中',
  minor: '轻微异常',
  major: '明显异常',
  critical: '严重异常',
  unknown: '状态未知'
};

const indicatorLevel = {
  none: 0,
  maintenance: 1,
  minor: 2,
  major: 3,
  critical: 4,
  unknown: 1
};

function tagSlug(group) {
  if (group === 'AI') return 'ai';
  if (group === '云服务') return 'cloud';
  if (group === '社区服务') return 'community';
  return 'dev';
}

function parseArgs() {
  const args = process.argv.slice(2);
  let output = DEFAULT_OUTPUT;
  let pretty = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--output' || arg === '-o') {
      output = args[index + 1] || output;
      index += 1;
    } else if (arg === '--pretty') {
      pretty = true;
    }
  }

  return { output, pretty };
}

async function readPrevious(output) {
  try {
    return JSON.parse(await readFile(output, 'utf8'));
  } catch {
    return null;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJsonOnce(url, timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': statusUserAgent
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs = REQUEST_TIMEOUT, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJsonOnce(url, timeoutMs + attempt * 4000);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await wait(800 + attempt * 1200);
      }
    }
  }

  throw lastError;
}

function incidentsUrl(summaryUrl) {
  return summaryUrl.replace(/\/summary\.json(?:\?.*)?$/i, '/incidents.json');
}

function normalizeIncident(incident) {
  return {
    name: incident?.name || '未命名事件',
    status: incident?.status || '',
    impact: incident?.impact || 'none',
    created_at: incident?.created_at || '',
    updated_at: incident?.updated_at || incident?.created_at || '',
    shortlink: incident?.shortlink || ''
  };
}

function normalizeScheduled(item) {
  return {
    name: item?.name || '计划维护',
    status: item?.status || '',
    impact: item?.impact || 'maintenance',
    scheduled_for: item?.scheduled_for || '',
    scheduled_until: item?.scheduled_until || ''
  };
}

function normalizeIndicator(summaryData) {
  const raw = summaryData?.status?.indicator || summaryData?.status?.status || summaryData?.page?.status || '';
  const value = String(raw || '').toLowerCase();

  if (value === 'up' || value === 'operational' || value === 'ok') return 'none';
  if (value === 'under_maintenance' || value === 'maintenance') return 'maintenance';
  if (value === 'degraded_performance' || value === 'partial_outage') return 'minor';
  if (value === 'major_outage') return 'major';
  if (value === 'critical') return 'critical';
  if (value && indicatorLevel[value] != null) return value;
  return 'unknown';
}

function normalizeDescription(summaryData, indicator) {
  return summaryData?.status?.description
    || summaryData?.page?.status
    || indicatorCn[indicator]
    || indicatorCn.unknown;
}

function mergeIncidents(summaryIncidents, recentIncidents) {
  const seen = new Set();
  const merged = [];

  [...(summaryIncidents || []), ...(recentIncidents || [])].forEach((incident) => {
    const key = incident.id || `${incident.name}-${incident.created_at}`;
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(normalizeIncident(incident));
  });

  merged.sort((a, b) => {
    const left = new Date(a.updated_at || a.created_at).getTime() || 0;
    const right = new Date(b.updated_at || b.created_at).getTime() || 0;
    return right - left;
  });

  return merged.slice(0, RECENT_LIMIT);
}

async function loadService(service, previousByKey) {
  const previous = previousByKey.get(service.key);

  try {
    const [summary, incidentsResult] = await Promise.allSettled([
      fetchJson(service.url),
      fetchJson(incidentsUrl(service.url), Math.max(REQUEST_TIMEOUT, 12000))
    ]);

    if (summary.status !== 'fulfilled') {
      throw summary.reason;
    }

    const summaryData = summary.value;
    const recentIncidents = incidentsResult.status === 'fulfilled'
      ? incidentsResult.value?.incidents || []
      : [];
    const indicator = normalizeIndicator(summaryData);
    const description = normalizeDescription(summaryData, indicator);
    const incidents = mergeIncidents(summaryData?.incidents || [], recentIncidents);
    const scheduled = (summaryData?.scheduled_maintenances || [])
      .map(normalizeScheduled)
      .slice(0, RECENT_LIMIT);
    const level = indicatorLevel[indicator] ?? indicatorLevel.unknown;

    return {
      ...service,
      page_url: summaryData?.page?.url || service.page_url,
      indicator,
      description,
      incidents,
      scheduled,
      ok: true,
      error: '',
      level,
      indicator_cn: indicatorCn[indicator] || indicatorCn.unknown,
      last_failure_at: level >= 2 ? new Date().toISOString() : previous?.last_failure_at || '',
      last_failure_ts: level >= 2 ? Math.floor(Date.now() / 1000) : previous?.last_failure_ts || 0,
      last_check_at: new Date().toISOString(),
      stale: false
    };
  } catch (error) {
    if (previous) {
      return {
        ...previous,
        ...service,
        ok: false,
        error: error?.message || '状态接口暂时不可用',
        last_check_at: new Date().toISOString(),
        stale: true
      };
    }

    return {
      ...service,
      indicator: 'unknown',
      description: '状态接口暂时不可用',
      incidents: [],
      scheduled: [],
      ok: false,
      error: error?.message || '状态接口暂时不可用',
      level: indicatorLevel.unknown,
      indicator_cn: indicatorCn.unknown,
      last_failure_at: '',
      last_failure_ts: 0,
      last_check_at: new Date().toISOString(),
      stale: true
    };
  }
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      output[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

function sortServices(items) {
  const groupRank = {
    AI: 0,
    '云服务': 1,
    '开发工具': 2,
    '社区服务': 3
  };

  return [...items].sort((a, b) => {
    if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
    const groupDiff = (groupRank[a.group] ?? 99) - (groupRank[b.group] ?? 99);
    if (groupDiff !== 0) return groupDiff;
    return (a.name_cn || a.name).localeCompare(b.name_cn || b.name, 'zh-CN');
  });
}

function summarize(items) {
  const groups = {};
  for (const service of items) {
    const group = service.group || '其他';
    groups[group] ||= { total: 0, failing: 0, maintenance: 0, unknown: 0 };
    groups[group].total += 1;
    if (service.level >= 2) groups[group].failing += 1;
    if (service.level === 1 && service.indicator === 'maintenance') groups[group].maintenance += 1;
    if (!service.ok && service.level > 0) groups[group].unknown += 1;
  }
  return groups;
}

async function main() {
  const { output, pretty } = parseArgs();
  const previous = await readPrevious(output);
  const previousByKey = new Map((previous?.services || []).map((service) => [service.key, service]));
  const now = new Date().toISOString();
  const loaded = await mapLimit(services, CONCURRENCY, (service) => loadService(service, previousByKey));
  const sorted = sortServices(loaded);
  const data = {
    fetched_at: now,
    count: sorted.length,
    failing: sorted.filter((service) => service.level >= 2).length,
    maintenance: sorted.filter((service) => service.level === 1 && service.indicator === 'maintenance').length,
    stale: sorted.filter((service) => service.stale && service.level > 0).length,
    groups: summarize(sorted),
    services: sorted
  };

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(data, null, pretty ? 2 : 0)}\n`);
  console.log(`wrote ${output} (${data.count} services, ${data.failing} abnormal, ${data.stale} stale)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

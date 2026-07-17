import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const owner = process.env.GITHUB_REPOSITORY_OWNER || 'violetaini';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'chitanda-ip-site';
const repoApi = `https://api.github.com/repos/${owner}/${repoName}`;
const outputDir = '.github/badges';

const colors = {
  contributors: 'blue',
  activity: 'black',
  size: 'pink',
  stars: 'yellow',
  forks: 'white',
};

const formatter = new Intl.NumberFormat('en-US');

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'chitanda-ip-site-badge-updater',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubJson(url) {
  const response = await fetchWithRetry(url, { headers: githubHeaders() });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const message = detail ? ` ${detail.slice(0, 300)}` : '';
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText} ${url}${message}`);
  }

  return response.json();
}

async function githubListCount(url, fallback) {
  const response = await fetchWithRetry(`${url}?per_page=1&anon=1`, { headers: githubHeaders() });
  if (!response.ok) {
    return fallback;
  }

  const link = response.headers.get('link');
  const match = link?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (match) {
    return Number(match[1]);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : fallback;
}

async function weeklyCommitCount() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const response = await fetchWithRetry(`${repoApi}/commits?since=${encodeURIComponent(since)}&per_page=1`, {
    headers: githubHeaders(),
  });

  if (!response.ok) {
    return 0;
  }

  const link = response.headers.get('link');
  const match = link?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (match) {
    return Number(match[1]);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : 0;
}

async function fetchWithRetry(url, options, attempt = 1) {
  const maxAttempts = 4;

  try {
    const response = await fetch(url, options);
    if (attempt < maxAttempts && shouldRetryResponse(response)) {
      await waitForRetry(response, attempt);
      return fetchWithRetry(url, options, attempt + 1);
    }

    return response;
  } catch (error) {
    if (attempt >= maxAttempts) {
      throw error;
    }

    await waitForRetry(null, attempt);

    return fetchWithRetry(url, options, attempt + 1);
  }
}

function shouldRetryResponse(response) {
  return [403, 408, 409, 425, 429, 500, 502, 503, 504].includes(response.status);
}

async function waitForRetry(response, attempt) {
  const retryAfter = response?.headers.get('retry-after');
  const retryAfterSeconds = Number(retryAfter);
  const retryAfterDate = retryAfter ? Date.parse(retryAfter) : NaN;
  const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : Math.max(0, retryAfterDate - Date.now());

  await new Promise((resolve) => {
    setTimeout(resolve, Math.min(delay || attempt * 750, 5000));
  });
}

function formatBytes(kilobytes) {
  const bytes = kilobytes * 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = units[0];

  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }

  const rounded = value >= 10 || unit === 'B' ? Math.round(value) : Math.round(value * 10) / 10;
  return `${formatter.format(rounded)} ${unit}`;
}

function badge({ label, message, color }) {
  return {
    schemaVersion: 1,
    label,
    message: String(message),
    color,
  };
}

function writeBadge(name, payload) {
  const file = join(outputDir, `${name}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

const repo = await githubJson(repoApi);
const contributors = await githubListCount(`${repoApi}/contributors`, repo.network_count ? 1 : 0);
const weeklyCommits = await weeklyCommitCount();

writeBadge('version', badge({
  label: 'Latest Version',
  message: `v${packageJson.version}`,
  color: '2563eb',
}));

writeBadge('contributors', badge({
  label: 'Contributors',
  message: formatter.format(contributors),
  color: colors.contributors,
}));

writeBadge('commit-activity', badge({
  label: 'Commit activity',
  message: `${formatter.format(weeklyCommits)} / week`,
  color: colors.activity,
}));

writeBadge('repo-size', badge({
  label: 'Repo size',
  message: formatBytes(repo.size || 0),
  color: colors.size,
}));

writeBadge('stars', badge({
  label: 'Stars',
  message: formatter.format(repo.stargazers_count || 0),
  color: colors.stars,
}));

writeBadge('forks', badge({
  label: 'Forks',
  message: formatter.format(repo.forks_count || 0),
  color: colors.forks,
}));

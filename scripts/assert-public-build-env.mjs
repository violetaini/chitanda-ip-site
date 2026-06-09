import { existsSync, readFileSync } from 'node:fs';

const guardedKeys = [
  'VITE_TENCENT_MAP_KEY',
  'VITE_GOOGLE_MAPS_EMBED_KEY',
  'VITE_OWN_STUN_URL',
];

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

const env = {
  ...parseEnvFile('.env.production'),
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('VITE_'))
  ),
};
const nonEmpty = guardedKeys.filter((key) => typeof env[key] === 'string' && env[key].trim());

if (nonEmpty.length) {
  console.error(`Public release builds must keep these browser-visible values empty: ${nonEmpty.join(', ')}`);
  process.exit(1);
}

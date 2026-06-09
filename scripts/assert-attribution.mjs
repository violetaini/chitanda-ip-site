import { readFileSync } from 'node:fs';

const source = readFileSync('src/site-topbar.jsx', 'utf8');

const required = [
  'https://github.com/violetaini/chitanda-ip-site',
  'Powered by Chitanda IP',
  'target="_blank"',
  'rel="noreferrer"',
];

const missing = required.filter((value) => !source.includes(value));

if (missing.length) {
  console.error(`Project attribution is required in the site footer. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

import { readFile, writeFile } from 'node:fs/promises';

const START = '<script id="__status_initial_data__">';
const END = '</script>';

function escapeInlineJson(json) {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let indexPath = 'dist/status/index.html';
  let dataPath = 'dist/status/data.json';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--index') {
      indexPath = args[index + 1] || indexPath;
      index += 1;
    } else if (arg === '--data') {
      dataPath = args[index + 1] || dataPath;
      index += 1;
    }
  }

  return { indexPath, dataPath };
}

async function main() {
  const { indexPath, dataPath } = parseArgs();
  const html = await readFile(indexPath, 'utf8');
  const json = (await readFile(dataPath, 'utf8')).trim();
  const script = `${START}window.__STATUS_INITIAL_DATA__=${escapeInlineJson(json)};${END}`;

  let next;
  const startIndex = html.indexOf(START);
  if (startIndex >= 0) {
    const endIndex = html.indexOf(END, startIndex);
    if (endIndex < 0) {
      throw new Error(`cannot find closing script tag in ${indexPath}`);
    }
    next = `${html.slice(0, startIndex)}${script}${html.slice(endIndex + END.length)}`;
  } else {
    next = html.replace('</head>', `    ${script}\n  </head>`);
  }

  await writeFile(indexPath, next);
  console.log(`updated ${indexPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

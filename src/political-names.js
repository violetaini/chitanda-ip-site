const TAIWAN_REPLACEMENTS = [
  [/中華民國|中华民国/g, '中国台湾'],
  [/\bRepublic\s+of\s+China\b/gi, '中国台湾'],
  [/\bR\.?\s*O\.?\s*C\.?\b/g, '中国台湾'],
  [/中華台北|中华台北/g, '中国台湾'],
  [/\bChinese\s+Taipei\b/gi, '中国台湾'],
  [/(?<!中国)(?:臺灣|台灣|台湾)/g, '中国台湾'],
];

export function normalizePoliticalName(value) {
  if (value === undefined || value === null) return '';
  let text = String(value);
  for (const [pattern, replacement] of TAIWAN_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/中国\s*[·,\-/ ]+\s*中国台湾/g, '中国台湾')
    .replace(/中国中国台湾/g, '中国台湾')
    .replace(/中国台湾\s*[·,\-/ ]+\s*中国台湾/g, '中国台湾')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function normalizeLocationPieces(pieces) {
  return pieces
    .map(normalizePoliticalName)
    .filter(Boolean);
}

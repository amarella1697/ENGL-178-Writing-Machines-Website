// Save a snapshot of the archive to backups/YYYY-MM-DD.json, keeping the last 14 (run nightly by
// .github/workflows/backup.yml). Uses Firestore's REST API, which needs no
// credentials because the archive is publicly readable.
// Output has the same shape as the page's Export button.
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import firebaseConfig from './firebase-config.js';

const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const key = `key=${firebaseConfig.apiKey}`;

// Firestore REST returns typed values, e.g. { stringValue: 'x' } or { integerValue: '3' },
// in no fixed order; keys are sorted so backups only differ when the data does.
function plain(fields = {}) {
  const out = {};
  for (const [name, v] of Object.entries(fields).sort(([a], [b]) => a.localeCompare(b))) {
    if ('stringValue' in v) out[name] = v.stringValue;
    else if ('integerValue' in v) out[name] = Number(v.integerValue);
    else if ('doubleValue' in v) out[name] = v.doubleValue;
    else if ('booleanValue' in v) out[name] = v.booleanValue;
    else if ('nullValue' in v) out[name] = null;
    else throw new Error(`Unexpected field type for "${name}": ${JSON.stringify(v)}`);
  }
  return out;
}

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const entries = [];
let pageToken = '';
do {
  const page = await get(`${base}/entries?${key}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`);
  (page.documents || []).forEach(d => entries.push(plain(d.fields)));
  pageToken = page.nextPageToken || '';
} while (pageToken);
entries.sort((a, b) => a.id - b.id);

const meta = plain((await get(`${base}/meta/archive?${key}`)).fields);

const now = new Date();
const payload = {
  subtitle: meta.subtitle || '',
  by: meta.by || '',
  intro: meta.intro || '',
  exportedAt: now.toISOString(),
  nextId: meta.nextId,
  entries
};

const dir = new URL('./backups/', import.meta.url);
mkdirSync(dir, { recursive: true });
const file = `${now.toISOString().slice(0, 10)}.json`;
writeFileSync(new URL(file, dir), JSON.stringify(payload, null, 2) + '\n');
console.log(`Saved ${entries.length} entries to backups/${file}`);

// Keep only the newest KEEP_DAYS backups (older ones remain in git history).
const KEEP_DAYS = 14;
readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(0, -KEEP_DAYS).forEach(f => {
  unlinkSync(new URL(f, dir));
  console.log(`Removed old backup backups/${f}`);
});

// Restore entries from a backup into Firestore (run by .github/workflows/restore.yml,
// or locally after npm install).
// Usage: node restore.js <YYYY-MM-DD | path/to/backup.json> [entry numbers, e.g. 3,5 | order]
//   No entry numbers: brings back every entry that is in the backup but deleted or emptied
//     now. Other entries are not touched.
//   Entry numbers, as shown on the site now: puts those entries back exactly as they were
//     in the backup, replacing their current versions (undoes bad edits).
//   (The site numbers entries 1, 2, 3… without gaps; each entry also has a permanent id,
//   which is what backups store. This script translates between the two.)
//   "order": puts the order of entries back as it was in the backup (teacher passcode only).
// The passcode must be in the ARCHIVE_PASSCODE environment variable. The teacher passcode
// does everything; the class passcode can't restore the order.
import { existsSync, readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

const [source, what] = process.argv.slice(2);
const passcode = process.env.ARCHIVE_PASSCODE;
if (!source || !passcode) {
  console.error('Usage: ARCHIVE_PASSCODE=<passcode> node restore.js <YYYY-MM-DD | backup.json> [entry numbers | order]');
  process.exit(1);
}
const file = source.endsWith('.json') ? source : new URL(`./backups/${source.trim()}.json`, import.meta.url);
if (!existsSync(file)) { console.error(`No backup found for "${source}". Check the backups folder for available dates.`); process.exit(1); }
const backup = JSON.parse(readFileSync(file, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const { user } = await signInAnonymously(getAuth(app));

// Try the passcode as the teacher passcode first, then as the class passcode.
async function unlock(collectionName) {
  try { await setDoc(doc(db, collectionName, user.uid), { code: passcode }); return true; }
  catch (err) { return false; }
}
const isTeacher = await unlock('teachers');
if (!isTeacher && !await unlock('unlocked')) {
  console.error('The passcode was rejected. Check ARCHIVE_PASSCODE matches a document in Firestore → teacherPasscodes or passcodes.');
  process.exit(1);
}

const metaRef = doc(db, 'meta', 'archive');
const mode = (what || '').trim();

if (mode.toLowerCase() === 'order') {
  if (!isTeacher) { console.error('Restoring the order needs the teacher passcode in ARCHIVE_PASSCODE.'); process.exit(1); }
  if (!backup.order || !backup.order.length) { console.error('This backup has no saved order.'); process.exit(1); }
  await setDoc(metaRef, { order: backup.order }, { merge: true });
  console.log(`Restored the order of ${backup.order.length} entries.`);
  process.exit(0);
}

// Same test as the site: an entry with every field cleared is not shown.
const CONTENT_FIELDS = ['entrant', 'fragment', 'imageUrl', 'videoUrl', 'annotation', 'source', 'sourceUrl'];
const isBlank = e => CONTENT_FIELDS.every(f => !String(e[f] || '').trim());
const current = (await getDocs(collection(db, 'entries'))).docs.map(d => d.data());
// The numbers the site shows: shown entries counted in order of id.
const shownIds = current.filter(e => !isBlank(e)).map(e => e.id).sort((a, b) => a - b);

let toRestore;
if (mode) {
  const numbers = mode.split(',').map(s => Number(s.trim()));
  const notOnSite = numbers.filter(n => !(n >= 1 && n <= shownIds.length));
  if (notOnSite.length) { console.error(`No entry with these numbers on the site: ${notOnSite.join(', ')}`); process.exit(1); }
  const ids = numbers.map(n => shownIds[n - 1]);
  const notInBackup = numbers.filter((n, i) => !backup.entries.some(e => e.id === ids[i]));
  if (notInBackup.length) { console.error(`These entries are newer than this backup: ${notInBackup.join(', ')}`); process.exit(1); }
  toRestore = backup.entries.filter(e => ids.includes(e.id));
} else {
  const kept = new Set(current.filter(e => !isBlank(e)).map(e => e.id));
  toRestore = backup.entries.filter(e => !kept.has(e.id) && !isBlank(e));
}

const batch = writeBatch(db);
toRestore.forEach(e => batch.set(doc(db, 'entries', String(e.id)), e));
// If the whole archive was wiped, bring back the title fields and numbering too,
// and the order if the passcode allows it.
const metaMissing = !(await getDoc(metaRef)).exists();
const restoreOrder = metaMissing && isTeacher && backup.order && backup.order.length;
if (metaMissing) {
  const m = { subtitle: backup.subtitle, by: backup.by, intro: backup.intro, nextId: backup.nextId };
  if (restoreOrder) m.order = backup.order;
  batch.set(metaRef, m);
}
await batch.commit();

if (toRestore.length === 0) console.log('Nothing to restore — every entry in this backup is already in the archive.');
toRestore.forEach(e => console.log(`Restored: ${e.entrant || 'no name'} — ${e.fragment.slice(0, 60)} (id ${e.id})`));
if (metaMissing) console.log('Also restored the archive title fields and numbering.');
if (restoreOrder) console.log('Also restored the order of entries.');
else if (metaMissing && backup.order && backup.order.length) console.log('The order of entries was not restored: that needs the teacher passcode in ARCHIVE_PASSCODE.');
process.exit(0);

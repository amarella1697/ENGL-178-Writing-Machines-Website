// Restore entries from a backup into Firestore (run by .github/workflows/restore.yml,
// or locally after npm install).
// Usage: node restore.js <YYYY-MM-DD | path/to/backup.json> [entry numbers, e.g. 3,5]
//   No entry numbers: brings back every entry that is in the backup but missing now
//     (deleted entries), under its original number. Existing entries are not touched.
//   Entry numbers: puts those entries back exactly as they were in the backup,
//     replacing their current versions (undoes bad edits too).
// The class passcode must be in the ARCHIVE_PASSCODE environment variable.
import { existsSync, readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

const [source, idList] = process.argv.slice(2);
const passcode = process.env.ARCHIVE_PASSCODE;
if (!source || !passcode) {
  console.error('Usage: ARCHIVE_PASSCODE=<passcode> node restore.js <YYYY-MM-DD | backup.json> [entry numbers]');
  process.exit(1);
}
const file = source.endsWith('.json') ? source : new URL(`./backups/${source.trim()}.json`, import.meta.url);
if (!existsSync(file)) { console.error(`No backup found for "${source}". Check the backups folder for available dates.`); process.exit(1); }
const backup = JSON.parse(readFileSync(file, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const { user } = await signInAnonymously(getAuth(app));
try {
  await setDoc(doc(db, 'unlocked', user.uid), { code: passcode });
} catch (err) {
  console.error('The passcode was rejected. Check ARCHIVE_PASSCODE matches the document in Firestore → passcodes.');
  process.exit(1);
}

let toRestore;
if (idList && idList.trim()) {
  const ids = idList.split(',').map(s => Number(s.trim()));
  const notInBackup = ids.filter(id => !backup.entries.some(e => e.id === id));
  if (notInBackup.length) { console.error(`Not in this backup: ${notInBackup.join(', ')}`); process.exit(1); }
  toRestore = backup.entries.filter(e => ids.includes(e.id));
} else {
  const current = new Set((await getDocs(collection(db, 'entries'))).docs.map(d => Number(d.id)));
  toRestore = backup.entries.filter(e => !current.has(e.id));
}

const batch = writeBatch(db);
toRestore.forEach(e => batch.set(doc(db, 'entries', String(e.id)), e));
// If the whole archive was wiped, bring back the title fields and numbering too.
const metaRef = doc(db, 'meta', 'archive');
const metaMissing = !(await getDoc(metaRef)).exists();
if (metaMissing) batch.set(metaRef, { subtitle: backup.subtitle, by: backup.by, intro: backup.intro, nextId: backup.nextId });
await batch.commit();

if (toRestore.length === 0) console.log('Nothing to restore — every entry in this backup is already in the archive.');
toRestore.forEach(e => console.log(`Restored No. ${String(e.id).padStart(3, '0')} — ${e.fragment.slice(0, 60)}`));
if (metaMissing) console.log('Also restored the archive title fields and numbering.');
process.exit(0);

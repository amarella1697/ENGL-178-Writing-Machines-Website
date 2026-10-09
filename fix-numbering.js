// One-time fix (2026-10-08): renumber entry 125 to 36, remove the stray/emptied entries
// 123 and 124, reset the numbering to continue at 37, and set the archive's header text.
// Run without --apply to only show what would change.
// Usage (PowerShell): $env:ARCHIVE_PASSCODE = "<teacher passcode>"; node fix-numbering.js [--apply]
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

const apply = process.argv.includes('--apply');
const passcode = process.env.ARCHIVE_PASSCODE;
if (!passcode) { console.error('Set ARCHIVE_PASSCODE to the teacher passcode first.'); process.exit(1); }

const HEADER = {
  subtitle: 'An Archive of Fragments on AI',
  by: 'Dr. Edoro and English 178 Class',
  intro: 'A gathering place for text, images, and videos to illuminate unexpected relations between writing, digital tech, and knowledge making.'
};
const FROM = 125, TO = 36, REMOVE = [123, 124];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const { user } = await signInAnonymously(getAuth(app));
try { await setDoc(doc(db, 'teachers', user.uid), { code: passcode }); }
catch (err) { console.error('That is not the teacher passcode (this needs the teacher one, to delete entries).'); process.exit(1); }

const entries = (await getDocs(collection(db, 'entries'))).docs.map(d => d.data());
const byId = new Map(entries.map(e => [e.id, e]));
const meta = (await getDoc(doc(db, 'meta', 'archive'))).data();

// Stop if the data no longer looks the way it did when this was written.
const problems = [];
if (!byId.has(FROM)) problems.push(`entry ${FROM} is missing`);
if (byId.has(TO)) problems.push(`entry ${TO} already exists`);
if (byId.get(FROM) && byId.get(FROM).entrant !== 'Anushka') problems.push(`entry ${FROM} is not Anushka's`);
const unexpected = entries.filter(e => e.id > 35 && e.id !== FROM && !REMOVE.includes(e.id)).map(e => e.id);
if (unexpected.length) problems.push(`unexpected entries above 35: ${unexpected.join(', ')}`);
if (problems.length) { console.error('Not changing anything: ' + problems.join('; ')); process.exit(1); }

const moved = Object.assign({}, byId.get(FROM), { id: TO });
const xrefFix = entries.filter(e => e.xrefId === FROM || REMOVE.includes(e.xrefId));
const order = (meta.order || []).filter(id => id !== FROM && !REMOVE.includes(id));

console.log(`Entry ${FROM} (${moved.entrant}: "${moved.fragment.slice(0, 50)}…") becomes No. ${TO}.`);
REMOVE.forEach(id => console.log(`Entry ${id} is removed (${JSON.stringify(byId.get(id) || null).slice(0, 80)}).`));
xrefFix.forEach(e => console.log(`Entry ${e.id}'s cross-reference is updated.`));
console.log(`Numbering continues at ${TO + 1} (was ${meta.nextId}).`);
console.log(`Header set to: ${JSON.stringify(HEADER)}`);

if (!apply) { console.log('\nNothing changed yet. Run again with --apply to make these changes.'); process.exit(0); }

const batch = writeBatch(db);
batch.set(doc(db, 'entries', String(TO)), moved);
batch.delete(doc(db, 'entries', String(FROM)));
REMOVE.forEach(id => batch.delete(doc(db, 'entries', String(id))));
xrefFix.forEach(e => batch.update(doc(db, 'entries', String(e.id)), { xrefId: e.xrefId === FROM ? TO : null }));
batch.set(doc(db, 'meta', 'archive'), Object.assign({ nextId: TO + 1, order }, HEADER), { merge: true });
await batch.commit();
console.log('\nDone.');
process.exit(0);

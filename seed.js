// One-time: load the entries from writing-machines-archive-2.json into Firestore.
// Usage: npm install, then: node seed.js <class passcode>
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

const passcode = process.argv[2];
if (!passcode) { console.error('Usage: node seed.js <class passcode>'); process.exit(1); }

const archive = JSON.parse(readFileSync(new URL('./writing-machines-archive-2.json', import.meta.url), 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const metaRef = doc(db, 'meta', 'archive');

if ((await getDoc(metaRef)).exists()) {
  console.error('The archive already has data — not seeding, to avoid overwriting class entries.');
  process.exit(1);
}

const { user } = await signInAnonymously(getAuth(app));
await setDoc(doc(db, 'unlocked', user.uid), { code: passcode });

const batch = writeBatch(db);
archive.entries.forEach(e => batch.set(doc(db, 'entries', String(e.id)), e));
batch.set(metaRef, { subtitle: archive.subtitle, by: archive.by, intro: archive.intro, nextId: archive.nextId });
await batch.commit();

console.log(`Seeded ${archive.entries.length} entries.`);
process.exit(0);

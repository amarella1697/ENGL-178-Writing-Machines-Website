// One-time fix (2026-10-12): rename entries whose constellation is a near-match of an
// official one (e.g. "Baffling Complexity", "Moving Goal Post") to the official name.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';
import { officialName } from './constellation-names.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const { user } = await signInAnonymously(getAuth(app));
await setDoc(doc(db, 'teachers', user.uid), { code: process.env.ARCHIVE_PASSCODE });
const batch = writeBatch(db);
let n = 0;
(await getDocs(collection(db, 'entries'))).docs.forEach(d => {
  const e = d.data(), name = officialName(e.category);
  if (e.category && name !== e.category) {
    batch.update(d.ref, { category: name });
    console.log(`Entry ${e.id}: "${e.category}" -> "${name}"`);
    n++;
  }
});
await batch.commit();
console.log(`Renamed ${n} entries.`);
process.exit(0);

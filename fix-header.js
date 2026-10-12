// One-time fix (2026-10-12): put the "by" line back after a student overwrote it.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const { user } = await signInAnonymously(getAuth(app));
await setDoc(doc(db, 'teachers', user.uid), { code: process.env.ARCHIVE_PASSCODE });
await setDoc(doc(db, 'meta', 'archive'), { by: 'Dr. Edoro and English 178 Class' }, { merge: true });
console.log('Restored the "by" line.');
process.exit(0);

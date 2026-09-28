# Writing Machines — Archive

A shared archive for ENGL 178. The page is hosted on GitHub Pages, and entries are stored
in Firebase Firestore, so everyone sees the same archive and changes appear live. No more
exporting and importing JSON.

- **Reading** is open to anyone with the link.
- **Adding, editing, or deleting** asks for the class passcode, again after every page reload.
- **Export Archive (.json)** still downloads a backup snapshot.

## One-time setup

### 1. Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** (Google Analytics not needed).
2. On the project overview, click the **Web** (`</>`) icon to register a web app. Copy the
   `firebaseConfig` values into [firebase-config.js](firebase-config.js).
3. **Security → Authentication → Get started → Sign-in method → Anonymous → Enable.**
4. **Databases & Storage → Firestore → Create database** (production mode, any nearby region).
5. **Firestore → Rules:** replace everything with the contents of
   [firestore.rules](firestore.rules), then **Publish**.
6. **Set the class passcode:** Firestore → **Data** → **Start collection** → Collection ID
   `passcodes` → Document ID = the passcode (e.g. `machines-178`) → add any field
   (e.g. `note` = `class passcode`) → Save.

### 2. Load the existing entries (once)
```
npm install
node seed.js <the passcode>
```
This copies the 10 entries from `writing-machines-archive-2.json` into Firestore. It refuses
to run if the archive already has data.

### 3. GitHub Pages
1. Create an empty repo on github.com (public; Pages on a private repo needs a paid plan).
2. Push this folder:
   ```
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. Repo **Settings → Pages → Build and deployment:** Source = *Deploy from a branch*,
   Branch = `main`, folder = `/ (root)`. The site appears at `https://<you>.github.io/<repo>/`.
4. Back in Firebase: **Security → Authentication → Settings → Authorized domains → Add domain**
   `<you>.github.io`.

## Managing the passcode
- **Change it:** in Firestore → `passcodes`, delete the old document and add a new one.
  Everyone needs the new passcode from their next page load.
- **Cut off pages that are already open and unlocked:** also delete the `unlocked` collection.

## Nightly backups
Every night at 08:00 UTC, [a GitHub Action](.github/workflows/backup.yml) runs
[backup.js](backup.js) and commits a snapshot of the archive to `backups/YYYY-MM-DD.json`
(same format as the Export button). To recover a deleted entry, open an older backup file in
the `backups` folder and copy the entry back in through the page. To take a backup right away,
go to the repo's **Actions** tab → **Nightly backup** → **Run workflow**.

## Local testing
The page uses ES modules, so open it through a local server instead of double-clicking it:
```
npx serve .
```

## Note on the API key
The `apiKey` in `firebase-config.js` is a public identifier, not a secret; Firebase's own docs
say it's safe to commit. Access is enforced by `firestore.rules`.

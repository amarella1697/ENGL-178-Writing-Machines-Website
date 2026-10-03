# Writing Machines — Archive

A shared archive for ENGL 178. Everyone sees the same entries, and changes appear live —
no exporting or importing JSON.

**Live site:** <https://amarella1697.github.io/ENGL-178-Writing-Machines-Website/>

## For students
- Open the link to read the archive. Search, the contributor menu, and the constellation filters
  work for everyone. Click a name on any card to see everything that person entered.
- **+ New Entry** and **Edit** ask for the class passcode (get it from your instructor). It is
  asked again whenever the page is refreshed. Only the teacher can delete entries.
- Entries can include an **image** and a **video**. Paste a link to an image file or a Google
  Drive image, and a YouTube, Google Drive, or direct .mp4 / .mp3 link for video or audio. Drive files must
  be shared as *Anyone with the link*. Images show whole; click one to see it full size.
- Your changes are saved immediately and show up for everyone else without a refresh.
- **Export Archive (.json)** downloads a copy of the whole archive.

## For the teacher

### Quick links
| What | Where |
| --- | --- |
| Live site | <https://amarella1697.github.io/ENGL-178-Writing-Machines-Website/> |
| GitHub repo | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website> |
| Nightly backups (last 14 days) | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/tree/main/backups> |
| Run a backup now | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/actions/workflows/backup.yml> → **Run workflow** |
| Restore from a backup | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/actions/workflows/restore.yml> → **Run workflow** |
| Edit the page (text, layout, colors) | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/edit/main/index.html> |
| GitHub collaborators | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/settings/access> |
| GitHub secret for restores (`ARCHIVE_PASSCODE`, best set to the teacher passcode) | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/settings/secrets/actions> |
| Teacher passcode | Firestore → **Data** → `teacherPasscodes` collection |
| GitHub Pages settings | <https://github.com/amarella1697/ENGL-178-Writing-Machines-Website/settings/pages> |
| Firebase project | <https://console.firebase.google.com/project/writing-machines-website/overview> |
| Firestore data & rules (entries, passcode) | <https://console.firebase.google.com/project/writing-machines-website/firestore> — **Data** and **Rules** tabs |
| Firebase sign-in settings | <https://console.firebase.google.com/project/writing-machines-website/authentication/providers> |
| Firebase members | <https://console.firebase.google.com/project/writing-machines-website/settings/iam> |

### Getting access (one time)
- **GitHub:** the repo owner adds you under *GitHub collaborators* above. Accept the invite
  from your email. This lets you run backups/restores and edit the page. (A repo owned by a
  personal account has only one admin, its owner. To give someone else admin rights, the repo
  has to be transferred to them or moved into a GitHub organization.)
- **Firebase:** the project owner adds your Google account under *Firebase members* above
  (role *Editor* or *Owner*). This lets you change the passcode and view the raw data.

### Common tasks

**Sign in as the teacher**
Click **Teacher sign-in** at the bottom of the live site and enter the teacher passcode. It is
asked again whenever the page is refreshed. Signed in, you can arrange and delete entries, as
well as everything students can do.

**Change the order of entries**
1. Sign in as the teacher (above).
2. Click **Arrange Entries**. Drag cards to new spots, or use **First**, **Earlier**, and **Later**
   on each card.
3. Click **Save Order**. Everyone sees the new order right away; **Cancel** throws your changes away.

New entries show up at the top, newest first, until you arrange them. Only the teacher passcode
can change the order. The class passcode can't.

To undo a bad arrangement, run *Restore from a backup* with a date from before it and type
`order` in **entries**.

**Delete an entry**
Sign in as the teacher; a **Delete** button then appears on every card. Deleted entries can be
brought back from a backup (below).

**Change the teacher passcode**
Same steps as the class passcode below, but in the `teacherPasscodes` collection. The teacher
passcode also works anywhere the class passcode is asked for. If the `ARCHIVE_PASSCODE` GitHub
secret holds the teacher passcode, update it too. To sign out browsers that are already signed
in as the teacher, also delete the `teachers` collection.

**Change the class passcode**
1. Firestore → **Data** tab → `passcodes` collection → delete the old document.
2. **Add document** → Document ID = the new passcode (type it; don't use Auto-ID) → add a
   field `note` = `class passcode` → Save. Students need the new code from their next refresh.
3. If the GitHub secret `ARCHIVE_PASSCODE` (link above) holds the class passcode, update it
   to the new one so restores keep working.

To lock out pages that are already open and unlocked, also delete the `unlocked` collection.

**Bring back deleted entries**
1. Open *Restore from a backup* (link above) → **Run workflow**.
2. **date:** pick a date from the backups folder from *before* the deletion, e.g. `2026-09-28`.
3. Leave **entries** blank → **Run workflow**.

Every entry that is in that backup but missing from the archive comes back under its original
number. Entries that still exist are not touched. Click the finished run to see what was restored.

**Undo a bad edit**
Same as above, but type the entry number(s) in **entries**, e.g. `7` or `3,5`. Those entries are
put back exactly as they were in that backup.

**Edit the archive's subtitle, "by" line, or introduction**
Click the text at the top of the live site, type, then click elsewhere. It asks for the passcode
and saves for everyone.

**Change the page itself**
Edit `index.html` on GitHub (link above) and click **Commit changes**. The live site updates in
about a minute.

**Backups older than 14 days**
Only the newest 14 stay in the `backups` folder, but every older one is still in the repo's
history: open the `backups` folder → **History**, find the day, and download that file. Restore
from it by running `restore.js` locally (see *Scripts* below) with the file's path.

## How it works
- [index.html](index.html) is the whole site, served by GitHub Pages.
- Entries live in Firebase Firestore. The page reads and writes them directly.
- [firestore.rules](firestore.rules) lets anyone read, but only lets a browser write after it
  has sent a passcode that matches a document in the `passcodes` collection. Changing the order
  of entries (the `order` field of `meta/archive`) and deleting entries need a passcode from
  `teacherPasscodes`. Each browser gets
  an invisible anonymous Firebase sign-in so the rules can tell browsers apart; students never
  see a login.
- [backup.js](backup.js) runs nightly at 08:00 UTC via
  [.github/workflows/backup.yml](.github/workflows/backup.yml) and commits
  `backups/YYYY-MM-DD.json`, keeping the newest 14.
- [restore.js](restore.js) runs via [.github/workflows/restore.yml](.github/workflows/restore.yml).

## Scripts (run locally, after `npm install`)
```
# PowerShell
$env:ARCHIVE_PASSCODE = "<passcode>"
node restore.js 2026-09-28            # bring back deleted entries
node restore.js 2026-09-28 3,5        # put entries 3 and 5 back as they were
node restore.js 2026-09-28 order      # put the order of entries back (teacher passcode)
node restore.js path\to\backup.json   # restore from a downloaded backup file
node backup.js                        # write today's backup to backups/
```
`node seed.js <passcode>` loaded the original entries from `writing-machines-archive-2.json`;
it refuses to run if the archive already has data.

To preview the site locally, run `npx serve .` (the page can't be opened by double-clicking).

## Original setup (already done)
1. Firebase project → **Web** app registered; config in [firebase-config.js](firebase-config.js).
2. **Security → Authentication → Sign-in method → Anonymous** enabled.
3. **Databases & Storage → Firestore → Create database** (production mode); rules from
   [firestore.rules](firestore.rules) published; `passcodes/<passcode>` and
   `teacherPasscodes/<teacher passcode>` documents created.
4. `npm install` then `node seed.js <passcode>`.
5. GitHub Pages: Settings → Pages → *Deploy from a branch*, `main`, `/ (root)`.
6. GitHub secret `ARCHIVE_PASSCODE` set to a passcode for restores. The teacher passcode is
   best: the class passcode works for entries but can't restore the order.

The `apiKey` in `firebase-config.js` is a public identifier, not a secret; Firebase's docs say
it's safe to commit. Access is enforced by `firestore.rules`.

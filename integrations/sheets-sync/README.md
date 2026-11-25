# Google Sheet progress sync

Two-way sync between the StudyLab pages (Complete the Script and the NOV25 board) and your readiness Google Sheet. The site is static, so the bridge is a small Apps Script web app that lives **inside your own Sheet**. Nothing is hosted anywhere else.

## Set up (about 5 minutes, once)

1. Open the readiness Sheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with [`Code.gs`](Code.gs) from this folder, then save.
3. In the function dropdown pick **setup** → **Run**. Approve the permission prompt. Because of `@OnlyCurrentDoc`, the script can only touch this one spreadsheet.
4. **Deploy → New deployment → type: Web app**. Set Execute as **Me** and Who has access **Anyone**. Click Deploy, then copy the **Web app URL** (it ends in `/exec`).
5. Reload the Sheet. A **StudyLab sync** menu appears; choose **Show sync token** and copy it.
6. On the StudyLab site, open **Save progress to Google Sheet** at the bottom of Complete the Script or the NOV25 board. Paste the URL and token, then click **Connect and sync**.

Repeat step 6 on each browser or device; progress merges. After you edit `Code.gs`, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

## What it writes

| Tab | Contents | Who edits |
|---|---|---|
| `Lab_Runs` | One row per finished run: time, game, item, mode, language, domains, concepts, blanks, misses, clean, XP, level after, next due, what you missed, first-try score %. Practice-exam retakes logged on the NOV25 board are added here too. One `baseline` row carries XP earned before you connected | Append-only from the site |
| `Lab_Status` | One row per script or mission: level, status, runs, clean runs, misses, last played, next due | The site (newest `Last played` wins) |
| `Lab_Concepts` | Concept heat: base weight, misses, hits, heat, **Your priority** | You edit **Your priority** |
| `Lab_Dashboard` | Formulas: runs, clean rate, XP, days practised, mastered counts, per-domain table, hottest concepts, recent runs | Rebuilt by `setup` |

Existing tabs (Question Log, Weak Concepts, Progress, Dashboard…) are never touched.

## What it reads back

- **Levels and due dates** from other devices: a row whose *Last played* date is newer than the local one replaces the local level. Run and miss counts take the higher value.
- **XP, practice days, retakes**, so streaks and the NOV25 trend survive a cleared browser.
- **Your priority** in `Lab_Concepts`:

| Priority | Effect in Complete the Script |
|---|---|
| High | +3 heat: scripts that use it jump up Today's run |
| Medium | +1.5 heat |
| Normal | no change |
| Low | −1.5 heat |
| Ignore | heat floor, hidden from Weak spots |

Sync runs when a run finishes, when the page loads, when you come back to the tab (at most every 2 min), and from **Sync now**. Runs finished offline are queued in the browser and sent next time.

## Security

- The web app runs as you but only accepts requests that carry the **sync token**. The token is stored in Script Properties, never in a cell, and is compared in constant time. **StudyLab sync → Rotate sync token** invalidates the old one.
- The site stores the URL and token only in that browser's `localStorage`. The site only sends to `https://script.google.com/macros/s/…/exec` URLs.
- Text from the site is length-capped, has control characters stripped, and is prefixed with `'` if it starts with `= + - @`, so it can't become a formula.
- If the Sheet is shared by link, the `Lab_` tabs are visible to anyone who has that link, like the rest of the Sheet.
- Disconnect a browser from the panel. Turn sync off entirely with **Deploy → Manage deployments → Archive**.

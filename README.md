# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/index.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `STMDosNiRoha` project files (HTML prototypes, assets, components)


## Simple local data and CSV backup

This project intentionally uses a lightweight, no-server setup for small STM usage:

- Day-to-day records are saved in browser `localStorage`, so refreshes in the same browser profile retain data.
- On the **Cetak / Export** screen, export families, transactions, savings types, and activity logs as separate CSV files.
- CSV imports merge records by their IDs. Existing records with matching IDs are updated; other records remain.
- When restoring data, import savings types and families before transactions so transaction foreign references can be validated.
- The PostgreSQL schema in `database/schema.sql` is optional reference material only. The app does not connect to it.

### Important limitations

- Browser storage is per browser profile/device. It is not automatically shared between computers, and clearing browser data can erase the working copy. Export CSV backups regularly.
- CSV files are manual backups/imports, not a live database. Keep the four CSV exports together for a complete backup.
- A fresh install starts with empty family, transaction, and activity records. The three savings categories and four administrator examples are starter configuration; review them before using the system for real STM finances.
- This is not yet production-audited. Browser end-to-end tests have not been run. Review imported CSV files and verify totals after restoring.
- Authentication and user roles are currently prototype UI, not real access control.

### Basic backup workflow

1. Open **Cetak / Export**.
2. Download **Keluarga CSV**, **Jenis Tabungan CSV**, **Transaksi CSV**, and **Aktivitas CSV**.
3. Keep the files together in a dated folder.
4. To restore, import **Jenis Tabungan**, then **Keluarga**, then **Transaksi**, then **Aktivitas**.
5. Confirm member counts and transaction totals after import.

If this later needs a single shared database, SQLite is the simplest next step; it would require a small local backend because browser pages cannot safely write directly to a SQL database file.

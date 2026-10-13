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


## Current implementation status

The UI is still a static React/Babel prototype served from `project/index.html`. This branch adds browser-local persistence and a PostgreSQL schema, but **does not yet connect the UI to a shared server database**.

### Changes on `feat/persistent-data-family-management`

- New `database/schema.sql`: PostgreSQL tables for families, savings types, users, transactions, and activity logs, plus indexes and a derived family-balance view.
- `project/data.jsx`: loads/saves the current prototype data in browser `localStorage`.
- `project/keluarga.jsx`: the “Anggota Baru” action now opens a creation form, assigns a member number, logs the action, and persists the record.
- `project/screens-pembayaran.jsx`: transactions are persisted, receive an ID based on the current maximum ID, validate amount/date/member/type, reject inactive members, and create an activity entry.

### Important limitations before real use

- Browser `localStorage` is local to one browser profile/device. It is not a shared database, has no multi-user synchronization, and is not suitable as the source of truth for real financial records.
- `database/schema.sql` is a schema only; the app does not currently connect to PostgreSQL. A backend/API and environment-based database credentials still need to be implemented.
- Existing records in `project/data.jsx` are synthetic demo data. Do not treat them as real STM records.
- Authentication/authorization, edit/reversal workflows, server-side validation, backup/restore, and end-to-end browser testing are still required before production use.
- The interface contains date/period assumptions and other prototype controls that should be audited as the backend is connected.

### Recommended next step

Implement a small Node.js/Express API backed by PostgreSQL, then replace the `localStorage` adapter with API calls. The API should own IDs, validate transactions, enforce role permissions, and calculate balances from the transaction ledger. Configure secrets through environment variables; never commit database passwords or service-role keys.

# Automatic family sync with Google Apps Script

This adds a shared Google Sheets backend for the GitHub Pages app. Family members do **not** need to sign in to Google individually. Each phone is configured once with the deployed Apps Script URL and a shared family passphrase; subsequent changes are synchronized through the bridge.

## Security model — read before deployment

- The Apps Script web app runs as the owner, so it can read and update the configured spreadsheet.
- Anyone can reach the web-app frame, but **every data operation requires the shared passphrase**. Use a long random passphrase (at least 20 characters), not a family name, phone number, or a short numeric PIN.
- The passphrase is stored in each configured browser's local storage for convenience. Anyone with access to that browser profile can use it. Do not share the deployed URL and passphrase publicly.
- This is a lightweight family tool, not a hardened financial system. If the passphrase leaks, rotate it in Script Properties and update each device. Keep regular spreadsheet/CSV backups.
- Never put the passphrase, spreadsheet ID, or Google credentials in the GitHub repository.

## 1. Create the Apps Script project

1. Sign in to the Google account that owns the spreadsheet.
2. Open [script.google.com](https://script.google.com/) and create a **New project** named `STM Dos Ni Roha Sync`.
3. Replace the default `Code.gs` contents with [`apps-script/Code.gs`](apps-script/Code.gs) from this repository.
4. Add an HTML file named **Bridge** (the filename must be `Bridge`, without `.html`) and paste in [`apps-script/Bridge.html`](apps-script/Bridge.html).
5. Open **Project Settings** → **Script Properties** → **Add script property**. Add:
   - `SPREADSHEET_ID` = the ID between `/d/` and `/edit` in your Google Sheets URL.
   - `ACCESS_PIN` = a long random passphrase shared only with family members who should use the app.
6. In **Project Settings**, set the time zone to your preferred local zone (for example, `Asia/Jakarta`).

The spreadsheet needs these tabs: `KELUARGA`, `JENIS_IURAN`, `PEMBAYARAN`, `USERS`, and `AKTIVITAS`. They are created by the current app's OAuth integration; if needed, create the tabs manually with those exact names and header rows.

## 2. Deploy the bridge

1. Click **Deploy → New deployment**.
2. Select type **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone** (the exact wording may differ by account). This is required for family phones that do not sign in to Google. The app's server-side passphrase check still applies to every read/write operation.
5. Click **Deploy**, authorize the script to access your spreadsheet, and copy the URL ending in `/exec`.
6. If you edit the script later, use **Deploy → Manage deployments → Edit** and deploy a new version to the existing deployment.

Google may restrict anonymous web-app deployments on some account types or organization policies. If you cannot select **Anyone**, this no-Google-sign-in architecture will not work under that account without changing the hosting/access approach.

## 3. Configure the website

1. Open [STM Dos Ni Roha](https://thomshaan.github.io/stm-dos-ni-roha/) and refresh with **Ctrl+Shift+R**.
2. Open **Penyimpanan Cloud → Automatic family sync**.
3. Paste the deployed `/exec` URL and the shared passphrase.
4. Choose **Test connection**. If successful, choose **Load cloud data** on the first device that already has the correct data in the spreadsheet. On a new/empty spreadsheet, use **Upload this device** only from the device that contains the correct initial data.
5. Configure the same URL and passphrase on the other phone. Select **Load cloud data** once; afterward the site will auto-save changes made on that phone while the page is open.

**Important:** Upload replaces all five cloud tables with the current browser data. Load replaces the current browser data with the five cloud tables. Pick the initial source carefully and export a CSV backup first.

## Sync behavior and limitations

- The bridge uses an Apps Script iframe and `google.script.run` to avoid browser cross-origin API calls from GitHub Pages.
- Auto-save is debounced; keep the page open and online for changes to reach Sheets. On opening a device, load the latest cloud data before editing.
- This initial version is last-write-wins for the whole dataset, not row-level conflict resolution. Avoid simultaneous edits on two devices. For best results, finish one transaction, wait for the save confirmation, then edit on another device.
- Google Apps Script has execution and quota limits. It is intended for a small family group.
- The app still supports the existing OAuth option; the Apps Script backend is an alternative and does not need an OAuth Client ID on family phones.

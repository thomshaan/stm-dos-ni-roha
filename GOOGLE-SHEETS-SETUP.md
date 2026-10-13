# Google Sheets cloud storage setup

This guide connects the STM Dos Ni Roha GitHub Pages app to a spreadsheet in your own Google Drive. It uses Google OAuth in the browser and the restricted `drive.file` scope; there is no Apps Script endpoint, shared secret, or public unauthenticated database.

## 1. Create a Google Cloud project and OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project, for example **STM Dos Ni Roha**.
3. In **APIs & Services → Library**, enable **Google Sheets API**.
4. Open **Google Auth Platform** (or **APIs & Services → OAuth consent screen**) and configure the app:
   - App name: **STM Dos Ni Roha**
   - User support email: your Google account
   - Audience: **External** if this is a personal Gmail account
   - While the app is in **Testing**, add your own Google account under **Test users**.
   - Add the scope `https://www.googleapis.com/auth/drive.file` if the console asks you to configure scopes.
5. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
6. Choose **Web application**.
7. Under **Authorized JavaScript origins**, add exactly:
   `https://thomshaan.github.io`
   Do not include the repository path or a trailing slash.
8. Create the credential and copy the **Client ID**. It usually ends in `.apps.googleusercontent.com`.
9. Do **not** create or paste a client secret. A browser-based app must use the public OAuth client ID only.

Google's console labels can change slightly. If Google shows an OAuth verification warning, this personal app can remain in Testing with your account listed as a test user.

## 2. Connect the website

1. Open [STM Dos Ni Roha](https://thomshaan.github.io/stm-dos-ni-roha/) after the cloud-sync changes are deployed.
2. Open **Penyimpanan Cloud** in the sidebar.
3. Paste the OAuth Client ID and click **Simpan Pengaturan**.
4. Click **Hubungkan Google**, choose your Google account, and approve access.
5. Click **Buat Spreadsheet di Drive**. A spreadsheet named **STM Dos Ni Roha — Database** is created in your Google Drive with tabs for families, savings types, transactions, users, and activity.

## 3. Choose the initial data source carefully

- If the data on this browser is the correct starting copy, click **Upload data perangkat ini**. This writes the current browser data into Google Sheets. The cloud copy becomes the source of truth.
- If the spreadsheet already contains the correct records, click **Muat dari Google Sheets**. This replaces the current browser data with the cloud records.
- Do not choose upload if this browser is empty and the cloud already has your real records; it will overwrite the cloud tables.

After a successful first load/upload, changes are automatically synchronized while the page has a valid Google access token. After a page reload, click **Hubungkan Google** again; if cloud sync was initialized on this browser, it reloads the cloud data automatically. On another device/browser, enter the same OAuth Client ID, connect the same Google account, enter the Spreadsheet ID if it isn't already configured, then load the cloud data once to initialize that browser.

## Security and backup notes

- The OAuth Client ID is public and is not a password. Never add a client secret or service-account private key to GitHub Pages.
- The app requests `drive.file`, not full access to all your Drive files. It can access files created by or explicitly opened with this app.
- The Google access token is kept in memory and is not written to localStorage. You may need to reconnect after refreshing the page.
- The app's old local browser copy remains on that device. Keep exporting CSV backups from **Cetak / Export**.
- This is a single-owner convenience setup, not a security-audited accounting platform. Google account security and the browser session protect access; the app's displayed role list is not real application login enforcement.

# Google Sheets cloud sync setup — STM DOS Ni Roha

This integration uses Google OAuth in the browser and the Google Sheets API directly. The spreadsheet remains private in your Google Drive; a person who is not granted access to that spreadsheet cannot read or change it. The OAuth client ID and spreadsheet ID in the public website are identifiers, not passwords. Never commit an OAuth client secret or an access token.

## 1. Create the private spreadsheet

1. Sign in to the Google account that should own the STM data.
2. Create a Google Sheet named **STM DOS Ni Roha Database**.
3. Keep its sharing setting restricted. Do not use “Anyone with the link”.
4. Create five tabs with these exact names: `Families`, `Transactions`, `SavingsTypes`, `Users`, and `Activity`. Leave them empty; the app writes the headers and records.
5. Copy the spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`.

## 2. Configure Google Cloud OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create/select a project for this app.
2. Under **APIs & Services → Library**, enable **Google Sheets API**.
3. Configure the OAuth consent screen. Choose **External** for a normal personal Google account. Keep publishing status **Testing** and add the Google account you will use as a **test user**. This avoids making the app public; you may see a Google unverified-app warning while testing.
4. Under **APIs & Services → Credentials**, choose **Create Credentials → OAuth client ID → Web application**.
5. Add this exact **Authorized JavaScript origin**:
   `https://thomshaan.github.io`
   Do not add a path. Create the client and copy its ID ending in `.apps.googleusercontent.com`. A client secret is not needed for this browser OAuth flow.

## 3. Put the IDs into the website code

1. Open `project/cloud-sync.jsx` in the repository.
2. Replace `PASTE_YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your OAuth client ID.
3. Replace `PASTE_YOUR_GOOGLE_SPREADSHEET_ID` with the ID copied from the spreadsheet URL.
4. Commit the two configuration values. These values are identifiers, not secrets; **never put a client secret or access token in GitHub**.
5. Wait for GitHub Pages to publish the update, then open [STM DOS Ni Roha](https://thomshaan.github.io/stm-dos-ni-roha/) and hard-refresh with **Ctrl+Shift+R**.

## 4. First connection and migration

1. Click **Hubungkan Sheets** and choose the same Google account that owns the spreadsheet.
2. Grant the requested Google Sheets permission.
3. On first connection, if the sheet is empty, confirm uploading the current browser's data. If the sheet already contains records, the app asks before replacing the local browser copy with cloud data.
4. Verify family count, deposits, withdrawals, and Rekap Akhir totals. Keep CSV exports as a backup before using the app for real financial records.

## Daily use and important limits

- Connect after opening the site; access tokens are kept in memory and are not saved in browser storage. While connected, changes are saved to Sheets automatically after a short delay. Reconnect after a full page reload.
- On another device, open the website, connect the same Google account, and load the spreadsheet data.
- Keep the spreadsheet private. Access is enforced by Google; this is not an app-level user-management system. Anyone you explicitly share the sheet with may be able to access its data through their own Google authorization.
- The app keeps a local browser cache as a fallback. If it says “Tidak terhubung”, changes are local only and have not been uploaded.
- Avoid editing the same records from two devices at the same time. This simple sync writes the current full dataset and is intended for one user/device session at a time, not concurrent collaboration.
- This feature has not yet been browser end-to-end tested. Verify the connection and compare totals before relying on it for financial reporting.

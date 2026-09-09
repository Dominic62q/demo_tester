# Touch-and-go fingerprint sign-in (demo)

Small React + Firebase app for signing in with a ZKTeco fingerprint reader.
The browser page talks to a **local bridge** (`http://127.0.0.1:5050`) on the
same PC as the reader — the hosted page never sees fingerprint data, only
match results.

## Run locally

```bash
npm install
cp .env.example .env   # fill in Firebase values
npm run dev            # http://127.0.0.1:5174
```

You also need the fingerprint bridge running on the same PC
(see `../fingerprint_test/bridge`), with this page's origin in its CORS list.

## Deploy (Vercel)

Import this folder as a Vite project. Set these environment variables
in the Vercel project settings (same names as `.env.example`):

- `VITE_FB_API_KEY`, `VITE_FB_AUTH_DOMAIN`, `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`, `VITE_FB_SENDER_ID`, `VITE_FB_APP_ID`
- `VITE_BRIDGE_URL` (usually still `http://127.0.0.1:5050`)

Notes:

- Fingerprint scanning only works on the PC with the reader + bridge.
  Other visitors get the UI shell; scans fail with a friendly message.
- After Vercel gives you a URL, add it to the bridge's CORS origins
  (`bridge/appsettings.json`) on the reader PC, otherwise the browser
  will block scan requests.
- Firestore rules live in `firestore.rules` — deploy them with
  `firebase deploy --only firestore:rules`.

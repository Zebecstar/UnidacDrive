# Unidac Drive

A universal cloud workspace alpha for web, iOS, and Android, built with Expo Router and TypeScript.

## Included in this alpha

- Responsive desktop, tablet, and mobile drive interface
- Grid and list browsing
- Search, Shared, Starred, Recent, and Trash views
- Cross-platform system document picker
- Local folder creation and file starring
- File detail panel on large displays
- Static web export configured for Vercel
- Expo project structure ready for Android and iOS builds

## Run locally

```bash
npm install
npm run web
```

For native testing:

```bash
npm run android
npm run ios
```

## Deploy to Vercel

Import this GitHub repository into Vercel. The included `vercel.json` runs `npm run vercel-build` and serves the generated `dist` directory.

## Current alpha boundary

The interface currently uses in-memory demonstration data. Authentication, permanent database storage, object storage, sharing permissions, offline synchronization, and collaborative editing should be connected in the next phase.

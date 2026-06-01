# Golf Handicap League

A mobile-friendly web app for tracking society golf handicaps.

## What it does

- Keeps a live handicap standings table
- Lets you enter Stableford points
- Lets you enter gross scores by course rating and slope
- Lets you add players
- Lets you add missing courses/tees
- Saves data in the browser/device using localStorage
- Can be pinned to a phone home screen

## How to run locally

Install Node.js first: https://nodejs.org

Then run:

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal.

## How to deploy to Vercel

1. Create a GitHub repository called `golf-handicap-league`.
2. Upload these files to that repository.
3. Go to https://vercel.com and sign in with GitHub.
4. Click **Add New Project**.
5. Pick the repository.
6. Click **Deploy**.

Your app will be live at a URL like:

```text
https://golf-handicap-league.vercel.app
```

## Pin to phone

### iPhone
Open the URL in Safari → Share → Add to Home Screen.

### Android
Open the URL in Chrome → menu → Add to Home Screen.

## Important note

This first version stores data on the device/browser. For a shared live app where everyone sees the same data, add a hosted database such as Supabase.
Updated deployment trigger.

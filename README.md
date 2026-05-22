# MCMAP Logbook

A beginner-friendly React, Vite, Tailwind CSS, and Supabase-ready front end for tracking and verifying MCMAP training hours.

## What is included

- Landing page
- Login page
- Sign up page
- Belt User dashboard
- Submit MCMAP Hours page
- MAI dashboard
- Pending logs page
- Verified logbook page
- Subscription page with free Belt User accounts and MAI annual billing at $84.99/year
- Help page with FAQ and sample log entries
- Mock Belt User and MAI data
- Supabase client setup placeholder

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment example:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open the local URL Vite prints in your terminal, usually:

   ```bash
   http://localhost:5173
   ```

## Supabase notes

The app currently uses mock data only. When you are ready to connect real accounts and logs, add your Supabase URL and anon key to `.env`, then replace the mock data calls in `src/data/mockData.js` with Supabase queries.

## Billing notes

The subscription flow prepares Stripe Checkout for MAI annual billing. Belt User accounts are free. Use Stripe webhooks plus backend subscription checks before enforcing paid MAI access.

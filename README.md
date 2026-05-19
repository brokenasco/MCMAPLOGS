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
- Subscription page with 1-month free trial and $2/month mock plan
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

The subscription flow is front-end only for now. It shows a 1-month free trial and a $2/month plan, but it does not charge real cards. Use a payment provider such as Stripe plus backend subscription checks before accepting real payments.

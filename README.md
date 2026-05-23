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
- Account deletion from the profile page
- Supabase-backed account, profile, and log flows when environment variables are configured

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

Add your Supabase URL and public key to `.env` for local browser testing and to Vercel for deployed accounts:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Run `supabase/mai-subscriptions.sql` in the Supabase SQL editor before enabling MAI billing enforcement. It adds the Stripe subscription fields on `profiles`, marks existing Belt Users as free, and marks existing MAIs as unpaid until Stripe confirms a subscription.

## Billing notes

Stripe Checkout is used only for MAI annual billing. Belt User accounts are free.

The deployed billing flow needs these Vercel environment variables:

```bash
STRIPE_SECRET_KEY=...
STRIPE_MAI_ANNUAL_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Register the Stripe webhook URL as `/api/stripe-webhook` and send these events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The webhook stores Stripe customer, subscription, and status fields on the MAI profile. MAI dashboard and verification routes only open after the stored subscription status is `active`.

## Account deletion notes

The profile page includes an account deletion action. It requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel because the server function must delete the authenticated Supabase user. For paid MAI accounts, the deletion endpoint also cancels the saved Stripe subscription before removing the profile.

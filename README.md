# MCMAP Logbook

A beginner-friendly React, Vite, Tailwind CSS, and Supabase-ready front end for tracking and verifying MCMAP training hours.

## What is included

- Landing page
- Login page
- Sign up page
- Password recovery pages
- Belt User dashboard
- Submit MCMAP Hours page
- MAI dashboard
- Pending logs page
- Verified logbook page
- Subscription page with free Belt User accounts and a 3-month MAI free trial before annual billing at $84.99/year
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

Run `supabase/structured-mcmap-logs.sql` in the Supabase SQL editor before using the structured Belt User logbook. It adds the target belt, class code, technique/tie-in name, and minute tracking fields to `training_logs`.

## Billing notes

Stripe Checkout is used only for MAI annual billing. Belt User accounts are free. MAI checkout starts a 3-month free trial, then bills $84.99/year.
Belt Users can upgrade the same account to MAI from Profile > Upgrade to MAI. After Stripe confirms checkout, the webhook changes that profile to `MAI` and assigns an MAI number if one does not already exist.

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

The webhook stores Stripe customer, subscription, and status fields on the MAI profile. MAI dashboard and verification routes open when the stored subscription status is `trialing` or `active`.

## Owner MAI access

The site supports one free owner MAI account by setting that profile's `subscription_status` to `owner_free`.
Run `supabase/owner-mai-account.sql` in the Supabase SQL editor after replacing the email with the owner account email.
Owner MAI accounts can use MAI verification tools without Stripe checkout.

## Account deletion notes

The profile page includes an account deletion action. It requires `SUPABASE_SERVICE_ROLE_KEY` in Vercel because the server function must delete the authenticated Supabase user. For paid MAI accounts, the deletion endpoint also cancels the saved Stripe subscription before removing the profile.

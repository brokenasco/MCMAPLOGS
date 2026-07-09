import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(request);
    const signature = request.headers['stripe-signature'];

    if (!isValidStripeSignature(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)) {
      return response.status(400).json({ error: 'Stripe webhook signature could not be verified.' });
    }

    const event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object);
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await handleSubscriptionChanged(event.data.object);
    }

    return response.status(200).json({ received: true });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Stripe webhook failed.' });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.user_id || session.client_reference_id;

  if (!userId || !session.subscription) return;

  const subscription = await getStripeSubscription(session.subscription);
  await applyMaiSubscriptionAccess(userId, subscription, session.customer);
}

async function handleSubscriptionChanged(subscription) {
  if (subscription.metadata?.user_id && isMaiAccessSubscriptionStatus(subscription.status)) {
    await applyMaiSubscriptionAccess(subscription.metadata.user_id, subscription, subscription.customer);
    return;
  }

  const update = mapSubscriptionUpdate(subscription, subscription.customer);
  const updatedBySubscription = await updateProfileBySubscriptionId(subscription.id, update);

  if (!updatedBySubscription && subscription.metadata?.user_id) {
    await updateProfileByUserId(subscription.metadata.user_id, update);
  }
}

async function applyMaiSubscriptionAccess(userId, subscription, customerId) {
  const profile = await getProfileByUserId(userId);
  const update = {
    ...mapSubscriptionUpdate(subscription, customerId),
    account_type: 'MAI',
    mai_number: profile?.mai_number || await generateUniqueMaiNumber()
  };

  await updateProfileByUserId(userId, update);
}

function isMaiAccessSubscriptionStatus(status) {
  return ['active', 'trialing'].includes(status);
}

function mapSubscriptionUpdate(subscription, customerId) {
  return {
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    trial_start_date: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end_date: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    subscription_price_id: subscription.items?.data?.[0]?.price?.id || null,
    subscription_current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    subscription_cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
  };
}

async function getStripeSubscription(subscriptionId) {
  const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
    }
  });
  const subscription = await stripeResponse.json();

  if (!stripeResponse.ok) {
    throw new Error(subscription.error?.message || 'Unable to load Stripe subscription.');
  }

  return subscription;
}

async function updateProfileByUserId(userId, update) {
  return updateProfiles(`id=eq.${encodeURIComponent(userId)}`, update);
}

async function getProfileByUserId(userId) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  const supabaseResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,mai_number`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!supabaseResponse.ok) {
    const error = await supabaseResponse.text();
    throw new Error(error || 'Unable to load Supabase profile.');
  }

  const profiles = await supabaseResponse.json();
  return profiles[0] || null;
}

async function isMaiNumberTaken(maiNumber) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  const supabaseResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?mai_number=eq.${encodeURIComponent(maiNumber)}&select=id&limit=1`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!supabaseResponse.ok) {
    const error = await supabaseResponse.text();
    throw new Error(error || 'Unable to check MAI number availability.');
  }

  const profiles = await supabaseResponse.json();
  return profiles.length > 0;
}

async function updateProfileBySubscriptionId(subscriptionId, update) {
  return updateProfiles(`stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`, update);
}

async function updateProfiles(filter, update) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(update)
  });

  if (!supabaseResponse.ok) {
    const error = await supabaseResponse.text();
    throw new Error(error || 'Unable to update Supabase subscription status.');
  }

  const profiles = await supabaseResponse.json();
  return profiles.length > 0;
}

function isValidStripeSignature(rawBody, signatureHeader, webhookSecret) {
  if (!rawBody || !signatureHeader || !webhookSecret) return false;

  const parts = Array.isArray(signatureHeader) ? signatureHeader.join(',').split(',') : signatureHeader.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));

  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature);

  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature);
    return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
  });
}

async function readRawBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';

  const trimmedUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return '';
  }
}

async function generateUniqueMaiNumber() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const digits = attempt < 35 ? 4 : attempt < 45 ? 5 : 6;
    const maiNumber = generateMaiNumber(digits);
    if (!await isMaiNumberTaken(maiNumber)) return maiNumber;
  }

  throw new Error('Unable to assign a unique MAI number. Please try checkout again or contact support.');
}

function generateMaiNumber(digits) {
  const minimum = 10 ** (digits - 1);
  const maximum = (10 ** digits) - 1;
  return `MAI-${Math.floor(minimum + Math.random() * (maximum - minimum + 1))}`;
}

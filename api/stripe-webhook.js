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

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
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
  const profile = await getProfileByUserId(userId);
  const update = {
    ...mapSubscriptionUpdate(subscription, session.customer),
    account_type: 'MAI',
    mai_number: profile?.mai_number || generateMaiNumber()
  };

  await updateProfileByUserId(userId, update);
}

async function handleSubscriptionChanged(subscription) {
  const update = mapSubscriptionUpdate(subscription, subscription.customer);
  const updatedBySubscription = await updateProfileBySubscriptionId(subscription.id, update);

  if (!updatedBySubscription && subscription.metadata?.user_id) {
    await updateProfileByUserId(subscription.metadata.user_id, update);
  }
}

function mapSubscriptionUpdate(subscription, customerId) {
  return {
    stripe_customer_id: customerId || null,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
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

function generateMaiNumber() {
  return `MAI-${Math.floor(2000 + Math.random() * 7000)}`;
}

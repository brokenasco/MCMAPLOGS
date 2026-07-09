const priceIds = {
  MAI: process.env.STRIPE_PRICING || process.env.STRIPE_MAI_PRICE_ID || process.env.STRIPE_MAI_ANNUAL_PRICE_ID
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { role, email } = request.body || {};
    const accessToken = readBearerToken(request);

    if (role !== 'MAI') {
      return response.status(400).json({ error: 'Belt User accounts are free and do not need checkout.' });
    }

    if (!accessToken) {
      return response.status(401).json({ error: 'Log in before starting MAI checkout.' });
    }

    const priceId = priceIds[role];

    if (!process.env.STRIPE_SECRET_KEY) {
      return response.status(500).json({ error: 'Stripe secret key is not configured.' });
    }

    if (!priceId) {
      return response.status(400).json({ error: 'Stripe price ID is missing for this account type.' });
    }

    const { user: signedInUser, error: authError } = await getSupabaseUser(accessToken);

    if (!signedInUser?.id) {
      return response.status(401).json({
        error:
          authError ||
          'Supabase could not confirm your login. Sign out, sign back in, then start checkout again.'
      });
    }

    const profile = await getProfile(signedInUser.id);

    if (!['Belt User', 'MAI'].includes(profile?.account_type)) {
      return response.status(403).json({ error: 'This account cannot start MAI checkout.' });
    }

    if (hasLifetimeMaiAccess(profile)) {
      return response.status(400).json({ error: 'This account already has lifetime MAI access and does not need checkout.' });
    }

    const origin = request.headers.origin || `https://${request.headers.host}`;
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '21',
      'subscription_data[metadata][account_role]': role,
      'subscription_data[metadata][source_account_type]': profile.account_type,
      'subscription_data[metadata][user_id]': signedInUser.id,
      'metadata[account_role]': role,
      'metadata[source_account_type]': profile.account_type,
      'metadata[user_id]': signedInUser.id,
      client_reference_id: signedInUser.id,
      success_url: `${origin}/profile/subscription?checkout=success`,
      cancel_url: `${origin}/profile/subscription?checkout=cancelled`
    });

    if (profile.stripe_customer_id) {
      body.set('customer', profile.stripe_customer_id);
    } else if (email || signedInUser.email) {
      body.set('customer_email', email || signedInUser.email);
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return response.status(stripeResponse.status).json({ error: session.error?.message || 'Stripe Checkout failed.' });
    }

    return response.status(200).json({ url: session.url });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Unable to create checkout session.' });
  }
}

function readBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function getSupabaseUser(accessToken) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const publicKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const authKeys = [publicKey, process.env.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean);

  if (!supabaseUrl || !authKeys.length) {
    throw new Error('Supabase server auth settings are missing in Vercel.');
  }

  let lastError = '';

  for (const supabaseKey of authKeys) {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (userResponse.ok) {
      return { user: await userResponse.json(), error: '' };
    }

    const errorText = await userResponse.text();
    lastError = `Supabase rejected this login token (${userResponse.status}). Make sure Vercel uses the same Supabase project URL and anon key as the website, then redeploy. ${errorText}`;
  }

  return { user: null, error: lastError };
}

async function getProfile(userId) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,account_type,stripe_customer_id,lifetime_mai_access,dev_test_access`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!profileResponse.ok) {
    throw new Error('Unable to load the MAI billing profile.');
  }

  const profiles = await profileResponse.json();
  return profiles[0] || null;
}

function hasLifetimeMaiAccess(profile) {
  return Boolean(
    profile?.lifetime_mai_access ||
    profile?.dev_test_access ||
    profile?.id === '18a9842e-84f8-46a8-806c-c2276a46c6f0'
  );
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

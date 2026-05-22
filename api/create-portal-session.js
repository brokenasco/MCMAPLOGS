export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = readBearerToken(request);

    if (!process.env.STRIPE_SECRET_KEY) {
      return response.status(500).json({ error: 'Stripe secret key is not configured.' });
    }

    if (!accessToken) {
      return response.status(401).json({ error: 'Log in before opening billing settings.' });
    }

    const signedInUser = await getSupabaseUser(accessToken);
    const profile = signedInUser?.id ? await getProfile(signedInUser.id) : null;

    if (!profile?.stripe_customer_id) {
      return response.status(400).json({ error: 'No Stripe customer is saved for this account yet.' });
    }

    const origin = request.headers.origin || `https://${request.headers.host}`;
    const body = new URLSearchParams({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/subscription`
    });

    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    const portalSession = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return response.status(stripeResponse.status).json({ error: portalSession.error?.message || 'Stripe portal failed.' });
    }

    return response.status(200).json({ url: portalSession.url });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Unable to create billing portal session.' });
  }
}

function readBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function getSupabaseUser(accessToken) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase server auth settings are missing in Vercel.');
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!userResponse.ok) return null;
  return userResponse.json();
}

async function getProfile(userId) {
  const supabaseUrl = normalizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!profileResponse.ok) {
    throw new Error('Unable to load the billing profile.');
  }

  const profiles = await profileResponse.json();
  return profiles[0] || null;
}

function normalizeUrl(rawUrl) {
  return rawUrl?.trim().replace(/\/$/, '') || '';
}

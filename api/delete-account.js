export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accessToken = readBearerToken(request);

    if (!accessToken) {
      return response.status(401).json({ error: 'Log in before deleting your account.' });
    }

    const { user, error: authError } = await getSupabaseUser(accessToken);

    if (!user?.id) {
      return response.status(401).json({
        error:
          authError ||
          'Supabase could not confirm your login. Sign out, sign back in, then delete your account again.'
      });
    }

    const profile = await getProfile(user.id);

    if (profile?.stripe_subscription_id) {
      await cancelStripeSubscription(profile.stripe_subscription_id);
    }

    await anonymizeVerifiedSubmittedLogs(user.id);
    await deleteUnverifiedSubmittedLogs(user.id);
    await clearMaiVerificationReferences(user.id);
    await deleteProfile(user.id);
    await deleteAuthUser(user.id);

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Unable to delete this account.' });
  }
}

function readBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function getSupabaseUser(accessToken) {
  const supabaseUrl = getSupabaseUrl();
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
  const profileResponse = await supabaseFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,stripe_subscription_id`
  );

  if (!profileResponse.ok) {
    throw new Error('Unable to load your account before deletion.');
  }

  const profiles = await profileResponse.json();
  return profiles[0] || null;
}

async function cancelStripeSubscription(subscriptionId) {
  if (!process.env.STRIPE_SECRET_KEY) return;

  const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
    }
  });

  if (!stripeResponse.ok && stripeResponse.status !== 404) {
    const stripeError = await stripeResponse.json().catch(() => null);
    throw new Error(stripeError?.error?.message || 'Unable to cancel the Stripe subscription.');
  }
}

async function anonymizeVerifiedSubmittedLogs(userId) {
  const updateResponse = await supabaseFetch(
    `/rest/v1/training_logs?belt_user_id=eq.${encodeURIComponent(userId)}&status=eq.Verified`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        belt_user_id: null,
        marine_name: 'Former Belt User'
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error('Unable to preserve verified training logs before deleting the account.');
  }
}

async function deleteUnverifiedSubmittedLogs(userId) {
  const deleteResponse = await supabaseFetch(`/rest/v1/training_logs?belt_user_id=eq.${encodeURIComponent(userId)}&status=neq.Verified`, {
    method: 'DELETE'
  });

  if (!deleteResponse.ok) {
    throw new Error('Unable to delete unverified training logs.');
  }
}

async function clearMaiVerificationReferences(userId) {
  const updateResponse = await supabaseFetch(`/rest/v1/training_logs?verified_by=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      verified_by: null
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Unable to remove MAI verification references.');
  }
}

async function deleteProfile(userId) {
  const deleteResponse = await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });

  if (!deleteResponse.ok) {
    throw new Error('Unable to delete the account profile.');
  }
}

async function deleteAuthUser(userId) {
  const deleteResponse = await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorText = await deleteResponse.text();
    throw new Error(errorText || 'Unable to delete the login account.');
  }
}

async function supabaseFetch(path, options = {}) {
  const supabaseUrl = getSupabaseUrl();

  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role settings are missing in Vercel.');
  }

  return fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
      ...(options.headers || {})
    }
  });
}

function getSupabaseUrl() {
  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';

  if (!rawUrl) return '';

  const trimmedUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return '';
  }
}

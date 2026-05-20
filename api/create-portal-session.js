export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = request.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      return response.status(500).json({ error: 'Stripe secret key is not configured.' });
    }

    if (!customerId) {
      return response.status(400).json({ error: 'Stripe customer ID is required.' });
    }

    const origin = request.headers.origin || `https://${request.headers.host}`;
    const body = new URLSearchParams({
      customer: customerId,
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

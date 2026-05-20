const priceIds = {
  'Belt User': process.env.STRIPE_BELT_USER_PRICE_ID,
  MAI: process.env.STRIPE_MAI_PRICE_ID
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { role, email } = request.body || {};
    const priceId = priceIds[role];

    if (!process.env.STRIPE_SECRET_KEY) {
      return response.status(500).json({ error: 'Stripe secret key is not configured.' });
    }

    if (!priceId) {
      return response.status(400).json({ error: 'Stripe price ID is missing for this account type.' });
    }

    const origin = request.headers.origin || `https://${request.headers.host}`;
    const body = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '30',
      'subscription_data[metadata][account_role]': role,
      success_url: `${origin}/subscription?checkout=success`,
      cancel_url: `${origin}/subscription?checkout=cancelled`
    });

    if (email) {
      body.set('customer_email', email);
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

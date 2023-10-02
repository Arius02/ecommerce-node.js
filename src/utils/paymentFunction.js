import Stripe from 'stripe'


export const paymentFunction = async ({
  payment_method_types = ['card'],
  mode = 'payment',
  customer_email = '',
  client_reference_id = '',
  metadata = {},
  success_url,
  cancel_url,
  line_items = [],
}) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const session = await stripe.checkout.sessions.create({
    payment_method_types,
    mode,
    customer_email,
    client_reference_id,
    metadata,
    success_url,
    cancel_url,
    line_items,
  })
  return session
}

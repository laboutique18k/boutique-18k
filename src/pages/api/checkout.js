import Stripe from 'stripe';

export const prerender = false;

export async function POST({ request }) {
  // 1. Buscamos la clave EXACTAMENTE en el momento en que alguien hace clic
  const stripeKey = import.meta.env.STRIPE_SECRET_KEY;

  // 2. Si no la encuentra, evitamos que la web se rompa y lanzamos un aviso claro
  if (!stripeKey) {
    console.error("❌ ALERTA: No encuentro la clave secreta. Revisa dónde está el archivo .env");
    return new Response(JSON.stringify({ error: "Falta configuración de claves" }), { status: 500 });
  }

  // 3. Inicializamos la pasarela de forma segura
  // @ts-ignore
  const stripe = new Stripe(stripeKey);

  try {
    const data = await request.json();
    const { nombre, precio } = data;
    const origin = request.headers.get('origin') || 'http://localhost:4321';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: nombre,
            },
            unit_amount: Math.round(parseFloat(precio) * 100), 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/exito`,
      cancel_url: `${origin}/catalogo`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (error) {
    console.error("Error de Stripe:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
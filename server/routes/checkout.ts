import type { Request, Response } from "express";
import Stripe from "stripe";

const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18",
});

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { listingId, listingTitle, amount, successUrl, cancelUrl } =
      req.body || {};

    if (!listingId || !amount) {
      return res.status(400).json({
        ok: false,
        error: "listingId and amount are required",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listingTitle || `Listing #${listingId}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || "https://example.com/success",
      cancel_url: cancelUrl || "https://example.com/cancel",
    });

    res.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({
      ok: false,
      error: String(error?.message || error),
    });
  }
}

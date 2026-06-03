import express from "express";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import supabase from "./supabase.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const getUser = (req) => {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET)
  } catch {
    return null;
  }
};

const getRenewalDate = async (subscriptionId) => {
  if (!subscriptionId) return null;

  try {
    const subscription =
      typeof subscriptionId === "string"
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : subscriptionId;

    return subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
  } catch (err) {
    console.error("Failed to load subscription renewal:", err.message);
    return null;
  }
};

const serializeUser = (dbUser, planRenewalDate = null) => ({
  id: dbUser.oauth_id,
  name: dbUser.name,
  email: dbUser.email,
  avatar: dbUser.avatar,
  provider: dbUser.provider,
  plan: dbUser.plan,
  questionCount: dbUser.question_count,
  planRenewalDate,
});

const upgradeUserToPro = async ({ oauthId, customerId, subscriptionId }) => {
  const { data: updatedUser, error: planError } = await supabase
    .from("users")
    .update({ plan: "pro" })
    .eq("oauth_id", oauthId)
    .select()
    .single();

  if (planError) throw planError;

  if (customerId || subscriptionId) {
    const { error: stripeMetaError } = await supabase
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq("oauth_id", oauthId);

    if (stripeMetaError) {
      console.warn("Plan upgraded, but Stripe metadata was not saved:", stripeMetaError.message);
    }
  }

  return updatedUser;
};

// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("oauth_id", user.id)
      .single();

    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    const priceData = {
      currency: price.currency,
      recurring: price.recurring
        ? {
            interval: price.recurring.interval,
            interval_count: price.recurring.interval_count,
          }
        : { interval: "month" },
      product_data: {
        name: "Clarix Pro Plan",
        description: "Monthly Pro access for Clarix",
      },
    };

    if (price.unit_amount !== null) {
      priceData.unit_amount = price.unit_amount;
    } else if (price.unit_amount_decimal) {
      priceData.unit_amount_decimal = price.unit_amount_decimal;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: dbUser?.email || user.email,
      client_reference_id: user.id,
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      metadata: { oauthId: user.id },
      subscription_data: { metadata: { oauthId: user.id } },
      custom_text: {
        submit: {
          message: "Start your Clarix Pro Plan.",
        },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Confirm checkout after Stripe redirects the browser back to the app.
router.post("/confirm-session", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.metadata?.oauthId !== user.id) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }

    if (session.status !== "complete" || session.payment_status !== "paid") {
      return res.status(400).json({ error: "Checkout is not complete" });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    const planRenewalDate = await getRenewalDate(session.subscription);
    const updatedUser = await upgradeUserToPro({
      oauthId: user.id,
      customerId: session.customer,
      subscriptionId,
    });

    res.json({
      user: serializeUser(updatedUser, planRenewalDate),
    });
  } catch (err) {
    console.error("Confirm checkout error:", err.message);
    res.status(500).json({ error: "Failed to confirm checkout session" });
  }
});

// Stripe webhook
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const oauthId = session.metadata?.oauthId;
    if (oauthId) {
      await upgradeUserToPro({
        oauthId,
        customerId: session.customer,
        subscriptionId: session.subscription,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await supabase
      .from("users")
      .update({ plan: "free" })
      .eq("stripe_subscription_id", subscription.id);
  }

  res.json({ received: true });
});

// Get usage info
router.get("/usage", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("oauth_id", user.id)
    .single();

  if (!dbUser) return res.status(404).json({ error: "User not found" });

  res.json({
    plan: dbUser.plan,
    questionCount: dbUser.question_count,
    remaining: dbUser.plan === "pro" ? "unlimited" : Math.max(0, 30 - dbUser.question_count),
    planRenewalDate: dbUser.plan === "pro" ? await getRenewalDate(dbUser.stripe_subscription_id) : null,
  });
});

export default router;

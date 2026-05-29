import express from "express";
import passport from "./passport.js";
import jwt from "jsonwebtoken";
import supabase from "./supabase.js";
import Stripe from "stripe";

const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const issueToken = (user) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });

const saveAndIssue = async (profile, res) => {
  const today = new Date().toDateString();

  let { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("oauth_id", profile.id)
    .single();

  if (!dbUser) {
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        oauth_id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        provider: profile.provider,
        plan: "free",
        question_count: 0,
        last_reset_date: today,
      })
      .select()
      .single();
    if (error || !newUser) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
    dbUser = newUser;
  } else if (dbUser.last_reset_date !== today) {
    await supabase
      .from("users")
      .update({ question_count: 0, last_reset_date: today })
      .eq("oauth_id", profile.id);
    dbUser.question_count = 0;
  }

  const token = issueToken({
    id: profile.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: dbUser.avatar,
    provider: dbUser.provider,
    plan: dbUser.plan,
  });

  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
};

const getPlanRenewalDate = async (dbUser) => {
  if (dbUser.plan !== "pro" || !dbUser.stripe_subscription_id) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(dbUser.stripe_subscription_id);
    return subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;
  } catch (err) {
    console.error("Failed to load plan renewal date:", err.message);
    return null;
  }
};

// ── Google ──────────────────────────────────────────────
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => saveAndIssue(req.user, res)
);

// ── GitHub ──────────────────────────────────────────────
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => saveAndIssue(req.user, res)
);

// ── Me ───────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    const today = new Date().toDateString();

    let { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("oauth_id", decoded.id)
      .single();

    if (!dbUser) return res.status(404).json({ error: "User not found" });

    if (dbUser.last_reset_date !== today) {
      await supabase
        .from("users")
        .update({ question_count: 0, last_reset_date: today })
        .eq("oauth_id", decoded.id);
      dbUser.question_count = 0;
    }

    res.json({
      id: dbUser.oauth_id,
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      provider: dbUser.provider,
      plan: dbUser.plan,
      questionCount: dbUser.question_count,
      planRenewalDate: await getPlanRenewalDate(dbUser),
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

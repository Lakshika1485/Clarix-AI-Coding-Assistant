import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  oauthId: { type: String, required: true, unique: true },
  email: String,
  name: String,
  avatar: String,
  provider: String,
  plan: { type: String, default: "free" },
  questionCount: { type: Number, default: 0 },
  lastResetDate: { type: String, default: () => new Date().toDateString() },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
});

export default mongoose.model("User", userSchema);

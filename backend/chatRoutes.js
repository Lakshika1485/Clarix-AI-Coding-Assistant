import express from "express";
import jwt from "jsonwebtoken";
import supabase from "./supabase.js";

const router = express.Router();

const getUser = (req) => {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try { return jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET); }
  catch { return null; }
};

// Save a chat message
router.post("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { question, answer } = req.body;
  const { error } = await supabase.from("chats").insert({
    oauth_id: user.id,
    question,
    answer,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Get chat history for user
router.get("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabase
    .from("chats")
    .select("id, question, answer, created_at")
    .eq("oauth_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete all chat history
router.delete("/", async (req, res) => {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  await supabase.from("chats").delete().eq("oauth_id", user.id);
  res.json({ success: true });
});

export default router;

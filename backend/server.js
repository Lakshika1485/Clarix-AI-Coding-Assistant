import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import OpenAI from "openai";
import { getQuestionPrompt } from "./prompt.js";
import axios from "axios";
import passport from "./passport.js";
import authRoutes from "./authRoutes.js";
import stripeRoutes from "./stripeRoutes.js";
import jwt from "jsonwebtoken";
import chatRoutes from "./chatRoutes.js";
import supabase from "./supabase.js";

dotenv.config();

const app = express();

app.use(cors({ origin: ["http://localhost:8080", "http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean), credentials: true }));
app.use(express.json({
  limit: "10mb",
  verify: (req, res, buf) => {
    if (req.originalUrl === "/stripe/webhook") {
      req.rawBody = buf;
    }
  },
}));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(session({ secret: process.env.JWT_SECRET || "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRoutes);
app.use("/stripe", stripeRoutes);
app.use("/chats", chatRoutes);

const client = new OpenAI({
  baseURL: "https://api.sambanova.ai/v1",
  apiKey: process.env.SAMBANOVA_API_KEY,
});

// Question limit middleware
const checkLimit = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const today = new Date().toDateString();
    let { data: dbUser } = await supabase.from("users").select("*").eq("oauth_id", decoded.id).single();
    if (!dbUser) return res.status(404).json({ error: "User not found" });
    if (dbUser.last_reset_date !== today) {
      await supabase.from("users").update({ question_count: 0, last_reset_date: today }).eq("oauth_id", decoded.id);
      dbUser.question_count = 0;
    }
    if (dbUser.plan === "free" && dbUser.question_count >= 30) {
      return res.status(403).json({ error: "limit_reached", message: "Daily limit reached. Upgrade to Pro." });
    }
    await supabase.from("users").update({ question_count: dbUser.question_count + 1 }).eq("oauth_id", decoded.id);
    next();
  } catch (err) {
    console.error("checkLimit error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// AI route
app.post("/api", checkLimit, async (req, res) => {
  const { prompt } = req.body;
  const hasFile = prompt.includes("--- File:");
  const finalPrompt = getQuestionPrompt({ userQuestion: prompt, hasFile });

  try {
    const completion = await client.chat.completions.create({
      model: "Meta-Llama-3.3-70B-Instruct",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content.trim();

    let data;
    // Try JSON parse first
    try {
      const match = text.match(/```(?:json)?([\s\S]*?)```/);
      const jsonString = match ? match[1].trim() : text.trim();
      data = JSON.parse(jsonString);
    } catch {
      // If JSON fails (common with file content), wrap as plain answer
      data = {
        question: hasFile ? "File Analysis" : prompt.substring(0, 100),
        answer: text,
      };
    }

    // Save to Supabase chat history
    try {
      const decoded = jwt.verify(req.headers.authorization.split(" ")[1], process.env.JWT_SECRET);
      const shortQ = hasFile
        ? (prompt.split("--- File:")[0].trim() || "File analysis")
        : prompt.substring(0, 200);
      await supabase.from("chats").insert({
        oauth_id: decoded.id,
        question: shortQ,
        answer: data.answer || "",
      });
    } catch (e) {
      console.error("Chat save error:", e.message);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

const snippets = [];
let snippetCounter = 1;

app.post("/api/execute", async (req, res) => {
  const { script, language, versionIndex, stdin } = req.body;
  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script,
      language,
      versionIndex: versionIndex || "0",
      stdin: stdin || "",
    });
    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Failed to execute code" });
  }
});

app.post("/api/snippets", (req, res) => {
  const { code, language } = req.body;
  const id = snippetCounter++;
  snippets[id] = { code, language };
  res.json({ id });
});

app.get("/api/snippets/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const snippet = snippets[id];
  if (snippet) res.json(snippet);
  else res.status(404).json({ error: "Snippet not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

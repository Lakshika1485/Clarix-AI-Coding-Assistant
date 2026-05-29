import { useEffect, useRef, useState, useCallback } from "react";
import { AIComparisonCard } from "@/components/AIComparisonCard";
import UpgradeModal from "@/components/UpgradeModal";
import SettingsModal from "@/components/SettingsModal";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  Clipboard, RotateCcw, Trash2, Plus, MessageSquare,
  ChevronRight, Zap, Code, Menu, X, Settings, Crown, Mic, MicOff, Paperclip, FileText, XCircle
} from "lucide-react";
import logo from "/logo.png";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";

type Message = { role: "user" | "ai"; content: string; data?: any; file?: string; };
type Theme = "light" | "dark" | "system";
type ChatHistory = { id: number; question: string; answer: string; created_at: string; };

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const formatPlanDate = (date?: string | null) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
};

const getPlanDaysLeft = (date?: string | null) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Index() {
  const suggestions = [
    "Write a persuasive email to convince potential customers",
    "Tell me what is Artificial Intelligence?",
    "Explain JavaScript closures with an example",
    "What is the time complexity of binary search?",
  ];
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Voice chat setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setQuery(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => { setIsListening(false); toast.error("Microphone error. Allow mic access."); };
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) { toast.error("Voice not supported in this browser. Use Chrome."); return; }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setQuery("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let content = "";

      if (["txt", "md", "js", "ts", "py", "cpp", "java", "json", "html", "css"].includes(ext || "")) {
        content = await file.text();

      } else if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          pages.push(textContent.items.map((item: any) => item.str).join(" "));
        }
        content = pages.join("\n");

      } else if (ext === "docx") {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

      } else {
        toast.error("Unsupported file. Use TXT, PDF, DOCX, or code files.");
        setFileLoading(false);
        e.target.value = "";
        return;
      }

      if (!content.trim()) {
        toast.error("Could not extract text from file.");
        setFileLoading(false);
        e.target.value = "";
        return;
      }

      if (content.length > 8000) content = content.substring(0, 8000) + "\n...[truncated]";
      setAttachedFile({ name: file.name, content });
      toast.success(`📎 ${file.name} attached!`);
    } catch (err: any) {
      console.error("File upload error:", err);
      toast.error("Failed to read file: " + (err?.message || "Unknown error"));
    }
    setFileLoading(false);
    e.target.value = "";
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("clarix-theme") as Theme | null;
    return savedTheme || "system";
  });
  const [planCardVisible, setPlanCardVisible] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const planRenewalDate = formatPlanDate(user?.planRenewalDate);
  const planDaysLeft = getPlanDaysLeft(user?.planRenewalDate);

  // Load chat history
  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    if (sessionStorage.getItem("clarix-plan-updated") === "true") {
      sessionStorage.removeItem("clarix-plan-updated");
      toast.success("Your profile is updated to Pro Plan.");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const shouldUseDark = theme === "dark" || (theme === "system" && mediaQuery.matches);
      root.classList.toggle("dark", shouldUseDark);
      root.style.colorScheme = shouldUseDark ? "dark" : "light";
    };

    localStorage.setItem("clarix-theme", theme);
    applyTheme();

    if (theme !== "system") return;
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const handleSubmit = async (e?: React.FormEvent, override?: string) => {
    if (e) e.preventDefault();
    const text = override || query;
    if (!text.trim() && !attachedFile) return;
    const finalText = attachedFile
      ? `${text || "Analyze this file"} \n\n--- File: ${attachedFile.name} ---\n${attachedFile.content}`
      : text;
    setMessages((p) => [...p, { role: "user", content: text || `📎 ${attachedFile?.name}`, file: attachedFile?.name }]);
    setQuery("");
    setAttachedFile(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND_URL}/api`,
        { prompt: finalText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((p) => [...p, { role: "ai", content: res.data?.answer || "No response", data: res.data }]);
      // Add to history instantly like ChatGPT
      setChatHistory((prev) => [{ id: Date.now(), question: text, answer: res.data?.answer || "", created_at: new Date().toISOString() }, ...prev]);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error === "limit_reached") {
        setMessages((p) => p.slice(0, -1));
        setShowUpgrade(true);
      } else {
        toast.error("Failed to fetch response");
        setMessages((p) => [...p, { role: "ai", content: "Sorry, I encountered an error." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="flex h-[100svh] w-full overflow-hidden bg-white text-gray-900 dark:bg-[#070b16] dark:text-gray-100">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} theme={theme} onThemeChange={setTheme} />}

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/45 md:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside className={`${sidebarOpen ? "translate-x-0 md:w-64" : "-translate-x-full md:w-0"} fixed inset-y-0 left-0 z-30 w-72 max-w-[86vw] transition-all duration-300 overflow-hidden flex-shrink-0 flex flex-col bg-[#0f172a] text-white md:relative md:z-auto md:max-w-none md:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <img src={logo} className="w-6 h-6 rounded-md object-cover" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Clarix</span>
        </div>

        {/* New Chat */}
        <div className="px-3 py-3">
          <button
            onClick={() => {
              setMessages([]);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm font-medium border border-blue-500/20"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Nav */}
        <nav className="px-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium">
            <MessageSquare className="w-4 h-4 text-blue-400" /> Chat
          </button>
          <Link to="/compiler" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors">
            <Code className="w-4 h-4" /> Compiler
          </Link>
        </nav>

        {/* History — only here, not on right */}
        <div className="flex-1 overflow-y-auto px-3 mt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">History</p>
            {chatHistory.length > 0 && (
              <button
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  await axios.delete(`${BACKEND_URL}/chats`, { headers: { Authorization: `Bearer ${token}` } });
                  setChatHistory([]);
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {chatHistory.length === 0 ? (
              <p className="text-xs text-gray-600 px-3 py-2">No history yet</p>
            ) : (
              chatHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMessages([
                      { role: "user", content: item.question },
                      { role: "ai", content: item.answer, data: null },
                    ]);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5 group-hover:text-blue-400" />
                  <span className="text-xs text-gray-500 line-clamp-2 group-hover:text-gray-300">{item.question}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* User + Settings */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Settings</span>
          </button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            {user?.avatar ? (
              <img src={user.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                {user?.name?.[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.plan === "pro" ? "✨ Pro Plan" : "Free Plan"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="relative flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4 border-b border-gray-100 bg-white shrink-0 dark:border-white/10 dark:bg-[#0b1120]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-white/10">
              {sidebarOpen ? <X className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <Menu className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            </button>
            <h2 className="truncate font-semibold text-gray-800 dark:text-white">Clarix Chat</h2>
          </div>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {user?.plan === "free" && (
              <span className="hidden text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full dark:bg-white/10 dark:text-gray-300 sm:inline">
                {Math.max(0, 30 - (user.questionCount || 0))} questions left
              </span>
            )}
            {user?.plan === "pro" ? (
              <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium flex items-center gap-1 dark:bg-blue-500/10 dark:text-blue-300 sm:px-3">
                <Crown className="w-3 h-3" /> Pro Plan
                {planDaysLeft !== null && (
                  <span className="hidden text-blue-500/80 dark:text-blue-200/80 sm:inline">
                    · {planDaysLeft} days left
                  </span>
                )}
              </span>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 px-2.5 py-1.5 rounded-full transition-colors sm:px-3"
              >
                <Zap className="w-3.5 h-3.5" /> Upgrade
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors dark:hover:bg-white/10">
              <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </header>

        {/* Pro upgraded banner */}
        {user?.plan === "pro" && messages.length === 0 && (
          <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 dark:border-blue-500/20 dark:bg-blue-500/10">
            <Crown className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700 font-medium dark:text-blue-300">You're on Pro Plan — Unlimited questions every day! 🎉</p>
          </div>
        )}

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5">
                <img src={logo} className="w-12 h-12 rounded-xl object-cover" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 dark:text-white sm:text-3xl">How can I help you?</h1>
              <p className="text-gray-400 text-sm max-w-md mb-8 dark:text-gray-500">Ask me anything about coding, AI, or technology.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(undefined, q)}
                    className="text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm text-gray-600 hover:text-gray-800 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-blue-400/60 dark:hover:bg-blue-500/10 dark:hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 py-5 space-y-6 pb-32 sm:px-4 sm:py-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 shrink-0 flex items-center justify-center mt-1">
                      <img src={logo} className="w-6 h-6 rounded-md object-cover" />
                    </div>
                  )}
                  <div className={`max-w-[88%] flex flex-col gap-2 sm:max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-2">
                        {/* File card like ChatGPT */}
                        {msg.file && (
                          <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 max-w-xs dark:border-white/10 dark:bg-white/10">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 dark:bg-red-500/10">
                              <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate dark:text-gray-100">{msg.file}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">File attached</p>
                            </div>
                          </div>
                        )}
                        {/* Text bubble */}
                        {msg.content && msg.content !== `📎 ${msg.file}` && (
                          <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm w-full dark:border-white/10 dark:bg-[#0f172a]">
                        <AIComparisonCard data={msg.data || { question: "", answer: msg.content }} />
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 dark:border-white/10">
                          <button
                            onClick={() => { navigator.clipboard.writeText(msg.data?.answer || msg.content); toast.success("Copied!"); }}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors dark:text-gray-500 dark:hover:text-blue-300"
                          >
                            <Clipboard className="w-3.5 h-3.5" /> Copy
                          </button>
                          <button
                            onClick={() => handleSubmit(undefined, messages.filter(m => m.role === "user").slice(-1)[0]?.content)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors dark:text-gray-500 dark:hover:text-blue-300"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    user?.avatar
                      ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
                      : <div className="w-8 h-8 rounded-full bg-blue-500 shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1">{user?.name?.[0]}</div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 shrink-0 flex items-center justify-center">
                    <img src={logo} className="w-6 h-6 rounded-md object-cover animate-pulse" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm dark:border-white/10 dark:bg-[#0f172a]">
                    <span className="flex space-x-1.5 py-1">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <div className="border-t border-gray-100 bg-white px-3 py-3 shrink-0 dark:border-white/10 dark:bg-[#0b1120] sm:px-4 sm:py-4">
          <div className="max-w-3xl mx-auto">
            {/* Attached file preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl dark:border-blue-500/20 dark:bg-blue-500/10">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs text-blue-700 font-medium flex-1 truncate dark:text-blue-300">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="text-blue-400 hover:text-red-500 transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className={`flex flex-col gap-3 bg-gray-50 border rounded-2xl px-3 py-3 transition-all dark:bg-white/[0.04] sm:flex-row sm:items-end sm:px-4 ${
              isListening
                ? "border-red-400 ring-2 ring-red-100 dark:ring-red-500/20"
                : "border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-white/10 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-500/20"
            }`}>
              <TextareaAutosize
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "🎤 Listening... speak now" : attachedFile ? `Ask about ${attachedFile.name}...` : "Ask or search anything..."}
                minRows={1}
                maxRows={6}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed dark:text-gray-100 dark:placeholder-gray-500"
              />
              <div className="flex items-center justify-end gap-2 shrink-0">
                {/* File upload */}
                <label
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    attachedFile
                      ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300"
                      : "text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  }`}
                  title="Attach file (PDF, DOCX, TXT, code)"
                >
                  {fileLoading ? (
                    <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx,.md,.js,.ts,.py,.cpp,.java,.json,.html,.css"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? "text-red-500 bg-red-50 animate-pulse dark:bg-red-500/10"
                      : "text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:text-gray-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:text-gray-500 dark:hover:bg-red-500/10"
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={loading || (!query.trim() && !attachedFile)}
                  className="w-8 h-8 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2 dark:text-gray-500">Clarix can make mistakes. Consider checking important information.</p>
          </div>
        </div>

      {/* Floating plan card */}
        {planCardVisible && (
          <div className="pointer-events-none absolute bottom-24 right-3 z-20 w-[calc(100%-1.5rem)] max-w-80 sm:right-4 sm:w-80">
            <div className="pointer-events-auto relative rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] p-5 text-white shadow-2xl ring-1 ring-white/10">
              <button
                onClick={() => setPlanCardVisible(false)}
                className="absolute right-3 top-3 rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close plan card"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-3 flex items-center justify-between pr-8">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <img src={logo} className="w-5 h-5 rounded-md object-cover" />
                </div>
                <span className="font-bold text-blue-300">Pro Plan</span>
              </div>
              {user?.plan === "pro" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <span className="font-bold text-xl">You're Pro!</span>
                  </div>
                  <p className="text-blue-200 text-xs">Unlimited questions every day 🎉</p>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-blue-200/80">Next renewal</p>
                    <p className="text-sm font-semibold text-white">{planRenewalDate || "Active monthly plan"}</p>
                    {planDaysLeft !== null && (
                      <p className="text-xs text-blue-200">Renews after {planDaysLeft} days</p>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
                    {["Unlimited questions/day", "Priority AI responses", "Full compiler access"].map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                        <span className="text-xs text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-1">
                    <span className="text-3xl font-bold">$9.99</span>
                    <span className="text-gray-400 text-sm">/month</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-4">Get unlimited questions per day</p>
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors"
                  >
                    Get Pro Plan Now
                  </button>
                  <p className="text-center text-gray-500 text-xs mt-2">
                    {Math.max(0, 30 - (user?.questionCount || 0))} free questions left today
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Plan</h3>
        </div>
        <div className="flex-1 flex flex-col justify-end p-4">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <img src={logo} className="w-5 h-5 rounded-md object-cover" />
              </div>
              <span className="font-bold text-blue-400">Pro Plan</span>
            </div>
            {user?.plan === "pro" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xl">You're Pro!</span>
                </div>
                <p className="text-blue-200 text-xs">Unlimited questions every day 🎉</p>
                <div className="space-y-2 mt-3">
                  {["Unlimited questions/day", "Priority AI responses", "Full compiler access"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px]">✓</span>
                      </div>
                      <span className="text-xs text-gray-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1">
                  <span className="text-3xl font-bold">$9.99</span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <p className="text-gray-400 text-xs mb-4">Get unlimited questions per day</p>
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold transition-colors"
                >
                  Get Pro Plan Now
                </button>
                <p className="text-center text-gray-500 text-xs mt-2">
                  {Math.max(0, 30 - (user?.questionCount || 0))} free questions left today
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

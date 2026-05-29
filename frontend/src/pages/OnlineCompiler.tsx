 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { ArrowLeft, Play, Save, Download, Upload, Copy, CheckCircle, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.png";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const languages = [
  { value: "javascript", label: "JavaScript", jdoodleLang: "nodejs", icon: "🟨" },
  { value: "python", label: "Python", jdoodleLang: "python3", icon: "🐍" },
  { value: "cpp", label: "C++", jdoodleLang: "cpp", icon: "⚙️" },
  { value: "java", label: "Java", jdoodleLang: "java", icon: "☕" },
];

const defaultCode: Record<string, string> = {
  javascript: "// Write your code here\nconsole.log('Hello from Clarix!');",
  python: "# Write your code here\nprint('Hello from Clarix!')",
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from Clarix!" << endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Clarix!");\n    }\n}',
};

const OnlineCompiler = () => {
  const [code, setCode] = useState(defaultCode.javascript);
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [stdin, setStdin] = useState("");
  const [loading, setLoading] = useState(false);
  const [snippetId, setSnippetId] = useState<number | null>(null);
  const [loadSnippetId, setLoadSnippetId] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCode(defaultCode[language] || "");
  }, [language]);

  const executeCode = async () => {
    setLoading(true);
    setOutput("");
    try {
      const selectedLang = languages.find((l) => l.value === language);
      const response = await axios.post(`${BACKEND_URL}/api/execute`, {
        script: code,
        language: selectedLang?.jdoodleLang,
        versionIndex: "0",
        stdin: stdin || "",
      });
      setOutput(response.data.output || "Error: " + response.data.error);
    } catch {
      setOutput("Error: Failed to execute code.");
    }
    setLoading(false);
  };

  const saveCode = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/snippets`, { code, language });
      setSnippetId(response.data.id);
      toast.success(`Saved! Snippet ID: ${response.data.id}`);
    } catch {
      toast.error("Error saving code.");
    }
  };

  const loadCode = async () => {
    if (!loadSnippetId) { toast.error("Enter a snippet ID"); return; }
    try {
      const response = await axios.get(`${BACKEND_URL}/api/snippets/${loadSnippetId}`);
      setCode(response.data.code);
      setLanguage(response.data.language);
      toast.success("Code loaded!");
    } catch {
      toast.error("Snippet not found.");
    }
  };

  const downloadCode = () => {
    const ext: Record<string, string> = { javascript: "js", python: "py", cpp: "cpp", java: "java" };
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${ext[language] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedLang = languages.find((l) => l.value === language);

  return (
    <div className="h-[100svh] w-full flex flex-col bg-white dark:bg-[#0a0f1e] overflow-hidden">

      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shrink-0">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="hidden w-px h-5 bg-gray-200 dark:bg-white/10 sm:block" />
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <img src={logo} className="w-5 h-5 rounded-md object-cover" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Clarix</span>
            <span className="hidden text-gray-400 dark:text-gray-500 text-sm sm:inline">/ Compiler</span>
          </div>
        </div>

        {/* Language selector */}
        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:pb-0">
          {languages.map((l) => (
            <button
              key={l.value}
              onClick={() => setLanguage(l.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                language === l.value
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={saveCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 text-xs font-medium transition-colors sm:px-3"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button
            onClick={downloadCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 text-xs font-medium transition-colors sm:px-3"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={executeCode}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20 sm:px-4"
          >
            <Play className="w-3.5 h-3.5" />
            {loading ? "Running..." : "Run Code"}
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

        {/* Editor */}
        <div className="min-h-0 flex-[1.2] flex flex-col overflow-hidden border-b border-gray-200 dark:border-white/10 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-[#0f172a] border-b border-gray-200 dark:border-white/10 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-400 ml-2">
              {selectedLang?.icon} main.{language === "javascript" ? "js" : language === "python" ? "py" : language === "cpp" ? "cpp" : "java"}
            </span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                automaticLayout: true,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="min-h-[38%] w-full flex flex-col bg-gray-50 dark:bg-[#080d1a] overflow-hidden lg:min-h-0 lg:w-96">

          {/* Stdin Input */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Input (stdin)</span>
              {stdin && (
                <button onClick={() => setStdin("")} className="text-xs text-red-400 hover:text-red-300 ml-auto">Clear</button>
              )}
            </div>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter program input here..."
              rows={3}
              className="w-full px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-blue-400 transition-colors resize-none font-mono"
            />
          </div>

          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Output</span>
            </div>
            {output && (
              <button onClick={copyOutput} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {/* Output content */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="flex space-x-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                </div>
                <p className="text-xs text-gray-400">Executing code...</p>
              </div>
            ) : output ? (
              <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <Play className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400">Run your code to see output</p>
              </div>
            )}
          </div>

          {/* Snippet loader */}
          <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Load Snippet</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter snippet ID..."
                value={loadSnippetId}
                onChange={(e) => setLoadSnippetId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={loadCode}
                className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
            {snippetId && (
              <p className="text-xs text-blue-500 mt-2">✅ Saved as ID: <strong>{snippetId}</strong></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineCompiler;

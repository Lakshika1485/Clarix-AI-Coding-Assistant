import { Link } from "react-router-dom";
import logo from "/logo.png";
import googleIcon from "@/assets/icons/google.svg";
import githubIcon from "@/assets/icons/github.svg";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const Login = () => {
  return (
    <div className="min-h-[100svh] w-full flex bg-[#0f172a]">

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gradient-to-br from-[#0f172a] to-[#1e3a5f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <img src={logo} className="w-7 h-7 rounded-lg object-cover" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Clarix</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Your AI-Powered<br />
            <span className="text-blue-400">Coding Assistant</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Ask questions, compile code, analyze files, and get instant AI responses — all in one place.
          </p>
          <div className="flex flex-col gap-3">
            {[
              "🤖 AI Chat with Llama 3.3 70B",
              "💻 Online Compiler (70+ languages)",
              "📎 File & Document Analysis",
              "🎤 Voice Input Support",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs">© 2024 Clarix. All rights reserved.</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm space-y-7 sm:space-y-8">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
              <img src={logo} className="w-7 h-7 rounded-lg object-cover" />
            </div>
            <span className="text-white font-bold text-xl">Clarix</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to continue to Clarix</p>
          </div>

          <div className="space-y-3">
            <a
              href={`${BACKEND_URL}/auth/google`}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-white hover:bg-gray-100 transition-colors text-gray-800 text-sm font-semibold shadow-lg"
            >
              <img src={googleIcon} className="w-5 h-5" />
              Continue with Google
            </a>

            <a
              href={`${BACKEND_URL}/auth/github`}
              className="flex items-center justify-center gap-3 w-full py-3.5 rounded-xl bg-[#1a1f2e] border border-white/10 hover:bg-[#252b3b] transition-colors text-white text-sm font-semibold"
            >
              <img src={githubIcon} className="w-5 h-5 invert" />
              Continue with GitHub
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">secure OAuth 2.0</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-center text-gray-500 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign up free
            </Link>
          </p>

          <p className="text-center text-gray-600 text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

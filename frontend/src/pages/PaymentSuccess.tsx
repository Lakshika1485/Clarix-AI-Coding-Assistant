import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Crown, Zap, MessageSquare, Code, CheckCircle } from "lucide-react";
import logo from "/logo.png";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser, updateUser, user } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [statusText, setStatusText] = useState("Updating your account...");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const confirmUpgrade = async () => {
      const token = localStorage.getItem("token");

      try {
        if (sessionId) {
          const res = await axios.post(
            `${BACKEND_URL}/stripe/confirm-session`,
            { sessionId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data?.user) {
            updateUser(res.data.user);
          }
        }

        const refreshedUser = await refreshUser();
        if (refreshedUser?.plan !== "pro") {
          throw new Error("Profile still shows Free after checkout confirmation.");
        }

        sessionStorage.setItem("clarix-plan-updated", "true");
        setStatusText("Your profile is updated to Pro.");
        toast.success("Plan updated to Pro!");
      } catch (err) {
        console.error(err);
        await refreshUser();
        setStatusText("Payment succeeded. Your plan will update shortly.");
        toast.error("Payment succeeded, but the profile update is still syncing.");
      }
    };

    confirmUpgrade();

    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); navigate("/"); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, refreshUser, sessionId, updateUser]);

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center space-y-6 sm:space-y-8">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <img src={logo} className="w-12 h-12 rounded-xl object-cover" />
          </div>
        </div>

        {/* Success icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-yellow-400/20 flex items-center justify-center sm:w-24 sm:h-24">
              <Crown className="w-10 h-10 text-yellow-400 sm:w-12 sm:h-12" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">You're Pro Now! 🎉</h1>
          <p className="text-base text-blue-200 sm:text-lg">Welcome to the Pro Plan, {user?.name?.split(" ")[0] || "there"}!</p>
          <p className="text-gray-400 text-sm">{statusText}</p>
        </div>

        {/* Features */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What you unlocked</p>
          {[
            { icon: Zap, text: "Unlimited questions every day", color: "text-yellow-400" },
            { icon: MessageSquare, text: "Priority AI responses", color: "text-blue-400" },
            { icon: Code, text: "Full compiler access", color: "text-green-400" },
            { icon: Crown, text: "Pro badge on your profile", color: "text-purple-400" },
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-300">{text}</span>
              <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
            </div>
          ))}
        </div>

        {/* Redirect */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors"
          >
            Start Using Pro →
          </button>
          <p className="text-gray-500 text-xs">Redirecting automatically in {countdown}s...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

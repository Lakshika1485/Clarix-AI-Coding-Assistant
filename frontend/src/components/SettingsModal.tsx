import { useState } from "react";
import { X, Sun, Moon, Monitor, User, Shield, FileText, LogOut, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Panel = "main" | "account" | "privacy" | "policy";
type Theme = "light" | "dark" | "system";

interface Props {
  onClose: () => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
}

const formatPlanDate = (date?: string | null) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
};

const getPlanDaysLeft = (date?: string | null) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const SettingsModal = ({ onClose, theme, onThemeChange }: Props) => {
  const { user, logout } = useAuth();
  const [panel, setPanel] = useState<Panel>("main");
  const planRenewalDate = formatPlanDate(user?.planRenewalDate);
  const planDaysLeft = getPlanDaysLeft(user?.planRenewalDate);

  const handleTheme = (t: Theme) => {
    onThemeChange(t);
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else if (t === "light") root.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-3 py-4 sm:px-4">
      <div className="w-full max-w-md max-h-[calc(100svh-2rem)] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            {panel !== "main" && (
              <button onClick={() => setPanel("main")} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">
              {panel === "main" && "Settings"}
              {panel === "account" && "Account Information"}
              {panel === "privacy" && "Privacy & Security"}
              {panel === "policy" && "Privacy Policy"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* ── Main Panel ── */}
        {panel === "main" && (
          <div className="p-4 space-y-5 overflow-y-auto sm:p-6 sm:space-y-6">

            {/* Profile */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</p>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${user?.plan === "pro" ? "bg-blue-100 text-blue-600" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"}`}>
                    {user?.plan === "pro" ? "✨ Pro Plan" : "Free Plan"}
                  </span>
                  {user?.plan === "pro" && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {planRenewalDate ? `Renews ${planRenewalDate}` : "Active monthly plan"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as { value: Theme; label: string; icon: any }[]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleTheme(value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      theme === value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* More Options */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">More</p>
              <div className="space-y-1">
                <button onClick={() => setPanel("account")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left">Account Information</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => setPanel("privacy")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left">Privacy & Security</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => setPanel("policy")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 text-left">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => { logout(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-500">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Account Panel ── */}
        {panel === "account" && (
          <div className="p-4 space-y-4 overflow-y-auto sm:p-6">
            {[
              { label: "Full Name", value: user?.name },
              { label: "Email Address", value: user?.email },
              { label: "Login Provider", value: user?.provider?.charAt(0).toUpperCase() + user?.provider?.slice(1) },
              { label: "Plan", value: user?.plan === "pro" ? "Pro Plan ✨" : "Free Plan" },
              ...(user?.plan === "pro" ? [
                { label: "Renewal Date", value: planRenewalDate || "Active monthly plan" },
                { label: "Days Remaining", value: planDaysLeft !== null ? `${planDaysLeft} days` : "Monthly plan" },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value || "—"}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Privacy & Security Panel ── */}
        {panel === "privacy" && (
          <div className="p-4 space-y-4 overflow-y-auto sm:p-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Data Security</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Your data is encrypted and stored securely. We never share your personal information with third parties.</p>
            </div>
            {[
              { title: "Two-Factor Authentication", desc: "Add an extra layer of security to your account", badge: "Coming Soon" },
              { title: "Active Sessions", desc: "Manage devices where you're logged in", badge: "1 Active" },
              { title: "Data Export", desc: "Download a copy of your data", badge: "Coming Soon" },
              { title: "Delete Account", desc: "Permanently delete your account and data", badge: null, danger: true },
            ].map(({ title, desc, badge, danger }) => (
              <div key={title} className={`p-4 rounded-xl border ${danger ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5" : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${danger ? "text-red-600" : "text-gray-900 dark:text-white"}`}>{title}</p>
                  {badge && <span className="text-xs bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
                <p className={`text-xs mt-1 ${danger ? "text-red-400" : "text-gray-400"}`}>{desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Privacy Policy Panel ── */}
        {panel === "policy" && (
          <div className="p-4 space-y-4 overflow-y-auto sm:p-6">
            {[
              { title: "Information We Collect", content: "We collect information you provide when creating an account, including your name, email address, and profile picture from your OAuth provider (Google or GitHub). We also collect usage data such as questions asked and subscription status." },
              { title: "How We Use Your Information", content: "Your information is used to provide and improve our services, process payments via Stripe, enforce usage limits, and communicate important updates about your account." },
              { title: "Data Storage", content: "Your data is stored securely in Supabase with industry-standard encryption. We do not sell your personal data to third parties." },
              { title: "Third-Party Services", content: "We use Google/GitHub for authentication, Stripe for payment processing, and SambaNova for AI responses. Each service has its own privacy policy." },
              { title: "Your Rights", content: "You have the right to access, update, or delete your personal data at any time. Contact us to exercise these rights." },
              { title: "Contact", content: "For privacy-related questions, please contact us through the app." },
            ].map(({ title, content }) => (
              <div key={title}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsModal;

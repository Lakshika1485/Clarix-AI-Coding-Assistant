import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { Zap, X } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

interface Props {
  onClose: () => void;
}

const UpgradeModal = ({ onClose }: Props) => {
  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BACKEND_URL}/stripe/create-checkout-session`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.url;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-3 py-4 sm:px-4">
      <div className="w-full max-w-md max-h-[calc(100svh-2rem)] overflow-y-auto bg-white border border-gray-200 rounded-2xl p-5 space-y-5 relative shadow-xl dark:border-white/10 dark:bg-[#0f172a] sm:p-8 sm:space-y-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
            <Zap className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Daily Limit Reached</h2>
          <p className="text-gray-500 text-sm dark:text-gray-400">You've used all 30 free questions for today. Upgrade to Pro for unlimited access.</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-bold text-lg dark:text-white">Pro Plan</span>
            <span className="text-blue-500 font-bold text-xl">$9.99<span className="text-sm text-gray-400">/mo</span></span>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2">✅ Unlimited questions per day</li>
            <li className="flex items-center gap-2">✅ Priority AI responses</li>
            <li className="flex items-center gap-2">✅ Access to all features</li>
          </ul>
        </div>

        <button
          onClick={handleUpgrade}
          className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors"
        >
          Upgrade to Pro — $9.99/mo
        </button>

        <p className="text-center text-gray-600 text-xs">Cancel anytime. Secure payment via Stripe.</p>
      </div>
    </div>
  );
};

export default UpgradeModal;

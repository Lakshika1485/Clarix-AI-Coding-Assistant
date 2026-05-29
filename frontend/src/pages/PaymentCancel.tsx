import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/", { replace: true }), 1200);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100svh] bg-background flex items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <XCircle className="w-16 h-16 text-red-400" />
        <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
        <p className="text-gray-400">No worries, you can upgrade anytime. Taking you back to Clarix...</p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;

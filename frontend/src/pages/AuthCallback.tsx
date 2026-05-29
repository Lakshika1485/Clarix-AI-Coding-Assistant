import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.png";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-[100svh] bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <img src={logo} className="w-10 h-10 rounded-full object-cover animate-pulse" />
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

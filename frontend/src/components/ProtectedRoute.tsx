import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background px-4">
        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

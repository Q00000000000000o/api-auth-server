import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLoginPage from "./pages/AdminLoginPage";
import DocsPage from "./pages/DocsPage";

export type AppRoute = "docs" | "admin-login" | "admin";

export default function App() {
  const [route, setRoute] = useState<AppRoute>("docs");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {route === "docs" && (
        <DocsPage onAdminClick={() => setRoute("admin-login")} />
      )}
      {route === "admin-login" && (
        <AdminLoginPage
          onSuccess={() => setRoute("admin")}
          onBack={() => setRoute("docs")}
        />
      )}
      {route === "admin" && (
        <AdminDashboard onLogout={() => setRoute("docs")} />
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}

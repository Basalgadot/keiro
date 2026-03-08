"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, Eye, EyeOff } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type Tab = "login" | "register";

function getErrorMessage(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (msg.includes("Email not confirmed")) return "Confirma tu email antes de entrar.";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con ese email.";
  if (msg.includes("Password should be")) return "La contraseña debe tener al menos 6 caracteres.";
  return "Ocurrió un error. Intenta de nuevo.";
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  function changeTab(t: Tab) {
    setTab(t);
    setError("");
    setSuccess("");
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) { setError("Servicio no disponible. Verifica la configuración."); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(getErrorMessage(error.message));
      else { router.push("/"); router.refresh(); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(getErrorMessage(error.message));
      else setSuccess("Revisa tu email para confirmar tu cuenta y luego inicia sesión.");
    }
    setLoading(false);
  }

  async function handlePasswordReset() {
    const supabase = getSupabaseClient();
    if (!supabase || !email) { setError("Ingresa tu email primero."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) setError(getErrorMessage(error.message));
    else setSuccess("Te enviamos un link para restablecer tu contraseña.");
  }

  async function handleOAuth(provider: "google" | "facebook") {
    const supabase = getSupabaseClient();
    if (!supabase) { setError("Servicio no disponible."); return; }
    setOauthLoading(provider);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(getErrorMessage(error.message)); setOauthLoading(null); }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-keiro-500">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-grafito">Keiro</h1>
          <p className="text-sm text-gray-500">
            Guarda tus recetas y compara precios de forma segura
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => changeTab("login")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "login" ? "bg-white text-grafito shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => changeTab("register")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "register" ? "bg-white text-grafito shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Crear cuenta
          </button>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-surface disabled:opacity-60"
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirigiendo..." : "Continuar con Google"}
          </button>
          <button
            onClick={() => handleOAuth("facebook")}
            disabled={!!oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-surface disabled:opacity-60"
          >
            <FacebookIcon />
            {oauthLoading === "facebook" ? "Redirigiendo..." : "Continuar con Facebook"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">o con email</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-keiro-400 focus:ring-2 focus:ring-keiro-100"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300px-3.5 py-2.5 pl-3.5 pr-10 text-sm outline-none focus:border-keiro-400 focus:ring-2 focus:ring-keiro-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-keiro-700">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-keiro-500 py-2.5 text-sm font-semibold text-white hover:bg-keiro-700 disabled:opacity-60"
          >
            {loading ? "..." : tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
        </form>

        {tab === "login" && (
          <p className="mt-4 text-center text-xs text-gray-500">
            <button
              onClick={handlePasswordReset}
              className="text-keiro-700 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          Tus recetas se guardan de forma segura y son solo tuyas.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pill, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-green-700">
          <Pill className="h-5 w-5" />
          <span className="text-lg tracking-tight">Keiro</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm text-gray-600">
          {!isHome && (
            <Link href="/" className="hover:text-green-700 transition-colors">
              Buscar
            </Link>
          )}
          <Link href="/receta" className="font-medium hover:text-green-700 transition-colors">
            Escanear receta
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white hover:bg-green-700"
              >
                {initials}
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-2.5">
                      <p className="text-xs text-gray-400">Conectado como</p>
                      <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <User className="h-3.5 w-3.5" />
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

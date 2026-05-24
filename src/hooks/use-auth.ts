import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Carrega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    // Escuta mudanças de estado de auth (login, logout, refresh de token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Traduz as mensagens de erro mais comuns
        if (error.message.includes("Invalid login credentials")) {
          return { error: "E-mail ou senha incorretos." };
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: "Confirme seu e-mail antes de fazer login." };
        }
        if (error.message.includes("Too many requests")) {
          return { error: "Muitas tentativas. Aguarde alguns minutos." };
        }
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  }, [router]);

  return {
    ...state,
    signIn,
    signOut,
  };
}

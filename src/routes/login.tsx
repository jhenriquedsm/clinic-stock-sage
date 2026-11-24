import { createFileRoute, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { SignInPage } from "@/components/ui/sign-in-page";
import type { Testimonial } from "@/components/ui/sign-in-page";

export const Route = createFileRoute("/login")({ component: LoginPage });

const TESTIMONIALS: Testimonial[] = [];

function LoginPage() {
  const { user, loading, signIn } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <SignInPage
      theme="dark"
      heroImageSrc="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80&auto=format&fit=crop"
      testimonials={TESTIMONIALS}
      onSignIn={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "");
        const password = String(data.get("password") ?? "");
        const id = toast.loading("Entrando…");
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error, { id });
        } else {
          toast.dismiss(id);
        }
      }}
      onResetPassword={() => toast.info("Contate o administrador para redefinir a senha")}
    />
  );
}

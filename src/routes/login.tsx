import { createFileRoute, Navigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { SignInPage } from "@/components/ui/sign-in-page";
import type { Testimonial } from "@/components/ui/sign-in-page";

export const Route = createFileRoute("/login")({ component: LoginPage });

const TESTIMONIALS: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&q=80&auto=format&fit=crop&crop=faces",
    name: "Marina Costa",
    handle: "@marinadigital",
    text: "Plataforma incrível! A experiência é fluida e os recursos são exatamente o que eu precisava.",
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&q=80&auto=format&fit=crop&crop=faces",
    name: "Rafael Lima",
    handle: "@rafatech",
    text: "Mudou meu jeito de trabalhar. Design limpo, recursos fortes e um suporte excelente.",
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&q=80&auto=format&fit=crop&crop=faces",
    name: "Diego Martins",
    handle: "@diegocria",
    text: "Já testei várias plataformas, e esta se destaca. Intuitiva, confiável e útil de verdade no dia a dia.",
  },
];

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
      onGoogleSignIn={() => toast.info("Login com Google não disponível")}
      onResetPassword={() => toast.info("Contate o administrador para redefinir a senha")}
      onCreateAccount={() => toast.info("Contate o administrador para criar uma conta")}
    />
  );
}

"use client"

import * as React from "react"
import { SignInPage, type Testimonial } from "./ui/sign-in-page"

// As fotos são do Unsplash (images.unsplash.com), de uso livre: a montanha sob o céu estrelado e os retratos. Os nomes
// e os depoimentos são fictícios.
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
]

/**
 * A tela de login no tema escuro, com a foto e os depoimentos à direita. Os botões não levam a lugar nenhum: cada um
 * mostra um aviso embaixo, e o envio mostra o e-mail digitado (a senha nunca aparece).
 */
export default function SignInPageDemo() {
  const [notice, setNotice] = React.useState<{ text: string; key: number } | null>(null)

  React.useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(t)
  }, [notice])

  const show = (text: string) => setNotice({ text, key: Date.now() })

  return (
    <div className="sip-demo">
      <style dangerouslySetInnerHTML={{ __html: DEMO_CSS }} />
      <SignInPage
        theme="dark"
        heroImageSrc="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80&auto=format&fit=crop"
        testimonials={TESTIMONIALS}
        onSignIn={event => {
          event.preventDefault()
          const data = new FormData(event.currentTarget)
          show(`Entrando como ${data.get("email")}${data.get("rememberMe") ? ", e mantendo a conexão" : ""}`)
        }}
        onGoogleSignIn={() => show("Continuar com Google")}
        onResetPassword={() => show("Esqueci a senha")}
        onCreateAccount={() => show("Criar conta")}
      />
      {notice && (
        <div key={notice.key} className="sip-demo__notice" role="status">
          {notice.text}
        </div>
      )}
    </div>
  )
}

const DEMO_CSS = `
.sip-demo { position: relative; width: 100%; min-height: 100svh; overflow: hidden; background: #09090b; }
.sip-demo__notice {
  position: absolute;
  bottom: 24px;
  left: 50%;
  z-index: 1;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  border: 1px solid #27272a;
  border-radius: 12px;
  background: #18181b;
  color: #fafafa;
  font: 500 14px/20px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  translate: -50% 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .4);
  animation: sip-demo-notice .25s ease-out;
}
@keyframes sip-demo-notice { from { opacity: 0; transform: translateY(8px); } }
`

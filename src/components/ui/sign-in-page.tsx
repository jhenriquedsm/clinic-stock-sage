"use client"

import * as React from "react"

/**
 * Sign In Page — a tela de login inteira, em duas colunas: o formulário à esquerda e, à direita, uma foto com
 * depoimentos de clientes em vidro fosco por cima.
 *
 * - **Formulário**: o título, a descrição, o e-mail e a senha em campos de vidro que acendem em violeta com o foco, o
 *   olho que mostra e esconde a senha, "Manter conectado", "Esqueci a senha" e o botão de entrar. Embaixo, o "Continuar
 *   com Google" e o "Criar conta".
 * - **Foto**: com heroImageSrc, a coluna da direita mostra a foto com cantos arredondados e, embaixo, até três
 *   depoimentos (um a partir de 768 px de largura, dois a partir de 1280, três a partir de 1536).
 * - **Entrada**: cada peça aparece em sequência, subindo e saindo do desfoque; a foto entra pela direita e os
 *   depoimentos por último. Com "reduzir movimento", tudo já aparece no lugar.
 *
 * As larguras são as do próprio componente (container queries), não as da tela: dentro de um modal ou de uma coluna,
 * ele vira uma coluna só sem a foto, como num celular. O tema segue o sistema; theme="dark" ou "light" prende um deles.
 *
 * O ícone do Google é o oficial, de quatro cores; o olho é o do Lucide (licença ISC), desenhado aqui.
 *
 * Autocontido: o React é o único import. Sem Tailwind, sem bibliotecas, sem arquivo CSS.
 */

export type Testimonial = {
  avatarSrc: string
  name: string
  handle: string
  text: string
}

export type SignInPageProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  /** A foto da coluna da direita. Sem ela, o formulário fica sozinho, no centro. */
  heroImageSrc?: string
  /** Até três depoimentos por cima da foto. */
  testimonials?: Testimonial[]
  /** O envio do formulário. Os campos chegam pelo nome: email, password e rememberMe. */
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void
  onGoogleSignIn?: () => void
  onResetPassword?: () => void
  onCreateAccount?: () => void
  /** "system" segue o sistema (o padrão); "dark" e "light" prendem um tema. */
  theme?: "system" | "dark" | "light"
  className?: string
}

// O React 19 sobe uma <style> com href e precedence para o <head>, uma vez só (fora da página e do textContent dela). O
// React 18 não conhece isso: lá ela vai dentro da página, escondida e com o CSS cru, porque como filho de texto o SSR do
// 18 escaparia as aspas e quebraria os seletores.
const HOISTS_STYLES = Number(React.version.split(".")[0]) >= 19

function SignInStyles() {
  if (HOISTS_STYLES) {
    const hoist = { href: "sign-in-page", precedence: "default" } as React.StyleHTMLAttributes<HTMLStyleElement>
    return <style {...hoist}>{SIP_CSS}</style>
  }
  return <style hidden dangerouslySetInnerHTML={{ __html: SIP_CSS }} />
}

function GoogleIcon() {
  return (
    <svg className="sip-google" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {off ? (
        <>
          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

function TestimonialCard({ testimonial, delay }: { testimonial: Testimonial; delay: number }) {
  return (
    <figure className="sip-testimonial sip-in-up" style={{ "--sip-delay": delay + "ms" } as React.CSSProperties}>
      <img className="sip-testimonial__avatar" src={testimonial.avatarSrc} alt="" decoding="async" draggable={false} />
      <div className="sip-testimonial__body">
        <p className="sip-testimonial__name">{testimonial.name}</p>
        <p className="sip-testimonial__handle">{testimonial.handle}</p>
        <blockquote className="sip-testimonial__text">{testimonial.text}</blockquote>
      </div>
    </figure>
  )
}

const step = (n: number) => ({ "--sip-delay": n * 100 + "ms" }) as React.CSSProperties

export function SignInPage({
  title = <span className="sip-title__light">Docctor Lab</span>,
  description = "Entre na sua conta e continue de onde parou",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  theme = "system",
  className,
}: SignInPageProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const id = React.useId()

  return (
    <div className={"sip" + (className ? " " + className : "")} data-theme={theme}>
      <SignInStyles />
      <div className="sip__inner">
        <section className="sip__form-col">
          <div className="sip__form-wrap">
            <h1 className="sip-title sip-in" style={step(1)}>
              {title}
            </h1>
            <p className="sip-description sip-in" style={step(2)}>
              {description}
            </p>

            <form className="sip-form" onSubmit={onSignIn}>
              <div className="sip-in" style={step(3)}>
                <label className="sip-label" htmlFor={id + "-email"}>
                  E-mail
                </label>
                <div className="sip-field">
                  <input
                    id={id + "-email"}
                    className="sip-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Digite seu e-mail"
                    required
                  />
                </div>
              </div>

              <div className="sip-in" style={step(4)}>
                <label className="sip-label" htmlFor={id + "-password"}>
                  Senha
                </label>
                <div className="sip-field sip-field--password">
                  <input
                    id={id + "-password"}
                    className="sip-input"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    required
                  />
                  <button
                    type="button"
                    className="sip-eye"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Esconder a senha" : "Mostrar a senha"}
                    aria-pressed={showPassword}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
              </div>

              <div className="sip-row sip-in" style={step(5)}>
                <label className="sip-check">
                  <input type="checkbox" name="rememberMe" className="sip-check__box" />
                  <span>Manter conectado</span>
                </label>
                <a
                  href="#"
                  className="sip-link"
                  onClick={e => {
                    e.preventDefault()
                    onResetPassword?.()
                  }}
                >
                  Esqueci a senha
                </a>
              </div>

              <button type="submit" className="sip-submit sip-in" style={step(6)}>
                Entrar
              </button>
            </form>

            {onGoogleSignIn && (
              <>
                <div className="sip-divider sip-in" style={step(7)}>
                  <span className="sip-divider__line" />
                  <span className="sip-divider__text">Ou continue com</span>
                </div>

                <button type="button" className="sip-google-btn sip-in" style={step(8)} onClick={onGoogleSignIn}>
                  <GoogleIcon />
                  Continuar com Google
                </button>
              </>
            )}

            {onCreateAccount && (
              <p className="sip-signup sip-in" style={step(9)}>
                Novo por aqui?{" "}
                <a
                  href="#"
                  className="sip-link"
                  onClick={e => {
                    e.preventDefault()
                    onCreateAccount()
                  }}
                >
                  Criar conta
                </a>
              </p>
            )}
          </div>
        </section>

        {heroImageSrc && (
          <section className="sip__hero-col">
            <div className="sip-hero sip-in-right" style={{ ...step(3), backgroundImage: `url(${JSON.stringify(heroImageSrc)})` }} />
            {testimonials.length > 0 && (
              <div className="sip-testimonials">
                <TestimonialCard testimonial={testimonials[0]} delay={1000} />
                {testimonials[1] && (
                  <div className="sip-testimonials__more sip-testimonials__more--xl">
                    <TestimonialCard testimonial={testimonials[1]} delay={1200} />
                  </div>
                )}
                {testimonials[2] && (
                  <div className="sip-testimonials__more sip-testimonials__more--2xl">
                    <TestimonialCard testimonial={testimonials[2]} delay={1400} />
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

const SIP_CSS = `
/* as cores: claro por padrão, escuro com o sistema no escuro, e o data-theme do componente prende um dos dois */
.sip {
  --sip-bg: #ffffff;
  --sip-fg: #09090b;
  --sip-muted: #71717a;
  --sip-border: #e4e4e7;
  --sip-field: rgba(9, 9, 11, .05);
  --sip-hover: #f4f4f5;
  --sip-primary: #18181b;
  --sip-primary-hover: rgba(24, 24, 27, .9);
  --sip-primary-fg: #fafafa;
  --sip-accent: #8b5cf6;
  --sip-accent-text: #7c3aed;
  --sip-card: rgba(255, 255, 255, .4);
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  .sip[data-theme="system"] {
    --sip-bg: #09090b;
    --sip-fg: #fafafa;
    --sip-muted: #a1a1aa;
    --sip-border: #27272a;
    --sip-field: rgba(250, 250, 250, .05);
    --sip-hover: #27272a;
    --sip-primary: #fafafa;
    --sip-primary-hover: rgba(250, 250, 250, .9);
    --sip-primary-fg: #18181b;
    --sip-accent-text: #a78bfa;
    --sip-card: rgba(39, 39, 42, .4);
    color-scheme: dark;
  }
}
.sip[data-theme="dark"] {
  --sip-bg: #09090b;
  --sip-fg: #fafafa;
  --sip-muted: #a1a1aa;
  --sip-border: #27272a;
  --sip-field: rgba(250, 250, 250, .05);
  --sip-hover: #27272a;
  --sip-primary: #fafafa;
  --sip-primary-hover: rgba(250, 250, 250, .9);
  --sip-primary-fg: #18181b;
  --sip-accent-text: #a78bfa;
  --sip-card: rgba(39, 39, 42, .4);
  color-scheme: dark;
}

/* a página: a altura da tela, e as larguras dela mesma (container queries) decidem as colunas */
.sip {
  box-sizing: border-box;
  width: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  container-type: inline-size;
  background: var(--sip-bg);
  color: var(--sip-fg);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: normal;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.sip *, .sip *::before, .sip *::after { box-sizing: border-box; }
.sip__inner { display: flex; flex: 1 1 auto; flex-direction: column; width: 100%; }
@container (min-width: 768px) { .sip__inner { flex-direction: row; } }

/* a coluna do formulário */
.sip__form-col { display: flex; flex: 1 1 0%; align-items: center; justify-content: center; min-width: 0; padding: 32px; }
.sip__form-wrap { display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 448px; }

.sip-title { margin: 0; font-family: inherit; font-size: 36px; font-weight: 600; line-height: 1.25; letter-spacing: normal; color: var(--sip-fg); }
@container (min-width: 768px) { .sip-title { font-size: 48px; } }
.sip-title__light { font-weight: 300; letter-spacing: -.05em; color: var(--sip-fg); }
.sip-description { margin: 0; font-size: 16px; line-height: 24px; color: var(--sip-muted); }

.sip-form { display: flex; flex-direction: column; gap: 20px; margin: 0; }
.sip-label { display: block; margin: 0 0 8px; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--sip-muted); }

/* o campo de vidro: acende em violeta com o foco */
.sip-field {
  position: relative;
  border: 1px solid var(--sip-border);
  border-radius: 16px;
  background: var(--sip-field);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  transition: border-color .15s cubic-bezier(.4, 0, .2, 1), background-color .15s cubic-bezier(.4, 0, .2, 1);
}
.sip-field:focus-within { border-color: color-mix(in srgb, #a78bfa 70%, transparent); background: color-mix(in srgb, var(--sip-accent) 10%, transparent); }
.sip-input {
  display: block;
  width: 100%;
  margin: 0;
  padding: 16px;
  border: 0;
  border-radius: 16px;
  outline: none;
  background: transparent;
  color: var(--sip-fg);
  font: inherit;
  font-size: 14px;
  line-height: 20px;
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
}
.sip-input::placeholder { color: var(--sip-muted); opacity: 1; }
/* o autopreenchimento do navegador não pinta o campo de amarelo nem de azul */
.sip-input:-webkit-autofill,
.sip-input:-webkit-autofill:hover,
.sip-input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--sip-fg);
  caret-color: var(--sip-fg);
  transition: background-color 600000s 0s, color 600000s 0s;
}
.sip-field--password .sip-input { padding-right: 48px; }
.sip-input::-ms-reveal { display: none; }

.sip-eye {
  position: absolute;
  top: 0;
  right: 12px;
  bottom: 0;
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--sip-muted);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  transition: color .15s cubic-bezier(.4, 0, .2, 1);
}
.sip-eye:hover { color: var(--sip-fg); }
.sip-eye:focus-visible { outline: 2px solid var(--sip-accent); outline-offset: 2px; border-radius: 6px; }
.sip-eye svg { display: block; width: 20px; height: 20px; }

.sip-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; line-height: 20px; }
.sip-check { display: flex; align-items: center; gap: 12px; color: color-mix(in srgb, var(--sip-fg) 90%, transparent); cursor: pointer; }
/* a caixa de marcar: um quadrado arredondado que fica violeta com o visto */
.sip-check__box {
  display: grid;
  place-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin: 0;
  border: 1px solid var(--sip-border);
  border-radius: 6px;
  background: var(--sip-field);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  transition: background-color .15s, border-color .15s;
}
.sip-check__box::before {
  content: "";
  width: 10px;
  height: 10px;
  background: #fff;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  scale: 0;
  transition: scale .15s cubic-bezier(.4, 0, .2, 1);
}
.sip-check__box:checked { border-color: var(--sip-accent); background: var(--sip-accent); }
.sip-check__box:checked::before { scale: 1; }
.sip-check__box:focus-visible { outline: 2px solid var(--sip-accent); outline-offset: 2px; }

.sip-link { color: var(--sip-accent-text); text-decoration: none; text-underline-offset: 3px; transition: color .15s; }
.sip-link:hover { text-decoration: underline; }
.sip-link:focus-visible { outline: 2px solid var(--sip-accent); outline-offset: 2px; border-radius: 4px; }

.sip-submit,
.sip-google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  margin: 0;
  padding: 16px;
  border-radius: 16px;
  font: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
  transition: background-color .15s cubic-bezier(.4, 0, .2, 1);
}
.sip-submit { border: 0; background: var(--sip-primary); color: var(--sip-primary-fg); }
.sip-submit:hover { background: var(--sip-primary-hover); }
.sip-google-btn { border: 1px solid var(--sip-border); background: transparent; color: var(--sip-fg); }
.sip-google-btn:hover { background: var(--sip-hover); }
.sip-submit:focus-visible,
.sip-google-btn:focus-visible { outline: 2px solid var(--sip-accent); outline-offset: 2px; }
.sip-google { display: block; flex-shrink: 0; width: 20px; height: 20px; }

/* "Ou continue com" no meio de um fio: o fundo do texto é o da página */
.sip-divider { position: relative; display: flex; align-items: center; justify-content: center; }
.sip-divider__line { width: 100%; border-top: 1px solid var(--sip-border); }
.sip-divider__text { position: absolute; padding: 0 16px; background: var(--sip-bg); color: var(--sip-muted); font-size: 14px; line-height: 20px; }

.sip-signup { margin: 0; text-align: center; font-size: 14px; line-height: 20px; color: var(--sip-muted); }

/* a coluna da foto: só a partir de 768 px de largura */
.sip__hero-col { position: relative; display: none; flex: 1 1 0%; min-width: 0; padding: 16px; }
@container (min-width: 768px) { .sip__hero-col { display: block; } }
.sip-hero { position: absolute; inset: 16px; border-radius: 24px; background-position: center; background-size: cover; background-repeat: no-repeat; }

.sip-testimonials { position: absolute; bottom: 32px; left: 50%; display: flex; justify-content: center; gap: 16px; width: 100%; padding: 0 32px; translate: -50% 0; }
.sip-testimonials__more { display: none; }
@container (min-width: 1280px) { .sip-testimonials__more--xl { display: flex; } }
@container (min-width: 1536px) { .sip-testimonials__more--2xl { display: flex; } }

/* o depoimento: vidro fosco por cima da foto */
.sip-testimonial {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 256px;
  margin: 0;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 24px;
  background: var(--sip-card);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  font-size: 14px;
  line-height: 1.375;
}
.sip-testimonial__avatar { display: block; flex-shrink: 0; width: 40px; height: 40px; border-radius: 16px; object-fit: cover; }
.sip-testimonial__body { min-width: 0; }
.sip-testimonial__name { margin: 0; font-weight: 500; color: var(--sip-fg); }
.sip-testimonial__handle { margin: 0; color: var(--sip-muted); }
.sip-testimonial__text { margin: 4px 0 0; padding: 0; border: 0; font: inherit; color: color-mix(in srgb, var(--sip-fg) 80%, transparent); }

/* a entrada: cada peça sobe e sai do desfoque, na ordem do --sip-delay; a foto vem da direita */
.sip-in { opacity: 0; filter: blur(4px); transform: translateY(10px); animation: sip-fade-slide-in .6s ease-out var(--sip-delay, 0ms) forwards; }
.sip-in-right { opacity: 0; filter: blur(4px); transform: translateX(32px); animation: sip-slide-right-in .8s ease-out var(--sip-delay, 0ms) forwards; }
.sip-in-up { opacity: 0; filter: blur(4px); transform: translateY(20px) scale(.95); animation: sip-testimonial-in .6s ease-out var(--sip-delay, 0ms) forwards; }
@keyframes sip-fade-slide-in { to { opacity: 1; filter: none; transform: none; } }
@keyframes sip-slide-right-in { to { opacity: 1; filter: none; transform: none; } }
@keyframes sip-testimonial-in { to { opacity: 1; filter: none; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .sip-in, .sip-in-right, .sip-in-up { opacity: 1; filter: none; transform: none; animation: none; }
  .sip *, .sip *::before { transition-duration: .01ms !important; }
}
`

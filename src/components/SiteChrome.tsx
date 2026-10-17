import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-pati.jpeg.asset.json";
import { WHATSAPP_URL, TIKTOK_URL, PHONE } from "@/lib/site";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.43 9.42m8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.41 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.02" />
    </svg>
  );
}

export function TikTokIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .59.04.86.13V9.4a6.34 6.34 0 0 0-.86-.06A6.33 6.33 0 0 0 3.15 15.7a6.34 6.34 0 0 0 10.86 4.43 6.3 6.3 0 0 0 1.86-4.48V8.7a8.2 8.2 0 0 0 4.77 1.52V6.77a4.8 4.8 0 0 1-1.05-.08" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo.url} alt="Crochet by Pati' Dagan" className="h-12 w-12 rounded-full object-cover shadow-soft" />
          <span className="hidden font-display text-xl sm:block">Crochet <span className="font-script text-2xl text-primary">by Pati'</span></span>
        </Link>
        <nav className="flex items-center gap-6 text-sm tracking-wide">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>Accueil</Link>
          <Link to="/boutique" activeProps={{ className: "text-primary" }}>Boutique</Link>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="hidden sm:inline">Contact</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <img src={logo.url} alt="" className="h-20 w-20 rounded-full object-cover" loading="lazy" />
          <p className="font-script text-3xl text-primary">Fait main avec passion</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="eyebrow mb-3">Contact</p>
          <p>{PHONE}</p>
          <p>Cotonou, Bénin</p>
        </div>
        <div>
          <p className="eyebrow mb-3">Suivez-nous</p>
          <div className="flex gap-3">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full border border-cocoa p-2.5 hover:bg-cocoa hover:text-primary-foreground transition"><WhatsAppIcon className="h-5 w-5" /></a>
            <a href={TIKTOK_URL} target="_blank" rel="noreferrer" aria-label="TikTok" className="rounded-full border border-cocoa p-2.5 hover:bg-cocoa hover:text-primary-foreground transition"><TikTokIcon /></a>
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Crochet by Pati' Dagan · <Link to="/admin" className="hover:text-primary">Espace admin</Link></p>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Discuter sur WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-whatsapp p-4 text-primary-foreground shadow-soft animate-pulse-ring transition hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm transition-all duration-500 group-hover:max-w-40">Écrivez-nous</span>
    </a>
  );
}

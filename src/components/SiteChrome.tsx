import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import logoImg from "@/assets/logo.jpg";
import { WHATSAPP_URL, TIKTOK_URL, INSTAGRAM_URL, PHONE, formatPrice, type Product } from "@/lib/site";
import { useWhatsApp, type InquiryType } from "@/lib/whatsappContext";
import { productsQuery } from "@/lib/queries";
import { ArrowLeft, X, Sparkles, MessageCircle, Send, ShoppingBag } from "lucide-react";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.43 9.42m8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.41 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.02" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isHome = currentPath === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4 md:py-5">
        {/* Logo et Nom de marque agrandis */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0">
          <Link to="/" className="group flex items-center gap-3 sm:gap-4 md:gap-5 transition min-w-0">
            <div className="relative shrink-0">
              <img
                src={logoImg}
                alt="Crochet by Pati' Dagan"
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full object-cover shadow-md ring-2 sm:ring-4 ring-primary/25 transition duration-300 group-hover:scale-105 group-hover:ring-primary/50"
              />
              <span
                className="absolute bottom-0 right-0 h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-background bg-whatsapp shadow-xs"
                title="Atelier ouvert · En ligne sur WhatsApp"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex flex-wrap items-baseline gap-1 sm:gap-2 leading-none">
                <span className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                  Crochet
                </span>
                <span className="font-script text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-primary font-normal">
                  by Pati'
                </span>
                <span className="font-display text-[11px] sm:text-sm md:text-base font-bold tracking-[0.2em] text-foreground/80 uppercase">
                  DAGAN
                </span>
              </div>
              <p className="text-[9px] sm:text-xs md:text-sm font-medium tracking-[0.18em] sm:tracking-[0.25em] text-muted-foreground uppercase mt-1 sm:mt-1.5 truncate">
                Fait main avec passion
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Responsive (Mobile, Tablette, Desktop) */}
        <nav className="flex items-center gap-2 sm:gap-4 md:gap-8 text-sm tracking-wide shrink-0">
          {!isHome && (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/80 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-foreground transition-all hover:border-cocoa hover:bg-cocoa hover:text-primary-foreground group shadow-xs"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-primary group-hover:text-primary-foreground" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
          )}

          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-primary font-semibold" }}
            className="hover:text-primary transition-colors hidden sm:inline font-medium"
          >
            Accueil
          </Link>

          <Link
            to="/boutique"
            activeProps={{ className: "text-primary font-semibold" }}
            className="hover:text-primary transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-secondary/50"
          >
            Boutique
          </Link>
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
          <img
            src={logoImg}
            alt="Crochet by Pati' Dagan"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20 shadow-soft"
            loading="lazy"
          />
          <div>
            <p className="font-display text-xl">Crochet by Pati' Dagan</p>
            <p className="font-script text-2xl text-primary">Fait main avec passion</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="eyebrow mb-3">Atelier & Commandes</p>
          <p className="font-medium text-foreground">{PHONE}</p>
          <p className="font-medium text-foreground">Calavi, Bénin</p>
          <p className="mt-1 text-xs">Créations artisanales faites main sur mesure & prêtes à porter</p>
        </div>
        <div>
          <p className="eyebrow mb-3">Suivez-nous</p>
          <div className="flex gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="rounded-full border border-cocoa p-2.5 transition hover:bg-cocoa hover:text-primary-foreground"
              title="WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-cocoa p-2.5 transition hover:bg-cocoa hover:text-primary-foreground"
              title="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="rounded-full border border-cocoa p-2.5 transition hover:bg-cocoa hover:text-primary-foreground"
              title="TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Crochet by Pati' Dagan · Tout droit réservé ·{" "}
        <Link to="/admin" className="hover:text-primary">
          Espace admin
        </Link>
      </p>
    </footer>
  );
}

export function WhatsAppFloat() {
  const {
    isOpen,
    toggleForm,
    closeForm,
    selectedProduct,
    setSelectedProduct,
    customerName,
    setCustomerName,
    customerNote,
    setCustomerNote,
    inquiryType,
    setInquiryType,
    generatedMessage,
    whatsappUrl,
  } = useWhatsApp();

  const { data: rawProducts } = useQuery(productsQuery);
  const products: Product[] = (rawProducts ?? []) as Product[];

  return (
    <>
      {/* Floating interactive conversation card */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-auto sm:right-6 z-50 w-auto sm:w-96 max-w-sm sm:max-w-md mx-auto sm:mx-0 overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-md animate-fade-up">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-border/80 bg-cocoa px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={logoImg}
                  alt="Pati' Dagan"
                  className="h-10 w-10 rounded-full border border-white/30 object-cover"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-cocoa bg-whatsapp" />
              </div>
              <div>
                <p className="font-display text-base font-semibold leading-tight">Pati' Dagan</p>
                <p className="text-[11px] text-white/80">En ligne sur WhatsApp</p>
              </div>
            </div>
            <button
              onClick={closeForm}
              className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="max-h-[70vh] overflow-y-auto p-4 space-y-3.5 text-xs text-foreground">
            {/* Selected Product Banner */}
            <div className="rounded-xl border border-primary/20 bg-secondary/50 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-primary">
                  {selectedProduct ? "Création sélectionnée" : "Objet de la discussion"}
                </span>
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-[10px] text-muted-foreground hover:text-primary underline"
                  >
                    Changer
                  </button>
                )}
              </div>

              {selectedProduct ? (
                <div className="flex items-center gap-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-script text-lg text-primary">
                        Pati'
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-medium">{selectedProduct.name}</p>
                    <p className="text-xs font-semibold text-primary">{formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
              ) : (
                <select
                  className="field py-1.5 text-xs"
                  value=""
                  onChange={(e) => {
                    const found = products.find((p) => p.id === e.target.value);
                    setSelectedProduct(found ?? null);
                  }}
                >
                  <option value="">✨ Création personnalisée / Commande sur-mesure</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="mb-1 block font-medium">Votre nom ou prénom</label>
              <input
                type="text"
                className="field text-xs"
                placeholder="Ex : Sarah, Aminata..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Inquiry Intent Chips */}
            <div>
              <label className="mb-1.5 block font-medium">Votre souhait</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["commander", "Commander"],
                    ["personnaliser", "Personnaliser"],
                    ["question", "Renseignement"],
                  ] as [InquiryType, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInquiryType(val)}
                    className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-medium transition ${
                      inquiryType === val
                        ? "border-cocoa bg-cocoa text-primary-foreground shadow-sm"
                        : "border-border bg-card hover:bg-secondary/70 text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note / Details */}
            <div>
              <label className="mb-1 block font-medium">
                Précisions & préférences (couleur, taille, livraison)
              </label>
              <textarea
                rows={2}
                className="field text-xs resize-none"
                placeholder="Ex : Je souhaite cette pièce en couleur beige clair, livraison Calavi..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
              />
            </div>

            {/* Live Message Preview */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-2.5">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                Aperçu du message WhatsApp
              </p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed italic text-foreground/80 line-clamp-4">
                "{generatedMessage}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp py-3 px-4 text-xs font-semibold text-white shadow-md transition hover:brightness-105 active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>Envoyer sur WhatsApp</span>
              </a>

              <div className="text-center">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-primary underline transition"
                >
                  Ou discuter directement sans préremplissage
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp trigger button */}
      <button
        onClick={toggleForm}
        aria-label="Discuter sur WhatsApp"
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-whatsapp p-3.5 text-white shadow-soft animate-pulse-ring transition duration-300 hover:scale-105"
      >
        <WhatsAppIcon className="h-6 w-6" />
        {selectedProduct && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cocoa text-[9px] font-bold text-white ring-2 ring-card">
            1
          </span>
        )}
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium transition-all duration-300 group-hover:max-w-36">
          {selectedProduct ? `Commander « ${selectedProduct.name} »` : "Discuter avec Pati'"}
        </span>
      </button>
    </>
  );
}

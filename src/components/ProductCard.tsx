import { WHATSAPP_URL, formatPrice, type Product } from "@/lib/site";
import { WhatsAppIcon } from "./SiteChrome";

export function ProductCard({ p }: { p: Product }) {
  return (
    <article className="group animate-fade-up">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center font-script text-3xl text-primary">Pati'</div>
        )}
        {!p.available && <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs">Sur commande</span>}
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-2 rounded-full bg-card/95 py-2.5 text-sm opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Commander
        </a>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">{p.name}</h3>
          {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
        </div>
        <p className="whitespace-nowrap text-sm text-primary">{formatPrice(p.price)}</p>
      </div>
    </article>
  );
}

export const WHATSAPP_PHONE = "2290193552294";
export const WHATSAPP_URL = "https://wa.me/2290193552294";
export const TIKTOK_URL = "https://www.tiktok.com/@patriciadagan7";
export const INSTAGRAM_URL = "https://www.instagram.com/crochetbypatidagan?mdxt=YjQ2djZhZXRqNXc%3D&utm_source=qr";
export const PHONE = "+229 01 93 55 22 94";

export const formatPrice = (p: number | null) =>
  p == null ? "Sur devis" : `${new Intl.NumberFormat("fr-FR").format(p)} FCFA`;

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
};

export type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  featured: boolean;
  available: boolean;
};

export function buildWhatsAppProductUrl(product: Product, note?: string) {
  const priceStr = formatPrice(product.price);
  let text = `Bonjour Pati', je souhaite commander votre création « ${product.name} » (${priceStr}).`;
  if (note && note.trim()) {
    text += `\n\nPrécisions / personnalisation : ${note.trim()}`;
  } else {
    text += `\n\nEst-elle disponible ? Pouvons-nous échanger sur les détails et modalités de commande ?`;
  }
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppInquiryUrl(params: {
  productName?: string;
  productPrice?: string;
  customerName?: string;
  inquiryType?: string;
  note?: string;
}) {
  const lines: string[] = ["Bonjour Pati' !"];
  if (params.customerName && params.customerName.trim()) {
    lines.push(`Je m'appelle ${params.customerName.trim()}.`);
  }
  if (params.productName && params.productName.trim()) {
    const priceText = params.productPrice ? ` (${params.productPrice})` : "";
    lines.push(`Création concernée : « ${params.productName.trim()} »${priceText}.`);
  } else {
    lines.push("Je vous contacte pour une commande personnalisée sur-mesure.");
  }
  if (params.inquiryType && params.inquiryType.trim()) {
    lines.push(`Souhait : ${params.inquiryType.trim()}`);
  }
  if (params.note && params.note.trim()) {
    lines.push(`Détails / préférences (taille, coloris, mensurations) : ${params.note.trim()}`);
  } else {
    lines.push("Pouvons-nous échanger sur la confection et la disponibilité ?");
  }
  lines.push("Merci et à très vite !");
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}


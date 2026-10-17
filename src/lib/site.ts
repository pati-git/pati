export const WHATSAPP_URL = "https://wa.me/message/OG5F527ZODDDG1";
export const TIKTOK_URL = "https://www.tiktok.com/@patriciadagan7";
export const PHONE = "+229 01 93 55 22 94";

export const formatPrice = (p: number | null) =>
  p == null ? "Sur devis" : `${new Intl.NumberFormat("fr-FR").format(p)} FCFA`;

export type Category = { id: string; name: string; slug: string; description: string | null; position: number };
export type Product = {
  id: string; category_id: string | null; name: string; description: string | null;
  price: number | null; image_url: string | null; featured: boolean; available: boolean;
};

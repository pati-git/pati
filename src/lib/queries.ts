import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "./site";
import { defaultCategories, defaultProducts } from "./defaultData";

const FETCH_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: PromiseLike<T>, ms = FETCH_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout contacting database")), ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    try {
      const res = await withTimeout(
        supabase.from("categories").select("*").order("position")
      );
      if (res.error || !res.data || res.data.length === 0) {
        return defaultCategories;
      }
      return res.data as Category[];
    } catch {
      // Si la base de données distante est injoignable (ex: erreur 1016, coupure réseau),
      // le site s'affiche immédiatement avec les catégories enregistrées en local.
      return defaultCategories;
    }
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    try {
      const res = await withTimeout(
        supabase.from("products").select("*").order("created_at", { ascending: false })
      );
      if (res.error || !res.data || res.data.length === 0) {
        return defaultProducts;
      }
      return (res.data as Product[]).map((p) => ({
        ...p,
        image_url: p.image_url || "/images/products/sac.webp",
      }));
    } catch {
      // Si la base de données distante est injoignable,
      // affichage instantané et autonome des produits stockés au format WebP dans le projet.
      return defaultProducts;
    }
  },
});

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      try {
        const res = await withTimeout(
          supabase.from("products").select("*").eq("id", id).maybeSingle()
        );
        if (res.error || !res.data) {
          return defaultProducts.find((p) => p.id === id) || null;
        }
        return res.data as Product;
      } catch {
        return defaultProducts.find((p) => p.id === id) || null;
      }
    },
  });

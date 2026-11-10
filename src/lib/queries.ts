import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "./site";
import { defaultCategories, defaultProducts } from "./defaultData";
import { getLocalStoredProducts, getLocalStoredCategories } from "./localStore";

const FETCH_TIMEOUT_MS = 1500;

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

function mergeWithLocalCategories(baseCategories: Category[]): Category[] {
  const localCats = getLocalStoredCategories();
  if (localCats.length === 0) return baseCategories;
  const map = new Map<string, Category>();
  baseCategories.forEach((c) => map.set(c.id, c));
  localCats.forEach((c) => map.set(c.id, c));
  return Array.from(map.values()).sort((a, b) => a.position - b.position);
}

function mergeWithLocalProducts(baseProducts: Product[]): Product[] {
  const localProds = getLocalStoredProducts();
  if (localProds.length === 0) return baseProducts;
  const map = new Map<string, Product>();
  baseProducts.forEach((p) => map.set(p.id, p));
  // Les créations ajoutées ou modifiées localement écrasent ou complètent
  localProds.forEach((p) => map.set(p.id, p));
  return Array.from(map.values());
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    try {
      const res = await withTimeout(
        supabase.from("categories").select("*").order("position")
      );
      if (res.error || !res.data || res.data.length === 0) {
        return mergeWithLocalCategories(defaultCategories);
      }
      return mergeWithLocalCategories(res.data as Category[]);
    } catch {
      // Chargement immédiat depuis le dossier local du projet
      return mergeWithLocalCategories(defaultCategories);
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
        return mergeWithLocalProducts(defaultProducts);
      }
      const remote = (res.data as Product[]).map((p) => ({
        ...p,
        image_url: p.image_url || "/images/products/sac.webp",
      }));
      return mergeWithLocalProducts(remote);
    } catch {
      // Chargement direct depuis les photos locales WebP et le stockage projet
      return mergeWithLocalProducts(defaultProducts);
    }
  },
});

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: async () => {
      // Vérifier en priorité les créations du projet stockées localement
      const local = getLocalStoredProducts().find((p) => p.id === id);
      if (local) return local;

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

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "./site";
import { defaultCategories, defaultProducts } from "./defaultData";
import {
  getLocalStoredProducts,
  getLocalStoredCategories,
  getDeletedProductIds,
  getDeletedCategoryIds,
} from "./localStore";
import { getCatalogServerFn } from "./serverCatalog";

const FETCH_TIMEOUT_MS = 1000;

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
  const deletedIds = new Set(getDeletedCategoryIds());
  const localCats = getLocalStoredCategories();
  const map = new Map<string, Category>();

  // Conserver les catégories de base non supprimées
  baseCategories.forEach((c) => {
    if (!deletedIds.has(c.id)) {
      map.set(c.id, c);
    }
  });

  // Les catégories locales ajoutées ou renommées complètent ou remplacent
  localCats.forEach((c) => {
    if (!deletedIds.has(c.id)) {
      map.set(c.id, c);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.position - b.position);
}

function mergeWithLocalProducts(baseProducts: Product[]): Product[] {
  const deletedIds = new Set(getDeletedProductIds());
  const localProds = getLocalStoredProducts();
  const map = new Map<string, Product>();

  // Conserver les produits de base non supprimés
  baseProducts.forEach((p) => {
    if (!deletedIds.has(p.id)) {
      map.set(p.id, p);
    }
  });

  // Les créations ajoutées ou modifiées localement écrasent ou complètent
  localProds.forEach((p) => {
    if (!deletedIds.has(p.id)) {
      map.set(p.id, p);
    }
  });

  return Array.from(map.values());
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  staleTime: 0,
  gcTime: 1000 * 60 * 10,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
  queryFn: async () => {
    let baseCategories = defaultCategories;

    // 1. Tenter le chargement direct du catalogue statique public
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/data/catalog.json", { cache: "no-cache" });
        if (res.ok) {
          const json = await res.json();
          if (json?.categories && Array.isArray(json.categories) && json.categories.length > 0) {
            baseCategories = json.categories;
          }
        }
      }
    } catch {
      // Ignoré
    }

    // 2. Charger depuis le catalogue serveur (partagé entre tous les clients)
    try {
      const serverCatalog = await getCatalogServerFn();
      if (serverCatalog?.categories && serverCatalog.categories.length > 0) {
        baseCategories = serverCatalog.categories;
      }
    } catch {
      // Fallback
    }

    // 3. Synchroniser avec Supabase si actif
    try {
      const res = await withTimeout(
        supabase.from("categories").select("*").order("position")
      );
      if (res.data && res.data.length > 0) {
        baseCategories = res.data as Category[];
      }
    } catch {
      // Ignoré si indisponible
    }

    return mergeWithLocalCategories(baseCategories);
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  staleTime: 0,
  gcTime: 1000 * 60 * 10,
  refetchOnMount: "always",
  refetchOnWindowFocus: true,
  queryFn: async () => {
    let baseProducts = defaultProducts;

    // 1. Tenter le chargement direct du catalogue statique public (infaillible sur mobile & desktop)
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/data/catalog.json", { cache: "no-cache" });
        if (res.ok) {
          const json = await res.json();
          if (json?.products && Array.isArray(json.products) && json.products.length > 0) {
            baseProducts = json.products;
          }
        }
      }
    } catch {
      // Ignoré
    }

    // 2. Charger depuis le catalogue serveur persistant (partagé pour tous les clients)
    try {
      const serverCatalog = await getCatalogServerFn();
      if (serverCatalog?.products && serverCatalog.products.length > 0) {
        baseProducts = serverCatalog.products;
      }
    } catch {
      // Fallback
    }

    // 3. Synchroniser avec Supabase si actif
    try {
      const res = await withTimeout(
        supabase.from("products").select("*").order("created_at", { ascending: false })
      );
      if (res.data && res.data.length > 0) {
        const remote = (res.data as Product[]).map((p) => ({
          ...p,
          image_url: p.image_url || "/images/products/sac.webp",
        }));
        baseProducts = remote;
      }
    } catch {
      // Ignoré si indisponible
    }

    return mergeWithLocalProducts(baseProducts);
  },
});

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
    queryFn: async () => {
      const deletedIds = new Set(getDeletedProductIds());
      if (deletedIds.has(id)) return null;

      // 1. Vérifier en priorité les créations du projet stockées localement
      const local = getLocalStoredProducts().find((p) => p.id === id);
      if (local) return local;

      // 2. Vérifier dans le catalogue public statique
      try {
        if (typeof window !== "undefined") {
          const res = await fetch("/data/catalog.json", { cache: "no-cache" });
          if (res.ok) {
            const json = await res.json();
            const found = json?.products?.find((p: Product) => p.id === id);
            if (found && !deletedIds.has(found.id)) return found;
          }
        }
      } catch {
        // Ignoré
      }

      // 3. Vérifier dans le catalogue serveur TanStack Start
      try {
        const serverCatalog = await getCatalogServerFn();
        const found = serverCatalog.products.find((p) => p.id === id);
        if (found && !deletedIds.has(found.id)) return found;
      } catch {
        // Fallback
      }

      // 4. Vérifier avec Supabase si actif
      try {
        const res = await withTimeout(
          supabase.from("products").select("*").eq("id", id).maybeSingle()
        );
        if (res.data) return res.data as Product;
      } catch {
        // Fallback
      }

      // 4. Fallback statique
      const fallback = defaultProducts.find((p) => p.id === id);
      return fallback && !deletedIds.has(fallback.id) ? fallback : null;
    },
  });

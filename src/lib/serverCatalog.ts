import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";
import type { Product, Category } from "./site";
import { defaultProducts, defaultCategories } from "./defaultData";
import catalogSeed from "@/data/catalog.json";
import { query } from "./mysql";

export interface CatalogStore {
  categories: Category[];
  products: Product[];
  deletedProductIds: string[];
  deletedCategoryIds: string[];
}

// Fichiers de persistance
const SEED_CATALOG = catalogSeed as unknown as CatalogStore;
const TMP_CATALOG_FILE = path.resolve("/tmp", "crochet_pati_catalog.json");

// Cache mémoire serveur global partagé pendant l'exécution
declare global {
  // eslint-disable-next-line no-var
  var __PATI_SERVER_CATALOG__: CatalogStore | undefined;
}

async function readCatalogFromStorage(): Promise<CatalogStore> {
  // 1. Tenter de lire directement depuis la base cloud MySQL (TiDB Cloud)
  try {
    const dbProducts = await query<any[]>("SELECT * FROM pati_produits ORDER BY created_at DESC");
    const dbCategories = await query<any[]>("SELECT * FROM pati_categories ORDER BY position ASC");

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      const products: Product[] = dbProducts.map((p) => ({
        id: String(p.id),
        name: String(p.name),
        description: p.description ? String(p.description) : null,
        price: p.price != null ? Number(p.price) : null,
        category_id: p.category_id ? String(p.category_id) : null,
        image_url: p.image_url ? String(p.image_url) : null,
        featured: Boolean(p.featured),
        available: Boolean(p.available),
      }));

      const categories: Category[] =
        Array.isArray(dbCategories) && dbCategories.length > 0
          ? dbCategories.map((c) => ({
              id: String(c.id),
              name: String(c.name),
              slug: c.slug ? String(c.slug) : String(c.id),
              description: c.description ? String(c.description) : null,
              position: c.position != null ? Number(c.position) : 1,
              image_url: c.image_url ? String(c.image_url) : null,
            }))
          : defaultCategories;

      const store: CatalogStore = {
        categories,
        products,
        deletedProductIds: [],
        deletedCategoryIds: [],
      };
      globalThis.__PATI_SERVER_CATALOG__ = store;
      return store;
    }
  } catch (err) {
    console.warn("[serverCatalog] Lecture TiDB Cloud indisponible, fallback vers cache/graine :", err);
  }

  // 2. Si déjà en mémoire vive du serveur
  if (globalThis.__PATI_SERVER_CATALOG__) {
    return globalThis.__PATI_SERVER_CATALOG__;
  }

  // 3. Tenter de lire l'état persistant de l'instance (serverless : /tmp)
  try {
    const rawTmp = await fs.readFile(TMP_CATALOG_FILE, "utf-8");
    const parsedTmp = JSON.parse(rawTmp) as CatalogStore;
    if (parsedTmp && Array.isArray(parsedTmp.products) && parsedTmp.products.length > 0) {
      globalThis.__PATI_SERVER_CATALOG__ = parsedTmp;
      return parsedTmp;
    }
  } catch {
    // Aucun fichier trouvé
  }

  // 4. Graine embarquée dans le bundle : identique en local et en production
  const seed = structuredClone(SEED_CATALOG);
  if (seed && Array.isArray(seed.products) && Array.isArray(seed.categories)) {
    globalThis.__PATI_SERVER_CATALOG__ = seed;
    return seed;
  }

  // 5. Initialisation par défaut
  const initialStore: CatalogStore = {
    categories: defaultCategories,
    products: defaultProducts,
    deletedProductIds: [],
    deletedCategoryIds: [],
  };
  globalThis.__PATI_SERVER_CATALOG__ = initialStore;
  return initialStore;
}

async function persistCatalogToStorage(store: CatalogStore): Promise<void> {
  globalThis.__PATI_SERVER_CATALOG__ = store;
  const serialized = JSON.stringify(store, null, 2);

  // Écriture de l'état de l'instance (serverless : /tmp, éphémère par instance)
  try {
    await fs.writeFile(TMP_CATALOG_FILE, serialized, "utf-8");
  } catch {
    // Ignore
  }
}

/* -------------------------------------------------------------
 * SERVER FUNCTIONS ACCESSIBLES CÔTÉ SERVEUR ET CLIENT
 * ------------------------------------------------------------*/

export const getCatalogServerFn = createServerFn({ method: "GET" }).handler(async () => {
  return await readCatalogFromStorage();
});

export const saveProductServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("product" in input)) {
      throw new Error("Produit invalide.");
    }
    return input as { product: Product };
  })
  .handler(async ({ data }) => {
    const product = data.product;

    // 1. Persistance universelle dans TiDB Cloud (accessible par tous les terminaux)
    try {
      await query(
        `INSERT INTO pati_produits (id, name, description, price, category_id, image_url, featured, available, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           description = VALUES(description),
           price = VALUES(price),
           category_id = VALUES(category_id),
           image_url = VALUES(image_url),
           featured = VALUES(featured),
           available = VALUES(available),
           updated_at = NOW()`,
        [
          product.id,
          product.name,
          product.description || null,
          product.price != null ? product.price : null,
          product.category_id || null,
          product.image_url || null,
          product.featured ? 1 : 0,
          product.available ? 1 : 0,
        ]
      );
    } catch (dbErr) {
      console.error("[saveProductServerFn] Erreur d'enregistrement TiDB Cloud :", dbErr);
    }

    const store = await readCatalogFromStorage();

    // Retirer des identifiants supprimés
    const deletedIds = new Set(store.deletedProductIds || []);
    deletedIds.delete(product.id);

    // Mettre à jour ou ajouter dans le cache mémoire
    const list = [...store.products];
    const index = list.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.unshift(product);
    }

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
      deletedProductIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const toggleProductAvailabilityServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string; available?: boolean };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    let nextAvailable = typeof data.available === "boolean" ? data.available : true;

    const list = store.products.map((p) => {
      if (p.id === data.id) {
        nextAvailable = typeof data.available === "boolean" ? data.available : !p.available;
        return {
          ...p,
          available: nextAvailable,
        };
      }
      return p;
    });

    // Mise à jour TiDB Cloud
    try {
      await query("UPDATE pati_produits SET available = ?, updated_at = NOW() WHERE id = ?", [
        nextAvailable ? 1 : 0,
        data.id,
      ]);
    } catch (dbErr) {
      console.error("[toggleProductAvailabilityServerFn] Erreur TiDB Cloud :", dbErr);
    }

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const toggleProductFeaturedServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string; featured?: boolean };
  })
  .handler(async ({ data }) => {
    const store = await readCatalogFromStorage();
    let nextFeatured = typeof data.featured === "boolean" ? data.featured : false;

    const list = store.products.map((p) => {
      if (p.id === data.id) {
        nextFeatured = typeof data.featured === "boolean" ? data.featured : !p.featured;
        return {
          ...p,
          featured: nextFeatured,
        };
      }
      return p;
    });

    // Mise à jour TiDB Cloud
    try {
      await query("UPDATE pati_produits SET featured = ?, updated_at = NOW() WHERE id = ?", [
        nextFeatured ? 1 : 0,
        data.id,
      ]);
    } catch (dbErr) {
      console.error("[toggleProductFeaturedServerFn] Erreur TiDB Cloud :", dbErr);
    }

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const deleteProductServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string };
  })
  .handler(async ({ data }) => {
    const id = data.id;

    // Suppression dans TiDB Cloud
    try {
      await query("DELETE FROM pati_produits WHERE id = ?", [id]);
    } catch (dbErr) {
      console.error("[deleteProductServerFn] Erreur TiDB Cloud :", dbErr);
    }

    const store = await readCatalogFromStorage();
    const deletedIds = new Set(store.deletedProductIds || []);
    deletedIds.add(id);

    const list = store.products.filter((p) => p.id !== id);

    const updatedStore: CatalogStore = {
      ...store,
      products: list,
      deletedProductIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const saveCategoryServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("category" in input)) {
      throw new Error("Catégorie invalide.");
    }
    return input as { category: Category };
  })
  .handler(async ({ data }) => {
    const category = data.category;

    // Persistance dans TiDB Cloud
    try {
      await query(
        `INSERT INTO pati_categories (id, name, slug, description, position, image_url, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           slug = VALUES(slug),
           description = VALUES(description),
           position = VALUES(position),
           image_url = VALUES(image_url),
           updated_at = NOW()`,
        [
          category.id,
          category.name,
          category.slug || null,
          category.description || null,
          category.position || 1,
          category.image_url || null,
        ]
      );
    } catch (dbErr) {
      console.error("[saveCategoryServerFn] Erreur TiDB Cloud :", dbErr);
    }

    const store = await readCatalogFromStorage();
    const deletedIds = new Set(store.deletedCategoryIds || []);
    deletedIds.delete(category.id);

    const list = [...store.categories];
    const index = list.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      list[index] = category;
    } else {
      list.push(category);
    }

    const updatedStore: CatalogStore = {
      ...store,
      categories: list,
      deletedCategoryIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });

export const deleteCategoryServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object" || !("id" in input)) {
      throw new Error("Identifiant manquant.");
    }
    return input as { id: string };
  })
  .handler(async ({ data }) => {
    const id = data.id;

    // Suppression dans TiDB Cloud
    try {
      await query("DELETE FROM pati_categories WHERE id = ?", [id]);
    } catch (dbErr) {
      console.error("[deleteCategoryServerFn] Erreur TiDB Cloud :", dbErr);
    }

    const store = await readCatalogFromStorage();
    const deletedIds = new Set(store.deletedCategoryIds || []);
    deletedIds.add(id);

    const list = store.categories.filter((c) => c.id !== id);

    const updatedStore: CatalogStore = {
      ...store,
      categories: list,
      deletedCategoryIds: Array.from(deletedIds),
    };

    await persistCatalogToStorage(updatedStore);
    return updatedStore;
  });


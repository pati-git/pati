import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs/promises";
import path from "node:path";

export interface SaveProductImageInput {
  fileName: string;
  base64Data: string;
}

export const saveProductImageServerFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") {
      throw new Error("Données d'image invalides.");
    }
    const { fileName, base64Data } = input as { fileName?: string; base64Data?: string };
    if (!fileName || !base64Data) {
      throw new Error("Nom de fichier ou contenu de l'image manquant.");
    }
    return { fileName, base64Data };
  })
  .handler(async ({ data }) => {
    // Écriture de sauvegarde en local si le système de fichiers est disponible
    try {
      const cleanBase64 = data.base64Data.replace(/^data:image\/[a-z0-9.+]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      const targetDir = path.resolve(process.cwd(), "public", "images", "products");
      await fs.mkdir(targetDir, { recursive: true });

      const safeBaseName = data.fileName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      const uniqueFileName = `${Date.now()}-${safeBaseName}`;
      const destinationPath = path.join(targetDir, uniqueFileName);

      await fs.writeFile(destinationPath, buffer);
    } catch {
      // Ignoré en serverless / lecture seule
    }

    // On retourne toujours le format autonome dataUrl (WebP ultra-optimisé) :
    // Cela garantit qu'aucun terminal (smartphone, tablette, PC) n'ait d'erreur 404
    // et que l'image voyage directement dans la table MySQL pati_produits.
    return {
      imageUrl: data.base64Data,
    };
  });

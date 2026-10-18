import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { formatPrice, type Category, type Product } from "@/lib/site";
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle, Loader2, Lock, Plus } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Espace admin — Crochet by Pati" },
      { name: "description", content: "Gestion des produits et catégories de la boutique." },
      { property: "og:title", content: "Espace admin — Crochet by Pati" },
      { property: "og:description", content: "Gestion de la boutique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

async function compressImageToWebP(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Format d'image non valide ou fichier endommagé."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Traitement de l'image indisponible."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              fetch(dataUrl)
                .then((r) => r.blob())
                .then((b) => resolve({ blob: b, dataUrl }))
                .catch(() => reject(new Error("Erreur de compression d'image.")));
            }
          },
          "image/webp",
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return <div className="py-32 text-center text-muted-foreground">Chargement…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="py-32 text-center text-muted-foreground">Vérification…</div>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <p>Ce compte n'a pas accès à l'administration.</p>
        <button className="btn-outline mt-6 cursor-pointer" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    );
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [email, setEmail] = useState("patricialdagan729@gmail.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setMsg("email_unconfirmed");
      } else if (error.message.includes("Invalid login credentials")) {
        setMsg("Email ou mot de passe incorrect.");
      } else {
        setMsg(error.message);
      }
    }
    setBusy(false);
  };

  const resendEmail = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setMsg(`Erreur lors du renvoi : ${error.message}`);
    } else {
      setMsg("Email de confirmation renvoyé ! Vérifiez votre boîte de réception et le dossier Spams/Courriers indésirables.");
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <p className="eyebrow">Espace propriétaire</p>
        <h1 className="mt-2 text-3xl font-display">Connexion Administrateur</h1>
        
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Compte unique vérifié • Inscriptions fermées</span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Accès exclusif réservé à l'administratrice de la boutique.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Email administrateur</label>
          <input
            className="field"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Mot de passe</label>
          <input
            className="field"
            type="password"
            placeholder="••••••••••••"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button className="btn-primary w-full cursor-pointer justify-center" disabled={busy}>
          {busy ? "Connexion en cours..." : "Se connecter"}
        </button>

        {msg === "email_unconfirmed" ? (
          <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 text-xs text-foreground space-y-2">
            <p className="font-semibold text-primary">Email non encore confirmé dans Supabase</p>
            <p className="text-muted-foreground leading-relaxed">
              L'email de vérification peut tarder ou se trouver dans vos spams.
            </p>
            <button
              type="button"
              onClick={resendEmail}
              disabled={busy}
              className="btn-outline w-full py-2 text-xs cursor-pointer justify-center"
            >
              Renvoyer l'email d'activation
            </button>
          </div>
        ) : (
          msg && <p className="text-center text-xs text-destructive font-medium">{msg}</p>
        )}

        <div className="pt-2 text-center border-t border-border/40">
          <p className="text-[11px] text-muted-foreground">
            🔒 Système sécurisé : aucune création de nouveau compte n'est autorisée.
          </p>
        </div>
      </form>
    </div>
  );
}

const emptyProduct = { id: "", name: "", description: "", price: "", category_id: "", image_url: "", featured: false, available: true };
type Draft = typeof emptyProduct;

function Dashboard({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["categories"] }); };

  const remove = async (p: Product) => {
    if (!confirm(`Supprimer « ${p.name} » ?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    refresh();
  };

  const list = filter ? products.filter((p) => p.category_id === filter) : products;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <h1 className="mt-2 text-4xl">Mes produits</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/boutique" className="btn-outline">Voir la boutique</Link>
          <button className="btn-primary" onClick={() => setDraft({ ...emptyProduct, category_id: cats[0]?.id ?? "" })}>+ Ajouter un produit</button>
          <button className="btn-outline" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Produits" value={products.length} />
        <Stat label="Catégories" value={cats.length} />
        <Stat label="En vedette" value={products.filter((p) => p.featured).length} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <select className="field max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg">{p.name} {p.featured && <span className="text-xs text-primary">★</span>}</p>
                  <p className="text-xs text-muted-foreground">{cats.find((c) => c.id === p.category_id)?.name ?? "Sans catégorie"} · {formatPrice(p.price)}</p>
                </div>
                <button className="text-sm hover:text-primary" onClick={() => setDraft({ id: p.id, name: p.name, description: p.description ?? "", price: p.price?.toString() ?? "", category_id: p.category_id ?? "", image_url: p.image_url ?? "", featured: p.featured, available: p.available })}>Modifier</button>
                <button className="text-sm text-destructive" onClick={() => remove(p)}>Supprimer</button>
              </div>
            ))}
            {list.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Aucun produit.</p>}
          </div>
        </div>
        <CategoryManager cats={cats} onChange={refresh} />
      </div>

      {draft && <ProductForm draft={draft} cats={cats} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); refresh(); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}

function ProductForm({ draft, cats, onClose, onSaved }: { draft: Draft; cats: Category[]; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    // 1. Validation du format
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
    const isImage = validTypes.includes(file.type) || file.type.startsWith("image/");
    if (!isImage) {
      setErr("Format non supporté. Formats acceptés : JPG, PNG, WEBP, GIF, AVIF.");
      return;
    }

    // 2. Validation de la taille (10 Mo max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErr("La photo dépasse la taille maximale autorisée de 10 Mo. Veuillez sélectionner une photo plus légère.");
      return;
    }

    setUploading(true);
    setErr(null);

    try {
      setUploadStatus("Optimisation et compression WebP...");
      const { blob, dataUrl } = await compressImageToWebP(file, 1600, 0.85);

      setUploadStatus("Enregistrement de la photo...");
      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

      // Tentative de sauvegarde dans le bucket Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        setD((prev) => ({ ...prev, image_url: publicUrlData.publicUrl }));
      } else {
        // En cas d'indisponibilité du bucket, fallback automatique et transparent sur le format WebP compressé
        console.warn("Upload Storage indisponible, fallback image optimisée :", uploadError.message);
        setD((prev) => ({ ...prev, image_url: dataUrl }));
      }
    } catch (uploadException) {
      console.warn("Exception lors du traitement de l'image, fallback lecteur direct :", uploadException);
      const reader = new FileReader();
      reader.onload = () => {
        setD((prev) => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      setUploadStatus(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const row = {
      name: d.name.trim(),
      description: d.description || null,
      price: d.price ? Number(d.price) : null,
      category_id: d.category_id || null,
      image_url: d.image_url || null,
      featured: d.featured,
      available: d.available,
    };
    const { error } = d.id
      ? await supabase.from("products").update(row).eq("id", d.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) {
      setErr(error.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 backdrop-blur-xs p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-card p-6 shadow-soft border border-border"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <h2 className="text-2xl font-display text-foreground">
            {d.id ? "Modifier le produit" : "Ajouter un produit"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl p-1 rounded-md"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <label className="block text-sm font-medium text-foreground">
          Nom du produit *
          <input
            className="field mt-1"
            placeholder="Ex: Sac cabas en crochet terracotta"
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            required
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Description
          <textarea
            className="field mt-1"
            rows={3}
            placeholder="Détails de la création, matière, dimensions..."
            value={d.description}
            onChange={(e) => setD({ ...d, description: e.target.value })}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-foreground">
            Prix (FCFA)
            <input
              className="field mt-1"
              type="number"
              min={0}
              placeholder="Sur devis si vide"
              value={d.price}
              onChange={(e) => setD({ ...d, price: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium text-foreground">
            Catégorie
            <select
              className="field mt-1"
              value={d.category_id}
              onChange={(e) => setD({ ...d, category_id: e.target.value })}
            >
              <option value="">Aucune catégorie</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Zone d'ajout et prévisualisation de la photo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Photo du produit
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-secondary/30 p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{uploadStatus ?? "Chargement..."}</p>
              <p className="text-xs text-muted-foreground mt-1">Veuillez patienter un instant</p>
            </div>
          ) : d.image_url ? (
            <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-3">
              <div className="relative overflow-hidden rounded-lg bg-black/5 aspect-4/3 max-h-56 flex items-center justify-center">
                <img
                  src={d.image_url}
                  alt="Prévisualisation"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Photo prête et optimisée</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                  >
                    Changer la photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setD({ ...d, image_url: "" })}
                    className="flex items-center gap-1 text-xs text-destructive hover:underline py-1.5 px-2 cursor-pointer"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border/80 hover:border-primary/60 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2.5">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Cliquez pour ajouter une photo ou glissez-déposez
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formats acceptés : <span className="font-medium text-foreground">JPG, PNG, WEBP, GIF, AVIF</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Taille maximale : <span className="font-semibold text-primary">10 Mo</span> (optimisation automatique)
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-6 text-sm pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary h-4 w-4 rounded"
              checked={d.featured}
              onChange={(e) => setD({ ...d, featured: e.target.checked })}
            />
            <span className="font-medium text-foreground">⭐ Mettre en vedette (accueil)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-primary h-4 w-4 rounded"
              checked={d.available}
              onChange={(e) => setD({ ...d, available: e.target.checked })}
            />
            <span className="font-medium text-foreground">Disponible à la vente</span>
          </label>
        </div>

        {err && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{err}</p>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border/60">
          <button type="button" className="btn-outline cursor-pointer" onClick={onClose} disabled={busy || uploading}>
            Annuler
          </button>
          <button className="btn-primary cursor-pointer" disabled={busy || uploading}>
            {busy ? "Enregistrement..." : d.id ? "Mettre à jour" : "Créer le produit"}
          </button>
        </div>
      </form>
    </div>
  );
}

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoryManager({ cats, onChange }: { cats: Category[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const add = async (e: FormEvent) => {
    e.preventDefault(); if (!name.trim()) return;
    await supabase.from("categories").insert({ name: name.trim(), slug: `${slugify(name)}-${Date.now().toString(36)}`, position: cats.length + 1 });
    setName(""); onChange();
  };
  const rename = async (c: Category) => {
    const n = prompt("Nouveau nom", c.name); if (!n?.trim()) return;
    await supabase.from("categories").update({ name: n.trim() }).eq("id", c.id); onChange();
  };
  const del = async (c: Category) => {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ? Les produits resteront sans catégorie.`)) return;
    await supabase.from("categories").delete().eq("id", c.id); onChange();
  };
  return (
    <aside className="h-fit rounded-2xl border border-border bg-secondary/40 p-5">
      <h2 className="text-2xl">Catégories</h2>
      <ul className="mt-4 space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm">
            <span>{c.name}</span>
            <span className="flex gap-3 text-xs"><button onClick={() => rename(c)} className="hover:text-primary">Renommer</button><button onClick={() => del(c)} className="text-destructive">×</button></span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <input className="field" placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary px-4">+</button>
      </form>
    </aside>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { formatPrice, type Category, type Product } from "@/lib/site";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Espace admin — Crochet by Pati'" },
      { name: "description", content: "Gestion des produits et catégories de la boutique." },
      { property: "og:title", content: "Espace admin — Crochet by Pati'" },
      { property: "og:description", content: "Gestion de la boutique." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

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
        <button className="btn-outline mt-6" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    );
  return <Dashboard email={session.user.email ?? ""} />;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("patricialdagan729@gmail.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setMsg("email_unconfirmed");
        } else {
          setMsg(error.message);
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setMsg(error ? error.message : "Compte créé ! Si 'Confirm email' est activé sur votre projet Supabase, vérifiez votre boîte mail (et spams) ou confirmez l'utilisateur directement depuis le dashboard Supabase/Lovable.");
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
      <p className="eyebrow text-center">Espace propriétaire</p>
      <h1 className="mt-3 text-center text-4xl">{mode === "in" ? "Connexion" : "Créer le compte admin"}</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" placeholder="Mot de passe" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn-primary w-full cursor-pointer" disabled={busy}>{mode === "in" ? "Se connecter" : "Créer le compte"}</button>
        {msg === "email_unconfirmed" ? (
          <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 text-xs text-foreground space-y-2">
            <p className="font-semibold text-primary">Email non encore confirmé par Supabase</p>
            <p className="text-muted-foreground leading-relaxed">
              L'email de vérification envoyé par Supabase peut parfois tarder ou être filtré dans vos spams.
            </p>
            <button
              type="button"
              onClick={resendEmail}
              disabled={busy}
              className="btn-outline w-full py-2 text-xs cursor-pointer"
            >
              Renvoyer l'email d'activation
            </button>
            <p className="text-[11px] text-muted-foreground pt-1">
              💡 <strong>Astuce :</strong> Vous pouvez désactiver l'option « Confirm email » dans votre tableau de bord Supabase (Authentication → Providers → Email) pour vous connecter directement sans aucune confirmation.
            </p>
          </div>
        ) : (
          msg && <p className="text-center text-xs text-muted-foreground">{msg}</p>
        )}
      </form>
      <button className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Première visite ? Créer le compte admin" : "J'ai déjà un compte"}
      </button>
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
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setBusy(true); setErr(null);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { setErr(error.message); setBusy(false); return; }
    const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 20);
    if (data) setD((x) => ({ ...x, image_url: data.signedUrl }));
    setBusy(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    const row = {
      name: d.name.trim(), description: d.description || null,
      price: d.price ? Number(d.price) : null, category_id: d.category_id || null,
      image_url: d.image_url || null, featured: d.featured, available: d.available,
    };
    const { error } = d.id ? await supabase.from("products").update(row).eq("id", d.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) setErr(error.message); else onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/40 p-4" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-3xl">{d.id ? "Modifier le produit" : "Nouveau produit"}</h2>
        <label className="block text-sm">Nom<input className="field mt-1" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required /></label>
        <label className="block text-sm">Description<textarea className="field mt-1" rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Prix (FCFA)<input className="field mt-1" type="number" min={0} placeholder="Sur devis" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} /></label>
          <label className="block text-sm">Catégorie
            <select className="field mt-1" value={d.category_id} onChange={(e) => setD({ ...d, category_id: e.target.value })}>
              <option value="">Aucune</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="text-sm">
          Photo
          <div className="mt-1 flex items-center gap-3">
            {d.image_url && <img src={d.image_url} alt="" className="h-20 w-16 rounded-md object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="text-xs" />
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} /> En vedette</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={d.available} onChange={(e) => setD({ ...d, available: e.target.checked })} /> Disponible</label>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={busy}>{busy ? "…" : "Enregistrer"}</button>
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

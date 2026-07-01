import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { Plus, Trash2, Edit2, Save, X, Loader2, Sparkles, Clock, Trash, Search } from "lucide-react";
import { db, logAuditTrail, moveToRecycleBin } from "@/lib/firebase";
import type { ServiceItem } from "@/components/sections/ServicesSection";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";

// Extend ServiceItem type locally if needed or import
export interface ExtendedServiceItem extends ServiceItem {
  gallery?: string[];
}

export function ServicesManager() {
  const [items, setItems] = useState<ExtendedServiceItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");
  const [form, setForm] = useState({
    category: "",
    group: "",
    name: "",
    price: "",
    note: "",
    duration: "",
    badge: "",
    image: "",
    gallery: [] as string[],
  });

  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [newEditGalleryUrl, setNewEditGalleryUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtendedServiceItem>>({});

  useEffect(() => {
    const q = query(collection(db, "services"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExtendedServiceItem, "id">) }))),
    );
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.category || !form.group || !form.name || !form.price)
      return setErr("Please fill all required fields");

    setSaving(true);
    try {
      await addDoc(collection(db, "services"), {
        category: form.category.trim().toUpperCase(),
        group: form.group.trim(),
        name: form.name.trim(),
        price: form.price.trim(),
        note: form.note.trim() || null,
        duration: form.duration.trim() || "30 mins",
        badge: form.badge.trim() || null,
        image: form.image || null,
        gallery: form.gallery || [],
        order: Date.now(),
      });
      logAuditTrail(
        "Service created",
        `Created new service catalog item: ${form.category} • ${form.group} • ${form.name} (${form.price})`
      );

      setForm({
        category: form.category,
        group: form.group,
        name: "",
        price: "",
        note: "",
        duration: "",
        badge: "",
        image: "",
        gallery: [],
      });
      toast.success("Service added successfully!");
    } catch {
      setErr("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it: ExtendedServiceItem) => {
    setEditing(it.id);
    setEditForm({
      ...it,
      gallery: it.gallery || [],
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const oldSvc = items.find((x) => x.id === editing);
      await updateDoc(doc(db, "services", editing), {
        category: (editForm.category || "").toUpperCase(),
        group: editForm.group,
        name: editForm.name,
        price: editForm.price,
        note: editForm.note || null,
        duration: editForm.duration || "30 mins",
        badge: editForm.badge || null,
        image: editForm.image || null,
        gallery: editForm.gallery || [],
      });
      logAuditTrail(
        "Service edited",
        `Updated details for service item "${editForm.name}"`,
        oldSvc ? `${oldSvc.name} (${oldSvc.price})` : null,
        `${editForm.name} (${editForm.price})`
      );
      setEditing(null);
      toast.success("Service updated successfully!");
    } catch {
      setErr("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Distinct Categories
  const categories = ["ALL", ...Array.from(new Set(items.map((it) => it.category.toUpperCase())))];

  // Filtering
  const filteredItems = items.filter((it) => {
    const matchesCat = activeCat === "ALL" || it.category.toUpperCase() === activeCat;
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.group.toLowerCase().includes(search.toLowerCase()) ||
      it.category.toLowerCase().includes(search.toLowerCase()) ||
      (it.note && it.note.toLowerCase().includes(search.toLowerCase())) ||
      (it.badge && it.badge.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const tree: Record<string, Record<string, ExtendedServiceItem[]>> = {};
  for (const it of filteredItems) {
    tree[it.category] ??= {};
    tree[it.category][it.group] ??= [];
    tree[it.category][it.group].push(it);
  }

  return (
    <div className="space-y-8">
      {/* Form Add Service */}
      <form
        onSubmit={add}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 animate-in fade-in duration-300"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Add New Service Catalog Package
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Category (e.g. HAIR, SKIN, MAKEUP)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Group (e.g. Hair Spa, Facials)"
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            required
          />
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Service Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Price (e.g. ₹800)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Duration (e.g. 45 mins)"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Badge (e.g. Popular, Best Seller)"
            value={form.badge}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
          />
          <input
            className="px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Short Description / Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        {/* Cover & Gallery Upload fields */}
        <div className="grid md:grid-cols-12 gap-6 pt-4 border-t border-border">
          <div className="md:col-span-4">
            <ImageUploader
              label="Service Cover Photo"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              aspectRatio="video"
            />
          </div>

          <div className="md:col-span-8 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground block">
              Service Gallery Images (Optional - {form.gallery.length})
            </span>
            <div className="grid grid-cols-4 gap-2">
              {form.gallery.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border bg-muted">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.gallery.filter((_, i) => i !== idx);
                      setForm({ ...form, gallery: updated });
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="max-w-xs">
              <ImageUploader
                label="Add Gallery Image"
                value={newGalleryUrl}
                onChange={(url) => {
                  if (url) {
                    setForm({ ...form, gallery: [...form.gallery, url] });
                    setNewGalleryUrl("");
                    toast.success("Added to service gallery!");
                  }
                }}
                aspectRatio="video"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-soft"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save Service
          </button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      {/* Controls: Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-soft">
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize cursor-pointer transition-all ${
                activeCat === c
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-secondary hover:bg-accent text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search catalog services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border border-input focus:outline-none focus:border-primary text-xs"
          />
        </div>
      </div>

      {/* Structured Category List */}
      {filteredItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 bg-card border border-border rounded-3xl">
          No services matching search found.
        </div>
      ) : (
        <div className="space-y-6">
        {Object.keys(tree).map((cat) => (
          <div
            key={cat}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft"
          >
            <div className="px-5 py-3 bg-secondary/40 font-bold text-lg font-display uppercase tracking-wider">
              {cat}
            </div>
            <div className="p-4 space-y-4">
              {Object.keys(tree[cat]).map((g) => (
                <div key={g}>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                    {g}
                  </div>
                  <ul className="divide-y divide-border border border-border rounded-xl bg-background overflow-hidden">
                    {tree[cat][g].map((it) => (
                      <li
                        key={it.id}
                        className="px-4 py-4 flex flex-col justify-between gap-4"
                      >
                        {editing === it.id ? (
                          <div className="w-full space-y-4">
                            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
                              <input
                                className="px-2.5 py-1.5 rounded border border-input text-xs"
                                placeholder="Name"
                                value={editForm.name || ""}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              />
                              <input
                                className="px-2.5 py-1.5 rounded border border-input text-xs"
                                placeholder="Price"
                                value={editForm.price || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, price: e.target.value })
                                }
                              />
                              <input
                                className="px-2.5 py-1.5 rounded border border-input text-xs"
                                placeholder="Duration"
                                value={editForm.duration || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, duration: e.target.value })
                                }
                              />
                              <input
                                className="px-2.5 py-1.5 rounded border border-input text-xs"
                                placeholder="Badge"
                                value={editForm.badge || ""}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, badge: e.target.value })
                                }
                              />
                            </div>
                            <input
                              className="w-full px-2.5 py-1.5 rounded border border-input text-xs"
                              placeholder="Note"
                              value={editForm.note || ""}
                              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            />

                            <div className="grid md:grid-cols-12 gap-4 border-t border-border pt-4">
                              <div className="md:col-span-4">
                                <ImageUploader
                                  label="Cover Photo"
                                  value={editForm.image}
                                  onChange={(url) => setEditForm({ ...editForm, image: url })}
                                  aspectRatio="video"
                                />
                              </div>
                              <div className="md:col-span-8 space-y-2">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">
                                  Gallery Images ({editForm.gallery?.length || 0})
                                </span>
                                <div className="grid grid-cols-4 gap-2">
                                  {(editForm.gallery || []).map((url, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group border bg-muted">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (editForm.gallery || []).filter((_, i) => i !== idx);
                                          setEditForm({ ...editForm, gallery: updated });
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      >
                                        <Trash className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="max-w-xs pt-2">
                                  <ImageUploader
                                    label="Add to Gallery"
                                    value={newEditGalleryUrl}
                                    onChange={(url) => {
                                      if (url) {
                                        setEditForm({
                                          ...editForm,
                                          gallery: [...(editForm.gallery || []), url],
                                        });
                                        setNewEditGalleryUrl("");
                                        toast.success("Added to service edit gallery!");
                                      }
                                    }}
                                    aspectRatio="video"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-3 border-t border-border">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="px-4 py-1.5 rounded-full bg-primary text-white hover:bg-primary/95 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                {saving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Save Changes
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="px-4 py-1.5 rounded-full bg-secondary hover:bg-accent text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-3.5">
                              {it.image && (
                                <img
                                  src={it.image}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover border shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-sm flex items-center gap-2">
                                  <span>{it.name}</span>
                                  {it.badge && (
                                    <span className="text-[8px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-1.5 uppercase tracking-wide">
                                      {it.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                  <span className="flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" /> {it.duration || "30 mins"}
                                  </span>
                                  {it.note && (
                                    <span>
                                      • <span className="italic">{it.note}</span>
                                    </span>
                                  )}
                                  {it.gallery && it.gallery.length > 0 && (
                                    <span className="text-primary font-semibold">
                                      • {it.gallery.length} Gallery Photos
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 justify-end shrink-0">
                              <div className="font-bold text-sm text-gradient-rose font-mono">
                                {it.price}
                              </div>
                              <button
                                onClick={() => startEdit(it)}
                                className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this service?")) {
                                    await moveToRecycleBin("services", it.id, it);
                                    await deleteDoc(doc(db, "services", it.id));
                                    logAuditTrail(
                                      "Service deleted",
                                      `Deleted service item "${it.name}" from category ${it.category}`
                                    );
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

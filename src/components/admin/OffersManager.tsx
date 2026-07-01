import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, Trash2, Loader2, Tag } from "lucide-react";
import { db } from "@/lib/firebase";
import type { OfferItem } from "@/components/sections/OffersSection";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";

export function OffersManager() {
  const [items, setItems] = useState<OfferItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    discount: "",
    validUntil: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = query(collection(db, "offers"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OfferItem, "id">) })));
    });
  }, []);

  const addOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.title || !form.code || !form.discount || !form.validUntil)
      return setErr("Please fill required fields");

    setSaving(true);
    try {
      await addDoc(collection(db, "offers"), {
        title: form.title.trim(),
        description: form.description.trim(),
        code: form.code.trim().toUpperCase(),
        discount: form.discount.trim(),
        validUntil: form.validUntil,
        image: form.image || null,
        createdAt: Date.now(),
      });

      setForm({ title: "", description: "", code: "", discount: "", validUntil: "", image: "" });
      toast.success("Promo offer saved!");
    } catch {
      setErr("Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Add */}
      <form
        onSubmit={addOffer}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 animate-in fade-in duration-300"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" /> Create Coupon Promo Offer
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Offer Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Discount (e.g. 20% OFF or ₹300 OFF)"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Coupon Code (e.g. GLOW50)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <input
            type="date"
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            value={form.validUntil}
            onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            required
          />
        </div>

        <input
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
          placeholder="Offer description details..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="max-w-md">
          <ImageUploader
            label="Offer Banner / Poster Image"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            aspectRatio="video"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer shadow-soft"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save Offer
          </button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      {/* Grid listing */}
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-premium transition-shadow duration-300"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              {it.image && (
                <img src={it.image} alt="" className="h-14 w-20 rounded-lg object-cover border shrink-0 bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm truncate">{it.title}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {it.code}
                  </span>
                  <span className="text-xs font-semibold text-green-600">{it.discount}</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">Expiry: {it.validUntil}</div>
              </div>
            </div>

            <div className="flex items-center justify-end shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto">
              <button
                onClick={() => deleteDoc(doc(db, "offers", it.id))}
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                title="Delete Offer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-xs text-muted-foreground py-10">
            No promotional offers.
          </div>
        )}
      </div>
    </div>
  );
}

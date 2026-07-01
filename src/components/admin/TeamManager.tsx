import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, Trash2, Loader2, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import type { TeamMember } from "@/components/sections/TeamSection";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";

export function TeamManager() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ name: "", role: "", bio: "", experience: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = query(collection(db, "team"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) })));
    });
  }, []);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.name || !form.role || !form.bio) return setErr("Please fill required fields");

    setSaving(true);
    try {
      await addDoc(collection(db, "team"), {
        name: form.name.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        experience: form.experience.trim() || null,
        image: form.image || null,
        order: Date.now(),
      });

      setForm({ name: "", role: "", bio: "", experience: "", image: "" });
      toast.success("Team member saved!");
    } catch {
      setErr("Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Add */}
      <form
        onSubmit={addMember}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 animate-in fade-in duration-300"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" /> Add Stylist Member
        </h3>

        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Role (e.g. Master Stylist)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Experience (e.g. 5+ Years)"
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
          />
        </div>

        <textarea
          rows={2}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
          placeholder="Brief professional biography..."
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          required
        />

        <div className="max-w-xs">
          <ImageUploader
            label="Profile Photo"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            aspectRatio="square"
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
            Save Member
          </button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      {/* Grid listing */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-soft flex gap-4 items-start"
          >
            <img
              src={
                it.image ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
              }
              alt=""
              className="h-16 w-16 rounded-full object-cover border"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{it.name}</h4>
              <div className="text-xs text-primary font-medium truncate">{it.role}</div>
              {it.experience && (
                <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                  Exp: {it.experience}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 italic">{it.bio}</p>
            </div>
            <button
              onClick={() => deleteDoc(doc(db, "team", it.id))}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
              title="Delete member"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-xs text-muted-foreground py-10">
            No team members added.
          </div>
        )}
      </div>
    </div>
  );
}

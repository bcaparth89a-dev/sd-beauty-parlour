import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import type { BlogPost } from "@/components/sections/BlogSection";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";

export function BlogManager() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [form, setForm] = useState({ title: "", content: "", author: "", readTime: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, "id">) })));
    });
  }, []);

  const addPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.title || !form.content || !form.author || !form.readTime)
      return setErr("Please fill all fields");

    setSaving(true);
    try {
      await addDoc(collection(db, "blog"), {
        title: form.title.trim(),
        content: form.content.trim(),
        author: form.author.trim(),
        readTime: form.readTime.trim(),
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        image: form.image || null,
        createdAt: Date.now(),
      });

      setForm({ title: "", content: "", author: "", readTime: "", image: "" });
      toast.success("Blog article published!");
    } catch {
      setErr("Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Add */}
      <form
        onSubmit={addPost}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 animate-in fade-in duration-300"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Write New Article Post
        </h3>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Article Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Author (e.g. Simran Sen)"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            required
          />
          <input
            className="px-4 py-2.5 rounded-lg bg-background border border-input text-xs"
            placeholder="Read Time (e.g. 5 min read)"
            value={form.readTime}
            onChange={(e) => setForm({ ...form, readTime: e.target.value })}
            required
          />
        </div>

        <textarea
          rows={4}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
          placeholder="Main article contents..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />

        <div className="max-w-md">
          <ImageUploader
            label="Featured Blog Banner Cover Image"
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
            Publish Article
          </button>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </form>

      {/* Grid listing */}
      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-center gap-4"
          >
            {it.image && (
              <img src={it.image} alt="" className="h-10 w-16 rounded-lg object-cover border" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{it.title}</h4>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                By {it.author} • {it.date} • {it.readTime}
              </div>
            </div>

            <button
              onClick={() => deleteDoc(doc(db, "blog", it.id))}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer animate-in fade-in"
              title="Delete Article"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-10">
            No articles published.
          </div>
        )}
      </div>
    </div>
  );
}

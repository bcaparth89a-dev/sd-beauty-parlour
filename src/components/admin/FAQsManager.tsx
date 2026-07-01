import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import type { FAQItem } from "@/components/sections/FAQSection";

export function FAQsManager() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [form, setForm] = useState({ question: "", answer: "" });

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FAQItem, "id">) })));
    });
  }, []);

  const addFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;

    await addDoc(collection(db, "faqs"), {
      question: form.question.trim(),
      answer: form.answer.trim(),
      order: Date.now(),
    });
    setForm({ question: "", answer: "" });
  };

  return (
    <div className="space-y-8">
      {/* Form Add */}
      <form
        onSubmit={addFAQ}
        className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4"
      >
        <h3 className="font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" /> Add New FAQ
        </h3>

        <input
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm"
          placeholder="Question (e.g. Do you accept credit cards?)"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          required
        />

        <textarea
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm resize-none"
          placeholder="FAQ Answer details..."
          value={form.answer}
          onChange={(e) => setForm({ ...form, answer: e.target.value })}
          required
        />

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4" /> Save FAQ
        </button>
      </form>

      {/* Grid listing */}
      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="bg-card border border-border rounded-2xl p-4 shadow-soft flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-foreground">{it.question}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.answer}</p>
            </div>

            <button
              onClick={() => deleteDoc(doc(db, "faqs", it.id))}
              className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer shrink-0 animate-pulse-hover"
              title="Delete FAQ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-10">No FAQs saved.</div>
        )}
      </div>
    </div>
  );
}

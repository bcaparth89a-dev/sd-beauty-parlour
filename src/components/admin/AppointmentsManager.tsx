import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  MessageSquare,
  Search,
} from "lucide-react";
import { db, logAuditTrail, moveToRecycleBin } from "@/lib/firebase";
import { toast } from "sonner";

type Appointment = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  stylist?: string;
  date: string;
  time: string;
  notes?: string;
  payment: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt?: { seconds: number };
};

export function AppointmentsManager() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<"all" | Appointment["status"]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) })));
    });
  }, []);

  const setStatus = async (id: string, status: Appointment["status"]) => {
    try {
      const oldAppt = items.find((x) => x.id === id);
      const oldStatus = oldAppt?.status || "pending";
      await updateDoc(doc(db, "appointments", id), { status });
      logAuditTrail(
        "Appointment status updated",
        `${oldAppt?.name || "Guest"}'s booking status changed from ${oldStatus} to ${status}`,
        oldStatus,
        status
      );
      toast.success(`Booking marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const filtered = items.filter((it) => {
    const matchesFilter = filter === "all" || it.status === filter;
    const matchesSearch =
      it.name.toLowerCase().includes(search.toLowerCase()) ||
      it.phone.toLowerCase().includes(search.toLowerCase()) ||
      (it.email && it.email.toLowerCase().includes(search.toLowerCase())) ||
      it.service.toLowerCase().includes(search.toLowerCase()) ||
      (it.stylist && it.stylist.toLowerCase().includes(search.toLowerCase())) ||
      (it.notes && it.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Generate WhatsApp reminder link
  const getWhatsAppReminderLink = (it: Appointment) => {
    const cleanPhone = it.phone.replace(/\D/g, "");
    // Ensure country code
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Hello ${it.name}! This is a reminder from SD Beauty Parlour regarding your beauty slot:\n\n` +
        `• Service: ${it.service}\n` +
        `• Schedule: ${it.date} at ${it.time}\n` +
        `• Stylist: ${it.stylist || "Any Stylist"}\n\n` +
        `We look forward to pampering you! Please reply to confirm.`,
    );
    return `https://wa.me/${target}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Controls: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-soft">
        {/* Filters buttons */}
        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize cursor-pointer transition-all ${
                filter === f
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-secondary hover:bg-accent text-muted-foreground"
              }`}
            >
              {f} {f !== "all" && `(${items.filter((i) => i.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary/50 border border-input focus:outline-none focus:border-primary text-xs"
          />
        </div>
      </div>

      {/* Booking Listing cards */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 bg-card border border-border rounded-3xl">
          No appointments found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <div
              key={it.id}
              className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4 hover:shadow-premium transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-lg font-display text-foreground">{it.name}</h3>
                    <span
                      className={`inline-block text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold mt-1.5 ${
                        it.status === "confirmed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : it.status === "completed"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : it.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {it.status || "pending"}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Delete this appointment record?")) {
                        await moveToRecycleBin("appointments", it.id, it);
                        await deleteDoc(doc(db, "appointments", it.id));
                        logAuditTrail(
                          "Appointment deleted",
                          `Deleted appointment record for guest ${it.name} (${it.service})`
                        );
                      }
                    }}
                    className="p-2 rounded-full hover:bg-destructive/10 text-destructive cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <a
                      href={`tel:${it.phone}`}
                      className="hover:text-primary transition-colors font-semibold"
                    >
                      {it.phone}
                    </a>
                  </div>
                  {it.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <a
                        href={`mailto:${it.email}`}
                        className="hover:text-primary transition-colors"
                      >
                        {it.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium font-mono">{it.date}</span>
                    <Clock className="h-3.5 w-3.5 text-primary ml-2" />
                    <span className="font-medium font-mono">{it.time}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1.5">
                    <User className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Stylist:</span>{" "}
                      {it.stylist || "Any Stylist"}
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="font-semibold text-foreground">Service:</span> {it.service}
                  </div>
                  {it.notes && (
                    <div className="bg-secondary/40 p-2.5 rounded-xl border border-border mt-2">
                      <span className="font-semibold text-foreground">Notes:</span> {it.notes}
                    </div>
                  )}
                  <div className="font-semibold text-foreground">Payment: {it.payment}</div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border mt-4">
                {it.status === "pending" && (
                  <>
                    <button
                      onClick={() => setStatus(it.id, "confirmed")}
                      className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirm
                    </button>
                    <button
                      onClick={() => setStatus(it.id, "cancelled")}
                      className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
                    >
                      <XCircle className="h-4 w-4" /> Cancel
                    </button>
                  </>
                )}

                {it.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => setStatus(it.id, "completed")}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark Completed
                    </button>
                    <button
                      onClick={() => setStatus(it.id, "cancelled")}
                      className="py-2 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}

                <a
                  href={getWhatsAppReminderLink(it)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
                  title="Send WhatsApp Reminder"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

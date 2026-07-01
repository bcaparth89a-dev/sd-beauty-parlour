import { useEffect, useState } from "react";
import { addDoc, collection, onSnapshot, query, where, serverTimestamp, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Award,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { db } from "@/lib/firebase";
import { sendAppointmentEmails } from "@/lib/email";
import type { ServiceItem } from "./ServicesSection";
import type { TeamMember } from "./TeamSection";

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
];

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().trim().min(10, "Please enter a valid 10-digit phone number").max(15),
  email: z.string().trim().email("Invalid email format").max(120).or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  stylist: z.string().min(1, "Please select a stylist"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time slot"),
  notes: z.string().max(500).optional(),
  payment: z.string().min(1),
});

type BookedSlot = {
  time: string;
  stylist: string;
};

export function ContactSection() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stylists, setStylists] = useState<TeamMember[]>([]);
  const [existingBookings, setExistingBookings] = useState<BookedSlot[]>([]);
  const [bannerImg, setBannerImg] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    stylist: "Any Stylist",
    date: "",
    time: "",
    notes: "",
    payment: "Cash",
  });

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Load Contact Banner Image
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact_images"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.contactBanner) setBannerImg(d.contactBanner);
      }
    });
    return unsub;
  }, []);

  // Load Services
  useEffect(() => {
    const q = query(collection(db, "services"));
    return onSnapshot(q, (snap) => {
      setServices(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ServiceItem, "id">) })));
    });
  }, []);

  // Load Stylists
  useEffect(() => {
    const q = query(collection(db, "team"));
    return onSnapshot(q, (snap) => {
      setStylists(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) })));
    });
  }, []);

  // Sync existing bookings for date validation
  useEffect(() => {
    if (!form.date) return;
    const q = query(
      collection(db, "appointments"),
      where("date", "==", form.date),
      where("status", "!=", "cancelled"),
    );
    return onSnapshot(q, (snap) => {
      setExistingBookings(snap.docs.map((d) => d.data() as BookedSlot));
    });
  }, [form.date]);

  // Handle selected service from Service Section card trigger
  useEffect(() => {
    const handleSelected = () => {
      const selected = sessionStorage.getItem("selected-service");
      if (selected) {
        setForm((prev) => ({ ...prev, service: selected }));
        setStep(2); // Jump to Stylist Selection
        sessionStorage.removeItem("selected-service");
      }
    };
    window.addEventListener("service-selected", handleSelected);
    handleSelected();
    return () => window.removeEventListener("service-selected", handleSelected);
  }, []);

  const handleNextStep = () => {
    setValidationError(null);
    if (step === 1 && !form.service) {
      return setValidationError("Please select a service first.");
    }
    if (step === 2 && !form.stylist) {
      return setValidationError("Please select a stylist preference.");
    }
    if (step === 3) {
      if (!form.date) return setValidationError("Please pick a date.");
      if (!form.time) return setValidationError("Please select a time slot.");

      // Restrict past dates
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return setValidationError("Cannot book appointments in the past.");
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setValidationError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const isSlotBooked = (slot: string) => {
    return existingBookings.some(
      (b) => b.time === slot && (b.stylist === form.stylist || form.stylist === "Any Stylist"),
    );
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid fields");
      return;
    }

    setSubmitting(true);
    try {
      // Store in Firebase
      await addDoc(collection(db, "appointments"), {
        ...parsed.data,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Send confirmation emails via EmailJS helper
      await sendAppointmentEmails(parsed.data);

      setDone(true);
    } catch (err) {
      setValidationError("Failed to reserve booking. Try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      service: "",
      stylist: "Any Stylist",
      date: "",
      time: "",
      notes: "",
      payment: "Cash",
    });
    setStep(1);
    setDone(false);
  };

  // Generate pre-filled WhatsApp confirmation message link
  const getWhatsAppLink = () => {
    const waPhone = import.meta.env.VITE_PARLOUR_WHATSAPP || "917990101983";
    const text = encodeURIComponent(
      `Hello! I just booked a beauty session:\n\n` +
        `• Guest: ${form.name}\n` +
        `• Service: ${form.service}\n` +
        `• Stylist: ${form.stylist}\n` +
        `• Date: ${form.date} (${form.time})\n\n` +
        `Please confirm my slot. Thank you!`,
    );
    return `https://wa.me/${waPhone}?text=${text}`;
  };

  if (done) {
    return (
      <section
        id="contact"
        className="py-24 bg-secondary/10 relative bg-cover bg-center"
        style={{ backgroundImage: bannerImg ? `url(${bannerImg})` : undefined }}
      >
        {bannerImg && (
          <div className="absolute inset-0 bg-background/90 dark:bg-background/95 z-0 pointer-events-none" />
        )}
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-3xl p-12 shadow-premium space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle className="h-12 w-12" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-display">Session Reserved!</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your appointment is now pending confirmation. We have saved your request and
                dispatched email alerts.
              </p>
            </div>

            <div className="bg-secondary/40 rounded-2xl p-5 text-left text-xs space-y-2 border border-border">
              <div>
                <span className="font-semibold text-foreground">Service:</span> {form.service}
              </div>
              <div>
                <span className="font-semibold text-foreground">Stylist:</span> {form.stylist}
              </div>
              <div>
                <span className="font-semibold text-foreground">Schedule:</span> {form.date} at{" "}
                {form.time}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-soft"
              >
                Send WhatsApp Confirmation
              </a>
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-full border border-border hover:bg-accent text-foreground text-sm font-semibold cursor-pointer transition-all"
              >
                Book Another Session
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="py-24 bg-secondary/15 relative bg-cover bg-center"
      style={{ backgroundImage: bannerImg ? `url(${bannerImg})` : undefined }}
    >
      {bannerImg && (
        <div className="absolute inset-0 bg-background/90 dark:bg-background/95 z-0 pointer-events-none" />
      )}
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Booking System
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display text-foreground">
            Reserve Your <span className="text-gradient-rose">Beauty Slot</span>
          </h2>
        </div>

        {/* Multi-step progress bar */}
        <div className="mb-10 max-w-lg mx-auto">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />

            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => s < step && setStep(s)}
                disabled={s >= step}
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all cursor-pointer ${
                  step === s
                    ? "bg-primary text-white scale-110 shadow-soft"
                    : step > s
                      ? "bg-primary text-white"
                      : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-3 px-1">
            <span>Service</span>
            <span>Stylist</span>
            <span>Schedule</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Wizard Form Frame */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-premium">
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 overflow-hidden"
              >
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse shrink-0" />
                <span>{validationError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* STEP 1: Select Service */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-foreground font-display font-bold text-lg mb-2">
                  <Sparkles className="h-5 w-5 text-primary" /> 1. Select Beauty Service
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Choose Service *
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm"
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                  >
                    <option value="">-- Choose a service --</option>
                    {services.map((s) => (
                      <option
                        key={s.id}
                        value={`${s.category} / ${s.group} / ${s.name} (${s.price})`}
                      >
                        {s.category} • {s.group} • {s.name} ({s.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-muted-foreground bg-secondary/50 rounded-xl p-3 border border-border">
                  Tip: You can also explore catalog cards above and click "Book Now" to
                  automatically select a service.
                </div>
              </motion.div>
            )}

            {/* STEP 2: Select Stylist */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-foreground font-display font-bold text-lg mb-2">
                  <Award className="h-5 w-5 text-primary" /> 2. Preferred Artist / Stylist
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Default Any Stylist */}
                  <div
                    onClick={() => setForm({ ...form, stylist: "Any Stylist" })}
                    className={`cursor-pointer border p-4 rounded-2xl text-center space-y-2 transition-all ${
                      form.stylist === "Any Stylist"
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-primary">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Any Stylist</div>
                      <div className="text-[10px] text-muted-foreground">Recommended</div>
                    </div>
                  </div>

                  {stylists.map((stylist) => (
                    <div
                      key={stylist.id}
                      onClick={() => setForm({ ...form, stylist: stylist.name })}
                      className={`cursor-pointer border p-4 rounded-2xl text-center space-y-2 transition-all ${
                        form.stylist === stylist.name
                          ? "border-primary bg-primary/5 shadow-soft"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      <img
                        src={
                          stylist.image ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop"
                        }
                        alt={stylist.name}
                        className="h-12 w-12 rounded-full object-cover mx-auto border"
                      />
                      <div>
                        <div className="font-bold text-sm truncate">{stylist.name}</div>
                        <div className="text-[10px] text-primary font-medium truncate">
                          {stylist.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Date & Time Selection */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-foreground font-display font-bold text-lg mb-2">
                  <Calendar className="h-5 w-5 text-primary" /> 3. Schedule Date & Time
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Select Date *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm font-semibold"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                    />
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Select Time Slot *
                    </label>
                    {!form.date ? (
                      <div className="text-xs text-muted-foreground italic pt-4">
                        Please select a date first to view slots.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {TIME_SLOTS.map((slot) => {
                          const booked = isSlotBooked(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={booked}
                              onClick={() => setForm({ ...form, time: slot })}
                              className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                booked
                                  ? "bg-secondary text-muted-foreground/50 border-border cursor-not-allowed line-through"
                                  : form.time === slot
                                    ? "gradient-rose text-white border-primary shadow-soft"
                                    : "border-border bg-background hover:bg-secondary"
                              }`}
                            >
                              {slot} {booked && "(Booked)"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Guest Details */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 text-foreground font-display font-bold text-lg mb-2">
                  <User className="h-5 w-5 text-primary" /> 4. Personal Information
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Full Name *
                    </span>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Phone Number *
                    </span>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Email Address (optional)
                      </span>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Special Requests / Notes (optional)
                      </span>
                      <textarea
                        rows={3}
                        maxLength={500}
                        placeholder="Sensitive skin, styling preference..."
                        className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm resize-none"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                        Preferred Payment Method
                      </span>
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:outline-none focus:border-primary text-sm"
                        value={form.payment}
                        onChange={(e) => setForm({ ...form, payment: e.target.value })}
                      >
                        <option>Cash</option>
                        <option>UPI / Google Pay</option>
                        <option>Card</option>
                      </select>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Confirm Booking */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 text-foreground font-display font-bold text-lg mb-2">
                  <CreditCard className="h-5 w-5 text-primary" /> 5. Confirm Your Selection
                </div>

                <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden bg-secondary/20">
                  <div className="flex justify-between items-center p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Service Selected
                    </div>
                    <div className="text-sm font-bold text-foreground text-right max-w-[70%]">
                      {form.service}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Stylist Expert
                    </div>
                    <div className="text-sm font-semibold text-foreground">{form.stylist}</div>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Appointment Schedule
                    </div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 font-mono">
                      <span>{form.date}</span> at <span>{form.time}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Guest details
                    </div>
                    <div className="text-sm font-semibold text-foreground text-right">
                      {form.name} ({form.phone})
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                      Payment Details
                    </div>
                    <div className="text-sm font-semibold text-foreground">{form.payment}</div>
                  </div>
                </div>

                <button
                  onClick={submitBooking}
                  disabled={submitting}
                  className="w-full py-4 rounded-full gradient-rose text-white font-semibold shadow-premium hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {submitting ? "Reserving Slot..." : "Confirm & Send Request"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions Footer */}
          {step < 5 && (
            <div className="flex justify-between items-center pt-6 border-t border-border mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={step === 1 || submitting}
                className="px-6 py-2.5 rounded-full border border-border hover:bg-secondary text-sm font-bold transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={submitting}
                className="px-7 py-2.5 rounded-full gradient-rose text-white text-sm font-bold shadow-soft hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

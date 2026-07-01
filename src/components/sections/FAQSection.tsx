import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { HelpCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  order?: number;
};

const DEFAULT_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Do I need to book an appointment in advance?",
    answer:
      "Yes, we highly recommend booking appointments in advance to secure your preferred stylist, service date, and time slot. Walk-ins are subject to stylist availability.",
  },
  {
    id: "faq-2",
    question: "What luxury makeup brands do you use for bridal makeovers?",
    answer:
      "For bridal and premium makeovers, we use globally-acclaimed professional cosmetics brands, including MAC, Kryolan, Huda Beauty, Anastasia Beverly Hills, and Estée Lauder.",
  },
  {
    id: "faq-3",
    question: "Can I customize my bridal package?",
    answer:
      "Absolutely! We offer flexible customized bridal packages that can bundle hair styling, saree draping, skin facials, nail art, and body spa therapies according to your preferences.",
  },
  {
    id: "faq-4",
    question: "What is your cancellation or rescheduling policy?",
    answer:
      "We understand plans can change. You can cancel or reschedule your booking free of charge up to 24 hours before your appointment. Please contact us via phone or WhatsApp as soon as possible.",
  },
  {
    id: "faq-5",
    question: "Do you offer home services for weddings?",
    answer:
      "Yes, for bridal groups and large wedding groups, our senior makeup artists and stylists can travel directly to your home, hotel room, or venue location. Travel fees may apply depending on distance.",
  },
];

export function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, "faqs"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setFaqs(DEFAULT_FAQS);
        } else {
          setFaqs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FAQItem, "id">) })));
        }
      },
      () => {
        setFaqs(DEFAULT_FAQS);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-primary" /> FAQ
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 font-display">
            Frequently Asked <span className="text-gradient-rose">Questions</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Got questions about our beauty treatments or bridal services? Find quick answers below.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-soft">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={faq.id}
                value={`item-${idx}`}
                className="border-b border-border last:border-b-0 py-1"
              >
                <AccordionTrigger className="text-left font-display font-semibold hover:text-primary transition-colors text-base py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

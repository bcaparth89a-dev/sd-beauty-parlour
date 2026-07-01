import { useEffect, useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  collection,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import {
  Save,
  Loader2,
  Database,
  Sliders,
  Map,
  Clock,
  Phone,
  Sparkles,
  Image as ImageIcon,
  Settings,
  Plus,
  Trash2,
  Award,
  Heart,
  ShieldCheck,
  Info,
  Trash,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { uploadImage } from "@/lib/imgbb";
import type { FeatureItem } from "@/components/sections/WhyChooseUs";
import { ImageUploader } from "@/components/ui/ImageUploader";

type SubTab = "shop" | "home" | "about" | "beforeafter" | "whychooseus" | "contact" | "db";

export function SettingsManager() {
  const [subTab, setSubTab] = useState<SubTab>("shop");

  // Shop settings state
  const [shopForm, setShopForm] = useState({
    name: "SD Beauty Parlour",
    mapsUrl: "",
    hoursMonSat: "",
    hoursSun: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    facebook: "",
    instagram: "",
  });

  // Hero/Home settings state
  const [heroForm, setHeroForm] = useState({
    title1: "",
    title2: "",
    subtitle: "",
    stat1Val: "",
    stat1Lbl: "",
    stat2Val: "",
    stat2Lbl: "",
    stat3Val: "",
    stat3Lbl: "",
    image: "",
    bgImage: "",
    heroImages: [] as string[],
  });

  const [homeImagesForm, setHomeImagesForm] = useState({
    featuredBeautyImg: "",
    whyChooseUsImg: "",
    ctaBannerImg: "",
  });

  // About page state
  const [aboutForm, setAboutForm] = useState({
    aboutBanner: "",
    aboutTitle: "",
    aboutSubtitle: "",
    ownerImg: "",
    ownerName: "",
    ownerDesignation: "",
    ownerBio: "",
    visionImg: "",
    visionTitle: "",
    visionDesc: "",
    missionImg: "",
    missionTitle: "",
    missionDesc: "",
    interiorImgs: [] as string[],
  });

  const [newInteriorUrl, setNewInteriorUrl] = useState("");

  // Contact section images state
  const [contactImagesForm, setContactImagesForm] = useState({
    contactBanner: "",
    frontViewImg: "",
    mapsThumbnail: "",
  });

  // Before/After state
  const [baForm, setBaForm] = useState({
    beforeImg: "",
    afterImg: "",
  });

  // Why Choose Us list state
  const [whyList, setWhyList] = useState<FeatureItem[]>([]);
  const [whyForm, setWhyForm] = useState({
    icon: "Sparkles",
    title: "",
    desc: "",
  });

  // Contact & Location CMS state
  const [contactForm, setContactForm] = useState({
    heading: "Visit Our Parlour",
    description: "Step into our sanctuary of peace and pampering. Let our stylists transform your look.",
    mondayOpen: "10:00 AM",
    mondayClose: "08:00 PM",
    tuesdayOpen: "10:00 AM",
    tuesdayClose: "08:00 PM",
    wednesdayOpen: "10:00 AM",
    wednesdayClose: "08:00 PM",
    thursdayOpen: "10:00 AM",
    thursdayClose: "08:00 PM",
    fridayOpen: "10:00 AM",
    fridayClose: "08:00 PM",
    saturdayOpen: "10:00 AM",
    saturdayClose: "08:00 PM",
    sundayOpen: "10:00 AM",
    sundayClose: "06:00 PM",
    holidayNotes: "Closed on Public Holidays",
    salonName: "SD Beauty Parlour",
    address: "SD Beauty Parlour, Sector V, Salt Lake",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    pincode: "700091",
    phone1: "+91 79901 01983",
    phone2: "",
    whatsapp: "917990101983",
    email: "pawarparth233@gmail.com",
    supportEmail: "",
    emergencyContact: "",
    instagram: "https://instagram.com/sdbeautyparlour",
    facebook: "https://facebook.com/sdbeautyparlour",
    youtube: "",
    whatsappUrl: "https://wa.me/917990101983",
    googleBusiness: "",
    website: "",
    mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1207626917637!2d88.43126447594977!3d22.574528132924197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0275af80000001%3A0x7d02fc9bd91eb105!2sSector%20V%2C%20Salt%20Lake!5e0!3m2!1sen!2sin!4v1718012345678!5m2!1sen!2sin",
    contactSectionImages: [] as string[],
    ctaText: "Schedule Visit",
    ctaLink: "#contact",
    ctaType: "form" as "form" | "whatsapp" | "appointment" | "external",
    expYears: "10+ Years",
    happyClients: "5000+",
    beautyExperts: "10+",
    servicesCount: "50+",
    recipientEmail: "pawarparth233@gmail.com",
    autoReplySubject: "Thank you for contacting SD Beauty Parlour!",
    autoReplyMessage: "Hello! We have received your appointment request. Our beauty expert will reach out to you shortly to confirm.",
    whatsappInquiryText: "Hello! I'd like to book an appointment for a premium service at SD Beauty Parlour.",
    emailjsServiceId: "",
    emailjsCustTemplateId: "",
    emailjsOwnerTemplateId: "",
    emailjsPublicKey: "",
  });

  // Contact Showcase Images Upload states
  const [contactUploading, setContactUploading] = useState(false);
  const [contactUploadProgress, setContactUploadProgress] = useState("");
  const [contactDragActive, setContactDragActive] = useState(false);
  const contactFileInputRef = useRef<HTMLInputElement>(null);
  const replaceContactFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingContactIdx, setReplacingContactIdx] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Hero Showcase Multi-Image Upload states
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadProgress, setHeroUploadProgress] = useState("");
  const [heroDragActive, setHeroDragActive] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);

  const handleHeroFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    setHeroUploading(true);
    const toastId = toast.loading(`Uploading ${list.length} image(s)...`);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        setHeroUploadProgress(`Uploading ${i + 1} of ${list.length}...`);
        const url = await uploadImage(list[i]);
        newUrls.push(url);
      }
      setHeroForm((prev) => ({
        ...prev,
        heroImages: [...(prev.heroImages || []), ...newUrls],
      }));
      toast.success(`Uploaded ${list.length} images successfully!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload some images. Please try again.", { id: toastId });
    } finally {
      setHeroUploading(false);
      setHeroUploadProgress("");
    }
  };

  const handleHeroDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setHeroDragActive(true);
    } else if (e.type === "dragleave") {
      setHeroDragActive(false);
    }
  };

  const handleHeroDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHeroDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleHeroFiles(e.dataTransfer.files);
    }
  };

  const handleHeroFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleHeroFiles(e.target.files);
    }
  };

  const moveHeroImage = (index: number, direction: "left" | "right") => {
    const images = [...(heroForm.heroImages || [])];
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[newIndex];
    images[newIndex] = temp;

    setHeroForm((prev) => ({ ...prev, heroImages: images }));
  };

  const deleteHeroImage = (index: number) => {
    if (confirm("Are you sure you want to remove this image from the hero showcase?")) {
      const updated = (heroForm.heroImages || []).filter((_, i) => i !== index);
      setHeroForm((prev) => ({ ...prev, heroImages: updated }));
    }
  };

  const triggerReplaceHeroImage = (index: number) => {
    setReplacingIdx(index);
    setTimeout(() => {
      replaceFileInputRef.current?.click();
    }, 50);
  };

  const handleReplaceHeroFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (replacingIdx === null || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setHeroUploading(true);
    const toastId = toast.loading("Replacing image...");
    try {
      const url = await uploadImage(file);
      const updated = [...(heroForm.heroImages || [])];
      updated[replacingIdx] = url;
      setHeroForm((prev) => ({ ...prev, heroImages: updated }));
      toast.success("Image replaced successfully!", { id: toastId });
    } catch {
      toast.error("Failed to replace image", { id: toastId });
    } finally {
      setHeroUploading(false);
      setReplacingIdx(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = "";
    }
  };

  // Load Shop details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "business"), (snap) => {
      if (snap.exists()) setShopForm((prev) => ({ ...prev, ...snap.data() }));
    });
  }, []);

  // Load Hero details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "hero"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setHeroForm((prev) => ({
          ...prev,
          ...d,
          heroImages: d.heroImages || [],
        }));
      }
    });
  }, []);

  // Load Home image options
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "home_images"), (snap) => {
      if (snap.exists()) setHomeImagesForm((prev) => ({ ...prev, ...snap.data() }));
    });
  }, []);

  // Load About details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "about"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAboutForm((prev) => ({
          ...prev,
          ...d,
          interiorImgs: d.interiorImgs || [],
        }));
      }
    });
  }, []);

  // Load Contact images details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "contact_images"), (snap) => {
      if (snap.exists()) setContactImagesForm((prev) => ({ ...prev, ...snap.data() }));
    });
  }, []);

  // Load Before After details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "beforeafter"), (snap) => {
      if (snap.exists()) setBaForm((prev) => ({ ...prev, ...snap.data() }));
    });
  }, []);

  // Load Contact CMS details
  useEffect(() => {
    return onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setContactForm((prev) => ({
          ...prev,
          ...d,
          contactSectionImages: d.contactSectionImages || [],
        }));
      }
    });
  }, []);

  // Load Why Choose Us cards list
  useEffect(() => {
    const q = query(collection(db, "whychooseus"), orderBy("order", "asc"));
    return onSnapshot(q, (snap) => {
      setWhyList(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeatureItem, "id">) })));
    });
  }, []);

  // Saves General Shop Settings
  const saveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "business"), shopForm);
      await setDoc(doc(db, "settings", "contact_images"), contactImagesForm);
      toast.success("Shop & Contact configuration saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Saves Hero Banner & Home Images Configs
  const saveHomeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "hero"), heroForm);
      await setDoc(doc(db, "settings", "home_images"), homeImagesForm);
      toast.success("Homepage content & images saved!");
    } catch {
      toast.error("Failed to save homepage customizer details");
    } finally {
      setSaving(false);
    }
  };

  // Saves About Page Configurations
  const saveAboutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "about"), aboutForm);
      toast.success("About page configuration updated!");
    } catch {
      toast.error("Failed to save About settings");
    } finally {
      setSaving(false);
    }
  };

  // Saves Before After photo sliders
  const saveBeforeAfterSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "beforeafter"), baForm);
      toast.success("Before & After images updated!");
    } catch {
      toast.error("Failed to save Before/After slider");
    } finally {
      setSaving(false);
    }
  };

  // Saves Contact & Location CMS Configurations
  const saveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save contact settings master
      await setDoc(doc(db, "settings", "contact"), contactForm);

      // Duplicate core fields to business settings for backward compatibility
      await setDoc(doc(db, "settings", "business"), {
        name: contactForm.salonName,
        phone: contactForm.phone1,
        whatsapp: contactForm.whatsapp,
        email: contactForm.email,
        address: `${contactForm.address}, ${contactForm.city}, ${contactForm.state}, ${contactForm.country} - ${contactForm.pincode}`,
        hoursMonSat: `${contactForm.mondayOpen} - ${contactForm.mondayClose}`,
        hoursSun: `${contactForm.sundayOpen} - ${contactForm.sundayClose}`,
        instagram: contactForm.instagram,
        facebook: contactForm.facebook,
        mapsUrl: contactForm.mapsUrl,
      });

      toast.success("Contact, Map, and Operation schedule updated successfully!");
    } catch {
      toast.error("Failed to save contact settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleContactFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    setContactUploading(true);
    const toastId = toast.loading(`Uploading ${list.length} image(s)...`);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        setContactUploadProgress(`Uploading ${i + 1} of ${list.length}...`);
        const url = await uploadImage(list[i]);
        newUrls.push(url);
      }
      setContactForm((prev) => ({
        ...prev,
        contactSectionImages: [...(prev.contactSectionImages || []), ...newUrls],
      }));
      toast.success(`Uploaded ${list.length} images successfully!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload some images. Please try again.", { id: toastId });
    } finally {
      setContactUploading(false);
      setContactUploadProgress("");
    }
  };

  const handleContactDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setContactDragActive(true);
    } else if (e.type === "dragleave") {
      setContactDragActive(false);
    }
  };

  const handleContactDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setContactDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleContactFiles(e.dataTransfer.files);
    }
  };

  const handleContactFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleContactFiles(e.target.files);
    }
  };

  const moveContactImage = (index: number, direction: "left" | "right") => {
    const images = [...(contactForm.contactSectionImages || [])];
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const temp = images[index];
    images[index] = images[newIndex];
    images[newIndex] = temp;

    setContactForm((prev) => ({ ...prev, contactSectionImages: images }));
  };

  const deleteContactImage = (index: number) => {
    if (confirm("Are you sure you want to remove this image from the contact showcase?")) {
      const updated = (contactForm.contactSectionImages || []).filter((_, i) => i !== index);
      setContactForm((prev) => ({ ...prev, contactSectionImages: updated }));
    }
  };

  const triggerReplaceContactImage = (index: number) => {
    setReplacingContactIdx(index);
    setTimeout(() => {
      replaceContactFileInputRef.current?.click();
    }, 50);
  };

  const handleReplaceContactFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (replacingContactIdx === null || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    setContactUploading(true);
    const toastId = toast.loading("Replacing image...");
    try {
      const url = await uploadImage(file);
      const updated = [...(contactForm.contactSectionImages || [])];
      updated[replacingContactIdx] = url;
      setContactForm((prev) => ({ ...prev, contactSectionImages: updated }));
      toast.success("Image replaced successfully!", { id: toastId });
    } catch {
      toast.error("Failed to replace image", { id: toastId });
    } finally {
      setContactUploading(false);
      setReplacingContactIdx(null);
      if (replaceContactFileInputRef.current) replaceContactFileInputRef.current.value = "";
    }
  };

  // Add Why Choose Us feature
  const addWhyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whyForm.title.trim() || !whyForm.desc.trim()) return;
    try {
      await addDoc(collection(db, "whychooseus"), {
        icon: whyForm.icon,
        title: whyForm.title.trim(),
        desc: whyForm.desc.trim(),
        order: Date.now(),
      });
      setWhyForm({ icon: "Sparkles", title: "", desc: "" });
      toast.success("Highlights card saved!");
    } catch {
      toast.error("Failed to save card");
    }
  };

  // Seeding default content and premium sample images
  const seedSampleData = async () => {
    if (
      !confirm(
        "Are you sure? This will seed default services, team, blog posts, FAQs, offers, and dynamic settings.",
      )
    )
      return;
    setSeeding(true);
    try {
      // 1. Seed Settings Docs
      await setDoc(doc(db, "settings", "business"), {
        name: "SD Beauty Parlour",
        phone: "+91 79901 01983",
        whatsapp: "917990101983",
        email: "pawarparth233@gmail.com",
        address: "SD Beauty Parlour, Your City, India",
        hoursMonSat: "10:00 AM - 8:00 PM",
        hoursSun: "10:00 AM - 6:00 PM",
        mapsUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1207626917637!2d88.43126447594977!3d22.574528132924197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0275af80000001%3A0x7d02fc9bd91eb105!2sSector%20V%2C%20Salt%20Lake!5e0!3m2!1sen!2sin!4v1718012345678!5m2!1sen!2sin",
        facebook: "https://facebook.com/sdbeautyparlour",
        instagram: "https://instagram.com/sdbeautyparlour",
      });

      await setDoc(doc(db, "settings", "hero"), {
        title1: "Where Beauty",
        title2: "Meets Elegance",
        subtitle:
          "Welcome to SD Beauty Parlour. Indulge in bespoke bridal styling, premium hair design, and glowing skin therapies crafted with passion by certified specialists.",
        stat1Val: "10+ Years",
        stat1Lbl: "Experience",
        stat2Val: "5000+",
        stat2Lbl: "Happy Guests",
        stat3Val: "50+",
        stat3Lbl: "Luxury Services",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
        bgImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200",
        heroImages: [
          "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=800",
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800"
        ]
      });

      await setDoc(doc(db, "settings", "home_images"), {
        featuredBeautyImg: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800",
        whyChooseUsImg: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800",
        ctaBannerImg: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200",
      });

      await setDoc(doc(db, "settings", "about"), {
        aboutBanner: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200",
        aboutTitle: "Where Luxury Meets Care",
        aboutSubtitle: "Step into a sanctuary designed to bring out your finest elegance and confidence.",
        ownerImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
        ownerName: "Simran Sen",
        ownerDesignation: "Founder & Creative Director",
        ownerBio: "With over a decade of luxury bridal and hair expertise, Simran started SD Beauty Parlour with a single vision: to craft customized, high-end styling sessions that combine state-of-the-art global techniques with organic personal care.",
        visionImg: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=500",
        visionTitle: "Our Vision",
        visionDesc: "To establish a benchmark for luxury aesthetics and personalized styling experiences in the region, empowering every guest through world-class artistry and uncompromising hygiene standards.",
        missionImg: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=500",
        missionTitle: "Our Mission",
        missionDesc: "To deliver consistent premium styling, skincare, and bridal transformations using only luxury, certified products, curated with a deep focus on customer comfort and safety.",
        interiorImgs: [
          "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=500",
          "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=500",
          "https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=500",
        ],
      });

      await setDoc(doc(db, "settings", "contact_images"), {
        contactBanner: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200",
        frontViewImg: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600",
        mapsThumbnail: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=400",
      });

      await setDoc(doc(db, "settings", "contact"), {
        heading: "Visit Our Parlour",
        description: "Step into our sanctuary of peace and self-care. Let our professionals transform your look.",
        mondayOpen: "10:00 AM",
        mondayClose: "08:00 PM",
        tuesdayOpen: "10:00 AM",
        tuesdayClose: "08:00 PM",
        wednesdayOpen: "10:00 AM",
        wednesdayClose: "08:00 PM",
        thursdayOpen: "10:00 AM",
        thursdayClose: "08:00 PM",
        fridayOpen: "10:00 AM",
        fridayClose: "08:00 PM",
        saturdayOpen: "10:00 AM",
        saturdayClose: "08:00 PM",
        sundayOpen: "10:00 AM",
        sundayClose: "06:00 PM",
        holidayNotes: "Closed on Public Holidays",
        salonName: "SD Beauty Parlour",
        address: "SD Beauty Parlour, Sector V, Salt Lake",
        city: "Kolkata",
        state: "West Bengal",
        country: "India",
        pincode: "700091",
        phone1: "+91 79901 01983",
        phone2: "",
        whatsapp: "917990101983",
        email: "pawarparth233@gmail.com",
        supportEmail: "",
        emergencyContact: "",
        instagram: "https://instagram.com/sdbeautyparlour",
        facebook: "https://facebook.com/sdbeautyparlour",
        youtube: "",
        whatsappUrl: "https://wa.me/917990101983",
        googleBusiness: "",
        website: "",
        mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684.1207626917637!2d88.43126447594977!3d22.574528132924197!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0275af80000001%3A0x7d02fc9bd91eb105!2sSector%20V%2C%20Salt%20Lake!5e0!3m2!1sen!2sin!4v1718012345678!5m2!1sen!2sin",
        contactSectionImages: [
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600",
          "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=600",
          "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600",
        ],
        ctaText: "Schedule Visit",
        ctaLink: "#contact",
        ctaType: "form",
        expYears: "10+ Years",
        happyClients: "5000+",
        beautyExperts: "10+",
        servicesCount: "50+",
        recipientEmail: "pawarparth233@gmail.com",
        autoReplySubject: "Thank you for contacting SD Beauty Parlour!",
        autoReplyMessage: "Hello! We have received your appointment request. Our beauty expert will reach out to you shortly to confirm.",
        whatsappInquiryText: "Hello! I'd like to book an appointment for a premium service at SD Beauty Parlour.",
        emailjsServiceId: "",
        emailjsCustTemplateId: "",
        emailjsOwnerTemplateId: "",
        emailjsPublicKey: "",
      });

      await setDoc(doc(db, "settings", "beforeafter"), {
        beforeImg: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800",
        afterImg: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800",
      });

      toast.success("Complete luxury sample database and images seeded!");
    } catch (e) {
      toast.error("Failed to seed sample database.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Sub-Tabs Header */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
        {(["shop", "home", "about", "beforeafter", "whychooseus", "contact", "db"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${subTab === t
              ? "gradient-rose text-white shadow-soft"
              : "bg-card hover:bg-accent text-muted-foreground"
              }`}
          >
            {t === "beforeafter"
              ? "Before & After"
              : t === "whychooseus"
                ? "Why Choose Us"
                : t === "contact"
                  ? "Contact & Location"
                  : t === "db"
                    ? "Maintenance"
                    : t}
          </button>
        ))}
      </div>

      {/* SUB TAB: General Shop Config */}
      {subTab === "shop" && (
        <form
          onSubmit={saveShopSettings}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-6 animate-in fade-in duration-300"
        >
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Settings className="h-5 w-5 text-primary" /> Shop Branding & Channels
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium block mb-1">Parlour Name</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">Telephone Line</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.phone}
                onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">
                WhatsApp Number (e.g. 917990101983)
              </span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.whatsapp}
                onChange={(e) => setShopForm({ ...shopForm, whatsapp: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">Contact Email</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.email}
                onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium block mb-1">Shop Location Address</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.address}
                onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
            <label className="block">
              <span className="text-xs font-medium block mb-1">
                Monday - Saturday Working Hours
              </span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.hoursMonSat}
                onChange={(e) => setShopForm({ ...shopForm, hoursMonSat: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">Sunday Working Hours</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.hoursSun}
                onChange={(e) => setShopForm({ ...shopForm, hoursSun: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
            <label className="block">
              <span className="text-xs font-medium block mb-1">Instagram Link URL</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.instagram}
                onChange={(e) => setShopForm({ ...shopForm, instagram: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">Facebook Link URL</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={shopForm.facebook}
                onChange={(e) => setShopForm({ ...shopForm, facebook: e.target.value })}
              />
            </label>
          </div>

          {/* Contact Section Image uploads */}
          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Contact & Maps Page Images</h4>
            <div className="grid sm:grid-cols-3 gap-4">
              <ImageUploader
                label="Contact Banner Image"
                value={contactImagesForm.contactBanner}
                onChange={(url) => setContactImagesForm({ ...contactImagesForm, contactBanner: url })}
                aspectRatio="video"
              />
              <ImageUploader
                label="Salon Front View Photo"
                value={contactImagesForm.frontViewImg}
                onChange={(url) => setContactImagesForm({ ...contactImagesForm, frontViewImg: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="Google Maps Thumbnail preview"
                value={contactImagesForm.mapsThumbnail}
                onChange={(url) => setContactImagesForm({ ...contactImagesForm, mapsThumbnail: url })}
                aspectRatio="square"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Save Shop & Contact Details
          </button>
        </form>
      )}

      {/* SUB TAB: Homepage Layout Customizer */}
      {subTab === "home" && (
        <form
          onSubmit={saveHomeSettings}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-6 animate-in fade-in duration-300"
        >
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Sparkles className="h-5 w-5 text-primary" /> Homepage Content & Images
          </h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium block mb-1">Hero Title Line 1 (Plain Text)</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={heroForm.title1}
                onChange={(e) => setHeroForm({ ...heroForm, title1: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">
                Hero Title Line 2 (Gradient Highlight)
              </span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={heroForm.title2}
                onChange={(e) => setHeroForm({ ...heroForm, title2: e.target.value })}
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium block mb-1">Hero Subtext Description</span>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
              value={heroForm.subtitle}
              onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
              required
            />
          </label>

          <div className="grid sm:grid-cols-3 gap-3 border-t border-border pt-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block uppercase">
                Highlight Stat 1
              </span>
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-xs"
                placeholder="10+ Years"
                value={heroForm.stat1Val}
                onChange={(e) => setHeroForm({ ...heroForm, stat1Val: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-[10px]"
                placeholder="Label"
                value={heroForm.stat1Lbl}
                onChange={(e) => setHeroForm({ ...heroForm, stat1Lbl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block uppercase">
                Highlight Stat 2
              </span>
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-xs"
                placeholder="5000+"
                value={heroForm.stat2Val}
                onChange={(e) => setHeroForm({ ...heroForm, stat2Val: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-[10px]"
                placeholder="Label"
                value={heroForm.stat2Lbl}
                onChange={(e) => setHeroForm({ ...heroForm, stat2Lbl: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block uppercase">
                Highlight Stat 3
              </span>
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-xs"
                placeholder="50+"
                value={heroForm.stat3Val}
                onChange={(e) => setHeroForm({ ...heroForm, stat3Val: e.target.value })}
                required
              />
              <input
                className="w-full px-3 py-2 rounded bg-background border border-input text-[10px]"
                placeholder="Label"
                value={heroForm.stat3Lbl}
                onChange={(e) => setHeroForm({ ...heroForm, stat3Lbl: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Homepage Images */}
          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Homepage Visual Assets</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ImageUploader
                label="Hero Background Image"
                value={heroForm.bgImage}
                onChange={(url) => setHeroForm({ ...heroForm, bgImage: url })}
                aspectRatio="video"
              />
              <ImageUploader
                label="Hero Side Showcase Image"
                value={heroForm.image}
                onChange={(url) => setHeroForm({ ...heroForm, image: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="Featured Beauty Image"
                value={homeImagesForm.featuredBeautyImg}
                onChange={(url) => setHomeImagesForm({ ...homeImagesForm, featuredBeautyImg: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="Why Choose Us Side Image"
                value={homeImagesForm.whyChooseUsImg}
                onChange={(url) => setHomeImagesForm({ ...homeImagesForm, whyChooseUsImg: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="CTA Booking Section Banner Image"
                value={homeImagesForm.ctaBannerImg}
                onChange={(url) => setHomeImagesForm({ ...homeImagesForm, ctaBannerImg: url })}
                aspectRatio="video"
              />
            </div>
          </div>

          {/* Hero Showcase Multi-Image Customizer */}
          <div className="border-t border-border pt-6 space-y-4">
            <div>
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Hero Showcase Multi-Image (Apple-Style Slideshow)
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                Upload multiple images to display in an elegant, cinematic sliding stack slideshow in the Hero section showcase.
              </p>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={heroFileInputRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleHeroFileSelect}
              disabled={heroUploading}
            />
            <input
              type="file"
              ref={replaceFileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleReplaceHeroFile}
              disabled={heroUploading}
            />

            {/* Grid of uploaded images */}
            {heroForm.heroImages && heroForm.heroImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {heroForm.heroImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden group border border-border bg-muted shadow-soft"
                  >
                    <img src={img} alt={`Showcase ${idx + 1}`} className="w-full h-full object-cover" />

                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-10">
                      {/* Top actions (Replace, Delete) */}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => triggerReplaceHeroImage(idx)}
                          disabled={heroUploading}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                          title="Replace Image"
                        >
                          {heroUploading && replacingIdx === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHeroImage(idx)}
                          disabled={heroUploading}
                          className="p-1.5 rounded-full bg-destructive/80 hover:bg-destructive text-white transition-colors cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bottom actions (Reorder arrows) */}
                      <div className="flex justify-between items-center w-full">
                        {idx > 0 ? (
                          <button
                            type="button"
                            onClick={() => moveHeroImage(idx, "left")}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        ) : (
                          <div />
                        )}
                        <span className="text-[10px] text-white/90 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                          {idx + 1}
                        </span>
                        {idx < heroForm.heroImages.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => moveHeroImage(idx, "right")}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                            title="Move Right"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            <div
              onDragEnter={handleHeroDrag}
              onDragOver={handleHeroDrag}
              onDragLeave={handleHeroDrag}
              onDrop={handleHeroDrop}
              onClick={() => heroFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${heroDragActive
                ? "border-primary bg-primary/5 scale-[0.98]"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/40"
                }`}
            >
              {heroUploading && replacingIdx === null ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-foreground">
                    {heroUploadProgress || "Uploading showcase images..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Drag & drop multiple files here or <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Supports JPG, PNG, WEBP. Add images to the sliding showcase.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Save Homepage Configuration
          </button>
        </form>
      )}

      {/* SUB TAB: About Page Layout Customizer */}
      {subTab === "about" && (
        <form
          onSubmit={saveAboutSettings}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-6 animate-in fade-in duration-300"
        >
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <Info className="h-5 w-5 text-primary" /> About Page Dynamic Content
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium block mb-1">About Header Title</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={aboutForm.aboutTitle}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutTitle: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium block mb-1">About Header Subtitle</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                value={aboutForm.aboutSubtitle}
                onChange={(e) => setAboutForm({ ...aboutForm, aboutSubtitle: e.target.value })}
                required
              />
            </label>
          </div>

          {/* Owner/Founder Section */}
          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-bold text-xs text-primary uppercase">Founder & Owner Profile</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Owner Name</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={aboutForm.ownerName}
                  onChange={(e) => setAboutForm({ ...aboutForm, ownerName: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Owner Designation</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={aboutForm.ownerDesignation}
                  onChange={(e) => setAboutForm({ ...aboutForm, ownerDesignation: e.target.value })}
                  required
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium block mb-1">Founder Short Bio</span>
              <textarea
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
                value={aboutForm.ownerBio}
                onChange={(e) => setAboutForm({ ...aboutForm, ownerBio: e.target.value })}
                required
              />
            </label>
          </div>

          {/* Vision & Mission */}
          <div className="grid sm:grid-cols-2 gap-6 border-t border-border pt-4">
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-primary uppercase">Our Vision Details</h4>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Vision Title</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={aboutForm.visionTitle}
                  onChange={(e) => setAboutForm({ ...aboutForm, visionTitle: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Vision Statement Details</span>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
                  value={aboutForm.visionDesc}
                  onChange={(e) => setAboutForm({ ...aboutForm, visionDesc: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs text-primary uppercase">Our Mission Details</h4>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Mission Title</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={aboutForm.missionTitle}
                  onChange={(e) => setAboutForm({ ...aboutForm, missionTitle: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Mission Statement Details</span>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
                  value={aboutForm.missionDesc}
                  onChange={(e) => setAboutForm({ ...aboutForm, missionDesc: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* About Layout Image Uploads */}
          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">About Layout Images</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ImageUploader
                label="About Header Banner"
                value={aboutForm.aboutBanner}
                onChange={(url) => setAboutForm({ ...aboutForm, aboutBanner: url })}
                aspectRatio="video"
              />
              <ImageUploader
                label="Owner Profile Photo"
                value={aboutForm.ownerImg}
                onChange={(url) => setAboutForm({ ...aboutForm, ownerImg: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="Vision Section Showcase Image"
                value={aboutForm.visionImg}
                onChange={(url) => setAboutForm({ ...aboutForm, visionImg: url })}
                aspectRatio="square"
              />
              <ImageUploader
                label="Mission Section Showcase Image"
                value={aboutForm.missionImg}
                onChange={(url) => setAboutForm({ ...aboutForm, missionImg: url })}
                aspectRatio="square"
              />
            </div>
          </div>

          {/* Interior Images list */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Salon Interior Gallery ({aboutForm.interiorImgs.length})
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {aboutForm.interiorImgs.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border bg-muted">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = aboutForm.interiorImgs.filter((_, i) => i !== idx);
                      setAboutForm({ ...aboutForm, interiorImgs: updated });
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="max-w-md">
              <ImageUploader
                label="Add New Interior Space Photo"
                value={newInteriorUrl}
                onChange={(url) => {
                  if (url) {
                    setAboutForm({ ...aboutForm, interiorImgs: [...aboutForm.interiorImgs, url] });
                    setNewInteriorUrl("");
                    toast.success("Salon interior photo added!");
                  }
                }}
                aspectRatio="video"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Save About Page Content
          </button>
        </form>
      )}

      {/* SUB TAB: Before & After Photos */}
      {subTab === "beforeafter" && (
        <form
          onSubmit={saveBeforeAfterSettings}
          className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5 animate-in fade-in duration-300"
        >
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <ImageIcon className="h-5 w-5 text-primary" /> Before & After Slider
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUploader
              label="Before Image"
              value={baForm.beforeImg}
              onChange={(url) => setBaForm({ ...baForm, beforeImg: url })}
              aspectRatio="square"
            />
            <ImageUploader
              label="After Image"
              value={baForm.afterImg}
              onChange={(url) => setBaForm({ ...baForm, afterImg: url })}
              aspectRatio="square"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Save Slider Photos
          </button>
        </form>
      )}

      {/* SUB TAB: Why Choose Us Cards Builder */}
      {subTab === "whychooseus" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form
            onSubmit={addWhyItem}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Award className="h-5 w-5 text-primary" /> Add Highlights Card
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Select Icon</span>
                <select
                  value={whyForm.icon}
                  onChange={(e) => setWhyForm({ ...whyForm, icon: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
                >
                  <option value="Award">Certified Seal (Award)</option>
                  <option value="Sparkles">Beauty Magic (Sparkles)</option>
                  <option value="ShieldCheck">Safe Hygenic (ShieldCheck)</option>
                  <option value="Heart">Guest Care (Heart)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Card Title</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  placeholder="e.g. Certified Stylists"
                  value={whyForm.title}
                  onChange={(e) => setWhyForm({ ...whyForm, title: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium block mb-1">Highlight Detail description</span>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                placeholder="Brief card summary description..."
                value={whyForm.desc}
                onChange={(e) => setWhyForm({ ...whyForm, desc: e.target.value })}
                required
              />
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
            >
              <Plus className="h-4 w-4" /> Save Highlight Card
            </button>
          </form>

          {/* Cards List */}
          <div className="grid sm:grid-cols-2 gap-4">
            {whyList.map((it) => (
              <div
                key={it.id}
                className="bg-card border border-border p-4 rounded-2xl flex justify-between items-center gap-3 shadow-soft"
              >
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span className="text-xs text-primary font-mono bg-secondary px-2 py-0.5 rounded">
                      {it.icon}
                    </span>
                    <span>{it.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{it.desc}</p>
                </div>
                <button
                  onClick={() => deleteDoc(doc(db, "whychooseus", it.id))}
                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive cursor-pointer shrink-0"
                  title="Delete Card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB: Contact & Location CMS */}
      {subTab === "contact" && (
        <form
          onSubmit={saveContactSettings}
          className="space-y-6 animate-in fade-in duration-300 pb-12"
        >
          {/* Section Branding Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-5 w-5" /> 1. Section Branding & Header
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Section Title</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.heading}
                  onChange={(e) => setContactForm({ ...contactForm, heading: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Section Description</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.description}
                  onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* Business Hours Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Clock className="h-5 w-5" /> 2. Weekly Business Hours
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                <div key={day} className="border border-border p-3 rounded-xl bg-secondary/10 space-y-2">
                  <span className="text-xs font-bold capitalize text-foreground">{day}</span>
                  <div className="space-y-1.5">
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground block">Open</span>
                      <input
                        className="w-full px-2 py-1 rounded bg-background border border-input text-[10px] font-mono"
                        placeholder="e.g. 10:00 AM"
                        value={(contactForm as any)[`${day}Open`]}
                        onChange={(e) => setContactForm({ ...contactForm, [`${day}Open`]: e.target.value })}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground block">Close</span>
                      <input
                        className="w-full px-2 py-1 rounded bg-background border border-input text-[10px] font-mono"
                        placeholder="e.g. 08:00 PM"
                        value={(contactForm as any)[`${day}Close`]}
                        onChange={(e) => setContactForm({ ...contactForm, [`${day}Close`]: e.target.value })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Special Holiday Notes / Shutdown Info</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  placeholder="e.g. Closed on Public Holidays"
                  value={contactForm.holidayNotes}
                  onChange={(e) => setContactForm({ ...contactForm, holidayNotes: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* Contact details & Address Details */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Phone className="h-5 w-5" /> 3. Address & Communication Info
            </h3>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Salon Name</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.salonName}
                  onChange={(e) => setContactForm({ ...contactForm, salonName: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Street Address</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">City</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.city}
                  onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">State</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.state}
                  onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Country</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.country}
                  onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Pincode</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.pincode}
                  onChange={(e) => setContactForm({ ...contactForm, pincode: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 border-t border-border pt-4">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Primary Phone Number</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.phone1}
                  onChange={(e) => setContactForm({ ...contactForm, phone1: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Secondary Phone Number</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.phone2}
                  onChange={(e) => setContactForm({ ...contactForm, phone2: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">WhatsApp Phone (WhatsApp Link trigger)</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.whatsapp}
                  onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Primary Email Address</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Support Email Address</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.supportEmail}
                  onChange={(e) => setContactForm({ ...contactForm, supportEmail: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Emergency Contact Number</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.emergencyContact}
                  onChange={(e) => setContactForm({ ...contactForm, emergencyContact: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* Social Media Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Sliders className="h-5 w-5" /> 4. Social Media URLs
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Instagram Profile Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.instagram}
                  onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Facebook Page Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.facebook}
                  onChange={(e) => setContactForm({ ...contactForm, facebook: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">YouTube Channel Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.youtube}
                  onChange={(e) => setContactForm({ ...contactForm, youtube: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">WhatsApp Direct Chat Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.whatsappUrl}
                  onChange={(e) => setContactForm({ ...contactForm, whatsappUrl: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Google Business Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.googleBusiness}
                  onChange={(e) => setContactForm({ ...contactForm, googleBusiness: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Business Website Link</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.website}
                  onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })}
                />
              </label>
            </div>
          </div>


          {/* Salon Images Slideshow Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
                <ImageIcon className="h-5 w-5" /> 6. Salon Images Showcase (Interior, Exterior, reception, etc.)
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Upload multiple images. They will display in an elegant, Ken Burns zoom-in cross-fade looping slideshow.
              </p>
            </div>

            {/* Hidden inputs */}
            <input
              type="file"
              ref={contactFileInputRef}
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleContactFileSelect}
              disabled={contactUploading}
            />
            <input
              type="file"
              ref={replaceContactFileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleReplaceContactFile}
              disabled={contactUploading}
            />

            {/* Grid of uploaded images */}
            {contactForm.contactSectionImages && contactForm.contactSectionImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {contactForm.contactSectionImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/5] rounded-2xl overflow-hidden group border border-border bg-muted shadow-soft"
                  >
                    <img src={img} alt={`Showcase ${idx + 1}`} className="w-full h-full object-cover" />

                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-10">
                      {/* Top actions (Replace, Delete) */}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => triggerReplaceContactImage(idx)}
                          disabled={contactUploading}
                          className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                          title="Replace Image"
                        >
                          {contactUploading && replacingContactIdx === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteContactImage(idx)}
                          disabled={contactUploading}
                          className="p-1.5 rounded-full bg-destructive/80 hover:bg-destructive text-white transition-colors cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Bottom actions (Reorder arrows) */}
                      <div className="flex justify-between items-center w-full">
                        {idx > 0 ? (
                          <button
                            type="button"
                            onClick={() => moveContactImage(idx, "left")}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                            title="Move Left"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                        ) : (
                          <div />
                        )}
                        <span className="text-[10px] text-white/90 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                          {idx + 1}
                        </span>
                        {idx < contactForm.contactSectionImages.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => moveContactImage(idx, "right")}
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                            title="Move Right"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone */}
            <div
              onDragEnter={handleContactDrag}
              onDragOver={handleContactDrag}
              onDragLeave={handleContactDrag}
              onDrop={handleContactDrop}
              onClick={() => contactFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${contactDragActive
                ? "border-primary bg-primary/5 scale-[0.98]"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-secondary/40"
                }`}
            >
              {contactUploading && replacingContactIdx === null ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-foreground">
                    {contactUploadProgress || "Uploading contact images..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Drag & drop multiple files here or <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Supports JPG, PNG, WEBP. Add images to the contact sliding showcase.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Customizer */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Sliders className="h-5 w-5" /> 7. CTA Button Action Manager
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Button text label</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  placeholder="e.g. Schedule Visit"
                  value={contactForm.ctaText}
                  onChange={(e) => setContactForm({ ...contactForm, ctaText: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Action Button Type</span>
                <select
                  value={contactForm.ctaType}
                  onChange={(e) => setContactForm({ ...contactForm, ctaType: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-input text-xs"
                >
                  <option value="form">Scroll to Booking Form</option>
                  <option value="whatsapp">Launch WhatsApp Chat link</option>
                  <option value="appointment">Appointment Anchor</option>
                  <option value="external">External Page Redirect Link</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Action Destination Link / Value</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  placeholder="e.g. #contact or WhatsApp URL"
                  value={contactForm.ctaLink}
                  onChange={(e) => setContactForm({ ...contactForm, ctaLink: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* Experience Counters Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-5 w-5" /> 8. Performance counters
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Years of Experience</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.expYears}
                  onChange={(e) => setContactForm({ ...contactForm, expYears: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Happy Guests Count</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.happyClients}
                  onChange={(e) => setContactForm({ ...contactForm, happyClients: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Beauty Experts Count</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.beautyExperts}
                  onChange={(e) => setContactForm({ ...contactForm, beautyExperts: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Beauty Services Offered</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.servicesCount}
                  onChange={(e) => setContactForm({ ...contactForm, servicesCount: e.target.value })}
                  required
                />
              </label>
            </div>
          </div>

          {/* Contact Form & EmailJS Settings */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-primary">
              <Settings className="h-5 w-5" /> 9. Form & EmailJS Credentials
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Recipient Booking Alert Email</span>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.recipientEmail}
                  onChange={(e) => setContactForm({ ...contactForm, recipientEmail: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">WhatsApp Inquiry Default Message</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.whatsappInquiryText}
                  onChange={(e) => setContactForm({ ...contactForm, whatsappInquiryText: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <label className="block">
                <span className="text-xs font-medium block mb-1">Auto Reply Subject line</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs"
                  value={contactForm.autoReplySubject}
                  onChange={(e) => setContactForm({ ...contactForm, autoReplySubject: e.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Auto Reply Confirmation Message body</span>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs resize-none"
                  value={contactForm.autoReplyMessage}
                  onChange={(e) => setContactForm({ ...contactForm, autoReplyMessage: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-border pt-4">
              <label className="block">
                <span className="text-xs font-medium block mb-1">EmailJS Service ID (Optional override)</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs font-mono"
                  placeholder="e.g. service_xxxxxx"
                  value={contactForm.emailjsServiceId}
                  onChange={(e) => setContactForm({ ...contactForm, emailjsServiceId: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Customer Template ID (Optional override)</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs font-mono"
                  placeholder="e.g. template_xxxxxx"
                  value={contactForm.emailjsCustTemplateId}
                  onChange={(e) => setContactForm({ ...contactForm, emailjsCustTemplateId: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">Owner Template ID (Optional override)</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs font-mono"
                  placeholder="e.g. template_xxxxxx"
                  value={contactForm.emailjsOwnerTemplateId}
                  onChange={(e) => setContactForm({ ...contactForm, emailjsOwnerTemplateId: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium block mb-1">EmailJS Public Key (Optional override)</span>
                <input
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-input text-xs font-mono"
                  placeholder="e.g. user_xxxxxx or key"
                  value={contactForm.emailjsPublicKey}
                  onChange={(e) => setContactForm({ ...contactForm, emailjsPublicKey: e.target.value })}
                />
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full gradient-rose text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-soft"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Save Contact Details & Operation Settings
          </button>
        </form>
      )}

      {/* SUB TAB: Seeder */}
      {subTab === "db" && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4 animate-in fade-in duration-300">
          <h3 className="font-semibold flex items-center gap-2 text-amber-600">
            <Database className="h-5 w-5" /> Database Maintenance
          </h3>
          <p className="text-xs text-muted-foreground">
            Instantly seed and overwrite/populate the database with pre-configured beauty packages,
            team designers, active discount campaigns, FAQs, and dynamic layouts for
            testing.
          </p>
          <button
            onClick={seedSampleData}
            disabled={seeding}
            className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-soft"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Reset & Seed All Collections
          </button>
        </div>
      )}
    </div>
  );
}

import emailjs from "@emailjs/browser";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

type EmailParams = {
  name: string;
  phone: string;
  email?: string;
  service: string;
  date: string;
  time: string;
  stylist: string;
  notes?: string;
  payment: string;
};

export async function sendAppointmentEmails(params: EmailParams) {
  let serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  let custTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_CUSTOMER;
  let ownerTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_OWNER;
  let publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  let parlourPhone = import.meta.env.VITE_PARLOUR_PHONE || "+91 79901 01983";
  let parlourAddress = import.meta.env.VITE_PARLOUR_ADDRESS || "SD Beauty Parlour, India";
  let parlourEmail = import.meta.env.VITE_PARLOUR_EMAIL || "pawarparth233@gmail.com";
  let autoReplySubject = "Thank you for contacting SD Beauty Parlour!";
  let autoReplyMessage = "Hello! We have received your appointment request. Our beauty expert will reach out to you shortly to confirm.";

  try {
    const docRef = doc(db, "settings", "contact");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.emailjsServiceId) serviceId = data.emailjsServiceId;
      if (data.emailjsCustTemplateId) custTemplateId = data.emailjsCustTemplateId;
      if (data.emailjsOwnerTemplateId) ownerTemplateId = data.emailjsOwnerTemplateId;
      if (data.emailjsPublicKey) publicKey = data.emailjsPublicKey;

      if (data.phone1) parlourPhone = data.phone1;
      if (data.address) {
        const parts = [
          data.address,
          data.city,
          data.state,
          data.country
        ].filter(Boolean);
        parlourAddress = parts.join(", ") + (data.pincode ? ` - ${data.pincode}` : "");
      }
      if (data.recipientEmail) parlourEmail = data.recipientEmail;
      else if (data.email) parlourEmail = data.email;

      if (data.autoReplySubject) autoReplySubject = data.autoReplySubject;
      if (data.autoReplyMessage) autoReplyMessage = data.autoReplyMessage;
    }
  } catch (err) {
    console.warn("Failed to load custom email settings from Firestore, using environment defaults:", err);
  }

  // Params structured for Customer Confirmation Email
  const customerParams = {
    to_name: params.name,
    to_email: params.email || "",
    service_name: params.service,
    booking_date: params.date,
    booking_time: params.time,
    stylist_name: params.stylist,
    payment_method: params.payment,
    parlour_phone: parlourPhone,
    parlour_address: parlourAddress,
    parlour_email: parlourEmail,
    auto_reply_subject: autoReplySubject,
    auto_reply_message: autoReplyMessage,
  };

  // Params structured for Owner Notification Email
  const ownerParams = {
    owner_email: parlourEmail,
    customer_name: params.name,
    customer_phone: params.phone,
    customer_email: params.email || "N/A",
    service_name: params.service,
    booking_date: params.date,
    booking_time: params.time,
    stylist_name: params.stylist,
    payment_method: params.payment,
    special_notes: params.notes || "None",
    timestamp: new Date().toLocaleString(),
  };

  // Check if fully configured, else log mocks
  if (!serviceId || !publicKey || !custTemplateId || !ownerTemplateId) {
    console.log(
      "%c[EmailJS Mock Triggered - Missing Credentials]",
      "color: #b8860b; font-weight: bold;",
    );
    console.log("Customer Confirmation Email Template Params:", customerParams);
    console.log("Owner Notification Email Template Params:", ownerParams);
    return { success: true, mock: true };
  }

  try {
    // Send Customer Confirmation Email (if email is provided)
    if (params.email?.trim()) {
      await emailjs.send(serviceId, custTemplateId, customerParams, publicKey);
      console.log("Confirmation email dispatched to customer successfully.");
    }

    // Send Owner Alert Email
    await emailjs.send(serviceId, ownerTemplateId, ownerParams, publicKey);
    console.log("Notification email dispatched to owner successfully.");

    return { success: true };
  } catch (err) {
    console.error("EmailJS dispatch failure:", err);
    throw err;
  }
}

# SD Beauty Parlour Web Application

A modern, fully-featured web application for SD Beauty Parlour built with React, Vite, TypeScript, and TailwindCSS. The project features a stunning, interactive client-facing interface as well as a powerful, secure Admin Panel for complete business operations management.

---

## 🚀 Features

### Client-Facing Website
* **Interactive Hero Section:** Beautiful visual entry point with call-to-actions.
* **Service Menu:** Categorized view of beauty services with descriptions and pricing.
* **Offers & Promotions:** Display of current active deals and discount cards.
* **Before & After Gallery:** Interactive slider showcase of makeover results.
* **Stylist & Team Showcases:** Introductions to the parlor's professional team.
* **Client Reviews & FAQs:** Built-in frequently asked questions accordion.
* **Map & Hours Integration:** Location map powered by Leaflet and operation details.
* **Contact & Appointment Form:** Client communication channels with EmailJS integration.

### Secure Admin Panel (`/admin`)
* **Dashboard Analytics:** Visualized financial charts, appointment trends, and user statistics.
* **Appointment Management:** Real-time scheduler to view, edit, approve, or cancel client bookings.
* **Service & Offer Manager:** Create, update, or delete services and promotional campaigns directly.
* **Gallery & Team Managers:** Upload new portfolio images and manage stylist profiles.
* **Financial Management:** Record income and expenses, export spreadsheet reports (`xlsx`), and download transaction archives (`zip`).
* **Settings Manager:** Dynamically update business hours, location details, social links, contact details, and theme configurations.

---

## 🛠️ Technology Stack

* **Frontend:** [React](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Routing:** React Router v7
* **Styling:** [TailwindCSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (animations) + [Radix UI](https://www.radix-ui.com/)
* **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore database and Authentication)
* **Image Hosting:** [ImgBB API](https://imgbb.com/) for dynamic upload of administrative media assets
* **Data Processing:** `xlsx` (Excel sheets) & `jszip` (zipped file exports)

---

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/bcaparth89a-dev/sd-beauty-parlour.git
   cd sd-beauty-parlour
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the Environment Variables:
   * Copy the `.env.example` file to create a `.env` file:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` and fill in the required keys with your actual values (e.g., Firebase config keys, ImgBB API key, and admin credentials). See below for details.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🔑 Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `sdbeautyparlour` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Cloud Storage Bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `208258772032` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:2082587...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Google Analytics ID | `G-XXXXXXXXXX` |
| `VITE_IMGBB_API_KEY` | ImgBB API Key for Image Uploads | `6de629...` |
| `VITE_ADMIN_EMAIL` | Default Admin login email address | `admin@sdbeauty.com` |
| `VITE_ADMIN_PASSWORD` | Default Admin login password | `password123` |
| `VITE_PARLOUR_PHONE` | Direct phone contact | `+917990101983` |
| `VITE_PARLOUR_WHATSAPP` | Direct WhatsApp phone number (with country code) | `917990101983` |
| `VITE_PARLOUR_EMAIL` | Business email | `info@sdbeauty.com` |
| `VITE_PARLOUR_INSTAGRAM` | Instagram business profile link | `https://instagram.com/` |
| `VITE_PARLOUR_FACEBOOK` | Facebook business page link | `https://facebook.com/` |
| `VITE_PARLOUR_ADDRESS` | Physical shop address | `SD Beauty Parlour, India` |

> [!IMPORTANT]
> The `.env` file is excluded from git commits using `.gitignore` to prevent leaking secure API keys and admin credentials to GitHub. Always store actual keys locally or in your deployment environment's secret settings.

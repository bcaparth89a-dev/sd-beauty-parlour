import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, addDoc, collection, serverTimestamp, doc, updateDoc, increment, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const logAuditTrail = async (
  action: string,
  details: string,
  oldValue?: string | null,
  newValue?: string | null
) => {
  try {
    const operator = sessionStorage.getItem("admin-operator") || "Admin";
    await addDoc(collection(db, "audit_logs"), {
      operator,
      action,
      details,
      oldValue: oldValue || null,
      newValue: newValue || null,
      timestamp: serverTimestamp(),
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

export const moveToRecycleBin = async (
  collectionName: string,
  id: string,
  data: any
) => {
  try {
    const cleanData = { ...data };
    delete cleanData.id;

    await addDoc(collection(db, "recycle_bin"), {
      originalCollection: collectionName,
      originalId: id,
      data: cleanData,
      deletedAt: Date.now(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to move item to recycle bin:", err);
  }
};

export const trackLocationMetric = async (metricName: "views" | "directions" | "mapClicks" | "navClicks") => {
  try {
    const docRef = doc(db, "settings", "location_analytics");
    await updateDoc(docRef, {
      [metricName]: increment(1)
    }).catch(async (err) => {
      // If document doesn't exist, initialize it
      if (err.code === "not-found") {
        await setDoc(docRef, {
          views: 0,
          directions: 0,
          mapClicks: 0,
          navClicks: 0,
          [metricName]: 1
        });
      } else {
        console.error("Failed to update location analytics:", err);
      }
    });
  } catch (err) {
    console.error("Failed to track location metric:", err);
  }
};

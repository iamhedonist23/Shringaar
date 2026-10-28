import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

export function getMaintenanceFirebaseApp() {
  const existing = getApps().find((app) => app.name === "shringaar-firebase-maintenance");
  if (existing) return existing;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!projectId) {
    throw new Error("FIREBASE_ADMIN_PROJECT_ID is required.");
  }
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  if (emulatorHost && /^(localhost|127\.0\.0\.1):\d+$/.test(emulatorHost)) {
    return initializeApp(
      { projectId },
      "shringaar-firebase-maintenance",
    );
  }
  const useApplicationDefault =
    process.env.FIREBASE_ADMIN_USE_ADC?.trim().toLowerCase() === "true";
  if ((!clientEmail || !privateKey) && !useApplicationDefault) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or enable FIREBASE_ADMIN_USE_ADC for local development.",
    );
  }
  return initializeApp(
    {
      credential: useApplicationDefault
        ? applicationDefault()
        : cert({ projectId, clientEmail: clientEmail!, privateKey: privateKey! }),
      projectId,
    },
    "shringaar-firebase-maintenance",
  );
}

import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export class FirebaseAdminConfigurationError extends Error {}

const appName = "shringaar-firebase-admin";
type FirebaseAdminGlobal = typeof globalThis & {
  __shringaarFirestore?: ReturnType<typeof getFirestore>;
};
const globalForFirebaseAdmin = globalThis as FirebaseAdminGlobal;

function getAdminApp(): App {
  const existing = getApps().find((app) => app.name === appName);
  if (existing) return existing;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const useApplicationDefault =
    process.env.FIREBASE_ADMIN_USE_ADC?.trim().toLowerCase() === "true";

  if (process.env.FIRESTORE_EMULATOR_HOST?.trim() && projectId) {
    return initializeApp({ projectId }, appName);
  }

  if (useApplicationDefault) {
    if (process.env.NODE_ENV === "production") {
      throw new FirebaseAdminConfigurationError(
        "FIREBASE_ADMIN_USE_ADC is for local development only. Configure the Firebase Admin service-account environment variables in production.",
      );
    }
    if (!projectId) {
      throw new FirebaseAdminConfigurationError(
        "Set FIREBASE_ADMIN_PROJECT_ID before enabling Firebase Application Default Credentials.",
      );
    }
    return initializeApp(
      { credential: applicationDefault(), projectId },
      appName,
    );
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseAdminConfigurationError(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    },
    appName,
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseAdminFirestore() {
  if (globalForFirebaseAdmin.__shringaarFirestore) {
    return globalForFirebaseAdmin.__shringaarFirestore;
  }

  const firestore = getFirestore(getAdminApp());
  firestore.settings({ ignoreUndefinedProperties: true });
  globalForFirebaseAdmin.__shringaarFirestore = firestore;
  return firestore;
}

export function getFirebaseAdminStorageBucket() {
  const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST?.trim();
  if (process.env.NODE_ENV === "production" && emulatorHost) {
    throw new FirebaseAdminConfigurationError(
      "FIREBASE_STORAGE_EMULATOR_HOST must not be set in production.",
    );
  }
  if (process.env.FIRESTORE_EMULATOR_HOST?.trim() && !emulatorHost) {
    throw new FirebaseAdminConfigurationError(
      "Set FIREBASE_STORAGE_EMULATOR_HOST when using the Firestore emulator so local uploads cannot reach a live Storage bucket.",
    );
  }

  const bucketName =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucketName) {
    throw new FirebaseAdminConfigurationError(
      "Set FIREBASE_ADMIN_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to enable product image uploads.",
    );
  }
  return getStorage(getAdminApp()).bucket(bucketName);
}

import "dotenv/config";
import { z } from "zod";
import { getAuth } from "firebase-admin/auth";
import { getMaintenanceFirebaseApp } from "@/scripts/firebase-admin";

const configSchema = z.object({
  ADMIN_EMAIL: z.email().transform((email) => email.trim().toLowerCase()),
});

async function main() {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid admin setup: ${parsed.error.issues.map((issue) => issue.message).join(" ")}`,
    );
  }

  const auth = getAuth(getMaintenanceFirebaseApp());
  const user = await auth.getUserByEmail(parsed.data.ADMIN_EMAIL);
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });
  console.info(`Admin access enabled for ${parsed.data.ADMIN_EMAIL}.`);
}

main().catch((error: unknown) => {
  console.error("Admin access setup failed:", error);
  process.exitCode = 1;
});

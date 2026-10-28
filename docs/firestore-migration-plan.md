# Firestore migration plan

The existing Prisma schema remains the migration source of truth. The app code
uses the Firebase Admin SDK for trusted server operations and Firebase
Authentication for credentials and session verification. Browser code does
not write commerce records directly.

## Model mapping

| Existing Prisma model | Firestore/Auth destination | Notes |
| --- | --- | --- |
| `User` | Firebase Authentication; `customers/{uid}` | Auth UID is the customer key. Admin access is a Firebase custom claim; no passwords or Better Auth sessions are copied into Firestore. |
| `Customer` | `customers/{uid}` | Name, email, phone, and timestamps. |
| `CustomerAddress` | `customers/{uid}/addresses/{addressId}` | Address fields stay scoped under the owner; default selection is transactionally maintained. |
| `Category` | `categories/{categoryId}` | Parent/child references remain IDs; active/sort order are query fields. |
| `Collection` | `collections/{collectionId}` | `productIds` plus explicit order replace the `CollectionProduct` join model. |
| `CollectionProduct` | `collections/{collectionId}.productIds[]` | Join ordering is preserved in the collection document. |
| `Product` | `products/{productId}` | Existing descriptive, SEO, image URL, category, occasion, and status fields are retained. Images remain at the existing URLs. |
| `ProductVariant` | Embedded `products/{productId}.variants[]` | Variant IDs/SKUs/prices/options/inventory are preserved; embedding keeps product and inventory transactions atomic. |
| `Order` | `orders/{orderId}` | Status, address/customer snapshot, totals, idempotency hash, and inventory reservation state are retained. |
| `OrderItem` | `orders/{orderId}.items[]` | Immutable purchase-time product, SKU, price, quantity, and image snapshot. |
| `Payment` | `orders/{orderId}.payments[]` and `paymentStatusTokens/{tokenHash}` | Gateway identifiers/status are retained; status token is stored as a hash only, with a hash-keyed lookup document for payment-result callbacks. |
| `AdminAuditLog` | `adminAuditLogs/{auditId}` | Before/after snapshots and actor UID are retained. |
| `RateLimit` | Firebase Auth throttling and route-level validation | Better Auth's PostgreSQL rate-limit table is not retained. Firebase Auth provides credential abuse protection; server mutations remain authenticated and origin-checked. |
| `Session` | Firebase Auth session cookie | Revocable Firebase session cookies replace database sessions. |
| `Account` | Firebase Authentication providers | Firebase owns provider linkage and password credentials. |
| `Verification` | Firebase Authentication | Email verification and password reset move to Firebase Auth. |

## Import and cutover safeguards

1. Keep the existing PostgreSQL database and Prisma schema/migrations unchanged
   until a Firestore export has been imported and reconciled. This code change
   does not connect to, alter, or delete production data.
2. Before cutover, resolve each customer account to a Firebase UID and create
   that identity in Firebase Authentication. Users without a Firebase identity
   require account linking or a password reset; passwords are never copied to
   Firestore.
3. Use the guarded importer below during a maintenance window. Reconcile
   collection counts, SKU uniqueness, order totals, idempotency links, and
   reserved inventory before switching traffic. Do not run a sample seed
   against imported production records.
4. Configure Firestore security rules to deny direct client writes. The app
   accesses Firestore through the server-only Admin SDK and enforces ownership
   in authenticated routes.
5. Firestore does not provide PostgreSQL-style full-text search. The existing
   catalog is queried through the application service for filtering and search;
   reassess query/index costs if the catalog grows substantially.

## Guarded one-time import

The `firebase:import:postgres` script reads the old schema through Prisma and
imports existing IDs and snapshots into Firestore. It is not run during build,
deployment, or this migration task. It first runs in dry-run mode and performs
no writes. The apply mode requires an explicit matching project confirmation,
a local JSON mapping from every legacy customer user ID to its Firebase UID,
an existing Firebase Auth user for every linked customer, and refuses to
overwrite any destination document not already marked as imported by this
script. If a batch fails after earlier batches committed, rerunning is safe for
those marked documents while the source remains frozen and the destination app
stays in maintenance mode.

Set `SOURCE_DATABASE_URL` to the legacy PostgreSQL connection string,
`FIREBASE_UID_MAP_PATH` to a local JSON object mapping legacy user IDs to
Firebase UIDs, and configure the server-only `FIREBASE_ADMIN_*` credentials.
Keep the mapping file outside source control. Review the dry-run counts, ensure
the app is in a maintenance window so records cannot change during import,
then run:

The mapping file contains legacy user IDs as keys and Firebase UIDs as values:

```json
{
  "legacy-user-id": "firebase-auth-uid"
}
```

```powershell
npm run firebase:import:postgres
npm run firebase:import:postgres -- --apply --confirm-project=$env:FIREBASE_ADMIN_PROJECT_ID
```

The importer preserves legacy order document IDs and writes an idempotency-key
mapping, so retries still find historical orders. It does not import Better
Auth credentials, sessions, or verification secrets. No production import
should be attempted until Firebase UID links and the target project have been
independently reviewed.

### Local Firestore emulator import

The local emulator uses the configured Firebase project ID only as a namespace;
`FIRESTORE_EMULATOR_HOST` redirects Firestore Admin SDK requests to localhost.
It does not write Firestore documents to the cloud project. The import source
can use the `DATABASE_URL` from the local `.env` only when the explicit
`--use-configured-database` flag is provided. `User.firebaseUid` values are
used automatically; provide `FIREBASE_UID_MAP_PATH` only for users whose UID
has not yet been linked.

Local development starts the Firestore and Storage emulators automatically
with `npm run dev`, imports any saved emulator data from `.firebase/local-data`,
and exports it when the dev server exits. Do not start a second emulator
instance while `npm run dev` is running. Install JDK 21 or newer for Firebase
CLI 15; older Java versions cannot start the Firestore emulator. Ensure
`.env.local` includes `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and
`FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` so the app connects to the
local services rather than cloud Firestore or Storage.

To run the emulators separately (for example, while importing data), start
them in one terminal:

```powershell
npm run firebase:emulator:firestore
```

For local product-image uploads, set
`FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` in `.env.local`. The emulator
stores local uploads; they do not reach the live Storage bucket.

In another terminal, run a dry run and review the counts before applying:

```powershell
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
$env:FIREBASE_ADMIN_PROJECT_ID = "shringaar-939e1"
npm run firebase:import:postgres -- --emulator --use-configured-database
npm run firebase:import:postgres -- --emulator --use-configured-database --apply --confirm-project=shringaar-939e1
```

For a catalog-only import when legacy customers have not all been linked to
Firebase UIDs, add `--catalog-only` to both commands. This imports categories,
products (including variants/inventory), and collections; it does not import
customers, addresses, orders, payments, or audit logs.

The local Next.js server also needs `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
and `FIREBASE_ADMIN_PROJECT_ID=shringaar-939e1`; the ignored `.env.local` is
configured for that local destination. The emulator exports data to the
ignored `.firebase/local-data` directory when it exits. Start it again after
stopping it and the export is retained locally.

## Required deployment configuration

Set the public Firebase web-app values and server-only Admin service-account
values documented in `.env.example` in Vercel. Never expose the Admin private
key to browser code. Configure the admin Firebase account with the `admin:
true` custom claim using the protected provisioning procedure before relying
on the admin panel.

Product image uploads use the configured Firebase Storage bucket. The admin
upload endpoint verifies the admin session, accepts only JPG/PNG/WebP images up
to 4 MB, and returns a download URL for the product gallery. Storage rules make
product images publicly readable and deny direct browser uploads; deploy them
with `firebase deploy --only storage`. Firebase Storage availability, billing,
and data-transfer charges depend on the Firebase project and usage.

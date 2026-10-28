# Quality assurance

## Local migration validation

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm test` | Passed; the Firestore emulator integration test is skipped unless the local emulator is configured |
| `npm run legacy:db:validate` | Passed; validates the retained source schema without connecting to production data |
| `npm run build` | Passed with Firebase credentials blanked for the build process; no live Firebase connection was used |
| `npm run test:e2e` | Not run |

## Validation scope

Application unit tests do not require a live PostgreSQL database. The
Firestore-backed catalog and checkout integration test is skipped unless
`FIRESTORE_EMULATOR_HOST` points to localhost. It refuses non-local emulator
hosts so it cannot direct integration writes to cloud Firestore.

The migration script is deliberately separate from normal build and test
commands. Its dry-run reads legacy PostgreSQL records and reports collection
counts without writing to Firebase. Apply mode requires an explicit project
confirmation; full account/order import also requires Firebase UID mapping.
See
[`firestore-migration-plan.md`](./firestore-migration-plan.md). Do not use
production credentials for automated tests.

## Commands

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

For emulator-backed checkout integration coverage:

```powershell
$env:FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080"
$env:FIREBASE_ADMIN_PROJECT_ID = "shringaar-939e1"
npm run test:integration
```

The Firebase Admin server modules use the emulator without service-account
credentials only when `FIRESTORE_EMULATOR_HOST` is explicitly configured.
Browser Firebase Authentication tests additionally require the Auth emulator
or a dedicated non-production Firebase project.

For local Firebase Admin access without a service-account key in `.env.local`,
set `FIREBASE_ADMIN_PROJECT_ID`, set `FIREBASE_ADMIN_USE_ADC=true`, and
authenticate with `gcloud auth application-default login` or configure
`GOOGLE_APPLICATION_CREDENTIALS` to point to a local service-account JSON file.
This option is refused in production; Vercel must use its server-only
`FIREBASE_ADMIN_*` credentials.

## Service limitations and manual checks

- Configure Firebase Authentication providers and verify sign-in, session
  exchange, sign-out, account ownership, and admin custom claims.
- Submit a contact message with the Firestore emulator enabled and verify it
  appears in the admin-only `/admin/messages` inbox.
- Verify that customers can only read and update their own address
  subcollections and that default-address changes remain consistent.
- Verify checkout price snapshots, inventory reservation/restoration,
  idempotent retry behavior, saved-address snapshots, and order access against
  the Firestore emulator before deployment.
- Test UroPay only with the provider's test credentials and authoritative
  status lookup. The integration does not enable a webhook until its signature
  contract has been independently verified.
- The legacy PostgreSQL source remains available only for the guarded
  one-time importer. Production data import, reconciliation, and cutover are
  not performed by the build or test suite.
- Existing external product-image URLs are unchanged. Recheck image failures
  against the current catalog data before replacing any owner-provided asset.

The historical screenshot report in [`../tests/SANITY_REPORT.md`](../tests/SANITY_REPORT.md)
predates the Firebase migration. It covers logged-out rendering only and is
not evidence of Firebase connectivity, successful data import, or authenticated
checkout behavior.

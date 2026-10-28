# Firestore commerce data model

The Next.js server uses Firebase Admin for trusted reads and writes. The
browser uses Firebase Authentication for sign-in and exchanges verified ID
tokens for HTTP-only session cookies; it does not read or write commerce
documents directly. [`firestore.rules`](../firestore.rules) denies direct
client access.

## Collections

| Collection / path | Document shape | Notes |
| --- | --- | --- |
| `customers/{uid}` | `uid`, `name`, `email`, `phone`, `image`, `createdAt`, `updatedAt` | The document ID and `uid` are the Firebase Authentication UID. Passwords and provider credentials remain in Firebase Authentication. |
| `customers/{uid}/addresses/{addressId}` | Customer address fields and timestamps | Address ownership is enforced by server routes using the authenticated UID. Address creation, default changes, and deletion use Firestore transactions. |
| `categories/{categoryId}` | Name, slug, description, image/SEO fields, `active`, `sortOrder`, `parentId`, timestamps | Parent references remain document IDs. |
| `products/{productId}` | Product fields, `categoryId`, `collectionIds`, timestamps, `variants[]` | Variants are embedded so product and inventory changes can be handled atomically. Image URLs continue to use the existing image host. |
| `collections/{collectionId}` | Name, slug, description, image/SEO fields, `active`, `sortOrder`, `productIds[]`, timestamps | The ordered product ID array replaces the relational join collection. |
| `orders/{orderId}` | Order/customer/address snapshots, totals, status, inventory state, `items[]`, `payments[]`, timestamps | Items and payments are immutable purchase-time snapshots except for trusted status updates. |
| `contactMessages/{messageId}` | `name`, `email`, `orderNumber`, `message`, `createdAt` | Public contact submissions are written by the server; only authenticated admins can list them through the admin page. |
| `paymentStatusTokens/{sha256(token)}` | `orderId`, `paymentId` | Allows payment-result lookup without storing the bearer token. |
| `orderIdempotencyKeys/{key}` | `orderId`, request fingerprint | Maps checkout retries to the original order document. |
| `adminAuditLogs/{auditId}` | Actor, action, entity, before/after snapshots, timestamp | Written by trusted admin routes alongside the mutation. |

### Product and inventory documents

```text
products/{productId}
  name, slug, description, shortDescription
  categoryId, material, plating, stoneType, occasions[]
  specifications, imageUrls[], seoTitle, seoDescription
  active, featured, collectionIds[]
  variants[]:
    id, sku, name, color, options, price, compareAtPrice
    inventoryQuantity, active, createdAt, updatedAt
  createdAt, updatedAt
```

### Order snapshots

`orders/{orderId}` retains the legacy order identifier and number, idempotency
key and request hash, customer and delivery snapshot, monetary totals, order and
fulfillment states, reservation state, item snapshots, and payment snapshots.
Saved-address edits therefore do not alter existing orders. Every inventory
reservation or restoration is performed transactionally with the order state
change.

## Identity migration

The one-time import uses a local JSON mapping from each legacy user ID to its
Firebase Authentication UID. Import customer profiles and address
subcollections using that UID, then rewrite customer references on historical
orders to the same UID. Users without a Firebase UID must be linked or
re-registered before importing their customer-owned records. Do not copy
password hashes, Better Auth accounts, sessions, or verification secrets into
Firestore; Firebase Authentication manages credentials and sessions.

## Checkout and payment behavior

COD and UroPay are handled by trusted Next.js server operations. Checkout
re-reads product and variant data, recalculates totals, validates stock, writes
the order and payment snapshots, and reserves inventory within a Firestore
transaction. The idempotency-key mapping preserves retries for both imported
orders and new orders.

UroPay credentials remain server-only. Browser returns trigger an authoritative
provider status lookup; the browser cannot mark an order paid. Raw payment
status tokens are not stored. Webhook processing remains disabled until its
provider signature contract is verified.

## Query and cost considerations

The current catalog and admin list services load records and apply selected
filters/search in application code. This avoids introducing a search service
and is intended for the current small catalog. Firestore is not a full-text
search engine; add purpose-built indexed query paths or reassess search if
catalog size or traffic grows. Review [`firestore.indexes.json`](../firestore.indexes.json)
when query shapes change.

## Migration and deployment

Keep the PostgreSQL database and Prisma schema/migrations unchanged until the
Firestore import is reconciled. The import must be idempotent and preserve
existing document identifiers, SKUs, inventory, customer links, address
ownership, order/payment snapshots, and audit history. Do not run a sample
seed against imported production data.

Configure the public `NEXT_PUBLIC_FIREBASE_*` web values and server-only
`FIREBASE_ADMIN_*` credentials in each Vercel environment. Create the required
Firebase Authentication providers, enable Firestore, deploy the deny-all
rules, and grant the Firebase admin custom claim only to approved users.

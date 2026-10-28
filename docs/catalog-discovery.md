# Catalogue discovery

The existing product, category, and collection pages read Firestore through
the server-side repository/service layer. No separate search service is used.
The current implementation loads active catalog documents and applies the
existing search and filter semantics in the application, which suits the
present small catalog but reads more documents than a selective indexed query.

## Query behavior

- Filters combine with AND; a text query matches product names and
  descriptions, category names, material, plating, stone type, and active
  variant SKUs.
- Price, finish, colour, and stock constraints must match the same active
  variant. Product-level material, occasion, and stone filters apply to the
  product.
- Results are returned 12 at a time. Page numbers are bounded and clamped to
  the last available page.
- Relevance uses deterministic match tiers (exact name, name prefix, category
  prefix, SKU prefix, then other matches), followed by creation time and ID.
  Other sort orders include ID as a stable tie-breaker.
- Search terms are normalized and wildcard characters are treated as text;
  they are not sent as SQL patterns.

## Firestore indexes and scaling

The current in-memory filtering path does not require the former PostgreSQL
trigram indexes. Firestore indexes are declared in
[`firestore.indexes.json`](../firestore.indexes.json); add or update entries
when a server-side query requires them.

Firestore does not provide PostgreSQL-style full-text search. This service
currently reads the active catalog before applying text and compound
variant-level filters. Monitor read volume and latency as the catalog grows.
For a larger catalog, redesign queryable facets and pagination around
Firestore-supported indexed queries before adding a search provider.

Products embed their variants to keep inventory changes atomic. Category and
collection membership is stored as document IDs (`categoryId`,
`collectionIds[]`, and `productIds[]`), avoiding relational join queries.

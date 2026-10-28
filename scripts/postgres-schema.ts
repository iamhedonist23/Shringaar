export function getPostgresSchema(connectionString: string): string | undefined {
  const schema = new URL(connectionString)
    .searchParams.get("schema")
    ?.trim();
  return schema || undefined;
}

export function getQualifiedPostgresTable(
  connectionString: string,
  tableName: string,
): string {
  const quoteIdentifier = (identifier: string) =>
    `"${identifier.replace(/"/g, '""')}"`;
  const schema = getPostgresSchema(connectionString) || "public";
  return `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}`;
}

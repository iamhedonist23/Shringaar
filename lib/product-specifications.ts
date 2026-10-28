export type ProductSpecificationRows = {
  rows: Array<{ label: string; value: string }>;
  care: string | null;
};

const semanticLabels: Record<string, string> = {
  material: "Material",
  basematerial: "Material",
  finish: "Finish",
  plating: "Finish",
  stone: "Stone / detail",
  stonedetail: "Stone / detail",
  stonetype: "Stone / detail",
  care: "Care",
};

function normalizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatLabel(key: string) {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}

export function buildProductSpecificationRows({
  material,
  finish,
  stoneType,
  specifications,
}: {
  material: string | null | undefined;
  finish: string | null | undefined;
  stoneType: string | null | undefined;
  specifications: Record<string, string> | null | undefined;
}): ProductSpecificationRows {
  const rows: ProductSpecificationRows["rows"] = [];
  const seenSemantics = new Set<string>();
  const seenLabels = new Set<string>();
  let care: string | null = null;

  const addRow = (label: string, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    rows.push({ label, value: trimmedValue });
    seenLabels.add(normalizeKey(label));
  };

  const coreRows = [
    ["material", material],
    ["finish", finish],
    ["stone", stoneType],
  ] as const;
  for (const [semantic, value] of coreRows) {
    if (!value?.trim()) continue;
    seenSemantics.add(semantic);
    addRow(semanticLabels[semantic], value);
  }

  for (const [key, rawValue] of Object.entries(specifications ?? {})) {
    const value = typeof rawValue === "string" ? rawValue.trim() : "";
    if (!value) continue;

    const normalizedKey = normalizeKey(key);
    const semantic = semanticLabels[normalizedKey];
    if (semantic === "Care") {
      care ??= value;
      continue;
    }

    if (semantic) {
      const semanticId =
        semantic === "Stone / detail" ? "stone" : semantic.toLowerCase();
      if (seenSemantics.has(semanticId)) continue;
      seenSemantics.add(semanticId);
      addRow(semantic, value);
      continue;
    }

    const label = formatLabel(key);
    const normalizedLabel = normalizeKey(label);
    if (!label || seenLabels.has(normalizedLabel)) continue;
    addRow(label, value);
  }

  return { rows, care };
}

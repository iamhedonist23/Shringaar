CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Category_name_trgm_idx"
ON "Category" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
ON "Product" USING GIN ("description" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_material_trgm_idx"
ON "Product" USING GIN ("material" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
ON "Product" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_occasions_gin_idx"
ON "Product" USING GIN ("occasions");

CREATE INDEX IF NOT EXISTS "Product_plating_trgm_idx"
ON "Product" USING GIN ("plating" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_stoneType_trgm_idx"
ON "Product" USING GIN ("stoneType" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "ProductVariant_sku_trgm_idx"
ON "ProductVariant" USING GIN ("sku" gin_trgm_ops);

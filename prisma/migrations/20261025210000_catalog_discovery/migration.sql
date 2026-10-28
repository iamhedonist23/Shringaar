CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "ProductVariant"
ADD COLUMN "color" TEXT;

CREATE INDEX "Product_active_material_idx"
ON "Product"("active", "material");

CREATE INDEX "Product_active_plating_idx"
ON "Product"("active", "plating");

CREATE INDEX "Product_active_stoneType_idx"
ON "Product"("active", "stoneType");

CREATE INDEX "ProductVariant_active_price_productId_idx"
ON "ProductVariant"("active", "price", "productId");

CREATE INDEX "ProductVariant_active_inventoryQuantity_productId_idx"
ON "ProductVariant"("active", "inventoryQuantity", "productId");

CREATE INDEX "ProductVariant_active_color_productId_idx"
ON "ProductVariant"("active", "color", "productId");

CREATE INDEX "ProductVariant_active_name_idx"
ON "ProductVariant"("active", "name");

CREATE INDEX "Product_occasions_gin_idx"
ON "Product" USING GIN ("occasions");

CREATE INDEX "Product_name_trgm_idx"
ON "Product" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "Product_description_trgm_idx"
ON "Product" USING GIN ("description" gin_trgm_ops);

CREATE INDEX "Product_material_trgm_idx"
ON "Product" USING GIN ("material" gin_trgm_ops);

CREATE INDEX "Product_plating_trgm_idx"
ON "Product" USING GIN ("plating" gin_trgm_ops);

CREATE INDEX "Product_stoneType_trgm_idx"
ON "Product" USING GIN ("stoneType" gin_trgm_ops);

CREATE INDEX "Category_name_trgm_idx"
ON "Category" USING GIN ("name" gin_trgm_ops);

CREATE INDEX "ProductVariant_sku_trgm_idx"
ON "ProductVariant" USING GIN ("sku" gin_trgm_ops);

CREATE INDEX "Product_material_lower_idx"
ON "Product"(lower("material"));

CREATE INDEX "Product_stoneType_lower_idx"
ON "Product"(lower("stoneType"));

CREATE INDEX "ProductVariant_name_lower_idx"
ON "ProductVariant"(lower("name"));

CREATE INDEX "ProductVariant_color_lower_idx"
ON "ProductVariant"(lower("color"));

UPDATE "ProductVariant"
SET "color" = CASE
  WHEN lower("name") LIKE '%rose%' THEN 'Rose Gold'
  ELSE 'Gold'
END;

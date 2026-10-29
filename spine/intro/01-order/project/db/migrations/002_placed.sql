-- When each order was placed: the lake is partitioned by day, so every
-- order needs one. Orders already recorded take the moment of migration.
ALTER TABLE orders ADD COLUMN placed timestamptz NOT NULL DEFAULT now();

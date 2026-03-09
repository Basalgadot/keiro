-- Agrega constraint único para que el upsert del scraper funcione correctamente
-- Ejecutar una sola vez en Supabase SQL Editor

ALTER TABLE precios
  ADD CONSTRAINT precios_medicamento_farmacia_unique
  UNIQUE (medicamento_id, farmacia_id);

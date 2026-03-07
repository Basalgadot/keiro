-- Fix: asignar comuna_id correcto a todas las farmacias
-- Ejecutar en Supabase SQL Editor

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'Providencia' LIMIT 1)
WHERE nombre ILIKE '%Providencia%';

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'Las Condes' LIMIT 1)
WHERE nombre ILIKE '%Las Condes%';

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'Santiago' LIMIT 1)
WHERE nombre ILIKE '%Santiago%' OR nombre ILIKE '%Ahumada%';

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'Maipú' LIMIT 1)
WHERE nombre ILIKE '%Maipú%' OR nombre ILIKE '%Maipu%';

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'La Florida' LIMIT 1)
WHERE nombre ILIKE '%La Florida%';

UPDATE farmacias SET comuna_id = (SELECT id FROM comunas WHERE nombre = 'Ñuñoa' LIMIT 1)
WHERE nombre ILIKE '%Ñuñoa%' OR nombre ILIKE '%Nunoa%';

-- Verificar resultado
SELECT nombre, comuna_id,
  (SELECT nombre FROM comunas WHERE id = farmacias.comuna_id) AS comuna_nombre
FROM farmacias ORDER BY nombre;

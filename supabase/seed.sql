-- ============================================================
-- FarmaVibe — Seed data inicial
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ============================================================
-- REGIONES DE CHILE
-- ============================================================

INSERT INTO regiones (nombre, numero, codigo) VALUES
  ('Arica y Parinacota', 15, 'XV'),
  ('Tarapacá', 1, 'I'),
  ('Antofagasta', 2, 'II'),
  ('Atacama', 3, 'III'),
  ('Coquimbo', 4, 'IV'),
  ('Valparaíso', 5, 'V'),
  ('Libertador General Bernardo O''Higgins', 6, 'VI'),
  ('Maule', 7, 'VII'),
  ('Ñuble', 16, 'XVI'),
  ('Biobío', 8, 'VIII'),
  ('La Araucanía', 9, 'IX'),
  ('Los Ríos', 14, 'XIV'),
  ('Los Lagos', 10, 'X'),
  ('Aysén del General Carlos Ibáñez del Campo', 11, 'XI'),
  ('Magallanes y de la Antártica Chilena', 12, 'XII'),
  ('Metropolitana de Santiago', 13, 'RM')
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMUNAS RM (las más relevantes para el MVP)
-- ============================================================

DO $$
DECLARE
  rm_id UUID;
BEGIN
  SELECT id INTO rm_id FROM regiones WHERE nombre = 'Metropolitana de Santiago';

  INSERT INTO comunas (nombre, region_id, codigo_ine) VALUES
    ('Santiago', rm_id, '13101'),
    ('Providencia', rm_id, '13123'),
    ('Las Condes', rm_id, '13110'),
    ('Vitacura', rm_id, '13132'),
    ('Ñuñoa', rm_id, '13120'),
    ('La Florida', rm_id, '13109'),
    ('Maipú', rm_id, '13119'),
    ('Pudahuel', rm_id, '13124'),
    ('San Miguel', rm_id, '13127'),
    ('Peñalolén', rm_id, '13122'),
    ('Macul', rm_id, '13118'),
    ('La Reina', rm_id, '13111'),
    ('Lo Barnechea', rm_id, '13116'),
    ('Huechuraba', rm_id, '13107'),
    ('Recoleta', rm_id, '13125'),
    ('Independencia', rm_id, '13108'),
    ('Conchalí', rm_id, '13104'),
    ('Quilicura', rm_id, '13126'),
    ('Renca', rm_id, '13126'),
    ('Cerrillos', rm_id, '13102'),
    ('La Cisterna', rm_id, '13108'),
    ('Lo Espejo', rm_id, '13117'),
    ('San Ramón', rm_id, '13129'),
    ('El Bosque', rm_id, '13105'),
    ('La Granja', rm_id, '13110'),
    ('Estación Central', rm_id, '13106'),
    ('Cerro Navia', rm_id, '13103'),
    ('Lo Prado', rm_id, '13118'),
    ('Quinta Normal', rm_id, '13125'),
    ('Pudahuel', rm_id, '13124')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- MEDICAMENTOS BASE (top 20 más buscados en Chile)
-- ============================================================

INSERT INTO medicamentos (nombre_generico, nombre_comercial, principio_activo, forma, dosis, requiere_receta, codigo_isp) VALUES
  ('Paracetamol', 'Tapsin / Panadol / Zolben', 'Paracetamol', 'comprimido', '500mg', false, 'F-001'),
  ('Paracetamol', 'Tapsin Fuerte', 'Paracetamol', 'comprimido', '1g', false, 'F-002'),
  ('Ibuprofeno', 'Brufen / Neobrufen', 'Ibuprofeno', 'comprimido', '400mg', false, 'F-003'),
  ('Ibuprofeno', 'Ibuprofeno', 'Ibuprofeno', 'comprimido', '600mg', false, 'F-004'),
  ('Amoxicilina', 'Amoval', 'Amoxicilina', 'cápsula', '500mg', true, 'F-005'),
  ('Amoxicilina + Ácido clavulánico', 'Augmentin', 'Amoxicilina/Clavulanato', 'comprimido', '875/125mg', true, 'F-006'),
  ('Omeprazol', 'Losec / Omeplax', 'Omeprazol', 'cápsula', '20mg', false, 'F-007'),
  ('Loratadina', 'Clarityne', 'Loratadina', 'comprimido', '10mg', false, 'F-008'),
  ('Cetirizina', 'Zyrtec', 'Cetirizina', 'comprimido', '10mg', false, 'F-009'),
  ('Metformina', 'Glucophage', 'Metformina', 'comprimido', '850mg', true, 'F-010'),
  ('Atorvastatina', 'Lipitor', 'Atorvastatina', 'comprimido', '20mg', true, 'F-011'),
  ('Losartán', 'Cozaar', 'Losartán', 'comprimido', '50mg', true, 'F-012'),
  ('Enalapril', 'Renitec', 'Enalapril', 'comprimido', '10mg', true, 'F-013'),
  ('Salbutamol', 'Ventolin', 'Salbutamol', 'inhalador', '100mcg', true, 'F-014'),
  ('Clonazepam', 'Ravotril', 'Clonazepam', 'comprimido', '0.5mg', true, 'F-015'),
  ('Alprazolam', 'Tafil', 'Alprazolam', 'comprimido', '0.25mg', true, 'F-016'),
  ('Fluoxetina', 'Prozac', 'Fluoxetina', 'cápsula', '20mg', true, 'F-017'),
  ('Sertralina', 'Zoloft', 'Sertralina', 'comprimido', '50mg', true, 'F-018'),
  ('Levotiroxina', 'Eutirox', 'Levotiroxina', 'comprimido', '100mcg', true, 'F-019'),
  ('Metoprolol', 'Lopressor', 'Metoprolol', 'comprimido', '50mg', true, 'F-020')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FARMACIAS DE EJEMPLO (Santiago RM)
-- ============================================================

DO $$
DECLARE
  providencia_id UUID;
  las_condes_id UUID;
  santiago_id UUID;
  maipu_id UUID;
BEGIN
  SELECT id INTO providencia_id FROM comunas WHERE nombre = 'Providencia' LIMIT 1;
  SELECT id INTO las_condes_id FROM comunas WHERE nombre = 'Las Condes' LIMIT 1;
  SELECT id INTO santiago_id FROM comunas WHERE nombre = 'Santiago' LIMIT 1;
  SELECT id INTO maipu_id FROM comunas WHERE nombre = 'Maipú' LIMIT 1;

  INSERT INTO farmacias (nombre, cadena, direccion, comuna_id, lat, lng, tiene_despacho, tiene_retiro) VALUES
    ('Cruz Verde Providencia', 'cruzverdefarmacia', 'Av. Providencia 1234', providencia_id, -33.4326, -70.6148, true, true),
    ('Cruz Verde Las Condes', 'cruzverdefarmacia', 'Av. Apoquindo 4500', las_condes_id, -33.4072, -70.5796, true, true),
    ('Salcobrand Providencia', 'salcobrand', 'Av. Providencia 2345', providencia_id, -33.4330, -70.6120, true, true),
    ('Salcobrand Las Condes', 'salcobrand', 'Av. El Bosque Norte 500', las_condes_id, -33.4115, -70.5848, true, true),
    ('Farmacias Ahumada Santiago Centro', 'ahumada', 'Huérfanos 1234', santiago_id, -33.4372, -70.6506, false, true),
    ('Farmacias Ahumada Providencia', 'ahumada', 'Av. Providencia 3000', providencia_id, -33.4301, -70.5989, true, true),
    ('Dr. Simi Maipú', 'drsimi', 'Av. Pajaritos 3456', maipu_id, -33.5100, -70.7615, false, true),
    ('Dr. Simi Santiago', 'drsimi', 'Alameda 2000', santiago_id, -33.4450, -70.6632, false, true),
    ('Kairos Web', 'kairosweb', NULL, NULL, NULL, NULL, true, false)
  ON CONFLICT DO NOTHING;
END $$;

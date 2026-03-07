import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pxgerivjocwfxadbxnor.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2VyaXZqb2N3ZnhhZGJ4bm9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjc2MTYyNCwiZXhwIjoyMDg4MzM3NjI0fQ.U8pTxN7SqKZDAuVwpPbBGtUy_UiGU-qNbyLo_QEe_Gs'
);

// 1. Check comunas
const { data: comunas } = await supabase.from('comunas').select('id,nombre').ilike('nombre', '%Las Condes%');
console.log('Comunas Las Condes:', comunas);

if (comunas && comunas.length > 0) {
  const { data: farmacias, error: errF } = await supabase.from('farmacias').select('id,nombre,comuna_id').eq('comuna_id', comunas[0].id);
  console.log('Farmacias en Las Condes:', farmacias, errF);
}

// 3. All farmacias and their comuna_id
const { data: allF } = await supabase.from('farmacias').select('id,nombre,comuna_id').order('nombre');
console.log('\nTodas las farmacias:');
allF?.forEach(f => console.log(' ', f.nombre, '->', f.comuna_id ?? 'NULL'));

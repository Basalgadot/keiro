-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Datos del cliente (para pedidos sin cuenta)
  nombre_cliente TEXT NOT NULL,
  email_cliente TEXT NOT NULL,
  telefono_cliente TEXT,
  direccion_despacho TEXT NOT NULL,
  -- Totales
  total INTEGER NOT NULL, -- en pesos CLP
  -- Estado del pago
  estado TEXT NOT NULL DEFAULT 'pendiente',
  -- pendiente | pagado | fallido | cancelado
  -- Flow
  flow_token TEXT,
  flow_order INTEGER,
  -- Items del carrito (JSON snapshot)
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_user ON pedidos(user_id);
CREATE INDEX idx_pedidos_flow_token ON pedidos(flow_token);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados ven sus propios pedidos
CREATE POLICY "pedidos_select_own" ON pedidos
  FOR SELECT USING (auth.uid() = user_id);

-- Service role puede hacer todo (para webhooks y API routes)
CREATE POLICY "pedidos_service_all" ON pedidos
  FOR ALL USING (true)
  WITH CHECK (true);

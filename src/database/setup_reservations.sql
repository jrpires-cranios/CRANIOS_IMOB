-- Create table for Property Reservations
CREATE TABLE IF NOT EXISTS reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  status TEXT DEFAULT 'ativa', -- 'ativa', 'cancelada', 'finalizada'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Waiting List (Fila de Espera)
CREATE TABLE IF NOT EXISTS fila_espera (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  imovel_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  status TEXT DEFAULT 'aguardando', -- 'aguardando', 'notificado', 'expirado'
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_reservas_imovel ON reservas(imovel_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status);
CREATE INDEX IF NOT EXISTS idx_fila_espera_imovel ON fila_espera(imovel_id);

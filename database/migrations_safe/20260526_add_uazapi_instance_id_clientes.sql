-- Adiciona vinculo entre cliente/imobiliaria e instancia UazAPI.
-- Idempotente: pode ser executado mais de uma vez sem apagar dados.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS uazapi_instance_id TEXT;

CREATE INDEX IF NOT EXISTS idx_clientes_uazapi_instance_id
  ON public.clientes (uazapi_instance_id)
  WHERE uazapi_instance_id IS NOT NULL;


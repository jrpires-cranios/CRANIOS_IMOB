-- Add short_id to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS short_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp TEXT; -- Ensure whatsapp column exists for ID
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nome TEXT;

-- Index for fast lookup by short_id
CREATE INDEX IF NOT EXISTS idx_leads_short_id ON leads(short_id);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);

-- Function to generate short_id (optional, can be done in code)
-- We will handle generation in code to ensure format C-XXXX

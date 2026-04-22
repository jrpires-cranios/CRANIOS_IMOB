-- Add book_pdf_url column to imoveis table
-- This stores the Cloudflare R2 URL of the generated property PDF book

ALTER TABLE imoveis 
ADD COLUMN IF NOT EXISTS book_pdf_url TEXT;

COMMENT ON COLUMN imoveis.book_pdf_url IS 'URL do PDF book do imóvel hospedado no Cloudflare R2';

-- Add index for faster lookups when checking if PDF exists
CREATE INDEX IF NOT EXISTS idx_imoveis_book_pdf ON imoveis(book_pdf_url) WHERE book_pdf_url IS NOT NULL;

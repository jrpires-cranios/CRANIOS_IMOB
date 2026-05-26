import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbhkwmesmvytqdfuwcie.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Client principal do backend. Em servidor, preferimos service role para evitar
// leituras inconsistentes quando RLS/policies evoluirem.
export const supabase = createClient(supabaseUrl, supabaseKey);

// Alias para compatibilidade.
export const supabaseAdmin = supabase;

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbhkwmesmvytqdfuwcie.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Client principal (anon) - RLS desabilitado, funciona para tudo
export const supabase = createClient(supabaseUrl, supabaseKey);

// Alias para compatibilidade - usa a mesma instância anon (RLS está desabilitado)
// Se no futuro ativar RLS, substituir pela service_role key completa
export const supabaseAdmin = supabase;

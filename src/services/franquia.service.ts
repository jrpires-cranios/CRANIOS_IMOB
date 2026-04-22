import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

export async function getFranquias(parentId: string) {
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Para cada franquia, podemos consolidar VGV ou leads
    const statsProm = (data || []).map(async (franquia) => {
        // Exemplo: Buscar total de vendas da franquia
        const { count: leadsVenda } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_id', franquia.id)
            .eq('status', 'won');
            
        return {
            ...franquia,
            total_vendas: leadsVenda || 0
        };
    });
    
    return await Promise.all(statsProm);
}

export async function createFranquia(parentId: string, data: any) {
    const payload = {
        ...data,
        parent_id: parentId,
        ativo: true,
        created_at: new Date().toISOString()
    };
    
    const { data: newFranquia, error } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();
        
    if (error) throw error;
    return newFranquia;
}

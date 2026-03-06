import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper: select all from a table
export async function supabaseSelect<T>(table: string, select: string = '*', filter?: { column: string; value: any }) {
  let query = supabase.from(table).select(select);
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as T[];
}

// Helper: upsert a row
export async function supabaseUpsert(table: string, row: Record<string, any>, conflict: string) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflict })
    .select();
  if (error) throw error;
  return data;
}

// Helper: update where
export async function supabaseUpdate<T>(table: string, updates: Record<string, any>, column: string, value: any) {
  const { data, error } = await supabase.from(table).update(updates).eq(column, value).select();
  if (error) throw error;
  return data as T[];
}

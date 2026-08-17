import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

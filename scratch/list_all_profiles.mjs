import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Fetching all profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, mentor_name');

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log(`Total profiles found: ${data ? data.length : 0}`);
  if (data) {
    data.forEach(p => {
      console.log(`- ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}, Mentor: ${p.mentor_name}`);
    });
  }
}

run();

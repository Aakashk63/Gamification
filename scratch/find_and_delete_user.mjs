import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  console.log("Searching for user 'ajay' in public.profiles...");
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%ajay%');

  if (error) {
    console.error("Error searching profiles:", error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("No profiles matching 'ajay' found.");
    return;
  }

  console.log(`Found ${profiles.length} profiles matching 'ajay':`);
  profiles.forEach(p => {
    console.log(`- ID: ${p.id}, Name: ${p.full_name}, Role: ${p.role}, Mentor: ${p.mentor_name}`);
  });

  for (const p of profiles) {
    console.log(`Attempting to delete profile with ID: ${p.id}...`);
    const { error: delError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', p.id);

    if (delError) {
      console.error(`Failed to delete profile ${p.id}:`, delError);
    } else {
      console.log(`Successfully deleted profile ${p.id} from public.profiles.`);
    }
  }
}

run();

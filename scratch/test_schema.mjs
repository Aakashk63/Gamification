import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function check() {
  console.log("Fetching profiles sample...");
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (profiles && profiles.length > 0) {
    profiles.forEach(p => {
      console.log(`Profile: id=${p.id}, name=${p.full_name}, role=${p.role}, mentor_id=${p.mentor_id}, mentor_name=${p.mentor_name}, students=${JSON.stringify(p.students)}`);
    });
    console.log("Full keys for first profile:", Object.keys(profiles[0]));
  } else {
    console.log("No profiles found.");
  }
}

check();

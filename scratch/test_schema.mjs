const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';

async function check() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const data = await res.json();
  console.log("Error details:", data);
}

check();

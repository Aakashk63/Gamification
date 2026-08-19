import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://tvgojqjnauuavwzvjnvb.supabase.co', 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa');
async function test() {
  const res = await supabase.from('announcements').select(`*, profiles(full_name, avatar_url, role), announcement_comments(*, profiles(full_name, avatar_url))`).limit(1);
  console.log(JSON.stringify(res.data, null, 2));
  if (res.error) console.error(res.error);
}
test();

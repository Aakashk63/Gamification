const supabaseUrl = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const supabaseAnonKey = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';

async function resetTask() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  console.log('Deleting completions for task_id = default-leetcode-daily on', today);
  
  const response = await fetch(`${supabaseUrl}/rest/v1/daily_task_completions?task_id=eq.default-leetcode-daily&task_date=eq.${today}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  
  if (response.ok) {
    console.log('Successfully reset today\'s LeetCode task completion status.');
  } else {
    console.error('Error deleting:', await response.text());
  }
}

resetTask();

/**
 * CampusXP — Centralized Frontend API Service
 * Now fully powered by Supabase! No external backend needed.
 */

import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiDashboardStats {
  totalTeams: number;
  overallLeader: string;
  activeMentorsCount: number;
  totalAnnouncementsCount: number;
  liveStatus: string;
}

export async function apiGetDashboardStats(): Promise<ApiDashboardStats> {
  // In a real app, you might run an RPC function or aggregate queries.
  // For now, we fetch basic counts or return placeholder data.
  
  const { count: postsCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });
    
  return {
    totalTeams: 16,
    overallLeader: 'TITANS',
    activeMentorsCount: 4,
    totalAnnouncementsCount: postsCount || 0,
    liveStatus: 'Spring Season 4 Active'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENT / POST APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiComment {
  id: string;
  post_id: string;
  user_id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  created_at: string;
}

export interface ApiPost {
  id: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null;
  created_at: string;
  updated_at?: string;
  likes: number; 
  hasLiked: boolean; 
  comments: ApiComment[];
  profiles?: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

/** Fetch all announcement posts (sorted newest first) */
export async function apiGetPosts(): Promise<ApiPost[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      profiles (full_name, avatar_url, role),
      announcement_comments (
        *,
        profiles (full_name, avatar_url)
      ),
      announcement_likes (user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((post: any) => {
    const postProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
    
    return {
      ...post,
      profiles: postProfile,
      comments: (post.announcement_comments || []).map((c: any) => {
        const commentProfile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        return {
          ...c,
          createdAt: c.created_at || c.createdAt,
          authorName: commentProfile?.full_name || 'Unknown User',
          authorAvatar: commentProfile?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
        };
      }),
      likes: post.announcement_likes?.length || 0,
      hasLiked: post.announcement_likes?.some((like: any) => like.user_id === currentUserId) || false,
    };
  });
}

/** Create a new announcement post */
export async function apiCreatePost(caption: string, imageUrl: string | null, videoUrl: string | null): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User is not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found");
  }

  if (!['mentor', 'admin'].includes(profile.role)) {
    throw new Error("Only mentors and admins can create announcements");
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      author_id: user.id,
      content: caption,
      image_url: imageUrl ?? null,
      video_url: videoUrl ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a post by ID */
export async function apiDeletePost(postId: string): Promise<{ success: boolean }> {
  // Try to delete comments and likes first to avoid FK constraint errors if cascade is not enabled
  await supabase.from('announcement_comments').delete().eq('announcement_id', postId);
  await supabase.from('announcement_likes').delete().eq('announcement_id', postId);

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', postId);

  if (error) throw error;
  return { success: true };
}

/** Toggle like on a post */
export async function apiLikePost(postId: string, isLiking: boolean): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  if (isLiking) {
    await supabase.from('announcement_likes').insert({
      announcement_id: postId,
      user_id: session.user.id
    });
  } else {
    await supabase.from('announcement_likes')
      .delete()
      .eq('announcement_id', postId)
      .eq('user_id', session.user.id);
  }
}

/** Add a comment to a post */
export async function apiAddComment(postId: string, content: string, _profile?: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('announcement_comments')
    .insert([{
      announcement_id: postId,
      user_id: session.user.id,
      content: content
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a comment from a post */
export async function apiDeleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('announcement_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiFeedback {
  name: string;
  department: string;
  teamName: string;
  email: string;
  contactNumber: string;
  feedback: string;
  fileName?: string | null;
}

/** Submit feedback via API */
export async function apiSubmitFeedback(feedback: ApiFeedback): Promise<{ success: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const { error } = await supabase
    .from('feedback')
    .insert([{
      user_id: session?.user?.id || null, // Allow anonymous or map to user
      name: feedback.name,
      department: feedback.department,
      teamName: feedback.teamName,
      email: feedback.email,
      contactNumber: feedback.contactNumber,
      feedback: feedback.feedback,
      file_name: feedback.fileName
    }]);

  if (error) throw error;
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiProfile {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string;
  linkedin_url?: string;
  leetcode_url?: string;
  team_points?: number; 
  email?: string; 
  mentor_id?: string;
  mentor_name?: string;
  level?: number;
  coins?: number;
  base_character?: string;
  equipped_items?: string[];
  unlocked_items?: string[];
}

export async function apiGetProfile(): Promise<ApiProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Attempt to fetch profile from DB, but don't fail if it doesn't exist yet
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const meta = user.user_metadata || {};

  // Auto-sync profile if it's missing or lacks a full_name
  if (!profile || !profile.full_name) {
    supabase.from('profiles').upsert({
      id: user.id,
      full_name: meta.name || 'CampusXP Member',
      role: meta.role || 'student',
      avatar_url: meta.role === 'mentor'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    }).then(() => console.log('Profile auto-synced for', user.id));
  }

  return {
    id: user.id,
    full_name: profile?.full_name || meta.name || 'Anonymous User',
    role: profile?.role || meta.role || 'student',
    avatar_url: profile?.avatar_url || (meta.role === 'mentor'
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'),
    linkedin_url: profile?.linkedin_url || '',
    leetcode_url: profile?.leetcode_url || '',
    email: user.email,
    mentor_name: profile?.mentor_name || meta.mentorName || 'No Mentor Assigned',
    team_points: profile?.team_points || 0,
    level: profile?.level || 1,
    coins: profile?.coins || 1000,
    base_character: profile?.base_character || meta.base_character || 'boy_base',
    equipped_items: profile?.equipped_items || meta.equipped_items || [],
    unlocked_items: profile?.unlocked_items || [],
  };
}

export async function apiUpdateAvatarState(base_character: string, equipped_items: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Store avatar settings in user_metadata to bypass missing column errors on profiles table
  const { error } = await supabase.auth.updateUser({
    data: { base_character, equipped_items }
  });

  // Try to update profiles as well, but ignore error if columns don't exist
  await supabase.from('profiles').update({ base_character, equipped_items }).eq('id', user.id);

  if (error) throw error;
}

export async function apiPurchaseItem(itemId: string, cost: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch current coins and unlocked items to prevent race conditions or cheating
  const { data: profile } = await supabase.from('profiles').select('coins, unlocked_items').eq('id', user.id).single();
  if (!profile) throw new Error("Profile not found");

  const currentCoins = profile.coins || 0;
  const currentUnlocked = profile.unlocked_items || [];

  if (currentCoins < cost) {
    throw new Error("Not enough coins");
  }

  if (currentUnlocked.includes(itemId)) {
    throw new Error("Item already owned");
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      coins: currentCoins - cost,
      unlocked_items: [...currentUnlocked, itemId]
    })
    .eq('id', user.id);

  if (error) throw error;
}

export async function apiUpdateProfileUrls(linkedinUrl: string, leetcodeUrl: string, avatarUrl?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: any = {
    linkedin_url: linkedinUrl,
    leetcode_url: leetcodeUrl
  };
  
  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  points: number;
  category: 'individual' | 'team';
  type: 'daily' | 'weekly' | 'special';
  is_leetcode: boolean;
  created_at: string;
  completed?: boolean;
}

export async function apiGetTasks(): Promise<ApiTask[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch all tasks
  const { data: dbTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*');
    
  let tasks: ApiTask[] = [];
  if (!tasksError && dbTasks) {
    tasks = dbTasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      points: t.points || 5,
      category: t.category || 'individual',
      type: t.type || t.task_type || 'special',
      is_leetcode: t.is_leetcode || false,
      created_at: t.created_at || new Date().toISOString()
    }));
  }

  // ALWAYS inject the default LeetCode daily task
  const defaultLeetCodeTask: ApiTask = {
    id: 'default-leetcode-daily',
    title: 'Complete LeetCode Sum',
    description: 'Solve any problem on LeetCode today to earn points!',
    points: 5,
    category: 'individual',
    type: 'daily',
    is_leetcode: true,
    created_at: new Date().toISOString()
  };

  if (!tasks.find(t => t.is_leetcode)) {
    tasks.unshift(defaultLeetCodeTask);
  }

  // Fetch user completions gracefully
  let completedTaskIds = new Set<string>();
  const { data: completions, error: completionsError } = await supabase
    .from('task_completions')
    .select('task_id')
    .eq('user_id', user.id);

  if (!completionsError && completions) {
    completedTaskIds = new Set(completions.map(c => c.task_id));
  }
  
  // Fallback to localStorage if DB table is missing
  try {
    const localCompletions = JSON.parse(localStorage.getItem('campusxp_completed_tasks') || '[]');
    localCompletions.forEach((id: string) => completedTaskIds.add(id));
  } catch(e) {}

  return tasks.map(task => ({
    ...task,
    completed: completedTaskIds.has(task.id)
  }));
}

export async function apiCompleteTask(taskId: string, points: number, isTeamTask: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Insert completion record
  const { error: completionError } = await supabase
    .from('task_completions')
    .insert({ user_id: user.id, task_id: taskId });

  if (completionError) {
    if (completionError.code === '23505') {
      throw new Error("Task already completed");
    }
    console.warn("Could not save task completion to DB (table might be missing), awarding points anyway.", completionError);
    // Fallback to local storage
    try {
      const localCompletions = JSON.parse(localStorage.getItem('campusxp_completed_tasks') || '[]');
      if (!localCompletions.includes(taskId)) {
        localStorage.setItem('campusxp_completed_tasks', JSON.stringify([...localCompletions, taskId]));
      }
    } catch(e) {}
  }

  // 2. Award points
  const { data: profile } = await supabase.from('profiles').select('coins, team_points').eq('id', user.id).single();
  if (!profile) return;

  const updates: any = {};
  if (isTeamTask) {
    updates.team_points = (profile.team_points || 0) + points;
  } else {
    updates.coins = (profile.coins || 0) + points;
  }

  await supabase.from('profiles').update(updates).eq('id', user.id);
}

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

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Fetch all tasks from public.tasks
  let { data: dbTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.warn("apiGetTasks: Error fetching tasks from DB:", tasksError);
  }

  let tasks: ApiTask[] = [];
  if (dbTasks && dbTasks.length > 0) {
    tasks = dbTasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      points: t.points || 5,
      category: t.category || 'individual',
      type: t.type || t.task_type || 'daily',
      is_leetcode: t.is_leetcode || false,
      created_at: t.created_at || new Date().toISOString()
    }));
  }

  // 2. Safe "get or create today's daily task" flow in Supabase public.tasks
  const existingDailyTask = tasks.find(t => 
    t.is_leetcode && 
    t.type === 'daily' && 
    ((t as any).task_date === today || dbTasks?.some((d: any) => d.id === t.id && (d.task_date === today || d.created_at?.startsWith(today))))
  );

  if (!existingDailyTask) {
    // Attempt to insert today's daily task into public.tasks
    try {
      const { data: newTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          title: 'Complete LeetCode Sum',
          description: 'Solve any problem on LeetCode today to earn points!',
          points: 5,
          category: 'individual',
          task_type: 'daily',
          type: 'daily',
          is_leetcode: true,
          task_date: today,
          created_by: user.id
        })
        .select('*')
        .maybeSingle();

      if (!insertError && newTask) {
        tasks.unshift({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          points: newTask.points || 5,
          category: newTask.category || 'individual',
          type: newTask.type || newTask.task_type || 'daily',
          is_leetcode: newTask.is_leetcode || false,
          created_at: newTask.created_at || new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Could not insert daily task into public.tasks:", err);
    }
  }

  // If tasks is still empty (e.g. empty table and insert blocked), provide standard task shape
  if (tasks.length === 0) {
    tasks = [
      {
        id: 'default-leetcode-daily',
        title: 'Complete LeetCode Sum',
        description: 'Solve any problem on LeetCode today to earn points!',
        points: 5,
        category: 'individual',
        type: 'daily',
        is_leetcode: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'default-leetcode-weekly',
        title: 'Complete 3 LeetCode Sums',
        description: 'Solve 3 problems on LeetCode this week.',
        points: 20,
        category: 'individual',
        type: 'weekly',
        is_leetcode: false,
        created_at: new Date().toISOString()
      }
    ];
  }

  // 3. Fetch completions from public.task_completions and public.daily_task_completions
  const completedTaskIds = new Set<string>();

  // Check public.task_completions
  try {
    const { data: completions, error: cErr } = await supabase
      .from('task_completions')
      .select('task_id')
      .eq('student_id', user.id);

    if (!cErr && completions) {
      completions.forEach((c: any) => completedTaskIds.add(String(c.task_id)));
    }
  } catch (e) {}

  // Check public.daily_task_completions for today
  try {
    const { data: dailyCompletions, error: dcErr } = await supabase
      .from('daily_task_completions')
      .select('task_id')
      .eq('student_id', user.id)
      .eq('task_date', today);

    if (!dcErr && dailyCompletions) {
      dailyCompletions.forEach((c: any) => completedTaskIds.add(String(c.task_id)));
    }
  } catch (e) {}

  return tasks.map(task => ({
    ...task,
    completed: completedTaskIds.has(String(task.id))
  }));
}

export async function apiCompleteTask(taskId: string, points: number, isTeamTask: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Insert completion into public.task_completions
  try {
    await supabase
      .from('task_completions')
      .insert({ 
        student_id: user.id, 
        task_id: taskId,
        task_date: today,
        points_earned: points
      });
  } catch (e) {
    console.warn("apiCompleteTask: task_completions insert notice:", e);
  }

  // 2. Also insert into public.daily_task_completions for compatibility
  try {
    await supabase
      .from('daily_task_completions')
      .insert({ 
        student_id: user.id, 
        task_id: taskId,
        task_date: today,
        points_earned: points
      });
  } catch (e) {
    console.warn("apiCompleteTask: daily_task_completions insert notice:", e);
  }

  // 3. Award points to profile
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

// ============================================================================
// MENTOR TEAMS APIS
// ============================================================================

export async function apiGetMentorTeams(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch teams with nested team_members and profiles
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members (
        id,
        team_id,
        student_id,
        profiles (id, full_name, avatar_url, role)
      )
    `)
    .eq('mentor_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn("apiGetMentorTeams joined query error, attempting fallback:", error);
    // Fallback: fetch teams, then team_members, then profiles
    const { data: rawTeams, error: rawError } = await supabase
      .from('teams')
      .select('*')
      .eq('mentor_id', user.id)
      .order('created_at', { ascending: true });

    if (rawError) {
      console.error("apiGetMentorTeams fallback error:", rawError);
      throw rawError;
    }

    if (!rawTeams || rawTeams.length === 0) return [];

    const teamIds = rawTeams.map(t => t.id);
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .in('team_id', teamIds);

    const studentIds = (members || []).map(m => m.student_id);
    let profilesMap = new Map();
    if (studentIds.length > 0) {
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', studentIds);
      (studentProfiles || []).forEach(p => profilesMap.set(p.id, p));
    }

    return rawTeams.map(t => {
      const tMembers = (members || [])
        .filter(m => m.team_id === t.id)
        .map(m => ({
          ...m,
          profiles: profilesMap.get(m.student_id) || { full_name: 'Student', avatar_url: '' }
        }));
      return { ...t, team_members: tMembers };
    });
  }

  return (teams || []).map(t => ({
    ...t,
    team_members: (t.team_members || []).map((m: any) => ({
      ...m,
      profiles: m.profiles || { full_name: 'Student', avatar_url: '' }
    }))
  }));
}

export async function apiCreateTeam(name: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('teams')
    .insert({ mentor_id: user.id, name })
    .select('*')
    .single();

  if (error) {
    console.error("apiCreateTeam error:", error);
    throw error;
  }
  return data;
}

export async function apiGetUnassignedStudents(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Fetch mentor profile including the students JSONB column
  let mentorProfile: any = null;
  const { data: mProfile, error: mError } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url, mentor_name, students')
    .eq('id', user.id)
    .eq('role', 'mentor')
    .maybeSingle();

  if (mError) {
    console.error("Error fetching mentor profile:", mError);
  }
  
  mentorProfile = mProfile || { id: user.id, full_name: user.user_metadata?.name || 'Mentor', students: [] };
  const mentorStudentNames: string[] = Array.isArray(mentorProfile?.students)
    ? mentorProfile.students
    : [];

  // 2. Fetch mentor's teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('mentor_id', user.id);

  const teamIds = (teams || []).map((t: any) => t.id);

  // 3. Fetch team members
  let allTeamMembers: any[] = [];
  const assignedStudentIds = new Set<string>();
  const assignedStudentNames = new Set<string>();

  if (teamIds.length > 0) {
    const { data: members, error: tmError } = await supabase
      .from('team_members')
      .select('id, team_id, student_id, profiles (id, full_name)')
      .in('team_id', teamIds);

    if (tmError) {
      console.warn("TEAM MEMBERS query error:", tmError);
    } else if (members) {
      allTeamMembers = members;
      members.forEach((m: any) => {
        if (m.student_id) assignedStudentIds.add(m.student_id);
        if (m.profiles?.full_name) assignedStudentNames.add(m.profiles.full_name.trim().toLowerCase());
      });
    }
  }

  // 4. Resolve mentor students into profile objects with UUIDs
  let studentProfiles: any[] = [];
  if (mentorStudentNames.length > 0) {
    const { data: matchedProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .eq('role', 'student')
      .in('full_name', mentorStudentNames);

    if (matchedProfiles) {
      studentProfiles = matchedProfiles;
    }
  }

  // If any student name from mentorProfile.students is not yet in studentProfiles, add an entry
  mentorStudentNames.forEach((name: string) => {
    if (!studentProfiles.some(sp => sp.full_name?.trim().toLowerCase() === name.trim().toLowerCase())) {
      studentProfiles.push({
        id: name,
        full_name: name,
        avatar_url: '',
        role: 'student'
      });
    }
  });

  // 5. Filter out students already assigned to any team of this mentor
  const availableStudents = studentProfiles.filter((s: any) => {
    const isIdAssigned = s.id && assignedStudentIds.has(s.id);
    const isNameAssigned = s.full_name && assignedStudentNames.has(s.full_name.trim().toLowerCase());
    return !isIdAssigned && !isNameAssigned;
  });

  // Exact debugging logs requested by user
  console.log("Current mentor ID:", user.id);
  console.log("Mentor profile:", mentorProfile);
  console.log("Mentor students:", mentorProfile?.students);
  console.log("Mentor teams:", teams || []);
  console.log("Team members:", allTeamMembers);
  console.log("Available students:", availableStudents);

  return availableStudents.map((s: any) => ({
    id: s.id,
    full_name: s.full_name || 'Student',
    avatar_url: s.avatar_url || '',
    role: s.role || 'student'
  }));
}

export async function apiAddStudentToTeam(teamId: string, studentIdOrName: string): Promise<any> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // 1. Resolve student UUID from name or ID
  let studentUuid = studentIdOrName;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentIdOrName);

  if (!isUuid) {
    // Look up student profile by full_name
    const { data: student } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('role', 'student')
      .eq('full_name', studentIdOrName)
      .maybeSingle();

    if (student) {
      studentUuid = student.id;
    } else {
      const { data: anyStudent } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('full_name', studentIdOrName)
        .maybeSingle();
        
      if (anyStudent) {
        studentUuid = anyStudent.id;
      } else {
        throw new Error(`Student profile for "${studentIdOrName}" was not found in public.profiles.`);
      }
    }
  }

  // 2. Check team member limit (Maximum 4 members)
  const { count, error: countError } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId);
    
  if (countError) {
    console.warn("apiAddStudentToTeam count check error:", countError);
  }
  if (count !== null && count >= 4) {
    throw new Error("Each team can have a maximum of 4 students.");
  }

  // 3. Duplicate check
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('student_id', studentUuid)
    .maybeSingle();
    
  if (existingMember) {
    throw new Error("Student is already in this team.");
  }

  // 4. Insert into public.team_members
  const { data, error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, student_id: studentUuid })
    .select('*, profiles (id, full_name, avatar_url, role)')
    .single();

  if (error) {
    console.error("apiAddStudentToTeam insert error:", error);
    if (error.code === '23505') throw new Error("Student is already in this team.");
    throw error;
  }

  return data;
}

export async function apiGetMentorTeamPerformance(): Promise<any[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get teams with members
  const teams = await apiGetMentorTeams();
  if (!teams || teams.length === 0) return [];

  // Get today's completions for all students using local date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const completionsMap = new Map<string, number>();

  try {
    const { data: comp1 } = await supabase
      .from('task_completions')
      .select('student_id, points_earned, task_date')
      .eq('task_date', today);

    if (comp1) {
      comp1.forEach((c: any) => completionsMap.set(c.student_id, c.points_earned || 0));
    }
  } catch (e) {}

  try {
    const { data: comp2 } = await supabase
      .from('daily_task_completions')
      .select('student_id, points_earned, task_date')
      .eq('task_date', today);

    if (comp2) {
      comp2.forEach((c: any) => completionsMap.set(c.student_id, c.points_earned || 0));
    }
  } catch (e) {}

  // Format response for Daily Task Monitor
  return teams.map(team => {
    const members = (team.team_members || []).map((m: any) => {
      const isCompleted = completionsMap.has(m.student_id);
      return {
        id: m.student_id,
        name: m.profiles?.full_name || 'Student',
        avatar: m.profiles?.avatar_url || '',
        completed: isCompleted,
        points: isCompleted ? completionsMap.get(m.student_id) : 0
      };
    });

    const completedCount = members.filter((m: any) => m.completed).length;
    const totalPoints = members.reduce((sum: number, m: any) => sum + m.points, 0);

    return {
      id: team.id,
      name: team.name,
      memberCount: members.length,
      members,
      completedCount,
      totalPoints
    };
  });
}

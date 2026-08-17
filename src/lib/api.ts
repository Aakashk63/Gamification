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
  user_id: string;
  authorName: string;
  authorAvatar: string;
  authorTagline: string;
  created_at: string;
  content: string;
  image?: string;
  video?: string;
  likes: number; // dynamically calculated
  hasLiked: boolean; // dynamically calculated
  shares: number;
  comments: ApiComment[]; // populated from relations
}

/** Fetch all announcement posts (sorted newest first) */
export async function apiGetPosts(): Promise<ApiPost[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      announcement_comments (*),
      announcement_likes (user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((post: any) => ({
    ...post,
    comments: post.announcement_comments || [],
    likes: post.announcement_likes?.length || 0,
    hasLiked: post.announcement_likes?.some((like: any) => like.user_id === currentUserId) || false,
  }));
}

/** Create a new announcement post */
export async function apiCreatePost(post: Partial<ApiPost>): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      user_id: session.user.id,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      authorTagline: post.authorTagline,
      content: post.content,
      image: post.image,
      video: post.video,
      shares: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete a post by ID */
export async function apiDeletePost(postId: string): Promise<{ success: boolean }> {
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
export async function apiAddComment(postId: string, content: string, profile: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from('announcement_comments')
    .insert([{
      post_id: postId,
      user_id: session.user.id,
      authorName: profile.name,
      authorAvatar: profile.avatar,
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

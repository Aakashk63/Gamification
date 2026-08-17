/**
 * CampusXP — Centralized Frontend API Service
 * All backend requests funnel through this module.
 * Base URL: http://localhost:5001
 */

const BASE_URL = import.meta.env.DEV ? 'http://localhost:5001' : '';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail || json.error || json.message || `Request failed: ${res.status}`);
  }
  return json as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH APIS
// ─────────────────────────────────────────────────────────────────────────────

/** Login a user (student or mentor) via the backend auth proxy → Supabase */
export async function apiLogin(email: string, password: string) {
  return request<{ session: any; user: any }>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** Register a new user via the backend auth proxy → Supabase */
export async function apiSignup(email: string, password: string, options: object) {
  return request<{ session: any; user: any }>('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, options }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiMentor {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
}

/** Fetch all available mentors from MongoDB */
export async function apiGetMentors(): Promise<ApiMentor[]> {
  return request<ApiMentor[]>('/api/mentors');
}

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

/** Fetch live dashboard summary stats */
export async function apiGetDashboardStats(): Promise<ApiDashboardStats> {
  return request<ApiDashboardStats>('/api/dashboard');
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENT / POST APIS
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface ApiPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorTagline: string;
  createdAt: string;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  hasLiked: boolean;
  shares: number;
  comments: ApiComment[];
}

/** Fetch all announcement posts (sorted newest first) */
export async function apiGetPosts(): Promise<ApiPost[]> {
  return request<ApiPost[]>('/api/posts');
}

/** Create a new announcement post */
export async function apiCreatePost(post: Omit<ApiPost, 'comments'> & { comments: ApiComment[] }): Promise<ApiPost> {
  return request<ApiPost>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
}

/** Delete a post by ID */
export async function apiDeletePost(postId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/posts/${postId}`, {
    method: 'DELETE',
  });
}

/** Toggle like on a post */
export async function apiLikePost(postId: string): Promise<ApiPost> {
  return request<ApiPost>(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
}

/** Add a comment to a post */
export async function apiAddComment(postId: string, comment: ApiComment): Promise<ApiPost> {
  return request<ApiPost>(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(comment),
  });
}

/** Delete a comment from a post */
export async function apiDeleteComment(postId: string, commentId: string): Promise<ApiPost> {
  return request<ApiPost>(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
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
  return request<{ success: boolean }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

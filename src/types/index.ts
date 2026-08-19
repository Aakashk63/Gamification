export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role?: string;
  points?: number; // Custom points comparison for the mentor's internal student VS challenge
}

export interface Team {
  id: string;
  name: string;
  rank: number;
  avatar: string;
  members: TeamMember[];
  department?: string;
  tagline?: string;
  badge?: string;
  previousRank?: number;
  highlightColor?: string;
}

export interface Leaderboard {
  id: string;
  title: string;
  season: string;
  updatedAt: string;
  teams: Team[];
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  team1: Team;
  team2: Team;
}

export interface PostComment {
  id: string;
  user_id?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  author_id: string;
  created_at: string;
  content: string;
  image_url?: string | null;
  video_url?: string | null; 
  likes: number;
  hasLiked?: boolean;
  comments: PostComment[];
  profiles?: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

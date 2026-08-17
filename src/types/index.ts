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
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorTagline: string;
  createdAt: string;
  content: string;
  image?: string;
  video?: string; // Local base64 string or url for video uploads
  likes: number;
  hasLiked?: boolean;
  comments: PostComment[];
  shares: number;
}

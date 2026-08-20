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

export interface DBTeam {
  id: string;
  mentor_id: string;
  name: string;
  created_at: string;
}

export interface DBTeamMember {
  id: string;
  team_id: string;
  student_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    role: string;
  };
}

export interface DBDailyTaskCompletion {
  id: string;
  task_id: string;
  student_id: string;
  task_date: string;
  completed: boolean;
  points_earned: number;
  completed_at: string;
}

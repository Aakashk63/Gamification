import type { Leaderboard, Team, Mentor } from '../types';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-titans',
    name: 'TITANS',
    rank: 1,
    avatar: '⚡',
    department: 'Computer Science & Engineering',
    tagline: 'Defending Spring Champions',
    badge: '👑 Reigning #1',
    previousRank: 1,
    highlightColor: 'from-amber-400 to-yellow-600',
    members: [
      { id: 'm1', name: 'Alex Vance', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 950 },
      { id: 'm2', name: 'Devon Miles', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', role: 'Lead Architect', points: 890 },
      { id: 'm3', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', role: 'ML Engineer', points: 870 },
      { id: 'm4', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', role: 'DevOps', points: 820 },
    ],
  },
  {
    id: 'team-phoenix',
    name: 'PHOENIX',
    rank: 2,
    avatar: '🔥',
    department: 'Electrical & Systems Engineering',
    tagline: 'Rising through the brackets',
    badge: '🥈 Contender',
    previousRank: 3,
    highlightColor: 'from-slate-200 to-slate-400',
    members: [
      { id: 'm5', name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 920 },
      { id: 'm6', name: 'Marcus Bell', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80', role: 'Fullstack', points: 880 },
      { id: 'm7', name: 'Zoe Zhang', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', role: 'Security Lead', points: 840 },
    ],
  },
  {
    id: 'team-warriors',
    name: 'WARRIORS',
    rank: 3,
    avatar: '⚔️',
    department: 'Artificial Intelligence & Robotics',
    tagline: 'Unstoppable Momentum',
    badge: '🥉 Bronze Tier',
    previousRank: 2,
    highlightColor: 'from-amber-600 to-amber-800',
    members: [
      { id: 'm8', name: 'Liam Sterling', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 910 },
      { id: 'm9', name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80', role: 'Data Strategist', points: 860 },
      { id: 'm10', name: 'Jordan Hayes', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80', role: 'Cloud Lead', points: 830 },
    ],
  },
  {
    id: 'team-cyberwolves',
    name: 'CYBER WOLVES',
    rank: 4,
    avatar: '🐺',
    department: 'Cybersecurity & Networks',
    tagline: 'Stealth & precision',
    previousRank: 5,
    members: [
      { id: 'm11', name: 'Nathan Drake', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 900 },
      { id: 'm12', name: 'Amira Khan', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80', points: 850 },
      { id: 'm13', name: 'Carlos Gomez', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80', points: 810 },
    ],
  },
  {
    id: 'team-quantumknights',
    name: 'QUANTUM KNIGHTS',
    rank: 5,
    avatar: '🛡️',
    department: 'Quantum Computing Lab',
    tagline: 'Calculating victory',
    previousRank: 4,
    members: [
      { id: 'm14', name: 'Freja Lind', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 880 },
      { id: 'm15', name: 'Tariq Al-Mansoor', avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80', points: 830 },
      { id: 'm16', name: 'Mia Tanaka', avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=120&auto=format&fit=crop&q=80', points: 790 },
    ],
  },
  {
    id: 'team-apexpredators',
    name: 'APEX PREDATORS',
    rank: 6,
    avatar: '🦅',
    department: 'Data Science & Analytics',
    tagline: 'Hunting the top spot',
    previousRank: 6,
    members: [
      { id: 'm17', name: 'Dante Russo', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 870 },
      { id: 'm18', name: 'Kavita Roy', avatar: 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?w=120&auto=format&fit=crop&q=80', points: 820 },
    ],
  },
  {
    id: 'team-vortex',
    name: 'VORTEX CORE',
    rank: 7,
    avatar: '🌀',
    department: 'Interactive Media & Game Design',
    tagline: 'Dynamic game-makers',
    previousRank: 8,
    members: [
      { id: 'm19', name: 'Lucas Scott', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 850 },
      { id: 'm20', name: 'Chloe Dubois', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', points: 800 },
    ],
  },
  {
    id: 'team-nova',
    name: 'NOVA DRIFTERS',
    rank: 8,
    avatar: '✨',
    department: 'Aerospace & Mechatronics',
    tagline: 'Reaching new heights',
    previousRank: 7,
    members: [
      { id: 'm21', name: 'Kenji Sato', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 840 },
      { id: 'm22', name: 'Ananya Nair', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80', points: 790 },
    ],
  },
  {
    id: 'team-sentinels',
    name: 'SENTINELS',
    rank: 9,
    avatar: '🛰️',
    department: 'Bioinformatics & Computational Bio',
    tagline: 'Guarding precision',
    previousRank: 9,
    members: [
      { id: 'm23', name: 'Oliver Twist', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 820 },
      { id: 'm24', name: 'Grace Hopper Jr.', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80', points: 780 },
    ],
  },
  {
    id: 'team-hyperion',
    name: 'HYPERION',
    rank: 10,
    avatar: '🪐',
    department: 'Applied Physics & Systems',
    tagline: 'Gravity defied',
    previousRank: 10,
    members: [
      { id: 'm25', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', role: 'Captain', points: 810 },
    ],
  },
];

export const MOCK_MENTORS: Mentor[] = [
  {
    id: 'mentor-sarah',
    name: 'Dr. Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Professor of AI & Data Science',
    department: 'Computer Science',
    team1: INITIAL_TEAMS[0], // Titans
    team2: INITIAL_TEAMS[3], // Cyber Wolves
  },
  {
    id: 'mentor-elena',
    name: 'Prof. Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Head of Embedded Systems Lab',
    department: 'Electrical Engineering',
    team1: INITIAL_TEAMS[1], // Phoenix
    team2: INITIAL_TEAMS[4], // Quantum Knights
  },
  {
    id: 'mentor-liam',
    name: 'Dr. Liam Sterling',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    role: 'Robotics & Control Systems Chair',
    department: 'Robotics Engineering',
    team1: INITIAL_TEAMS[2], // Warriors
    team2: INITIAL_TEAMS[5], // Apex Predators
  },
];

export const MOCK_LEADERBOARDS: Record<string, Leaderboard> = {
  'campus-cup-2026': {
    id: 'campus-cup-2026',
    title: 'Spring Campus Championship 2026',
    season: 'Season 4 • Live Standings',
    updatedAt: 'Just now (Live Sync)',
    teams: INITIAL_TEAMS,
  },
};

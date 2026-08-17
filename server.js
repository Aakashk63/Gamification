import ws from 'ws';
globalThis.WebSocket = ws;

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase Init on Backend
const SUPABASE_URL = 'https://tvgojqjnauuavwzvjnvb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa';
const supabaseBackend = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// MongoDB URI
const MONGO_URI = "mongodb+srv://akaakashsvg63:akaakashsvg63@clustercore.jhnizdr.mongodb.net/test?appName=Clustercore";

let useMongoDB = false;
let PostModel = null;
let MentorModel = null;

// Local JSON file database paths inside node_modules to avoid triggering Vite's file watcher reloads
const LOCAL_DB_PATH = path.resolve('node_modules', 'db_posts.json');
const LOCAL_MENTOR_DB_PATH = path.resolve('node_modules', 'db_mentors.json');

// Default initial seed posts
const SEED_POSTS = [
  {
    id: 'post-1',
    authorName: 'Akshaya .A',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    authorTagline: 'B.E. ECE Student | Aspiring Engineer | Python | Machine Learning',
    createdAt: '12m ago',
    content: "Learning Through Video Editing\n\nI'm happy to share that I attended a Webinar on Video Editing, where I gained valuable insights into the creative and technical aspects of video editing.",
    image: 'https://images.unsplash.com/photo-1589330694653-ded6df53f7ee?w=800&auto=format&fit=crop&q=80',
    likes: 24,
    hasLiked: false,
    shares: 3,
    comments: [
      {
        id: 'c1',
        authorName: 'Alex Vance',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        content: 'Congratulations Akshaya! Great achievement.',
        createdAt: '5m ago'
      }
    ]
  },
  {
    id: 'post-2',
    authorName: 'Devon Miles',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    authorTagline: 'CS Student | Competitive Programmer | Hackathon Enthusiast',
    createdAt: '2h ago',
    content: 'Excited to announce that our team TITANS just locked in the #1 position on the CampusXP championship standings! Huge thanks to all members for pushing code all night.',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80',
    likes: 42,
    hasLiked: true,
    shares: 8,
    comments: []
  }
];

// Seed Mentors Data
const SEED_MENTORS = [
  {
    id: 'mentor-sarah',
    name: 'Dr. Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Professor of AI & Data Science',
    department: 'Computer Science'
  },
  {
    id: 'mentor-elena',
    name: 'Prof. Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    role: 'Head of Embedded Systems Lab',
    department: 'Electrical Engineering'
  },
  {
    id: 'mentor-liam',
    name: 'Dr. Liam Sterling',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    role: 'Robotics & Control Systems Chair',
    department: 'Robotics Engineering'
  }
];

// Helper functions for Local JSON Database
const readLocalDB = () => {
  try {
    const parentDir = path.dirname(LOCAL_DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(SEED_POSTS, null, 2));
      return SEED_POSTS;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local file database:', error);
    return SEED_POSTS;
  }
};

const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to local file database:', error);
  }
};

const readLocalMentorsDB = () => {
  try {
    if (!fs.existsSync(LOCAL_MENTOR_DB_PATH)) {
      fs.writeFileSync(LOCAL_MENTOR_DB_PATH, JSON.stringify(SEED_MENTORS, null, 2));
      return SEED_MENTORS;
    }
    const data = fs.readFileSync(LOCAL_MENTOR_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return SEED_MENTORS;
  }
};

// Initialize Database connection safely
const initializeDatabase = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    // Connect with a 5s timeout to prevent buffering hang
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    // Setup mongoose models only if connection is successful
    const commentSchema = new mongoose.Schema({
      id: { type: String, required: true },
      authorName: { type: String, required: true },
      authorAvatar: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: String, required: true }
    });

    const postSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      authorName: { type: String, required: true },
      authorAvatar: { type: String, required: true },
      authorTagline: { type: String, required: true },
      createdAt: { type: String, required: true },
      content: { type: String, required: true },
      image: { type: String },
      video: { type: String },
      likes: { type: Number, default: 0 },
      hasLiked: { type: Boolean, default: false },
      comments: [commentSchema],
      shares: { type: Number, default: 0 }
    });

    const mentorSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      avatar: { type: String, required: true },
      role: { type: String, required: true },
      department: { type: String, required: true }
    });

    PostModel = mongoose.model('Post', postSchema);
    MentorModel = mongoose.model('Mentor', mentorSchema);
    useMongoDB = true;
    console.log('Successfully connected to MongoDB Atlas (Clustercore)');
    
    // Seed MongoDB Posts
    const count = await PostModel.countDocuments();
    if (count === 0) {
      await PostModel.insertMany(SEED_POSTS);
      console.log('Seeded MongoDB Atlas collection with initial posts.');
    }

    // Seed MongoDB Mentors
    const mentorCount = await MentorModel.countDocuments();
    if (mentorCount === 0) {
      await MentorModel.insertMany(SEED_MENTORS);
      console.log('Seeded MongoDB Atlas collection with mentors.');
    }
  } catch (err) {
    console.warn('MongoDB Connection Failed:', err.message || err);
    console.warn('Falling back to local file storage node_modules/db_posts.json.');
    useMongoDB = false;
    PostModel = null;
    MentorModel = null;
    readLocalDB();
  }
};
initializeDatabase();

// --- BACKEND API ENDPOINTS ---

// A. Login Proxy Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseBackend.auth.signInWithPassword({
      email,
      password
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Auth server error during login' });
  }
});

// B. Signup Proxy Endpoint
app.post('/api/signup', async (req, res) => {
  const { email, password, options } = req.body;
  try {
    const { data, error } = await supabaseBackend.auth.signUp({
      email,
      password,
      options
    });
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Auth server error during signup' });
  }
});

// C. Fetch Mentors List
app.get('/api/mentors', async (req, res) => {
  try {
    if (useMongoDB && MentorModel) {
      const mentors = await MentorModel.find({});
      return res.json(mentors);
    } else {
      return res.json(readLocalMentorsDB());
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve mentors' });
  }
});

// D. Fetch Dashboard Summary Stats
app.get('/api/dashboard', async (req, res) => {
  try {
    let postsCount = 0;
    if (useMongoDB && PostModel) {
      postsCount = await PostModel.countDocuments();
    } else {
      postsCount = readLocalDB().length;
    }
    return res.json({
      totalTeams: 10,
      overallLeader: 'TITANS',
      activeMentorsCount: 3,
      totalAnnouncementsCount: postsCount,
      liveStatus: 'Spring Season 4 Active'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
  }
});

// 1. Fetch All Posts
app.get('/api/posts', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const posts = await PostModel.find({}).sort({ _id: -1 });
      return res.json(posts);
    } else {
      const posts = readLocalDB();
      return res.json([...posts].reverse());
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve announcements' });
  }
});

// 2. Create Post
app.post('/api/posts', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const newPost = new PostModel(req.body);
      await newPost.save();
      return res.status(201).json(newPost);
    } else {
      const posts = readLocalDB();
      const newPost = { ...req.body };
      posts.push(newPost);
      writeLocalDB(posts);
      return res.status(201).json(newPost);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// 3. Delete Post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const result = await PostModel.findOneAndDelete({ id: req.params.id });
      if (!result) return res.status(404).json({ error: 'Announcement not found' });
      return res.json({ success: true, message: 'Announcement deleted successfully' });
    } else {
      let posts = readLocalDB();
      const originalLength = posts.length;
      posts = posts.filter(p => p.id !== req.params.id);
      if (posts.length === originalLength) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      writeLocalDB(posts);
      return res.json({ success: true, message: 'Announcement deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// 4. Like Post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const post = await PostModel.findOne({ id: req.params.id });
      if (!post) return res.status(404).json({ error: 'Announcement not found' });
      post.hasLiked = !post.hasLiked;
      post.likes = post.hasLiked ? post.likes + 1 : post.likes - 1;
      await post.save();
      return res.json(post);
    } else {
      const posts = readLocalDB();
      const postIndex = posts.findIndex(p => p.id === req.params.id);
      if (postIndex === -1) return res.status(404).json({ error: 'Announcement not found' });
      
      const post = posts[postIndex];
      post.hasLiked = !post.hasLiked;
      post.likes = post.hasLiked ? post.likes + 1 : post.likes - 1;
      posts[postIndex] = post;
      writeLocalDB(posts);
      return res.json(post);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// 5. Add Comment
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const post = await PostModel.findOne({ id: req.params.id });
      if (!post) return res.status(404).json({ error: 'Announcement not found' });
      post.comments.push(req.body);
      await post.save();
      return res.status(201).json(post);
    } else {
      const posts = readLocalDB();
      const postIndex = posts.findIndex(p => p.id === req.params.id);
      if (postIndex === -1) return res.status(404).json({ error: 'Announcement not found' });
      
      const post = posts[postIndex];
      post.comments.push(req.body);
      posts[postIndex] = post;
      writeLocalDB(posts);
      return res.status(201).json(post);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 6. Delete Comment
app.delete('/api/posts/:id/comments/:commentId', async (req, res) => {
  try {
    if (useMongoDB && PostModel) {
      const post = await PostModel.findOne({ id: req.params.id });
      if (!post) return res.status(404).json({ error: 'Announcement not found' });
      post.comments = post.comments.filter(c => c.id !== req.params.commentId);
      await post.save();
      return res.json(post);
    } else {
      const posts = readLocalDB();
      const postIndex = posts.findIndex(p => p.id === req.params.id);
      if (postIndex === -1) return res.status(404).json({ error: 'Announcement not found' });
      
      const post = posts[postIndex];
      post.comments = post.comments.filter(c => c.id !== req.params.commentId);
      posts[postIndex] = post;
      writeLocalDB(posts);
      return res.json(post);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

app.listen(PORT, () => {
  console.log(`CampusXP server listening on port ${PORT}`);
});

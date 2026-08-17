"""
CampusXP — FastAPI Backend
Replaces the Express.js server.js
Runs on: uvicorn main:app --host 0.0.0.0 --port 5001 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import motor.motor_asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from supabase import create_client, Client

# ─── App Setup ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="CampusXP API",
    description="FastAPI backend for CampusXP Collegiate Gamification Platform",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ──────────────────────────────────────────────────────────────────
MONGO_URI = "mongodb+srv://akaakashsvg63:akaakashsvg63@clustercore.jhnizdr.mongodb.net/test?appName=Clustercore"
SUPABASE_URL = "https://tvgojqjnauuavwzvjnvb.supabase.co"
SUPABASE_KEY = "sb_publishable_K0I_8o-yxg5WB7GJRzxs0A_otD8qQoa"

LOCAL_DB_PATH = Path("node_modules/db_posts.json")
LOCAL_MENTOR_DB_PATH = Path("node_modules/db_mentors.json")
LOCAL_FEEDBACK_DB_PATH = Path("node_modules/db_feedback.json")

# ─── Supabase Client ─────────────────────────────────────────────────────────
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── MongoDB Connection ───────────────────────────────────────────────────────
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000
)
db = mongo_client["test"]
posts_collection = db["posts"]
mentors_collection = db["mentors"]
feedback_collection = db["feedback"]

# ─── Seed Data ────────────────────────────────────────────────────────────────
SEED_POSTS = [
    {
        "id": "post-1",
        "authorName": "Akshaya .A",
        "authorAvatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        "authorTagline": "B.E. ECE Student | Aspiring Engineer | Python | Machine Learning",
        "createdAt": "12m ago",
        "content": "Learning Through Video Editing\n\nI'm happy to share that I attended a Webinar on Video Editing!",
        "image": "https://images.unsplash.com/photo-1589330694653-ded6df53f7ee?w=800&auto=format&fit=crop&q=80",
        "likes": 24,
        "hasLiked": False,
        "shares": 3,
        "comments": [
            {
                "id": "c1",
                "authorName": "Alex Vance",
                "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
                "content": "Congratulations Akshaya! Great achievement.",
                "createdAt": "5m ago"
            }
        ]
    },
    {
        "id": "post-2",
        "authorName": "Devon Miles",
        "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        "authorTagline": "CS Student | Competitive Programmer | Hackathon Enthusiast",
        "createdAt": "2h ago",
        "content": "Excited to announce that our team TITANS just locked in the #1 position on the CampusXP championship standings!",
        "image": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=80",
        "likes": 42,
        "hasLiked": True,
        "shares": 8,
        "comments": []
    }
]

SEED_MENTORS = [
    {"id": "mentor-sarah", "name": "Dr. Sarah Jenkins", "avatar": "", "role": "Professor of AI & Data Science", "department": "Computer Science"},
    {"id": "mentor-elena", "name": "Prof. Elena Rostova", "avatar": "", "role": "Head of Embedded Systems Lab", "department": "Electrical Engineering"},
    {"id": "mentor-liam", "name": "Dr. Liam Sterling", "avatar": "", "role": "Robotics & Control Systems Chair", "department": "Robotics Engineering"},
]

# ─── Local File Fallback ──────────────────────────────────────────────────────
def read_local_db():
    try:
        LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not LOCAL_DB_PATH.exists():
            LOCAL_DB_PATH.write_text(json.dumps(SEED_POSTS, indent=2))
            return SEED_POSTS
        return json.loads(LOCAL_DB_PATH.read_text())
    except Exception:
        return SEED_POSTS

def write_local_db(data):
    try:
        LOCAL_DB_PATH.write_text(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error writing local DB: {e}")

def read_local_feedback():
    try:
        if not LOCAL_FEEDBACK_DB_PATH.exists():
            return []
        return json.loads(LOCAL_FEEDBACK_DB_PATH.read_text())
    except Exception:
        return []

def write_local_feedback(data):
    try:
        LOCAL_FEEDBACK_DB_PATH.write_text(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error writing local feedback DB: {e}")

def read_local_mentors():
    try:
        if not LOCAL_MENTOR_DB_PATH.exists():
            LOCAL_MENTOR_DB_PATH.write_text(json.dumps(SEED_MENTORS, indent=2))
            return SEED_MENTORS
        return json.loads(LOCAL_MENTOR_DB_PATH.read_text())
    except Exception:
        return SEED_MENTORS

# ─── MongoDB availability flag ────────────────────────────────────────────────
use_mongo = False

@app.on_event("startup")
async def startup_event():
    global use_mongo
    try:
        # Test MongoDB connection
        await mongo_client.server_info()
        use_mongo = True
        print("[OK] FastAPI: Connected to MongoDB Atlas (Clustercore)")

        # Seed posts if empty
        count = await posts_collection.count_documents({})
        if count == 0:
            await posts_collection.insert_many(SEED_POSTS)
            print("[OK] Seeded MongoDB with initial posts.")

        # Seed mentors if empty
        mcount = await mentors_collection.count_documents({})
        if mcount == 0:
            await mentors_collection.insert_many(SEED_MENTORS)
            print("[OK] Seeded MongoDB with mentors.")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("[WARN] Falling back to local file storage.")
        use_mongo = False

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class CommentModel(BaseModel):
    id: str
    authorName: str
    authorAvatar: str
    content: str
    createdAt: str

class PostModel(BaseModel):
    id: str
    authorName: str
    authorAvatar: str
    authorTagline: str
    createdAt: str
    content: str
    image: Optional[str] = None
    video: Optional[str] = None
    likes: int = 0
    hasLiked: bool = False
    shares: int = 0
    comments: List[CommentModel] = []

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    options: Optional[dict] = None

class FeedbackModel(BaseModel):
    name: str
    department: str
    teamName: str
    email: str
    contactNumber: str
    feedback: str
    fileName: Optional[str] = None

def serialize(doc) -> dict:
    """Remove MongoDB _id field for JSON serialization."""
    if doc is None:
        return {}
    d = dict(doc)
    d.pop("_id", None)
    return d

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "CampusXP FastAPI Server is running",
        "version": "2.0.0",
        "docs": "/docs",
        "mongodb": use_mongo
    }

# A. Login Proxy
@app.post("/api/login")
async def login(req: LoginRequest):
    try:
        res = supabase_client.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        return {
            "session": res.session.model_dump() if res.session else None,
            "user": res.user.model_dump() if res.user else None
        }
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, 'message'):
            err_msg = e.message
        elif hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                err_msg = e.response.json().get('msg', err_msg)
            except:
                pass
        raise HTTPException(status_code=400, detail=err_msg)

# B. Signup Proxy
@app.post("/api/signup")
async def signup(req: SignupRequest):
    try:
        options = req.options or {}
        res = supabase_client.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": options
        })
        return {
            "session": res.session.model_dump() if res.session else None,
            "user": res.user.model_dump() if res.user else None
        }
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, 'message'):
            err_msg = e.message
        elif hasattr(e, 'response') and hasattr(e.response, 'json'):
            try:
                err_msg = e.response.json().get('msg', err_msg)
            except:
                pass
        raise HTTPException(status_code=400, detail=err_msg)

# C. Get Mentors — Calls Supabase RPC get_mentors() first, falls back to MongoDB
@app.get("/api/mentors")
async def get_mentors():
    # Primary: call Supabase RPC get_mentors()
    try:
        result = supabase_client.rpc("get_mentors").execute()
        if result.data:
            return result.data
    except Exception as e:
        print(f"Supabase RPC get_mentors failed: {e}")

    # Secondary: MongoDB
    if use_mongo:
        try:
            mentors = await mentors_collection.find({}).to_list(length=100)
            return [serialize(m) for m in mentors]
        except Exception as e:
            print(f"MongoDB mentor fetch failed: {e}")

    # Fallback: local file
    return read_local_mentors()

# D. Dashboard Stats
@app.get("/api/dashboard")
async def dashboard():
    try:
        if use_mongo:
            posts_count = await posts_collection.count_documents({})
        else:
            posts_count = len(read_local_db())
    except Exception:
        posts_count = 0

    # Get mentor count from Supabase
    mentor_count = 3
    try:
        result = supabase_client.rpc("get_mentors").execute()
        if result.data:
            mentor_count = len(result.data)
    except Exception:
        pass

    return {
        "totalTeams": 10,
        "overallLeader": "TITANS",
        "activeMentorsCount": mentor_count,
        "totalAnnouncementsCount": posts_count,
        "liveStatus": "Spring Season 4 Active"
    }

# 1. Get All Posts
@app.get("/api/posts")
async def get_posts():
    try:
        if use_mongo:
            posts = await posts_collection.find({}).sort("_id", -1).to_list(length=200)
            return [serialize(p) for p in posts]
        else:
            return list(reversed(read_local_db()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch posts: {e}")

# 2. Create Post
@app.post("/api/posts", status_code=201)
async def create_post(post: PostModel):
    post_dict = post.model_dump()
    try:
        if use_mongo:
            await posts_collection.insert_one(post_dict)
            post_dict.pop("_id", None)
            return post_dict
        else:
            posts = read_local_db()
            posts.append(post_dict)
            write_local_db(posts)
            return post_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {e}")

# 3. Delete Post
@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: str):
    try:
        if use_mongo:
            result = await posts_collection.delete_one({"id": post_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Post not found")
            return {"success": True, "message": "Post deleted successfully"}
        else:
            posts = read_local_db()
            new_posts = [p for p in posts if p.get("id") != post_id]
            if len(new_posts) == len(posts):
                raise HTTPException(status_code=404, detail="Post not found")
            write_local_db(new_posts)
            return {"success": True, "message": "Post deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete post: {e}")


# 5. Add Comment
@app.post("/api/posts/{post_id}/comments", status_code=201)
async def add_comment(post_id: str, comment: CommentModel):
    comment_dict = comment.model_dump()
    try:
        if use_mongo:
            result = await posts_collection.find_one_and_update(
                {"id": post_id},
                {"$push": {"comments": comment_dict}},
                return_document=True
            )
            if not result:
                raise HTTPException(status_code=404, detail="Post not found")
            return serialize(result)
        else:
            posts = read_local_db()
            for p in posts:
                if p.get("id") == post_id:
                    p.setdefault("comments", []).append(comment_dict)
                    write_local_db(posts)
                    return p
            raise HTTPException(status_code=404, detail="Post not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {e}")

# 6. Delete Comment
@app.delete("/api/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str):
    try:
        if use_mongo:
            result = await posts_collection.find_one_and_update(
                {"id": post_id},
                {"$pull": {"comments": {"id": comment_id}}},
                return_document=True
            )
            if not result:
                raise HTTPException(status_code=404, detail="Post not found")
            return serialize(result)
        else:
            posts = read_local_db()
            for p in posts:
                if p.get("id") == post_id:
                    p["comments"] = [c for c in p.get("comments", []) if c.get("id") != comment_id]
                    write_local_db(posts)
                    return p
            raise HTTPException(status_code=404, detail="Post not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete comment: {e}")

# 7. Submit Feedback
@app.post("/api/feedback", status_code=201)
async def submit_feedback(feedback: FeedbackModel):
    feedback_dict = feedback.model_dump()
    feedback_dict["createdAt"] = datetime.utcnow().isoformat()
    try:
        if use_mongo:
            await feedback_collection.insert_one(feedback_dict)
            return {"success": True}
        else:
            fb_list = read_local_feedback()
            fb_list.append(feedback_dict)
            write_local_feedback(fb_list)
            return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {e}")

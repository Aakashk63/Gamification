import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Post } from '../types';
import { supabase } from '../lib/supabase';
import {
  apiGetPosts,
  apiCreatePost,
  apiDeletePost,
  apiLikePost,
  apiAddComment,
  apiDeleteComment,
  type ApiPost,
  type ApiComment
} from '../lib/api';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Image as ImageIcon,
  Video,
  X,
  Send,
  MapPin,
  Building,
  CheckCircle,
  MoreHorizontal,
  Upload,
  Link,
  Info,
  Trash2
} from 'lucide-react';

export const AnnouncementPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  
  // Media states: supports URL or local file upload
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<{ name: string; url: string; type: 'image' | 'video' } | null>(null);

  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openComments, setOpenComments] = useState<{ [postId: string]: boolean }>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read query parameter on component load to detect if a specific post was shared
  const [sharedPostId, setSharedPostId] = useState<string | null>(null);

  // Fetch all posts from backend API
  const fetchPosts = async () => {
    try {
      const data = await apiGetPosts();
      setPosts(data as unknown as Post[]);
    } catch (err) {
      console.warn('Backend API connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const params = new URLSearchParams(window.location.search);
    const postParam = params.get('post');
    if (postParam) {
      setSharedPostId(postParam);
      // Auto-open comments for the shared post
      setOpenComments((prev) => ({ ...prev, [postParam]: true }));
    }
  }, []);

  // Handle student profile
  const [studentProfile, setStudentProfile] = useState({
    name: 'AAKASH K',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    tagline: 'Empowering Creators Through Code & Design | After Effects | Frontend Architect',
    location: 'Coimbatore, Tamil Nadu',
    institution: 'SNS Square / SNS Institution',
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=80'
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.user_metadata) {
        const meta = user.user_metadata;
        setStudentProfile((prev) => ({
          ...prev,
          name: meta.name || prev.name,
          institution: meta.collegeName || prev.institution,
          tagline: meta.role === 'mentor'
            ? `${meta.name} | Authorized Mentor`
            : `${meta.department || 'Student'} | Register No: ${meta.registerNo || ''}`,
          avatar: meta.role === 'mentor'
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
            : prev.avatar
        }));
      }
    });
  }, []);

  // Trigger local file selection input
  const triggerFileSelect = (type: 'image' | 'video') => {
    if (fileInputRef.current) {
      // Set correct accept filter
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  // Convert uploaded local photo/video to base64 for instant client-side preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target?.result as string;
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      
      setMediaFile({
        name: file.name,
        url: base64Url,
        type
      });
      setMediaUrl(''); // Clear url input if file uploaded
    };
    reader.readAsDataURL(file);
  };

  // Clear current media selection
  const removeMedia = () => {
    setMediaFile(null);
    setMediaUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Start new post submission
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim()) return;

    // Determine media content source (file upload overrides url text)
    const finalImage = mediaFile?.type === 'image' ? mediaFile.url : mediaUrl.trim() ? mediaUrl.trim() : undefined;
    const finalVideo = mediaFile?.type === 'video' ? mediaFile.url : undefined;

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorName: studentProfile.name,
      authorAvatar: studentProfile.avatar,
      authorTagline: studentProfile.tagline,
      createdAt: 'Just now',
      content: postCaption,
      image: finalImage,
      video: finalVideo,
      likes: 0,
      hasLiked: false,
      shares: 0,
      comments: []
    };

    // Optimistic UI update
    setPosts([newPost as unknown as Post, ...posts]);
    setPostCaption('');
    removeMedia();
    setIsPostModalOpen(false);

    try {
      await apiCreatePost(newPost as unknown as ApiPost);
      fetchPosts();
    } catch (err) {
      console.error('Failed to save announcement to DB:', err);
    }
  };

  // Delete post (only Aakash K)
  const handleDeletePost = async (postId: string) => {
    // Optimistic UI update
    setPosts(posts.filter(p => p.id !== postId));
    try {
      await apiDeletePost(postId);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete post from DB:', err);
    }
  };

  // Like action
  const handleLikePost = async (postId: string) => {
    // Optimistic UI update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const hasLiked = !post.hasLiked;
          return {
            ...post,
            hasLiked,
            likes: hasLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );

    try {
      await apiLikePost(postId);
      fetchPosts();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // Comment submission
  const handleAddComment = async (postId: string) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      authorName: studentProfile.name,
      authorAvatar: studentProfile.avatar,
      content: text,
      createdAt: 'Just now'
    };

    // Optimistic UI update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      })
    );
    setCommentInput({ ...commentInput, [postId]: '' });

    try {
      await apiAddComment(postId, newComment as ApiComment);
      fetchPosts();
    } catch (err) {
      console.error('Failed to add comment to DB:', err);
    }
  };

  // Delete Comment (only Aakash K)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    // Optimistic UI update
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter(c => c.id !== commentId)
          };
        }
        return post;
      })
    );

    try {
      await apiDeleteComment(postId, commentId);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete comment from DB:', err);
    }
  };

  // Dynamic Share action (Generates working post parameter query link)
  const handleSharePost = (postId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(postId);
      setTimeout(() => setCopySuccess(null), 2500);

      // Increment share count
      setPosts(
        posts.map((p) => (p.id === postId ? { ...p, shares: p.shares + 1 } : p))
      );
    });
  };

  // Reset the shared post filter to view normal feed
  const clearSharedHighlight = () => {
    setSharedPostId(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, '', newUrl);
  };

  // Prioritize the shared post to render at the top of the feed list
  const orderedPosts = useMemo(() => {
    if (!sharedPostId) return posts;
    const shared = posts.find((p) => p.id === sharedPostId);
    const others = posts.filter((p) => p.id !== sharedPostId);
    return shared ? [shared, ...others] : posts;
  }, [posts, sharedPostId]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Hidden file input handler */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* LEFT COLUMN: Student Profile Card */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-3xl bg-[#111622] border border-white/[0.08] overflow-hidden shadow-xl">
          {/* Profile Banner */}
          <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-800 relative">
            <img
              src={studentProfile.banner}
              alt="Banner"
              className="w-full h-full object-cover opacity-40"
            />
          </div>

          {/* Profile Details Container */}
          <div className="px-5 pb-5 relative flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full border-4 border-[#111622] overflow-hidden -mt-10 bg-slate-800 z-10 shadow-lg">
              <img
                src={studentProfile.avatar}
                alt={studentProfile.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="mt-3 text-lg font-black font-heading text-white tracking-wide flex items-center gap-1">
              {studentProfile.name}
              <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
              {studentProfile.tagline}
            </p>

            <div className="w-full border-t border-white/[0.06] mt-4 pt-4 space-y-2.5 text-left text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{studentProfile.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-emerald-400">{studentProfile.institution}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Announcement Feed */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* SHARED POST BANNER HIGHLIGHT ALERT */}
        {sharedPostId && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-xs text-emerald-400 font-semibold shadow-inner animate-pulse">
            <div className="flex items-center gap-2">
              <Info className="w-4.5 h-4.5" />
              <span>Viewing shared announcement highlights</span>
            </div>
            <button
              onClick={clearSharedHighlight}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
            >
              Show all feed posts
            </button>
          </div>
        )}

        {/* START A POST BOX */}
        <div className="p-4 rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl space-y-3.5">
          <div className="flex items-center gap-3">
            <img
              src={studentProfile.avatar}
              alt="Aakash K"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <button
              onClick={() => {
                setIsPostModalOpen(true);
              }}
              className="flex-1 text-left px-4 py-2.5 rounded-full bg-slate-900/60 border border-white/[0.06] hover:bg-slate-900 hover:border-emerald-500/20 text-slate-400 text-xs font-semibold transition-all cursor-pointer"
            >
              Start a post
            </button>
          </div>

          {/* Quick media triggers - Remove write article */}
          <div className="flex items-center justify-around border-t border-white/[0.04] pt-3 text-xs text-slate-400 font-semibold">
            <button
              onClick={() => {
                setIsPostModalOpen(true);
                triggerFileSelect('video');
              }}
              className="flex items-center gap-2 hover:text-emerald-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              <Video className="w-4.5 h-4.5 text-emerald-400" />
              <span>Upload Video</span>
            </button>
            <button
              onClick={() => {
                setIsPostModalOpen(true);
                triggerFileSelect('image');
              }}
              className="flex items-center gap-2 hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              <ImageIcon className="w-4.5 h-4.5 text-indigo-400" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>

        {/* FEED POSTS */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              Loading Announcements from SNS Database...
            </div>
          ) : orderedPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No announcements posted yet. Start a new post to update your peers!
            </div>
          ) : (
            orderedPosts.map((post) => {
              const hasComments = openComments[post.id];
              const isSharedTarget = sharedPostId === post.id;
              const isAuthor = post.authorName === studentProfile.name;
              return (
                <div
                  key={post.id}
                  className={`p-5 rounded-3xl bg-[#111622]/80 border shadow-md space-y-4 transition-all duration-300 ${
                    isSharedTarget
                      ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 bg-[#111622] scale-[1.01]'
                      : 'border-white/[0.06]'
                  }`}
                >
                  {/* Linked Post Highlight tag */}
                  {isSharedTarget && (
                    <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/60 w-fit px-2.5 py-1 rounded-full border border-emerald-500/30">
                      <Link className="w-3 h-3" />
                      <span>Linked Announcement</span>
                    </div>
                  )}

                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wide">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] text-slate-500">• 1st</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-400 max-w-md line-clamp-1">
                          {post.authorTagline}
                        </p>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          {post.createdAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Delete Option for Post Author only */}
                      {isAuthor && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-500/80 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Caption / Content Text */}
                  <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {post.content}
                  </div>

                  {/* Attached Image Media */}
                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-slate-900 max-h-[380px] flex items-center justify-center">
                      <img
                        src={post.image}
                        alt="Attachment"
                        className="w-full h-full object-contain max-h-[380px]"
                      />
                    </div>
                  )}

                  {/* Attached Video Media */}
                  {post.video && (
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-slate-950 max-h-[380px] flex items-center justify-center">
                      <video
                        src={post.video}
                        controls
                        className="w-full h-full object-contain max-h-[380px]"
                      />
                    </div>
                  )}

                  {/* Social Counters */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-white/[0.04] pb-2">
                    <div className="flex items-center gap-1">
                      <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500/10 text-emerald-400">
                        👍
                      </span>
                      <span>{post.likes} Likes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{post.comments.length} Comments</span>
                      <span>{post.shares} Shares</span>
                    </div>
                  </div>

                  {/* Social Actions Buttons */}
                  <div className="flex items-center justify-around text-xs text-slate-400 font-semibold pt-1">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-2 py-1.5 px-3 rounded-xl transition-colors cursor-pointer ${
                        post.hasLiked
                          ? 'text-emerald-400 bg-emerald-500/5'
                          : 'hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                      <span>Like</span>
                    </button>

                    <button
                      onClick={() =>
                        setOpenComments({ ...openComments, [post.id]: !openComments[post.id] })
                      }
                      className={`flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-900 hover:text-slate-200 transition-colors cursor-pointer ${
                        hasComments ? 'text-indigo-400 bg-indigo-500/5' : ''
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Comment</span>
                    </button>

                    <button
                      onClick={() => handleSharePost(post.id)}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-xl hover:bg-slate-900 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copySuccess === post.id ? 'Link Copied!' : 'Share'}</span>
                    </button>
                  </div>

                  {/* COMMENT SECTION PANEL */}
                  {hasComments && (
                    <div className="pt-3 border-t border-white/[0.04] space-y-4">
                      {/* Add Comment input */}
                      <div className="flex gap-2">
                        <img
                          src={studentProfile.avatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                        />
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentInput[post.id] || ''}
                            onChange={(e) =>
                              setCommentInput({ ...commentInput, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-white/[0.08] text-white focus:outline-none focus:border-emerald-400/50"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Comment list */}
                      {post.comments.length > 0 && (
                        <div className="space-y-2.5">
                          {post.comments.map((comment) => {
                            const isCommentAuthor = comment.authorName === studentProfile.name;
                            return (
                              <div
                                key={comment.id}
                                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-white/[0.02] group"
                              >
                                <img
                                  src={comment.authorAvatar}
                                  alt={comment.authorName}
                                  className="w-7 h-7 rounded-full object-cover mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-300">
                                        {comment.authorName}
                                      </span>
                                      {/* Delete Option for Comment Author only */}
                                      {isCommentAuthor && (
                                        <button
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="text-red-500 hover:text-red-400 p-0.5 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                          title="Delete Comment"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500">
                                      {comment.createdAt}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* START A POST MODAL */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreatePost}
            className="relative w-full max-w-lg rounded-3xl bg-[#131826] border border-white/10 p-6 shadow-2xl space-y-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-black font-heading text-white">Create a Post</h3>
              <button
                type="button"
                onClick={removeMedia}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Author details */}
            <div className="flex items-center gap-3">
              <img
                src={studentProfile.avatar}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <span className="text-xs font-bold text-white block">{studentProfile.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Posting to SNS Institution
                </span>
              </div>
            </div>

            {/* Text Area */}
            <div className="space-y-3">
              <textarea
                placeholder="What do you want to talk about?"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                required
                rows={4}
                className="w-full p-3 rounded-2xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50 resize-none"
              />

              {/* MEDIA PREVIEW ZONE (If local file uploaded) */}
              {mediaFile ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2.5 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate max-w-[200px]">
                        {mediaFile.name}
                      </p>
                      <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                        {mediaFile.type} Selected
                      </p>
                    </div>
                  </div>
                  
                  {/* Miniature Preview Thumbnail */}
                  <div className="flex items-center gap-3">
                    {mediaFile.type === 'image' ? (
                      <img
                        src={mediaFile.url}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <video
                        src={mediaFile.url}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-black shrink-0"
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear Selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* OPTIONAL URL FIELD (Visible if no file selected) */
                <div className="space-y-1 animate-in fade-in">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Add Photo/Video URL
                  </label>
                  <input
                    type="url"
                    placeholder="Paste image/video URL (e.g. Unsplash URL)"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400/50"
                  />
                </div>
              )}
            </div>

            {/* Modal actions / upload buttons - Remove write article */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
              {/* Media selection triggers */}
              <div className="flex gap-2 text-slate-400">
                <button
                  type="button"
                  onClick={() => triggerFileSelect('image')}
                  className="p-2 rounded-lg hover:bg-slate-900 hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Upload Local Photo"
                >
                  <ImageIcon className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => triggerFileSelect('video')}
                  className="p-2 rounded-lg hover:bg-slate-900 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Upload Local Video"
                >
                  <Video className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!postCaption.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 disabled:opacity-50 hover:bg-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

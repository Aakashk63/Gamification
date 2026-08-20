import React, { useState, useEffect } from 'react';
import { apiUpdateProfileUrls } from '../lib/api';
import { Share2, CheckCircle, Save, Loader2, Link2, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORE_CATALOG } from '../data/storeCatalog';
import { useProfile } from '../contexts/ProfileContext';
import { AvatarImage } from './ui/AvatarImage';
import { supabase } from '../lib/supabase';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading, refreshProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Edit mode state
  const [isEditingLinkedin, setIsEditingLinkedin] = useState(false);
  const [isEditingLeetcode, setIsEditingLeetcode] = useState(false);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (profile) {
      setLinkedinUrl(profile.linkedin_url || '');
      setLeetcodeUrl(profile.leetcode_url || '');
    }
  }, [profile]);

  const extractUsername = (input: string, platform: 'linkedin' | 'leetcode'): string | null => {
    const val = input.trim();
    if (!val) return null;
    
    if (val.includes('linkedin.com') || val.includes('leetcode.com') || val.startsWith('http')) {
      try {
        let cleanUrl = val.toLowerCase();
        if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
        const urlObj = new URL(cleanUrl);
        
        if (platform === 'linkedin' && urlObj.hostname.includes('linkedin.com')) {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts[0] === 'in' && parts[1]) return parts[1];
        }
        
        if (platform === 'leetcode' && urlObj.hostname.includes('leetcode.com')) {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts[0] === 'u' && parts[1]) return parts[1];
          if (parts[0]) return parts[0];
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    
    if (!val.includes(' ') && !val.includes('/')) {
      return val;
    }
    
    return null;
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSaveSuccess(false);

    const linkedInUser = linkedinUrl.trim() ? extractUsername(linkedinUrl, 'linkedin') : null;
    const leetCodeUser = leetcodeUrl.trim() ? extractUsername(leetcodeUrl, 'leetcode') : null;

    if (linkedinUrl.trim() && !linkedInUser) {
      setErrorMsg('Please enter a valid LinkedIn URL or Username');
      return;
    }

    if (leetcodeUrl.trim() && !leetCodeUser) {
      setErrorMsg('Please enter a valid LeetCode URL or Username');
      return;
    }

    setSaving(true);
    try {
      await apiUpdateProfileUrls(linkedinUrl.trim(), leetcodeUrl.trim(), avatarBase64 || undefined);
      setSaveSuccess(true);
      setIsEditingLinkedin(false);
      setIsEditingLeetcode(false);
      
      // Instantly sync the global application profile state!
      await refreshProfile();
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    // Copy the current URL to clipboard
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const linkedInUsername = extractUsername(linkedinUrl, 'linkedin');
  const leetCodeUsername = extractUsername(leetcodeUrl, 'leetcode');

  return (
    <div className="max-w-6xl mx-auto w-full h-[calc(100vh-6rem)] flex flex-col animate-fade-in overflow-hidden">
      <div className="flex items-center gap-3 shrink-0 mb-6">
        <h1 className="text-2xl font-black font-heading tracking-tight text-white flex items-center gap-1.5">
          PROFILE <span className="text-emerald-400">SETTINGS</span>
        </h1>
        <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent"></div>
      </div>

      <div className="flex justify-center flex-1 min-h-0 px-4 pb-4">
        {/* CENTER CONTAINER: 50/50 Grid */}
        <div className="w-full max-w-5xl rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl flex flex-col md:flex-row min-h-0 relative overflow-hidden">
          
          {/* LEFT COLUMN: Form */}
          <div className="flex-1 flex flex-col p-8 md:border-r border-white/[0.08] min-h-0">
            <div className="space-y-1 mb-8 shrink-0">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Personal Information
              </h2>
              <p className="text-sm text-slate-400">Update your external profile links.</p>
            </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            
            {/* Upload Photo Option */}
            <div className="space-y-1.5 flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-white/[0.04]">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Profile Photo
                </label>
                <p className="text-[10px] text-slate-500 mt-0.5">Upload a photo for your popup avatar.</p>
              </div>
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500/30 bg-transparent flex shrink-0 group">
                {(avatarBase64 || profile.avatar_url) ? (
                  <AvatarImage src={avatarBase64 || profile.avatar_url} alt="Profile" className="w-full h-full object-contain" />
                ) : (
                  <span className="m-auto text-slate-500 text-xs">{profile.full_name?.charAt(0) || 'U'}</span>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-4 h-4 text-white" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  title="Upload Photo"
                />
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Name
              </label>
              <input
                type="text"
                disabled
                value={profile.full_name}
                className="w-full bg-slate-900/50 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-300 font-medium cursor-not-allowed opacity-70"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <input
                type="text"
                disabled
                value={profile.email || ''}
                className="w-full bg-slate-900/50 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-300 font-medium cursor-not-allowed opacity-70"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400/80 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  LinkedIn ID
                </label>
                <button
                  onClick={() => setIsEditingLinkedin(!isEditingLinkedin)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Edit LinkedIn URL"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                disabled={!isEditingLinkedin}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className={`w-full bg-[#1A2235] border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-100 placeholder:text-emerald-500/30 focus:outline-none transition-all ${
                  isEditingLinkedin ? 'focus:ring-2 focus:ring-emerald-500/50' : 'opacity-70 cursor-not-allowed'
                }`}
              />
              {linkedinUrl.trim() && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold px-2">
                  {linkedInUsername ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Verified Username: @{linkedInUsername}</span>
                    </>
                  ) : (
                    <span className="text-red-400">Invalid LinkedIn format</span>
                  )}
                </div>
              )}
            </div>

            {/* LeetCode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-400/80 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  LeetCode ID
                </label>
                <button
                  onClick={() => setIsEditingLeetcode(!isEditingLeetcode)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  title="Edit LeetCode URL"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                disabled={!isEditingLeetcode}
                value={leetcodeUrl}
                onChange={(e) => setLeetcodeUrl(e.target.value)}
                placeholder="https://leetcode.com/yourprofile"
                className={`w-full bg-[#1A2235] border border-indigo-500/30 rounded-xl px-4 py-3 text-sm text-indigo-100 placeholder:text-indigo-500/30 focus:outline-none transition-all ${
                  isEditingLeetcode ? 'focus:ring-2 focus:ring-indigo-500/50' : 'opacity-70 cursor-not-allowed'
                }`}
              />
              {leetcodeUrl.trim() && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold px-2">
                  {leetCodeUsername ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-indigo-400">Verified Username: @{leetCodeUsername}</span>
                    </>
                  ) : (
                    <span className="text-red-400">Invalid LeetCode format</span>
                  )}
                </div>
              )}
            </div>

            {/* Mentor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Mentor
              </label>
              <input
                type="text"
                disabled
                value={profile.mentor_name || 'None'}
                className="w-full bg-slate-900/50 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-slate-300 font-medium cursor-not-allowed opacity-70"
              />
            </div>

            {/* Team Points (Replaced Your Vault) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider ml-1">
                Team Points
              </label>
              <input
                type="text"
                disabled
                value={profile.team_points ? profile.team_points.toLocaleString() : '0'}
                className="w-full bg-amber-950/20 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-300 font-bold tracking-wider cursor-not-allowed"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Profile updated successfully!
            </div>
          )}

            <div className="pt-4 flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/[0.06] hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-sm font-semibold"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share Profile
                    </>
                  )}
                </button>

                {profile?.role === 'mentor' && (
                  <button 
                    onClick={() => {
                      setDeleteStep(1);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/20 border border-red-500/30 hover:bg-red-900/20 text-red-400 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Profile
                  </button>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Profile Preview */}
          <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-900/30 min-h-0 relative">
             <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center justify-center gap-2">
                Your Avatar
              </h2>
            </div>

             <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-[#1a1525] border-4 border-emerald-500/50 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
               <img 
                 src={STORE_CATALOG.find(i => i.id === profile.base_character)?.imagePath || '/characters/batman_3d_v2.png'} 
                 alt="Your Avatar"
                 className="w-full h-full object-contain drop-shadow-xl" 
               />
               <button 
                 onClick={() => navigate('/avatar-store')}
                 className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-20"
                 title="Edit Avatar & Shop"
               >
                 <Pencil className="w-6 h-6 mb-1" />
                 <span className="text-xs font-bold tracking-widest">EDIT AVATAR</span>
               </button>
             </div>
             
             <div className="mt-8 text-center space-y-2">
               <h3 className="text-2xl font-black text-white tracking-tight">{profile.full_name}</h3>
               <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm uppercase tracking-widest">
                 {profile.role}
               </div>
             </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111622] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-red-400 uppercase tracking-wide">
                {deleteStep === 1 ? "Delete Profile?" : "Final Confirmation Required"}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {deleteStep === 1 
                  ? "Are you sure you want to delete your profile? This will remove all your data, customized settings, and leaderboard stats. This action cannot be undone."
                  : "WARNING: You are a Mentor. Deleting your profile will delete all of your created teams, student assignments, and mentor dashboard tracking. This action is extremely destructive. Click confirm again to permanently delete."}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteStep(1);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.06] hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteStep === 1 && profile?.role === 'mentor') {
                    setDeleteStep(2);
                  } else {
                    try {
                      setSaving(true);
                      setShowDeleteConfirm(false);
                      const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
                      if (error) throw error;
                      await supabase.auth.signOut();
                      window.location.reload();
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Failed to delete profile.');
                    } finally {
                      setSaving(false);
                      setDeleteStep(1);
                    }
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold transition-all text-sm cursor-pointer shadow-lg shadow-red-500/20"
              >
                {deleteStep === 1 ? "Delete Profile" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

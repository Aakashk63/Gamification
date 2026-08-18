import React, { useState, useEffect } from 'react';
import { apiGetProfile, apiUpdateProfileUrls, type ApiProfile } from '../lib/api';
import { Share2, CheckCircle, Save, Loader2, Link2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModelViewer } from './ModelViewer';
import { STORE_CATALOG } from '../data/storeCatalog';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiGetProfile();
      setProfile(data);
      setLinkedinUrl(data.linkedin_url || '');
      setLeetcodeUrl(data.leetcode_url || '');
    } catch (err) {
      console.error('Failed to load profile', err);
      setErrorMsg('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

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
      await apiUpdateProfileUrls(linkedinUrl.trim(), leetcodeUrl.trim());
      setSaveSuccess(true);
      setIsEditingLinkedin(false);
      setIsEditingLeetcode(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* LEFT COLUMN: Form */}
        <div className="p-8 rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl flex flex-col min-h-0">
          <div className="space-y-1 shrink-0 mb-8">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Personal Information
            </h2>
            <p className="text-sm text-slate-400">Update your external profile links.</p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
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

          <div className="pt-4 flex items-center justify-between">
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

        {/* RIGHT COLUMN: 3D Avatar Static Preview */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-72 h-[26rem] rounded-3xl bg-[#1a1525] border border-white/[0.08] shadow-2xl flex items-center justify-center">
            
            <ModelViewer 
              modelPath={STORE_CATALOG.find(i => i.id === profile.base_character)?.modelPath || '/models/wall-e.glb'} 
              className="w-full h-full" 
              autoRotate 
            />

            {/* Edit Avatar Overlay Button (White Circle) */}
            <button 
              onClick={() => navigate('/avatar-store')}
              className="absolute -top-4 -right-4 z-30 bg-white hover:bg-slate-200 text-slate-900 w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
              title="Edit Avatar & Shop"
            >
              <Pencil className="w-5 h-5 fill-current" />
            </button>

            {/* "You" Label like reference image */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2a1b2c] text-white text-xs font-bold px-4 py-1.5 rounded-full border border-white/5 shadow-md">
              You
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

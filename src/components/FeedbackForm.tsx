import React, { useState } from 'react';
import { Send, UploadCloud, MessageSquare, Loader2 } from 'lucide-react';
import { apiSubmitFeedback } from '../lib/api';

export const FeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    teamName: '',
    email: '',
    contactNumber: '',
    feedback: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      // In a real app, you would upload the file to Supabase storage and send the URL.
      // For now, we will just send the metadata to the FastAPI backend.
      
      const payload = {
        ...formData,
        fileName: file ? file.name : null,
      };

      await apiSubmitFeedback(payload);
      
      setStatusMsg({ type: 'success', text: 'Feedback submitted successfully! We will get back to you soon.' });
      setFormData({
        name: '',
        department: '',
        teamName: '',
        email: '',
        contactNumber: '',
        feedback: ''
      });
      setFile(null);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to submit feedback. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 animate-in fade-in">
      {/* Header Section */}
      <div className="mb-8 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black font-heading tracking-tight text-white uppercase">
          FAQ & Feedback Form
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Have a question or want to share feedback? Let us know below and our team will assist you.
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-[#111622]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
        {statusMsg && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Name of the Student</label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Department</label>
              <input
                required
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Team Name</label>
              <input
                required
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                placeholder="Your current team"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Email</label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Contact Number</label>
            <input
              required
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Feedback or Question</label>
            <textarea
              required
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              placeholder="How can we help you?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] text-sm text-white focus:outline-none focus:border-emerald-400/50 transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 ml-1">Upload Any Proof (Optional)</label>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/[0.06] border-dashed hover:border-emerald-400/30 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  {file ? file.name : "Attach a file"}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-widest uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Submit Feedback</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

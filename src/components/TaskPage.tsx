import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ChevronRight, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { type ApiTask, apiGetTasks, apiGetProfile, type ApiProfile } from '../lib/api';
import { LeetCodeVerifyModal } from './LeetCodeVerifyModal';

export const TaskPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, profileData] = await Promise.all([
        apiGetTasks(),
        apiGetProfile()
      ]);
      setTasks(tasksData);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifySuccess = () => {
    if (selectedTask) {
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id ? { ...t, completed: true } : t
      ));
    }
    setSelectedTask(null);
    loadData(); // Refresh tasks and profile to show updated points from backend
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const currentCategoryTasks = tasks.filter(t => t.category === activeTab);
  
  const dailyTasks = currentCategoryTasks.filter(t => t.type === 'daily');
  const weeklyTasks = currentCategoryTasks.filter(t => t.type === 'weekly');
  const specialTasks = currentCategoryTasks.filter(t => t.type === 'special');

  const renderTaskCard = (task: ApiTask) => {
    const isCompleted = task.completed;
    return (
      <div 
        key={task.id}
        onClick={() => {
          if (!isCompleted && task.is_leetcode) {
            setSelectedTask(task);
          }
        }}
        className={`relative p-5 rounded-2xl border transition-all ${
          isCompleted 
            ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70 cursor-default'
            : task.is_leetcode 
              ? 'bg-[#1a2030] border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer'
              : 'bg-[#111622] border-white/[0.05] opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex flex-col h-full justify-between gap-4">
          <div>
            <h4 className={`font-semibold text-sm ${isCompleted ? 'text-emerald-400' : 'text-slate-200'}`}>
              {task.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5">
              <span className="text-lg font-bold text-white">{task.points}</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            
            {isCompleted ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                Done
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider group-hover:text-white transition-colors">
                {task.is_leetcode ? 'Verify Now' : 'Coming Soon'}
                {task.is_leetcode && <ChevronRight className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>

        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
              Completed!
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title: string, taskList: ApiTask[]) => {
    if (taskList.length === 0) return null;
    return (
      <div className="mb-10 animate-fade-in-up">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 border border-white/10 bg-white/5 rounded-lg">
          <h3 className="text-sm font-bold text-white tracking-[0.2em] uppercase">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {taskList.map(renderTaskCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#06080F]/95 backdrop-blur-xl border-b border-white/[0.05] p-6 lg:px-8 shrink-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                  Task Center
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Complete tasks to earn points, level up, and help your team!
                </p>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl overflow-hidden shrink-0">
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'individual'
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  INDIVIDUAL TASK
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`flex-1 min-w-[140px] py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'team'
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  TEAM TASK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {renderSection('Daily Task', dailyTasks)}
            {renderSection('Weekly Task', weeklyTasks)}
            {renderSection('Special Task', specialTasks)}
            
            {currentCategoryTasks.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
                <p>No tasks available in this category.</p>
              </div>
            )}
          </div>
        </div>

      {/* Verification Modal */}
      {selectedTask && profile && (
        <LeetCodeVerifyModal 
          task={selectedTask}
          profile={profile}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleVerifySuccess}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Users, Clock, Plus, X, Calendar, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/ImageWithFallback';

const LuminaStyles = () => (
  <style>{`
    .sg-page {
      --primary: #630ed4;
      --primary-light: rgba(99, 14, 212, 0.1);
      --secondary: #fd761a;
      --secondary-light: rgba(253, 118, 26, 0.1);
      --bg: #f8f9ff;
      --surface: #ffffff;
      --text-main: #1d1a24;
      --text-muted: #4a4455;
      --border-light: rgba(255, 255, 255, 0.4);
      
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg);
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    .sg-blob {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(99, 14, 212, 0.15) 0%, rgba(253, 118, 26, 0.05) 100%);
      filter: blur(80px);
      z-index: 0;
      border-radius: 50%;
      pointer-events: none;
    }
    
    .sg-glass-panel {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-light);
    }
    
    .sg-glass-card {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-light);
      box-shadow: 0 20px 40px rgba(99, 14, 212, 0.08);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
      border-radius: 32px;
    }
    
    .sg-glass-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 30px 60px rgba(99, 14, 212, 0.15);
    }

    .sg-hero-gradient {
      background: linear-gradient(135deg, #4800a0 0%, #732ee4 50%, #fd761a 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .sg-pulse-orange {
      box-shadow: 0 0 0 0 rgba(253, 118, 26, 0.7);
      animation: sg-pulse 2s infinite;
    }
    
    @keyframes sg-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(253, 118, 26, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(253, 118, 26, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(253, 118, 26, 0); }
    }
  `}</style>
);

function getSubjectColors(subject) {
  const hash = String(subject).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = [
    { bg: 'rgba(99, 14, 212, 0.1)', text: '#630ed4' }, // Primary Purple
    { bg: 'rgba(253, 118, 26, 0.1)', text: '#fd761a' }, // Secondary Orange
    { bg: 'rgba(14, 159, 110, 0.1)', text: '#0e9f6e' }, // Emerald
    { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }, // Blue
    { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' }, // Pink
  ];
  return colors[hash % colors.length];
}

function StudyGroupCard({ group, onJoin, onLeave }) {
  const scheduledAt = group.scheduled_at ? new Date(group.scheduled_at) : null;
  const isMember = group.is_member;
  const currentMembers = group.member_count || group.current_members || 0;
  const isFull = currentMembers >= group.max_members;
  const colors = getSubjectColors(group.subject || 'General');

  return (
    <div className="sg-glass-card p-6 flex flex-col justify-between h-[340px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span 
            className="px-4 py-1.5 text-xs font-bold rounded-full uppercase tracking-wider"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {group.subject || 'General'}
          </span>
          {isMember ? (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              <Check size={12} /> Joined
            </span>
          ) : isFull ? (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
              Full
            </span>
          ) : (
             <div className="flex items-center gap-1 text-[var(--secondary)] font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--secondary)] sg-pulse-orange"></span>
                Open
             </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-[var(--text-main)] mb-3 line-clamp-2">
          {group.name || `${group.subject} Group`}
        </h3>
        
        <div className="space-y-2 text-[var(--text-muted)] text-sm font-medium">
          {scheduledAt && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              {format(scheduledAt, 'MMM do')} • {format(scheduledAt, 'h:mm a')}
            </div>
          )}
          {group.location_text && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-orange-400" />
              <span className="line-clamp-1">{group.location_text}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
             <Users size={16} className="text-blue-400" />
           {currentMembers}/{group.max_members} Members
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/30">
        <div className="flex -space-x-3">
          {group.members?.slice(0, 4).map((m, i) => (
             <Avatar key={m.id || i} src={m.avatar_url} name={m.name} size={40} className="border-2 border-white sg-glass-panel" />
          ))}
          {group.members?.length > 4 && (
             <div className="w-10 h-10 rounded-full border-2 border-white sg-glass-panel flex items-center justify-center bg-gray-50 text-[10px] font-bold text-gray-600">
               +{group.members.length - 4}
             </div>
          )}
        </div>
        
        <button
          onClick={() => isMember ? onLeave(group.id) : onJoin(group.id)}
          disabled={!isMember && isFull}
          className={`px-6 py-2.5 rounded-full font-bold transition-all ${
            isMember 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : isFull
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[var(--primary)] text-white hover:bg-opacity-90 shadow-[0_4px_15px_rgba(99,14,212,0.3)]'
          }`}
        >
          {isMember ? 'Leave' : isFull ? 'Full' : 'Join'}
        </button>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    subject: '', name: '', location_text: '',
    scheduled_at: '', max_members: 5,
  });

  const create = useMutation({
    mutationFn: () => api.post('/api/study-groups', { ...form, max_members: parseInt(form.max_members) }),
    onSuccess: () => {
      toast.success('Study group created!');
      queryClient.invalidateQueries({ queryKey: ['sg'] });
      onClose();
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose}></div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl sg-glass-panel rounded-[32px] p-8 sm:p-10 shadow-2xl border-white/50"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[var(--primary)]">Create Study Group</h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2 rounded-full hover:bg-white/50"
          >
            <X size={28} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-muted)] ml-2">Subject Area *</label>
              <input 
                className="w-full px-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                placeholder="e.g. Mathematics" 
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-muted)] ml-2">Group Name</label>
              <input 
                className="w-full px-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                placeholder="e.g. Calculus Final Prep" 
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-muted)] ml-2">Meeting Location *</label>
              <input 
                className="w-full px-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                placeholder="Library or Online Link" 
                value={form.location_text}
                onChange={e => setForm(f => ({ ...f, location_text: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-muted)] ml-2">Max Members</label>
              <input 
                className="w-full px-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                placeholder="5" 
                type="number"
                min={2} max={20}
                value={form.max_members}
                onChange={e => setForm(f => ({ ...f, max_members: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-[var(--text-muted)] ml-2">Date & Time *</label>
              <input 
                className="w-full px-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all" 
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>
          </div>
          
          <button 
            className="w-full py-5 mt-4 bg-[var(--primary)] text-white rounded-full text-lg font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => create.mutate()}
            disabled={!form.subject || !form.location_text || !form.scheduled_at || create.isPending}
          >
            {create.isPending ? 'Creating...' : 'Create Group Now'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function StudyGroupsPage() {
  const [subject, setSubject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.studyGroups({ subject }),
    queryFn: () => {
      const p = new URLSearchParams();
      if (subject) p.set('subject', subject);
      return api.get(`/api/study-groups?${p}`).then(r => r.data);
    },
  });

  const join = useMutation({
    mutationFn: (id) => api.post(`/api/study-groups/${id}/join`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sg'] }); toast.success('Joined group!'); },
    onError: err => toast.error(err.message),
  });

  const leave = useMutation({
    mutationFn: (id) => api.delete(`/api/study-groups/${id}/leave`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sg'] }); toast.success('Left group'); },
  });

  const groups = data?.items || [];

  return (
    <div className="sg-page pb-32">
      <LuminaStyles />
      
      {/* Background Decor */}
      <div className="sg-blob top-[-100px] left-[-100px]"></div>
      <div className="sg-blob bottom-[20vh] right-[-100px]" style={{ background: 'radial-gradient(circle, rgba(253, 118, 26, 0.1) 0%, rgba(99, 14, 212, 0.05) 100%)' }}></div>
      <div className="absolute inset-0 opacity-[0.15] bg-cover bg-center mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLv_bAhc0tbuUypFnawjulVDqY83u4K9pE25j9UAHTS7mN5robOqWFRxUtq4Hs7nkh5mI-qbTy0_rM0a66AdY0epetEL9PK1cFTwYSB45yiaUwjE2QN3S3MAvybuYFUPQ8vP5dXsooods1gfz4n-zr73wvji5tDDpKcI5j9m5RY5NwZvWNZB6a1joqo--q0h-n-Ih_A1fsP85Rd5durCWMxGttV_ISqwZ-G_YEQjBUiJ97vVQ15r_qU9nb0')" }}></div>

      <main className="relative z-10 pt-8 md:pt-16 px-4 md:px-8 max-w-[1280px] mx-auto">
        
        {/* Hero Section */}
        <section className="py-8 md:py-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold sg-hero-gradient mb-4">Study Groups</h2>
            <p className="text-lg text-[var(--text-muted)] max-w-xl">
              Join forces with top students. Collaborative learning made beautiful, organized, and effective.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
            <div className="relative flex-grow md:w-80 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--primary)] transition-colors" size={20} />
              <input 
                className="w-full pl-14 pr-6 py-4 rounded-full sg-glass-panel border-white/40 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium text-[var(--text-main)]" 
                placeholder="Search by subject..." 
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-[var(--secondary)] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Plus size={20} strokeWidth={3} />
              Create Group
            </button>
          </div>
        </section>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} height={340} />)}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState 
            icon={Users} 
            title="No study groups found" 
            description={subject ? `No groups match '${subject}'` : "Create the first study group!"} 
            action={{ label: 'Create Group', onClick: () => setShowModal(true) }} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map(group => (
              <StudyGroupCard 
                key={group.id} 
                group={group} 
                onJoin={id => join.mutate(id)} 
                onLeave={id => leave.mutate(id)} 
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && <CreateGroupModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { PeopleSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/ImageWithFallback';
import { useAuthStore } from '../stores/authStore';

const DEPARTMENTS = ['', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Pharmacy', 'MBA'];

function SeniorCard({ senior }) {
  return (
    <div className="glass-card bg-white/40 border border-white/50 backdrop-blur-xl rounded-[2rem] p-8 flex flex-col items-center text-center hover:scale-[1.02] transition-all duration-500 hover:shadow-xl group">
      <div className="relative mb-6">
        <div className="absolute -inset-2 bg-gradient-to-tr from-primary to-[#fd761a] rounded-full opacity-20 blur-md group-hover:opacity-40 transition-opacity"></div>
        <div className="relative z-10 border-4 border-white rounded-full shadow-sm overflow-hidden bg-white">
          <Avatar src={senior.avatar_url} name={senior.name} size={120} />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-on-surface mb-1">{senior.name}</h3>
      <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{senior.department} · Year {senior.year}</span>
      
      <p className="text-sm text-on-surface-variant mb-6 line-clamp-3 min-h-[60px]">
        {senior.bio_mentor || 'Ready to share experiences and guide juniors.'}
      </p>
      
      <div className="flex flex-wrap justify-center gap-2 mb-8 min-h-[30px]">
        {senior.subjects?.slice(0, 3).map(s => (
          <span key={s} className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap">
            {s}
          </span>
        ))}
      </div>
      
      <button 
        onClick={() => toast.info('Contact feature via DM')}
        className="w-full bg-gradient-to-br from-primary to-[#630ed4] text-white py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 mt-auto"
      >
        <span className="material-symbols-outlined text-[20px]">send</span>
        Message
      </button>
    </div>
  );
}

function OptInModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ bio_mentor: '', subjects: '' });

  const optIn = useMutation({
    mutationFn: () => api.post('/api/seniors/opt-in', {
      bio_mentor: form.bio_mentor,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      toast.success('You are now listed as a mentor!');
      queryClient.invalidateQueries({ queryKey: ['seniors'] });
      onClose();
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#2d3133]/40 backdrop-blur-md" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card bg-white/70 border border-white/50 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 max-w-xl w-full relative shadow-2xl overflow-hidden"
      >
        {/* Modal Background Polish */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#fd761a]/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight">Become a Mentor</h2>
            <button 
              onClick={onClose}
              className="material-symbols-outlined text-on-surface-variant hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-full"
            >
              close
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-2">Your Story & Expertise</label>
              <textarea 
                className="w-full px-6 py-4 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all text-sm resize-none" 
                placeholder="Briefly describe what you're passionate about teaching..." 
                rows="4"
                value={form.bio_mentor} 
                onChange={e => setForm(f => ({ ...f, bio_mentor: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-2">Subjects (comma separated)</label>
              <input 
                className="w-full px-6 py-4 bg-white/50 border border-white/60 rounded-2xl focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all text-sm" 
                placeholder="React, Data Structures, Marketing..." 
                type="text"
                value={form.subjects} 
                onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
              />
            </div>
            
            <button 
              onClick={() => optIn.mutate()} 
              disabled={!form.bio_mentor || optIn.isPending}
              className="w-full bg-gradient-to-br from-primary to-[#630ed4] disabled:opacity-50 text-white py-5 rounded-full font-bold hover:shadow-[0_10px_20px_-5px_rgba(124,58,237,0.4)] transition-all active:scale-[0.98] mt-4"
            >
              {optIn.isPending ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SeniorsPage() {
  const [department, setDepartment] = useState('');
  const [showOptIn, setShowOptIn] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const canBecomeMentor = (user?.year || 0) >= 3;
  const isMentor = user?.is_mentor;

  const { data, isLoading } = useQuery({
    queryKey: qk.seniors(department),
    queryFn: () => api.get(`/api/seniors${department ? `?department=${department}` : ''}`).then(r => r.data),
  });

  const optOut = useMutation({
    mutationFn: () => api.delete('/api/seniors/opt-out'),
    onSuccess: () => { toast.success('Removed from mentor list'); queryClient.invalidateQueries({ queryKey: ['seniors'] }); },
    onError: err => toast.error(err.message),
  });

  const seniors = data?.items || data || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .mesh-gradient {
            background-color: #f7f9fb;
            background-image: 
              radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.08) 0px, transparent 50%),
              radial-gradient(at 100% 0%, rgba(253, 118, 26, 0.08) 0px, transparent 50%),
              radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.08) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(253, 118, 26, 0.08) 0px, transparent 50%);
        }
      `}} />

      <div className="mesh-gradient min-h-screen relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="fixed top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-float"></div>
        <div className="fixed bottom-20 right-10 w-96 h-96 bg-[#fd761a]/10 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '-3s' }}></div>

        <div className="pt-12 pb-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          {/* Hero Section */}
          <section className="mb-12 text-center md:text-left">
            <h1 className="text-5xl md:text-[64px] font-bold text-on-surface tracking-tight mb-4">
              Campus Mentors
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed font-medium">
              Knowledge is a flame that grows when shared. Connect with senior students who have mastered the rhythm of campus life, academic excellence, and the art of balanced living.
            </p>
          </section>

          {/* Filter & Actions */}
          <section className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="relative w-full md:w-80">
              <select 
                value={department} 
                onChange={e => setDepartment(e.target.value)}
                className="w-full appearance-none glass-card bg-white/60 border border-white/50 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer shadow-sm"
              >
                <option value="">Filter by Department (All)</option>
                {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
            </div>

            {canBecomeMentor && (
              isMentor ? (
                <button 
                  onClick={() => optOut.mutate()} 
                  disabled={optOut.isPending}
                  className="bg-white/60 border-2 border-white/80 text-on-surface-variant px-8 py-4 rounded-full font-bold hover:bg-white transition-all active:scale-95 shadow-sm"
                >
                  Remove from Mentors
                </button>
              ) : (
                <button 
                  onClick={() => setShowOptIn(true)}
                  className="bg-gradient-to-br from-primary to-[#630ed4] text-white px-8 py-4 rounded-full font-bold hover:shadow-[0_10px_20px_-5px_rgba(124,58,237,0.4)] transition-all active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Become a Mentor
                </button>
              )
            )}
          </section>

          {/* Mentor Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="glass-card bg-white/40 border border-white/50 rounded-[2rem] p-8 h-[400px]">
                  <PeopleSkeleton />
                </div>
              ))}
            </div>
          ) : seniors.length === 0 ? (
            <EmptyState 
              icon={() => <span className="material-symbols-outlined text-4xl">person_off</span>} 
              title="No mentors yet" 
              description={canBecomeMentor ? "Be the first to share your knowledge!" : "Year 3+ students can become mentors."} 
              action={canBecomeMentor ? { label: 'Become a Mentor', onClick: () => setShowOptIn(true) } : undefined} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {seniors.map(senior => <SeniorCard key={senior.id} senior={senior} />)}
            </div>
          )}

          <AnimatePresence>
            {showOptIn && <OptInModal onClose={() => setShowOptIn(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

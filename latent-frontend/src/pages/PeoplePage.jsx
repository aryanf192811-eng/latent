import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { PeopleSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/ImageWithFallback';

const DEPARTMENTS = ['', 'Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Pharmacy', 'MBA'];
const STATUSES = ['', 'free', 'studying', 'at_mess', 'at_gym', 'in_class'];

function getStatusColor(status) {
  const colors = { 
    free: 'bg-green-500', 
    studying: 'bg-yellow-500', 
    at_mess: 'bg-orange-500', 
    at_gym: 'bg-purple-500', 
    in_class: 'bg-red-500' 
  };
  return colors[status] || 'bg-gray-400';
}

function PersonCard({ person, onFollow, onUnfollow }) {
  const isFollowing = person.is_following;
  
  return (
    <div className="glass-card bg-white/40 border border-white/50 backdrop-blur-xl rounded-2xl p-6 group hover:shadow-xl transition-all duration-500">
      <div className="flex flex-col items-center text-center">
        <Link to={`/profile/${person.id}`} className="relative mb-4 block hover:opacity-90 transition-opacity">
          <div className={`absolute inset-0 rounded-full blur-xl group-hover:blur-2xl transition-all ${getStatusColor(person.campus_status).replace('bg-', 'bg-').replace('-500', '-500/30')}`}></div>
          <div className="relative z-10 border-2 border-white rounded-full overflow-hidden">
            <Avatar src={person.avatar_url} name={person.name} size={96} />
          </div>
          <div className={`absolute bottom-0 right-1 w-5 h-5 ${getStatusColor(person.campus_status)} border-2 border-white rounded-full z-20 shadow-sm`} title={person.campus_status?.replace('_', ' ')}></div>
        </Link>
        
        <Link to={`/profile/${person.id}`} className="hover:opacity-80 transition-opacity">
          <h3 className="text-2xl font-bold text-on-surface mb-1 line-clamp-1">{person.name}</h3>
        </Link>
        <p className="text-sm font-medium text-primary mb-2 opacity-90 line-clamp-1">{person.department || 'Undecided'}</p>
        <p className="text-xs text-on-surface-variant mb-6 uppercase tracking-wider">{person.year ? `Year ${person.year}` : 'Student'}</p>
        
        <button
          onClick={() => isFollowing ? onUnfollow(person.id) : onFollow(person.id)}
          className={`w-full py-3 px-6 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isFollowing
              ? 'bg-white/60 text-primary border-2 border-primary hover:bg-white'
              : 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] active:scale-95'
          }`}
        >
          {isFollowing ? <><span className="material-symbols-outlined text-[18px]">check</span> Following</> : 'Follow'}
        </button>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.people({ department, year, status }),
    queryFn: () => {
      const params = new URLSearchParams();
      if (department) params.set('department', department);
      if (year) params.set('year', year);
      if (status) params.set('status', status);
      return api.get(`/api/people?${params}`).then(r => r.data);
    },
  });

  const follow = useMutation({
    mutationFn: (userId) => api.post(`/api/users/${userId}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Followed user');
    },
    onError: err => toast.error(err.message),
  });

  const unfollow = useMutation({
    mutationFn: (userId) => api.delete(`/api/users/${userId}/follow`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      toast.success('Unfollowed user');
    },
    onError: err => toast.error(err.message),
  });

  const people = data?.items || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .mesh-gradient-bg {
          background-color: #f7f9fb;
          background-image: 
            radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(253, 118, 26, 0.05) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.05) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(253, 118, 26, 0.05) 0px, transparent 50%);
        }
      `}} />
      
      <div className="mesh-gradient-bg min-h-screen pt-12 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="text-5xl md:text-[64px] font-bold text-primary mb-4 tracking-tight">Campus Community</h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto opacity-80 font-medium">
            Connect with fellow students, find collaborators, and build your network within the Latent ecosystem.
          </p>
        </section>

        {/* Filter Bar */}
        <section className="mb-12 sticky top-24 z-40">
          <div className="glass-card bg-white/60 border border-white/40 backdrop-blur-xl rounded-full px-6 py-4 flex flex-wrap md:flex-nowrap items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-grow min-w-[200px]">
              <span className="material-symbols-outlined text-primary text-xl">search</span>
              <span className="text-on-surface font-medium opacity-80">Directory Filters:</span>
            </div>
            
            <div className="h-8 w-px bg-on-surface-variant/20 hidden md:block"></div>
            
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select 
                value={department} 
                onChange={e => setDepartment(e.target.value)}
                className="bg-white/50 border border-white/60 rounded-full px-4 py-2 text-sm font-bold text-on-surface cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23630ed4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
              >
                <option value="">Department (All)</option>
                {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              
              <select 
                value={year} 
                onChange={e => setYear(e.target.value)}
                className="bg-white/50 border border-white/60 rounded-full px-4 py-2 text-sm font-bold text-on-surface cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23630ed4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
              >
                <option value="">Year (All)</option>
                {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value)}
                className="bg-white/50 border border-white/60 rounded-full px-4 py-2 text-sm font-bold text-on-surface cursor-pointer outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23630ed4%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
              >
                <option value="">Status (All)</option>
                {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* User Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="glass-card bg-white/40 border border-white/50 backdrop-blur-xl rounded-2xl p-6 h-[300px]">
                <PeopleSkeleton />
              </div>
            ))}
          </div>
        ) : people.length === 0 ? (
          <EmptyState 
            icon={() => <span className="material-symbols-outlined text-4xl">group_off</span>} 
            title="No people found" 
            description="Try adjusting your filters to find classmates" 
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {people.map(person => (
              <PersonCard 
                key={person.id} 
                person={person} 
                onFollow={id => follow.mutate(id)} 
                onUnfollow={id => unfollow.mutate(id)} 
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

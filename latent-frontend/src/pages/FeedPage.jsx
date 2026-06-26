import { useState, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImagePlus, BarChart2, EyeOff, X, Rss } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { PostCard } from '../components/common/PostCard';
import { PostSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/common/ImageWithFallback';

const TABS = ['for_you', 'following', 'trending'];

function PostComposer({ activeFilter }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const createPost = useMutation({
    mutationFn: (body) => api.post('/api/posts', body),
    onSuccess: () => {
      setContent(''); setExpanded(false);
      queryClient.invalidateQueries({ queryKey: qk.posts(activeFilter) });
      queryClient.invalidateQueries({ queryKey: ['infinite_posts', activeFilter] });
      toast.success('Post published!');
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="glass-panel rounded-2xl p-6 mb-8 inner-glow shadow-xl">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary p-0.5 shrink-0">
          <Avatar src={user?.avatar_url} name={user?.name} size={42} style={{ borderRadius: '50%', width: '100%', height: '100%' }} />
        </div>
        <div
          onClick={() => setExpanded(true)}
          className="flex-1 bg-surface-variant/30 rounded-full px-5 py-3 cursor-text text-on-surface-variant font-body-lg hover:bg-surface-variant/50 transition-colors"
        >
          What's happening on campus?
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-4"
          >
            <textarea
              className="w-full bg-surface-variant/30 text-on-surface rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-body-lg placeholder:text-on-surface-variant/50"
              placeholder="Share something with campus…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              maxLength={500}
              autoFocus
            />
            <div className="flex justify-between items-center mt-3 px-2">
              <div className="flex gap-4">
                <button className="flex items-center gap-2 text-primary hover:text-secondary-fixed transition-colors font-label-md">
                  <ImagePlus size={18} /> <span className="hidden sm:inline">Photo</span>
                </button>
                <button className="flex items-center gap-2 text-tertiary hover:text-primary-fixed transition-colors font-label-md">
                  <BarChart2 size={18} /> <span className="hidden sm:inline">Poll</span>
                </button>
                <button
                  onClick={() => setAnonymous(!anonymous)}
                  className={`flex items-center gap-2 font-label-md transition-colors ${anonymous ? 'text-secondary-container' : 'text-outline hover:text-on-surface'}`}
                >
                  <EyeOff size={18} /> <span className="hidden sm:inline">{anonymous ? 'Anonymous ON' : 'Anonymous'}</span>
                </button>
              </div>
              <div className="flex gap-4 items-center">
                <span className="font-label-sm text-outline">{content.length}/500</span>
                <button onClick={() => setExpanded(false)} className="text-outline hover:text-on-surface transition-colors p-1"><X size={18} /></button>
                <button
                  className="bg-gradient-to-r from-primary-container to-tertiary-container text-on-primary-container font-label-md px-6 py-2 rounded-full shadow-glow disabled:opacity-50 disabled:shadow-none hover:scale-105 transition-all"
                  disabled={!content.trim() || createPost.isPending}
                  onClick={() => createPost.mutate({ content, is_anonymous: anonymous })}
                >
                  {createPost.isPending ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
            {anonymous && <p className="text-xs text-secondary-container mt-2 ml-2">(Posting as Anonymous)</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('for_you');
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['infinite_posts', activeFilter],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/api/posts?tab=${activeFilter}&page=${pageParam}&limit=15`).then(r => r.data),
    getNextPageParam: (last) => last?.hasMore ? (last.page + 1) : undefined,
    initialPageParam: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages?.flatMap(p => p?.items || []) ?? [];

  return (
    <div className="flex flex-col items-center max-w-[1200px] mx-auto w-full p-6 lg:p-10 relative z-10">
      
      {/* Header & Filter */}
      <div className="flex flex-col items-center mb-8 space-y-6">
        <h1 className="font-display-lg text-display-lg bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent text-center">
          Campus Feed
        </h1>
        
        <div className="flex p-1 bg-surface-variant/30 backdrop-blur-md rounded-full shadow-inner">
          {TABS.map(tab => (
            <button 
              key={tab} 
              className={`px-6 py-2 rounded-full font-label-md transition-all duration-300 ${activeFilter === tab ? 'bg-white/10 text-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={() => setActiveFilter(tab)}
            >
              {tab === 'for_you' ? 'For You' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stories/Pulse Bar */}
      <section className="flex gap-gutter overflow-x-auto no-scrollbar py-4 mb-8 -mx-container-padding px-container-padding md:mx-0 md:px-0">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
            <div className="avatar-ring w-20 h-20 aspect-square p-[3px] shrink-0">
              <div className="w-full h-full aspect-square rounded-full border-4 border-background overflow-hidden bg-surface-variant">
                <img className="w-full h-full object-cover opacity-80" src={`https://i.pravatar.cc/150?img=${i+10}`} alt="Story" />
              </div>
            </div>
            <span className="font-label-sm text-on-surface-variant text-xs">Story {i}</span>
          </div>
        ))}
      </section>

      {/* Composer */}
      <PostComposer activeFilter={activeFilter} />

      {/* Posts */}
      <div className="flex flex-col gap-8">
        {isLoading
          ? [1, 2, 3].map(i => <PostSkeleton key={i} />)
          : posts.length === 0
            ? <EmptyState icon={Rss} title="Nothing here yet" description="Be the first to post something!" />
            : posts.map(post => <PostCard key={post.id} post={post} activeFilter={activeFilter} />)
        }
      </div>

      {/* Load more trigger */}
      <div ref={ref} className="h-10 flex items-center justify-center mt-6">
        {isFetchingNextPage && <div className="animate-pulse bg-white/10 rounded-full w-8 h-8" />}
      </div>
    </div>
  );
}

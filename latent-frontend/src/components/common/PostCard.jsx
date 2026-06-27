import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/api';
import { Avatar } from './ImageWithFallback';

const REACTIONS = [
  { type: 'heart', icon: 'favorite', label: 'Heart' },
  { type: 'fire', icon: 'local_fire_department', label: 'Fire' },
  { type: 'laugh', icon: 'sentiment_very_satisfied', label: 'Laugh' },
];

function formatText(text) {
  if (!text) return '';
  return text
    .replace(/#(\w+)/g, '<span class="text-primary font-bold">#$1</span>')
    .replace(/@(\w+)/g, '<span class="text-primary font-bold">@$1</span>');
}

function PollCard({ poll }) {
  if (!poll) return null;
  const totalVotes = poll.total_votes || 0;
  return (
    <div className="p-6 pt-0 flex flex-col gap-2">
      <p className="font-headline-md text-[18px] font-semibold text-on-surface">{poll.question}</p>
      {poll.options?.map(opt => {
        const pct = totalVotes ? Math.round((opt.votes / totalVotes) * 100) : 0;
        const isVoted = poll.user_vote_option_id === opt.id;
        return (
          <div key={opt.id} className={`relative mb-2 border rounded-xl overflow-hidden ${isVoted ? 'border-primary' : 'border-white/20'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`absolute inset-0 ${isVoted ? 'bg-primary-container' : 'bg-surface-variant/40'} rounded-xl`}
            />
            <div className="relative flex justify-between p-3 items-center">
              <span className="font-label-md text-on-surface z-10">{opt.option_text}</span>
              <span className="font-label-md text-primary font-bold z-10">{pct}%</span>
            </div>
          </div>
        );
      })}
      <p className="font-label-sm text-outline mt-1">{totalVotes} votes</p>
    </div>
  );
}

export function PostCard({ post, activeFilter = 'for_you' }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comments on demand when comments section is toggled open
  const { data: commentsData } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => api.get(`/api/posts/${post.id}/comments`).then(r => r.data),
    enabled: showComments,
  });

  // Backend returns `user` field (not `author`)
  const author = post.user;
  const text = post.content || '';
  const isLong = text.length > 250;
  const displayText = isLong && !expanded ? text.slice(0, 250) + '…' : text;

  // Images: backend sends image_urls array
  const images = post.image_urls || [];
  const hasMedia = images.length > 0;

  const INFINITE_KEY = ['infinite_posts', activeFilter];

  const reactMutation = useMutation({
    mutationFn: ({ type, hasReacted }) =>
      hasReacted
        ? api.delete(`/api/posts/${post.id}/react`)
        : api.post(`/api/posts/${post.id}/react`, { reaction_type: type }),
    onMutate: async ({ type, hasReacted }) => {
      await queryClient.cancelQueries({ queryKey: INFINITE_KEY });
      const prev = queryClient.getQueryData(INFINITE_KEY);
      queryClient.setQueryData(INFINITE_KEY, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: (page.items || []).map(p => {
              if (p.id !== post.id) return p;
              const newReactions = { ...p.reaction_counts };
              if (hasReacted) {
                newReactions[p.user_reaction] = Math.max(0, (newReactions[p.user_reaction] || 1) - 1);
              } else {
                if (p.user_reaction) newReactions[p.user_reaction] = Math.max(0, (newReactions[p.user_reaction] || 1) - 1);
                newReactions[type] = (newReactions[type] || 0) + 1;
              }
              return { ...p, user_reaction: hasReacted ? null : type, reaction_counts: newReactions };
            }),
          })),
        };
      });
      return { prev };
    },
    onError: (err, _, context) => {
      toast.error(err.message);
      if (context?.prev) queryClient.setQueryData(INFINITE_KEY, context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: INFINITE_KEY }),
  });

  const commentMutation = useMutation({
    mutationFn: (content) => api.post(`/api/posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: INFINITE_KEY });
    },
    onError: (err) => toast.error(err.message),
  });

  const timeAgo = post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : '';

  return (
    <article className="glass-card relative group rounded-3xl overflow-hidden shadow-2xl flex flex-col mb-8 transition-all duration-500 hover:scale-[1.01] hover:shadow-primary/20 w-full">

      {/* Author Header */}
      <div className="flex items-center gap-3 p-5 z-10 relative">
        <div className="avatar-ring w-12 h-12 p-[2px] shrink-0">
          <div className="w-full h-full rounded-full border-[3px] border-background overflow-hidden bg-surface-variant relative">
            <Avatar
               src={post.is_anonymous ? null : author?.avatar_url}
               name={post.is_anonymous ? '?' : (author?.name || '?')}
               size={42}
               style={{ borderRadius: '50%', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-headline-md text-[16px] font-bold text-on-surface">
            {post.is_anonymous ? <em className="text-on-surface-variant font-normal">Anonymous Student</em> : (author?.name || 'Campus User')}
          </h3>
          <p className="font-label-sm text-on-surface-variant">
            {author?.department || 'Campus'} • {timeAgo}
          </p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Content Text */}
      {displayText && (
        <div className="px-5 pb-4 z-10 relative">
          <p className="font-body-lg text-on-surface leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatText(displayText) }} />
          {isLong && (
            <button onClick={() => setExpanded(!expanded)} className="text-primary font-label-md mt-2 hover:underline">
              {expanded ? 'See less' : 'See more...'}
            </button>
          )}
        </div>
      )}

      {/* Media Content — only if images exist */}
      {hasMedia && (
        <div className="w-full relative bg-surface-variant/30 overflow-hidden max-h-[450px]">
          <img
            src={images[0]}
            alt="Post media"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      {/* Poll */}
      {post.poll && <PollCard poll={post.poll} />}

      {/* Reaction & Action Bar */}
      <div className="p-5 pt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {REACTIONS.map(r => {
             const hasReacted = post.user_reaction === r.type;
             const count = post.reaction_counts?.[r.type] || 0;
             return (
               <button
                 key={r.type}
                 onClick={() => reactMutation.mutate({ type: r.type, hasReacted })}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all active:scale-95 ${hasReacted ? 'bg-primary-container text-on-primary-container shadow-sm' : 'bg-surface-variant/30 text-on-surface hover:bg-surface-variant/60'}`}
               >
                 <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: hasReacted ? "'FILL' 1" : "'FILL' 0" }}>{r.icon}</span>
                 {count > 0 && <span className="font-label-sm font-bold">{count}</span>}
               </button>
             );
          })}

          <div className="flex-1"></div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-on-surface hover:bg-surface-variant/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
            <span className="font-label-sm font-bold">{post.comment_count || 0}</span>
          </button>

          <button
            onClick={() => { navigator.clipboard.writeText(window.location.origin + '/posts/' + post.id); toast.success('Link copied!'); }}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-variant/50 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">share</span>
          </button>
        </div>
      </div>

      {/* Comments Area */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/20 bg-surface-variant/10"
          >
            <div className="p-5 flex flex-col gap-4">
              {(Array.isArray(commentsData) ? commentsData : commentsData?.items || []).map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 shrink-0">
                    <Avatar src={c.user?.avatar_url} name={c.user?.name} size={32} style={{ borderRadius: '50%' }} />
                  </div>
                  <div className="flex-1 bg-white/60 backdrop-blur-md rounded-2xl rounded-tl-none p-3 shadow-sm border border-white/40">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-label-md text-on-surface">{c.user?.name || 'User'}</span>
                      <span className="text-[10px] text-on-surface-variant">{c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}</span>
                    </div>
                    <p className="font-body-md text-on-surface text-[14px] leading-snug">{c.content}</p>
                  </div>
                </div>
              ))}

              {/* Comment Input */}
              <div className="flex gap-3 items-center mt-2">
                <div className="w-8 h-8 shrink-0">
                  <Avatar src={null} name="Me" size={32} style={{ borderRadius: '50%' }} />
                </div>
                <div className="flex-1 relative">
                  <input
                    className="w-full h-10 pl-4 pr-12 rounded-full bg-white/60 border border-white/40 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && commentText.trim()) {
                        commentMutation.mutate(commentText.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => { if (commentText.trim()) commentMutation.mutate(commentText.trim()); }}
                    disabled={!commentText.trim()}
                    className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, MapPin, Calendar, Users, BookOpen, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], clubs: [], events: [], studyGroups: [], market: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ users: [], clubs: [], events: [], studyGroups: [], market: [] });
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.success) {
          setResults(response.data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const hasResults = results.users?.length > 0 || results.clubs?.length > 0 || results.events?.length > 0 || results.studyGroups?.length > 0 || results.market?.length > 0;

  return (
    <div className="relative group w-full" ref={wrapperRef}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (query.trim()) setIsOpen(true); }}
        className="w-full bg-white/5 border border-outline-variant/20 rounded-full py-2.5 pl-12 pr-4 focus:outline-none focus:border-primary transition-colors text-body-md font-body-md text-on-surface"
        placeholder="Search campus events, groups, people..."
        type="text"
      />

      {isOpen && query.trim() && (
        <div className="absolute top-full mt-2 w-full bg-surface-container-high border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-center text-on-surface-variant text-label-md">Searching...</div>
          ) : hasResults ? (
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {results.users?.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">People</div>
                  {results.users.map(user => (
                    <div key={user.id} onClick={() => handleSelect(`/profile/${user.id}`)} className="flex items-center gap-3 p-3 hover:bg-surface-variant rounded-xl cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" /> : <User size={16} className="text-primary" />}
                      </div>
                      <div>
                        <div className="text-label-md text-on-surface font-medium">{user.name}</div>
                        {user.department && <div className="text-xs text-on-surface-variant">{user.department}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.clubs?.length > 0 && (
                <div className="p-2 border-t border-outline-variant/10">
                  <div className="px-3 py-1.5 text-xs font-bold text-secondary uppercase tracking-wider">Clubs</div>
                  {results.clubs.map(club => (
                    <div key={club.id} onClick={() => handleSelect(`/clubs/${club.id}`)} className="flex items-center gap-3 p-3 hover:bg-surface-variant rounded-xl cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {club.logo_url ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" /> : <Users size={16} className="text-secondary" />}
                      </div>
                      <div>
                        <div className="text-label-md text-on-surface font-medium">{club.name}</div>
                        {club.category && <div className="text-xs text-on-surface-variant capitalize">{club.category}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.events?.length > 0 && (
                <div className="p-2 border-t border-outline-variant/10">
                  <div className="px-3 py-1.5 text-xs font-bold text-tertiary uppercase tracking-wider">Events</div>
                  {results.events.map(event => (
                    <div key={event.id} onClick={() => handleSelect(`/events/${event.id}`)} className="flex items-center gap-3 p-3 hover:bg-surface-variant rounded-xl cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {event.banner_url ? <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" /> : <Calendar size={16} className="text-tertiary" />}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-label-md text-on-surface font-medium truncate">{event.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.studyGroups?.length > 0 && (
                <div className="p-2 border-t border-outline-variant/10">
                  <div className="px-3 py-1.5 text-xs font-bold text-info uppercase tracking-wider text-blue-400">Study Groups</div>
                  {results.studyGroups.map(group => (
                    <div key={group.id} onClick={() => handleSelect(`/study-groups`)} className="flex items-center gap-3 p-3 hover:bg-surface-variant rounded-xl cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                        <BookOpen size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-label-md text-on-surface font-medium truncate">{group.name}</div>
                        {group.subject && <div className="text-xs text-on-surface-variant">{group.subject}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.market?.length > 0 && (
                <div className="p-2 border-t border-outline-variant/10">
                  <div className="px-3 py-1.5 text-xs font-bold text-success uppercase tracking-wider text-green-400">Market</div>
                  {results.market.map(item => (
                    <div key={item.id} onClick={() => handleSelect(`/market/${item.id}`)} className="flex items-center gap-3 p-3 hover:bg-surface-variant rounded-xl cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                        <ShoppingBag size={16} className="text-green-400" />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-label-md text-on-surface font-medium truncate">{item.title}</div>
                        {item.category && <div className="text-xs text-on-surface-variant capitalize">{item.category}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-on-surface-variant text-label-md">No results found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

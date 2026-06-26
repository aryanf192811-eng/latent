import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { EventSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

const FILTERS = ['upcoming', 'this_week', 'this_month', 'all'];

function ShaderBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    window.addEventListener('resize', syncSize);
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;
    const fs = `precision highp float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform vec2 u_resolution;

    void main() {
        vec2 uv = v_texCoord;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;
        
        float t = u_time * 0.4;
        
        float n1 = sin(p.x * 2.0 + t) * cos(p.y * 1.5 - t * 0.5);
        vec3 color1 = vec3(0.486, 0.227, 0.929);
        
        float n2 = cos(p.x * 1.5 - t * 0.8) * sin(p.y * 2.5 + t);
        vec3 color2 = vec3(1.0, 0.584, 0.0);
        
        vec3 color3 = vec3(0.969, 0.976, 0.984);
        
        float mask1 = smoothstep(-0.2, 0.8, n1);
        float mask2 = smoothstep(-0.5, 1.2, n2);
        
        vec3 finalColor = mix(color3, color1, mask1 * 0.15);
        finalColor = mix(finalColor, color2, mask2 * 0.1);
        
        float dist = length(v_texCoord - 0.5);
        finalColor *= 1.0 - dist * 0.1;

        gl_FragColor = vec4(finalColor, 1.0);
    }`;

    function cs(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animationId;
    function render(t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }
    render(0);

    return () => {
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none" style={{ display: 'block' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

function EventCard({ event, onRsvp }) {
  const date = event.starts_at ? new Date(event.starts_at) : null;
  const isGoing = event.user_rsvp === 'going';

  return (
    <article className="glass-card rounded-3xl overflow-hidden flex flex-col group transition-all duration-500 hover:-translate-y-2 border border-white/40 bg-white/40 shadow-sm hover:shadow-xl">
      <div className="relative h-64 overflow-hidden bg-surface-variant/30">
        <ImageWithFallback
          src={event.banner_url}
          alt={event.title}
          category="events"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {event.club && (
          <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            {event.club.name}
          </div>
        )}
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <Link to={`/events/${event.id}`} className="hover:opacity-80 transition-opacity">
          <h3 className="text-2xl font-bold mb-2 text-on-surface line-clamp-1">{event.title}</h3>
        </Link>
        <div className="flex items-center gap-2 text-on-surface-variant mb-3 font-medium">
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          <span>{date ? format(date, 'EEE, d MMM yyyy') : 'TBA'}</span>
          {date && (
            <>
              <span className="material-symbols-outlined text-[20px] ml-2">schedule</span>
              <span>{format(date, 'h:mm a')}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant mb-6 font-medium">
          <span className="material-symbols-outlined text-[20px]">location_on</span>
          <span className="line-clamp-1">{event.location_text || 'TBA'}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant mb-6 font-medium">
          <span className="material-symbols-outlined text-[20px]">group</span>
          <span>{event.attendees_count != null ? `${event.attendees_count} going` : '0 going'}</span>
        </div>
        
        <div className="mt-auto flex gap-3">
          <button
            onClick={() => onRsvp(event.id, isGoing ? 'not_going' : 'going')}
            className={`flex-1 py-4 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2 ${
              isGoing 
                ? 'bg-white/60 text-primary border-2 border-primary hover:bg-white' 
                : 'bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] active:scale-95'
            }`}
          >
            {isGoing ? (
              <><span className="material-symbols-outlined text-[20px]">check_circle</span> Going</>
            ) : (
              'RSVP Now'
            )}
          </button>
          <Link 
            to={`/events/${event.id}`} 
            className="flex-1 py-4 rounded-full font-bold text-base transition-all bg-white/60 text-on-surface hover:bg-white/80 border border-white/50 text-center flex items-center justify-center"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.events(activeFilter),
    queryFn: () => api.get(`/api/events?filter=${activeFilter}&page=1&limit=12`).then(r => r.data),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }) => api.post(`/api/events/${eventId}/rsvp`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.events(activeFilter) });
      toast.success('RSVP updated!');
    },
    onError: err => toast.error(err.message),
  });

  const events = data?.items || [];

  return (
    <>
      <ShaderBackground />
      <div className="pt-8 pb-24 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
        {/* Hero Section */}
        <header className="py-12 text-center">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            .hero-float { animation: float 6s ease-in-out infinite; }
          `}} />
          <h1 className="hero-float font-display-lg text-5xl md:text-[64px] font-bold leading-tight mb-6 text-on-surface">
            Campus <span className="text-primary italic">Events</span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 font-medium">
            Immerse yourself in the vibrant student life of Latent. Find your next experience, from live performances to formal ceremonies.
          </p>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {FILTERS.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${
                  activeFilter === f 
                    ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(124,58,237,0.4)]' 
                    : 'glass-card text-on-surface-variant hover:bg-white/60 bg-white/40 border border-white/50'
                }`}
              >
                {f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <EventSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <EmptyState 
            icon={() => <span className="material-symbols-outlined text-4xl">event_busy</span>} 
            title="No events yet" 
            description={`Check back soon for ${activeFilter.replace('_', ' ')} campus events`} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(ev => (
              <EventCard 
                key={ev.id} 
                event={ev} 
                onRsvp={(id, status) => rsvpMutation.mutate({ eventId: id, status })} 
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

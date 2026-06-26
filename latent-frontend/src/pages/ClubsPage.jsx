import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { qk } from '../lib/queryClient';
import { CardSkeleton } from '../components/common/Skeletons';
import { EmptyState } from '../components/common/EmptyState';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { Building2 } from 'lucide-react';

const CATEGORIES = ['all', 'cultural', 'technical', 'sports', 'academic', 'social'];

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
        
        float t = u_time * 0.3;
        
        float n1 = sin(p.x * 1.5 + t) * cos(p.y * 1.2 - t * 0.4);
        float n2 = cos(p.x * 2.0 - t * 0.6) * sin(p.y * 1.8 + t * 0.5);
        
        vec3 color1 = vec3(0.486, 0.227, 0.929); // Purple
        vec3 color2 = vec3(1.0, 0.584, 0.0);    // Orange
        vec3 background = vec3(0.969, 0.976, 0.984); // Off-white
        
        float mask1 = smoothstep(-0.3, 0.7, n1);
        float mask2 = smoothstep(-0.4, 0.9, n2);
        
        vec3 finalColor = mix(background, color1, mask1 * 0.12);
        finalColor = mix(finalColor, color2, mask2 * 0.08);
        
        float dist = length(v_texCoord - 0.5);
        finalColor *= 1.0 - dist * 0.05;

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
    <div className="fixed inset-0 w-full h-full -z-10 opacity-60 pointer-events-none" style={{ display: 'block' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

function ClubCard({ club, onJoin, onLeave }) {
  const isMember = club.is_member;
  return (
    <div className="group glass-card bg-white/40 border border-white/50 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
      <div className="relative h-48 w-full overflow-hidden bg-surface-variant/30">
        <Link to={`/clubs/${club.id}`} className="block w-full h-full">
          <ImageWithFallback 
            src={club.banner_url} 
            alt={club.name} 
            category="clubs" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </Link>
      </div>
      
      <div className="relative px-6 pb-8 flex-grow flex flex-col">
        <div className="absolute -top-12 left-6 w-20 h-20 rounded-full border-4 border-white overflow-hidden shadow-lg z-10 bg-white">
          <ImageWithFallback 
            src={club.logo_url} 
            alt={club.name} 
            category="clubs" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="mt-10 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <Link to={`/clubs/${club.id}`} className="hover:opacity-80 transition-opacity">
              <h3 className="text-2xl font-bold text-on-surface line-clamp-1">{club.name}</h3>
            </Link>
            <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-white/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/50 shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[16px]">groups</span> {club.members_count || 0}
            </span>
          </div>
          
          <span className="text-xs font-bold text-primary uppercase tracking-wider mb-3">{club.category}</span>
          
          <p className="text-sm text-on-surface-variant mb-6 line-clamp-2 flex-grow">
            {club.description}
          </p>
          
          <button
            onClick={() => isMember ? onLeave(club.id) : onJoin(club.id)}
            className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 group/btn transition-all duration-300 ${
              isMember 
                ? 'bg-white/60 text-primary border-2 border-primary hover:bg-white' 
                : 'bg-gradient-to-br from-primary to-[#fd761a] text-on-primary shadow-[0_4px_15px_rgba(99,14,212,0.2)] hover:shadow-[0_8px_25px_rgba(253,118,26,0.3)] hover:-translate-y-1'
            }`}
          >
            {isMember ? (
              <><span className="material-symbols-outlined text-[20px]">check_circle</span> Member</>
            ) : (
              <>Join Club <span className="material-symbols-outlined transition-transform duration-300 group-hover/btn:translate-x-1">arrow_forward</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClubsPage() {
  const [category, setCategory] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.clubs(category),
    queryFn: () => api.get(`/api/clubs?category=${category}&page=1&limit=20`).then(r => r.data),
  });

  const join = useMutation({
    mutationFn: (id) => api.post(`/api/clubs/${id}/join`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.clubs(category) }); toast.success('Joined club!'); },
    onError: err => toast.error(err.message),
  });

  const leave = useMutation({
    mutationFn: (id) => api.delete(`/api/clubs/${id}/leave`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk.clubs(category) }); toast.success('Left club'); },
    onError: err => toast.error(err.message),
  });

  const clubs = data?.items || [];

  return (
    <>
      <ShaderBackground />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floating { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .floating-anim { animation: floating 6s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      <div className="pt-12 pb-32 max-w-7xl mx-auto px-4 md:px-8 min-h-screen">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center mb-12">
          <h1 className="text-5xl md:text-[64px] font-bold text-primary floating-anim drop-shadow-xl mb-4 tracking-tight">
            Campus Clubs
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto font-medium opacity-90">
            Discover your community. Whether you're a coder, a creator, or a competitor, there's a home for your passion here at Latent.
          </p>
        </section>

        {/* Category Filter */}
        <section className="flex justify-center mb-12 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex items-center gap-4 px-4">
            {CATEGORIES.map(c => (
              <button 
                key={c}
                onClick={() => setCategory(c)}
                className={`px-8 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap hover:scale-105 active:scale-95 ${
                  category === c 
                    ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(124,58,237,0.4)]' 
                    : 'glass-card bg-white/40 border border-white/50 text-on-surface-variant hover:bg-white/60'
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Club Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card bg-white/40 border border-white/50 rounded-2xl h-[400px]">
                <CardSkeleton height={192} />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <EmptyState 
            icon={() => <span className="material-symbols-outlined text-4xl">domain_disabled</span>} 
            title="No clubs found" 
            description="Try a different category" 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.map(club => (
              <ClubCard 
                key={club.id} 
                club={club} 
                onJoin={id => join.mutate(id)} 
                onLeave={id => leave.mutate(id)} 
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

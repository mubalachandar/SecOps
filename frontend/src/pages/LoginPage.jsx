import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLogin } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import logoImg from '../assets/logo.jpg';

/* ── Animated canvas radar/network background ─────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Nodes
    const NODE_COUNT = 28;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    // Radar sweep
    let angle = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width  * 0.5;
      const cy = canvas.height * 0.45;
      const maxR = Math.min(canvas.width, canvas.height) * 0.42;

      // Concentric radar rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / 4) * i, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6,182,212,${0.04 + i * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Crosshairs
      ctx.strokeStyle = 'rgba(6,182,212,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();

      // Radar sweep cone
      const sweep = ctx.createConicalGradient
        ? null // fallback below
        : null;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, maxR, 0);
      grad.addColorStop(0,    'rgba(6,182,212,0.35)');
      grad.addColorStop(0.6,  'rgba(6,182,212,0.08)');
      grad.addColorStop(1,    'rgba(6,182,212,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxR, -0.35, 0.35);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // Nodes + edges
      nodes.forEach((n, i) => {
        // Move
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        // Edges to nearby nodes
        nodes.slice(i + 1).forEach(m => {
          const dx = n.x - m.x, dy = n.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(6,182,212,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        // Node dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6,182,212,0.5)';
        ctx.fill();
      });

      angle += 0.008;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}



export default function LoginPage() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]             = useState({});
  const [focused, setFocused]           = useState('');
  const loginMutation = useLogin();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validate = () => {
    const e = {};
    if (!email)                              e.email    = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email    = 'Invalid email format';
    if (!password)                           e.password = 'Password is required';
    else if (password.length < 6)            e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#07080e] flex overflow-hidden">

      {/* ══════════════ LEFT — Branding ══════════════ */}
      <div className="hidden lg:flex flex-col w-[52%] min-h-screen relative overflow-hidden border-r border-[#1a1d25]">

        {/* Animated canvas bg */}
        <ParticleCanvas />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#08090c] via-transparent to-[#0a0c14]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#06b6d4]/10 blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-purple-600/8 blur-[100px] translate-x-1/3 translate-y-1/3" />

        {/* Content on top of canvas */}
        <div className="relative z-10 flex flex-col h-full p-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-xl shadow-[#06b6d4]/20">
              <img src={logoImg} alt="SecOps AI Copilot" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight">SecOps AI Copilot</div>
              <div className="text-slate-600 text-[10px] tracking-wider uppercase">Enterprise SOC Platform</div>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">

            {/* Big logo glow */}
            <div className="relative mb-10">
              <div className="absolute inset-0 w-28 h-28 rounded-3xl bg-[#06b6d4]/20 blur-2xl scale-150" />
              <div className="relative w-28 h-28 rounded-3xl overflow-hidden ring-1 ring-[#06b6d4]/30 shadow-2xl shadow-[#06b6d4]/20">
                <img src={logoImg} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-3">
              Intelligent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#7ba3ff] to-purple-400">
                Threat Defense
              </span>
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              AI-powered security operations with real-time detection, automated triage, and full MITRE ATT&CK coverage.
            </p>


          </div>

          {/* Bottom tag */}
          <div className="text-[10px] text-slate-700 text-center">
            Secured · Encrypted · Compliant
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT — Login Form ══════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">

        {/* Subtle radial glow behind form */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-[#06b6d4]/4 blur-[100px]" />
        </div>

        <div className="w-full max-w-[360px] relative z-10">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-[#06b6d4]/30">
              <img src={logoImg} alt="SecOps AI Copilot" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-sm">SecOps AI Copilot</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[32px] font-black text-white tracking-tight leading-tight">
              Welcome back
            </h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Sign in to your security operations center
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={`w-full bg-[#0e1015] border rounded-xl px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-150 placeholder-[#2a2e38] ${
                  focused === 'email'
                    ? 'border-[#06b6d4] shadow-[0_0_0_3px_rgba(6,182,212,0.12)]'
                    : errors.email
                    ? 'border-[#f0384a]/60'
                    : 'border-[#1f2229] hover:border-[#2a2e38]'
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
              />
              {errors.email && (
                <p className="text-[#f0384a] text-[11px] mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`w-full bg-[#0e1015] border rounded-xl px-4 py-3 pr-11 text-sm text-slate-100 outline-none transition-all duration-150 placeholder-[#2a2e38] ${
                    focused === 'password'
                      ? 'border-[#06b6d4] shadow-[0_0_0_3px_rgba(6,182,212,0.12)]'
                      : errors.password
                      ? 'border-[#f0384a]/60'
                      : 'border-[#1f2229] hover:border-[#2a2e38]'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[#f0384a] text-[11px] mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              disabled={loginMutation.isPending}
              onClick={handleSubmit}
              className="w-full mt-2 relative overflow-hidden bg-[#06b6d4] hover:bg-[#5e8aff] active:bg-[#3d6ee8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 shadow-lg shadow-[#06b6d4]/30 hover:shadow-[#06b6d4]/40 group text-sm"
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {loginMutation.isPending ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>



          <p className="text-center text-[10px] text-[#1f2229] mt-6">
            © 2026 SecOps AI Copilot
          </p>
        </div>
      </div>
    </div>
  );
}

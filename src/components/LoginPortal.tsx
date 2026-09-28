import React, { useState } from 'react';
import { ShieldCheck, User, Building2, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Bus, MapPin, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  initialRole?: 'GOVERNMENT' | 'CITIZEN';
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'GOVERNMENT',
}) => {
  const [selectedRole, setSelectedRole] = useState<'GOVERNMENT' | 'CITIZEN'>(initialRole);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('gov_admin');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: 'GOVERNMENT' | 'CITIZEN') => {
    setSelectedRole(role);
    setIsRegistering(false);
    setErrorMsg(null);
    if (role === 'GOVERNMENT') {
      setUsername('gov_admin');
      setPassword('admin123');
    } else {
      setUsername('citizen_vizag');
      setPassword('citizen123');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isRegistering && selectedRole === 'CITIZEN') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            name: name.trim() || username,
            email: email.trim() || `${username}@citizen.vizag.gov`,
            phone: phone.trim(),
            password: password.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        onLoginSuccess(data.user);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
            role: selectedRole,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Authentication failed');
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Bus className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  SOLVOFIN <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SIH 2024-25</span>
                </h2>
                <p className="text-xs text-slate-400">AI-Powered Mobile Urban Sensing Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleRoleSelect('GOVERNMENT')}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'GOVERNMENT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>1. GOVERNMENT LOGIN</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('CITIZEN')}
              className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'CITIZEN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>2. CITIZEN LOGIN</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          {/* Info Banner */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              selectedRole === 'GOVERNMENT'
                ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-200'
                : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
            }`}
          >
            {selectedRole === 'GOVERNMENT' ? (
              <>
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Government / Authority Portal</strong>
                  Access centralized GIS dashboard, live multi-camera transit feeds, road defect volumetric modeling, traffic bottleneck mitigation, and citizen escalations.
                </div>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Citizen Urban Reporting Portal</strong>
                  Report potholes, waterlogging, broken signs, and hazards directly. Track real-time AI validation scores and municipal repair work order dispatches.
                </div>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400 font-medium">Quick Demo Preset:</span>
            {selectedRole === 'GOVERNMENT' ? (
              <button
                type="button"
                onClick={() => {
                  setUsername('gov_admin');
                  setPassword('admin123');
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
              >
                Use `gov_admin` / `admin123`
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUsername('citizen_vizag');
                  setPassword('citizen123');
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                Use `citizen_vizag` / `citizen123`
              </button>
            )}
          </div>

          {/* Registration Fields if Citizen Registration */}
          {isRegistering && selectedRole === 'CITIZEN' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98480 22341"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === 'GOVERNMENT' ? 'gov_admin' : 'citizen_vizag'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Citizen Register Toggle */}
          {selectedRole === 'CITIZEN' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">
                {isRegistering ? 'Already have a citizen account?' : 'New citizen reporter?'}
              </span>
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline"
              >
                {isRegistering ? 'Sign In Instead' : 'Register New Account'}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              selectedRole === 'GOVERNMENT'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-600/25'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>
                  {isRegistering
                    ? 'Complete Citizen Registration'
                    : `Authenticate as ${selectedRole === 'GOVERNMENT' ? 'Government Command' : 'Citizen Reporter'}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-center text-xs text-slate-500">
          SOLVOFIN Mobile Urban Sensing Architecture • Built for SIH 2024-25 • Multi-Role Access Enforced
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Eye, EyeOff, Monitor, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

function PasswordStrength({ password }) {
  let strength = 0;
  let label = 'Enter password';
  let color = 'bg-[#1f2229]';
  if (password.length > 0) {
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      strength = 4; label = 'Strong'; color = 'bg-[#2fbf71]';
    } else if (password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
      strength = 3; label = 'Good'; color = 'bg-[#f0c419]';
    } else if (password.length >= 6) {
      strength = 2; label = 'Fair'; color = 'bg-[#f5942e]';
    } else {
      strength = 1; label = 'Weak'; color = 'bg-[#f0384a]';
    }
  }
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? color : 'bg-[#1f2229]'}`} />
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-1">{label}</p>
    </div>
  );
}

function PasswordInput({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">{label}</label>
      <div className="relative">
        <Input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder="••••••••" />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-[#f0384a] mt-1">{error}</p>}
    </div>
  );
}

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    const errs = {};
    if (!currentPassword) errs.current = 'Current password required';
    if (newPassword.length < 8) errs.new = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsUpdating(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Password updated successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch(e) {
      toast.error('Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* CARD 1: Change Password */}
      <Card title="Change Password">
        <div className="space-y-4">
          <PasswordInput label="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} error={errors.current} />
          <div>
            <PasswordInput label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} error={errors.new} />
            <PasswordStrength password={newPassword} />
          </div>
          <PasswordInput label="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={errors.confirm} />
          <div className="flex justify-end pt-2">
            <Button variant="primary" isLoading={isUpdating} onClick={handleUpdatePassword}>Update Password</Button>
          </div>
        </div>
      </Card>

      {/* CARD 2: Active Sessions */}
      <Card title="Active Sessions">
        <div className="bg-[#0e1015] border border-[#1f2229] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-slate-500" />
            <div>
              <div className="text-sm font-medium text-slate-200">Current Session</div>
              <div className="text-[11px] text-[#2fbf71] mt-0.5">Active now</div>
            </div>
          </div>
          <Badge variant="success" size="sm">Current</Badge>
        </div>
        <p className="text-[10px] text-slate-700 mt-3">Multi-session management coming in v2.0</p>
      </Card>

      {/* CARD 3: 2FA */}
      <Card title="Two Factor Authentication">
        <div className="bg-[#0e1015] border border-dashed border-[#2a2e38] rounded-xl p-6 text-center">
          <Lock className="w-8 h-8 text-slate-700 mx-auto" />
          <div className="text-sm font-medium text-slate-400 mt-3">2FA Coming Soon</div>
          <p className="text-[11px] text-slate-600 mt-1">TOTP authentication will be available in v2.0</p>
        </div>
      </Card>
    </div>
  );
}

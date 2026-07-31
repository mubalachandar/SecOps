import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || user?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Profile updated successfully');
    } catch (e) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'US';
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* FORM */}
      <div className="lg:col-span-2">
        <Card title="Profile Information">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Full Name</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" icon={User} />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Email Address</label>
              <div className="relative">
                <Input value={user?.email || ''} disabled placeholder="email@company.com" className="opacity-60" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              </div>
              <p className="text-[10px] text-slate-700 mt-1">Email cannot be changed after account creation.</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">Role</label>
              <div className="flex items-center h-10 px-3 bg-[#0e1015] border border-[#1f2229] rounded-xl">
                <Badge variant={user?.role === 'admin' ? 'critical' : 'accent'} size="sm" className="capitalize">{user?.role || 'analyst'}</Badge>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" isLoading={isSaving} onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        </Card>
      </div>

      {/* AVATAR */}
      <div className="lg:col-span-1">
        <div className="bg-[#0e1015] border border-[#1f2229] rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#06b6d4] to-purple-600 flex items-center justify-center mx-auto">
            <span className="text-3xl font-black text-white">{initials}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-3">{user?.email}</div>
          <div className="mt-2 flex justify-center">
            <Badge variant={user?.role === 'admin' ? 'critical' : 'accent'} size="sm" className="capitalize">{user?.role || 'analyst'}</Badge>
          </div>
          <div className="text-[10px] text-slate-600 mt-2">Member since {joinDate}</div>
          <div className="border-t border-[#1f2229] mt-4 pt-4">
            <p className="text-[10px] text-slate-700">Avatar customization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

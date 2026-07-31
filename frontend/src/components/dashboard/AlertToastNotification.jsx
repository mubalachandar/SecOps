import React from 'react';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function AlertToastNotification({ alert, toastId }) {
  const navigate = useNavigate();

  const handleDismiss = (e) => {
    e.stopPropagation();
    toast.dismiss(toastId);
  };

  const handleClick = () => {
    navigate('/alerts');
    toast.dismiss(toastId);
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-slate-800 border ${alert.severity === 'critical' ? 'border-red-500/50 animate-[pulse_2s_ease-in-out_infinite]' : 'border-slate-700'} rounded-xl p-4 shadow-2xl w-80 flex items-start gap-3 cursor-pointer`}
    >
      <div className="relative mt-1 shrink-0">
        {alert.severity === 'critical' && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
        )}
        <div className={`w-3 h-3 rounded-full relative z-10 ${
          alert.severity === 'critical' ? 'bg-red-500' :
          alert.severity === 'high' ? 'bg-amber-500' :
          alert.severity === 'medium' ? 'bg-yellow-500' :
          'bg-blue-500'
        }`}></div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            New Alert Detected
          </span>
          <button 
            onClick={handleDismiss}
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <h4 className="text-slate-100 text-sm font-semibold mt-0.5 line-clamp-2">
          {alert.title}
        </h4>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge severity={alert.severity} size="sm" />
          <span className="text-slate-500 text-xs truncate">
            {alert.mitre_tactic || 'Unknown Tactic'} &middot; just now
          </span>
        </div>
      </div>
    </div>
  );
}

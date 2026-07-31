import React from 'react';
import Card from '../ui/Card';
import { useLiveThreats } from '../../hooks/useThreatMap';
import { Globe, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'XX') return '🌐';
  return String.fromCodePoint(...countryCode.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
};

export default function ThreatMapWidget() {
  const { data: liveThreats, isLoading } = useLiveThreats();

  return (
    <Card 
      title="Global Threat Activity" 
      subtitle="Top active attack origins"
      headerAction={
        <Link 
          to="/threat-map" 
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Map
        </Link>
      }
      className="h-full"
    >
      <div className="flex flex-col h-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : liveThreats?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-8">
            <Globe className="w-10 h-10 mb-2" />
            <p className="text-sm">No active threats detected</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {liveThreats?.slice(0, 5).map((threat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                <div className="text-2xl w-8 text-center" title={threat.geoip?.country}>
                  {getCountryFlag(threat.geoip?.countryCode)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-mono text-xs text-slate-300 font-medium truncate">{threat.source_ip}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${
                      threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      threat.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      threat.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {threat.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 truncate">{threat.geoip?.city || threat.geoip?.country || 'Unknown'}</span>
                    <span className="text-xs font-medium text-slate-400">{threat.alertCount} alerts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

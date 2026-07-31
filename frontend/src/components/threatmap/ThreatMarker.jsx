import React from 'react';
import { Marker } from 'react-simple-maps';

const SEVERITY_CONFIG = {
  critical: { color: '#f0384a', size: 14, pulsed: true },
  high: { color: '#f5942e', size: 10, pulsed: false },
  medium: { color: '#f0c419', size: 7, pulsed: false },
  low: { color: '#06b6d4', size: 5, pulsed: false },
};

export default function ThreatMarker({ threat, isSelected, onClick }) {
  const sev = (threat.max_severity || threat.severity || 'low').toLowerCase();
  const cfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.low;
  const r = cfg.size / 2;

  return (
    <Marker
      coordinates={[threat.lon || threat.longitude || 0, threat.lat || threat.latitude || 0]}
      onClick={() => onClick && onClick(threat)}
    >
      <g style={{ cursor: 'pointer' }}>
        {/* Outer ring 1 (critical only) */}
        {cfg.pulsed && (
          <circle r={r + 6} fill="none" stroke={cfg.color} strokeWidth="0.5" opacity="0.3"
            style={{ animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}
          />
        )}
        {/* Outer ring 2 */}
        {cfg.pulsed && (
          <circle r={r + 3} fill="none" stroke={cfg.color} strokeWidth="1" opacity="0.5"
            style={{ animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.5s' }}
          />
        )}
        {/* Selected ring */}
        {isSelected && (
          <circle r={r + 4} fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8" />
        )}
        {/* Main dot */}
        <circle r={r} fill={cfg.color} opacity="0.9" />
        {/* Inner shine */}
        <circle r={r * 0.4} fill="white" opacity="0.4" cy={-r * 0.2} />
      </g>
    </Marker>
  );
}

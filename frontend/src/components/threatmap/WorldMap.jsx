import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Globe } from 'lucide-react';
import ThreatMarker from './ThreatMarker';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap({ threats = [], onThreatClick, selectedThreat, isLoading }) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState([0, 20]);

  const handleZoomIn = () => {
    if (zoom >= 8) return;
    setZoom(zoom + 1);
  };

  const handleZoomOut = () => {
    if (zoom <= 1) return;
    setZoom(zoom - 1);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 20]);
  };

  const handleMoveEnd = (position) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  };

  return (
    <div className="relative w-full bg-[#0e1015] rounded-2xl overflow-hidden border border-[#1f2229] h-96 lg:h-[500px]">
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Live Threat Map</span>
          {threats.length > 0 && <span className="text-[11px] text-[#f0384a] animate-pulse">{threats.length} active threats</span>}
        </div>
      </div>

      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
        <ZoomableGroup center={center} zoom={zoom} onMoveEnd={handleMoveEnd}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#13151b', stroke: '#1f2229', strokeWidth: 0.5, outline: 'none' },
                    hover: { fill: '#191c24', stroke: '#1f2229', strokeWidth: 0.5, outline: 'none' },
                    pressed: { fill: '#13151b', stroke: '#1f2229', strokeWidth: 0.5, outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {threats.map((threat, idx) => {
            if (threat.lat === 0 && threat.lon === 0) return null;
            return (
              <ThreatMarker 
                key={`${threat.ip}-${idx}`}
                threat={threat}
                isSelected={selectedThreat?.ip === threat.ip}
                onClick={onThreatClick}
              />
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
        {[{label: '+', fn: handleZoomIn}, {label: '−', fn: handleZoomOut}, {label: '↺', fn: handleReset}].map(({label, fn}) => (
          <button key={label} onClick={fn} className="w-7 h-7 bg-[#13151b] border border-[#1f2229] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-[#2a2e38] transition-colors text-sm font-bold">{label}</button>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-[#0e1015]/90 backdrop-blur-sm border border-[#1f2229] rounded-xl px-4 py-3">
        <div className="text-[9px] uppercase tracking-wider text-slate-600 mb-2">Severity</div>
        <div className="space-y-1.5">
          {[['#f0384a', 'Critical', true], ['#f5942e', 'High', false], ['#f0c419', 'Medium', false], ['#06b6d4', 'Low', false]].map(([color, label, pulse]) => (
            <div key={label} className="flex items-center gap-2">
              <div className="relative w-2.5 h-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {pulse && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-60" style={{ backgroundColor: color }} />}
              </div>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-[#08090c]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
          <span className="text-sm text-slate-400 mt-3">Loading threat data...</span>
        </div>
      )}

      {!isLoading && threats.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <Globe className="w-16 h-16 text-slate-700 mb-2 opacity-50" />
          <div className="text-slate-300 font-medium">No geo-located threats</div>
          <div className="text-slate-500 text-sm">in selected period</div>
        </div>
      )}
    </div>
  );
}

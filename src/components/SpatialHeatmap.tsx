import React, { useState } from 'react';
import { FloorData, ZoneData } from '../types';
import { 
  Layers, 
  Thermometer, 
  Zap, 
  Wind, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Maximize2,
  Box,
  Compass
} from 'lucide-react';

interface SpatialHeatmapProps {
  floors: FloorData[];
  selectedFloorId: string;
  setSelectedFloorId: (floorId: string) => void;
  onInvestigateAnomaly?: (zone: ZoneData) => void;
}

export type HeatmapLayer = 'TEMP' | 'ENERGY' | 'AIRFLOW' | 'OCCUPANCY' | 'EQUIPMENT';
export type ProjectionMode = 'ISOMETRIC' | 'PLANAR';

export const SpatialHeatmap: React.FC<SpatialHeatmapProps> = ({
  floors,
  selectedFloorId,
  setSelectedFloorId,
  onInvestigateAnomaly,
}) => {
  const [activeLayer, setActiveLayer] = useState<HeatmapLayer>('TEMP');
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('ISOMETRIC');
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);
  const [calibratingZoneId, setCalibratingZoneId] = useState<string | null>(null);
  const [calibrationSuccess, setCalibrationSuccess] = useState<boolean>(false);

  const currentFloor = floors.find((f) => f.id === selectedFloorId) || floors[2]; // default floor 8

  // Helper to get color code based on metric & active layer
  const getZoneColor = (zone: ZoneData) => {
    if (zone.equipmentStatus === 'FAULT') {
      return {
        bg: 'bg-rose-950/80',
        border: 'border-rose-500',
        text: 'text-rose-300',
        glow: 'shadow-rose-500/30',
        fillHex: '#881337',
        strokeHex: '#f43f5e',
      };
    }

    if (activeLayer === 'TEMP') {
      const temp = zone.currentTempC;
      if (temp < 20.5) return { bg: 'bg-cyan-950/70', border: 'border-cyan-500/60', text: 'text-cyan-300', glow: 'shadow-cyan-500/20', fillHex: '#083344', strokeHex: '#06b6d4' };
      if (temp <= 23.0) return { bg: 'bg-emerald-950/70', border: 'border-emerald-500/60', text: 'text-emerald-300', glow: 'shadow-emerald-500/20', fillHex: '#022c22', strokeHex: '#10b981' };
      if (temp <= 25.5) return { bg: 'bg-amber-950/70', border: 'border-amber-500/60', text: 'text-amber-300', glow: 'shadow-amber-500/20', fillHex: '#451a03', strokeHex: '#f59e0b' };
      return { bg: 'bg-rose-950/70', border: 'border-rose-500/60', text: 'text-rose-300', glow: 'shadow-rose-500/20', fillHex: '#4c0519', strokeHex: '#f43f5e' };
    }

    if (activeLayer === 'ENERGY') {
      const wsqm = zone.energyIntensityWsqm;
      if (wsqm < 40) return { bg: 'bg-emerald-950/70', border: 'border-emerald-500/60', text: 'text-emerald-300', glow: 'shadow-emerald-500/20', fillHex: '#022c22', strokeHex: '#10b981' };
      if (wsqm < 80) return { bg: 'bg-amber-950/70', border: 'border-amber-500/60', text: 'text-amber-300', glow: 'shadow-amber-500/20', fillHex: '#451a03', strokeHex: '#f59e0b' };
      return { bg: 'bg-purple-950/70', border: 'border-purple-500/60', text: 'text-purple-300', glow: 'shadow-purple-500/20', fillHex: '#3b0764', strokeHex: '#a855f7' };
    }

    if (activeLayer === 'AIRFLOW') {
      const cfm = zone.airflowCfm;
      if (cfm < 1500) return { bg: 'bg-blue-950/70', border: 'border-blue-500/60', text: 'text-blue-300', glow: 'shadow-blue-500/20', fillHex: '#172554', strokeHex: '#3b82f6' };
      if (cfm < 3500) return { bg: 'bg-teal-950/70', border: 'border-teal-500/60', text: 'text-teal-300', glow: 'shadow-teal-500/20', fillHex: '#042f2e', strokeHex: '#14b8a6' };
      return { bg: 'bg-cyan-950/70', border: 'border-cyan-500/60', text: 'text-cyan-300', glow: 'shadow-cyan-500/20', fillHex: '#083344', strokeHex: '#06b6d4' };
    }

    if (activeLayer === 'OCCUPANCY') {
      const occRatio = zone.currentOccupancy / Math.max(1, zone.maxCapacity);
      if (occRatio < 0.2) return { bg: 'bg-slate-900/80', border: 'border-slate-700', text: 'text-slate-400', glow: '', fillHex: '#0f172a', strokeHex: '#334155' };
      if (occRatio < 0.6) return { bg: 'bg-cyan-950/70', border: 'border-cyan-500/60', text: 'text-cyan-300', glow: 'shadow-cyan-500/20', fillHex: '#083344', strokeHex: '#06b6d4' };
      return { bg: 'bg-rose-950/70', border: 'border-rose-500/60', text: 'text-rose-300', glow: 'shadow-rose-500/20', fillHex: '#4c0519', strokeHex: '#f43f5e' };
    }

    // Default Equipment
    return { bg: 'bg-slate-900/80', border: 'border-slate-700', text: 'text-slate-300', glow: '', fillHex: '#0f172a', strokeHex: '#475569' };
  };

  const handleExecuteCalibration = (zoneId: string) => {
    setCalibratingZoneId(zoneId);
    setTimeout(() => {
      setCalibratingZoneId(null);
      setCalibrationSuccess(true);
      setTimeout(() => setCalibrationSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-3.5">
        
        {/* Floor Level Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-xs font-mono text-gray-400 uppercase font-bold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Floor:</span>
          </span>
          {floors.map((fl) => {
            const isSelected = fl.id === selectedFloorId;
            const hasFault = fl.zones.some((z) => z.equipmentStatus === 'FAULT');
            return (
              <button
                key={fl.id}
                onClick={() => setSelectedFloorId(fl.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all relative ${
                  isSelected
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-semibold'
                    : 'bg-[#050505] border border-[#1f2937] text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>L{fl.levelNumber}: {fl.name.split('—')[1] || fl.name}</span>
                {hasFault && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode & Heatmap Layer Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* 3D Isometric vs 2D Planar Toggle */}
          <div className="flex items-center bg-[#050505] p-1 rounded border border-[#1f2937]">
            <button
              onClick={() => setProjectionMode('ISOMETRIC')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                projectionMode === 'ISOMETRIC' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Isometric</span>
            </button>
            <button
              onClick={() => setProjectionMode('PLANAR')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                projectionMode === 'PLANAR' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Architectural</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#1f2937] hidden sm:block"></div>

          {/* Metric Layer Selector */}
          <div className="flex items-center bg-[#050505] p-1 rounded border border-[#1f2937] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveLayer('TEMP')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeLayer === 'TEMP' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Thermal °C</span>
            </button>
            <button
              onClick={() => setActiveLayer('ENERGY')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeLayer === 'ENERGY' ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>W/m²</span>
            </button>
            <button
              onClick={() => setActiveLayer('AIRFLOW')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeLayer === 'AIRFLOW' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Airflow CFM</span>
            </button>
            <button
              onClick={() => setActiveLayer('OCCUPANCY')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-all ${
                activeLayer === 'OCCUPANCY' ? 'bg-rose-950/60 text-rose-300 border border-rose-900/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Occupancy</span>
            </button>
          </div>

        </div>

      </div>

      {/* Main Floor Visualizer Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Spatial Stage (2 Cols on desktop) */}
        <div className="xl:col-span-2 bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col relative overflow-hidden min-h-[480px]">
          
          {/* Floor Summary Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 pb-3 border-b border-[#1f2937] gap-2">
            <div>
              <span className="text-white font-bold text-sm">{currentFloor.name}</span>
              <span className="text-gray-500 ml-2">({currentFloor.areaSqm} m² • {currentFloor.zones.length} Zones)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-bold">Floor Load: {currentFloor.totalLoadKw.toFixed(1)} kW</span>
              <span className="text-gray-700">|</span>
              <span className="text-gray-300">Avg Temp: {currentFloor.avgTempC.toFixed(1)}°C</span>
              <span className="text-gray-700">|</span>
              <span className="text-emerald-400">Sensors: {currentFloor.equipmentSummary.sensorsOnline} Online</span>
            </div>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center justify-between my-3 px-2.5 py-1.5 bg-[#050505] rounded border border-[#1f2937] text-[11px] font-mono text-gray-400">
            <span className="text-gray-500 uppercase font-bold">Scale:</span>
            {activeLayer === 'TEMP' && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-600"></span> Cool (&lt;20°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> Comfort (21-23°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-600"></span> Warm (24-25°C)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-600"></span> Anomaly (&gt;26°C)</span>
              </div>
            )}
            {activeLayer === 'ENERGY' && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> Low (&lt;40 W/m²)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-600"></span> Moderate (40-80 W/m²)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-600"></span> High (&gt;80 W/m²)</span>
              </div>
            )}
            {activeLayer === 'AIRFLOW' && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600"></span> Low</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-teal-600"></span> Balanced</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-600"></span> High CFM</span>
              </div>
            )}
            {activeLayer === 'OCCUPANCY' && (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-700"></span> Vacant (&lt;20%)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-cyan-600"></span> Medium Density</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-600"></span> Full Capacity</span>
              </div>
            )}
          </div>

          {/* Interactive Graphic Map Render */}
          <div className="flex-1 flex items-center justify-center p-4 bg-[#050505] rounded border border-[#1f2937] relative overflow-hidden">
            
            {/* Background cyber grid */}
            <div className="absolute inset-0 bg-telemetry-grid opacity-20 pointer-events-none"></div>

            {/* Isometric Perspective Container */}
            <div 
              className={`w-full max-w-[620px] aspect-[4/3] relative transition-all duration-500 ${
                projectionMode === 'ISOMETRIC' ? 'transform -rotate-x-12 rotate-z-6 scale-95 shadow-2xl' : ''
              }`}
              style={{
                perspective: projectionMode === 'ISOMETRIC' ? '1000px' : 'none',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Floor Slab Plate */}
              <div className="absolute inset-0 rounded-xl bg-[#0a0a0a] border border-[#1f2937] shadow-2xl overflow-hidden p-3">
                
                {/* Zones Grid Layout */}
                <div className="w-full h-full relative">
                  {currentFloor.zones.map((zone) => {
                    const color = getZoneColor(zone);
                    const isSelected = selectedZone?.id === zone.id;
                    const hasAnomaly = zone.equipmentStatus === 'FAULT' || zone.anomalyNote;

                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                        }}
                        className={`absolute rounded border p-3 transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                          color.bg
                        } ${color.border} ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#050505] z-20 scale-[1.02]' : 'hover:scale-[1.01] hover:z-10'}`}
                      >
                        {/* Zone Header */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-semibold block">
                              {zone.code}
                            </span>
                            <span className="text-xs font-bold text-white leading-tight block truncate">
                              {zone.name}
                            </span>
                          </div>

                          {hasAnomaly && (
                            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                          )}
                        </div>

                        {/* Zone Core Metrics Badge */}
                        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#1f2937] text-[11px] font-mono">
                          <div>
                            <span className="text-gray-400 text-[9px] block uppercase">Temp</span>
                            <span className={`font-bold ${color.text}`}>{zone.currentTempC}°C</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[9px] block uppercase">Power</span>
                            <span className="font-bold text-gray-200">{zone.energyIntensityWsqm} W/m²</span>
                          </div>
                        </div>

                        {/* Equipment Tag */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 pt-1">
                          <span className="truncate">{zone.equipmentType}</span>
                          <span className={zone.equipmentStatus === 'FAULT' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {zone.equipmentStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Click instruction hint */}
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-500 bg-[#0a0a0a] px-2.5 py-1 rounded border border-[#1f2937]">
              Click any zone to inspect actuator telemetry
            </div>
          </div>

        </div>

        {/* Zone Detail Inspector Drawer (1 Col) */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          {selectedZone ? (
            <div className="space-y-4">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#1f2937] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                      {selectedZone.code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                      selectedZone.equipmentStatus === 'FAULT' ? 'bg-rose-950/80 text-rose-300 border border-rose-900/60' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                    }`}>
                      {selectedZone.equipmentStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedZone.name}</h3>
                  <p className="text-xs text-gray-400">{currentFloor.name}</p>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1f2937]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Anomaly Callout if Faulty */}
              {selectedZone.anomalyNote && (
                <div className="p-3 rounded bg-rose-950/30 border border-rose-900/50 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold font-mono">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>ANOMALY TELEMETRY FLAG</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    {selectedZone.anomalyNote}
                  </p>
                  <button
                    onClick={() => onInvestigateAnomaly && onInvestigateAnomaly(selectedZone)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider shadow transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Multi-Agent Investigation</span>
                  </button>
                </div>
              )}

              {/* Real-time Sub-systems Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                
                <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Space Temperature</span>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-baseline justify-between">
                    <span>{selectedZone.currentTempC}°C</span>
                    <span className="text-[10px] text-gray-500 font-normal">Set: {selectedZone.setpointTempC}°C</span>
                  </div>
                </div>

                <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Energy Density</span>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {selectedZone.energyIntensityWsqm} W/m²
                  </div>
                </div>

                <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Airflow Rate</span>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5 flex items-baseline justify-between">
                    <span>{selectedZone.airflowCfm} CFM</span>
                    <span className="text-[10px] text-gray-500 font-normal">Target: {selectedZone.targetAirflowCfm}</span>
                  </div>
                </div>

                <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">CO2 / Occupancy</span>
                  <div className="text-sm font-bold text-teal-300 mt-0.5 flex items-baseline justify-between">
                    <span>{selectedZone.co2Ppm} ppm</span>
                    <span className="text-[10px] text-gray-500 font-normal">{selectedZone.currentOccupancy}/{selectedZone.maxCapacity} pax</span>
                  </div>
                </div>

              </div>

              {/* Actuator & Valve Telemetry Sliders */}
              <div className="space-y-2 bg-[#050505] p-3 rounded border border-[#1f2937] text-xs font-mono">
                <div className="text-gray-300 font-bold uppercase text-[11px] mb-2 flex items-center justify-between">
                  <span>BACnet Actuator Positions</span>
                  <span className="text-[10px] text-gray-500">Live Read</span>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 text-[10px] mb-1">
                    <span>VAV Supply Damper</span>
                    <span className="text-white font-bold">{selectedZone.vavDamperPositionPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1f2937] rounded overflow-hidden">
                    <div
                      className={`h-full ${selectedZone.vavDamperPositionPercent > 80 ? 'bg-cyan-400' : 'bg-gray-600'}`}
                      style={{ width: `${selectedZone.vavDamperPositionPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 text-[10px] mb-1">
                    <span>Electric Reheat Valve</span>
                    <span className={selectedZone.reheatValvePercent > 0 ? 'text-rose-400 font-bold' : 'text-gray-400'}>
                      {selectedZone.reheatValvePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1f2937] rounded overflow-hidden">
                    <div
                      className={`h-full ${selectedZone.reheatValvePercent > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${selectedZone.reheatValvePercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* One-Click Mitigation Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleExecuteCalibration(selectedZone.id)}
                  disabled={calibratingZoneId === selectedZone.id}
                  className="w-full py-2 px-3 rounded bg-[#050505] hover:bg-[#1a1a1a] text-cyan-400 border border-cyan-800/60 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {calibratingZoneId === selectedZone.id ? (
                    <span className="flex items-center gap-2 text-cyan-300">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-cyan-400"></span>
                      <span>Pulsing BACnet Damper Calibration...</span>
                    </span>
                  ) : calibrationSuccess ? (
                    <span className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Actuator Re-Seated Successfully!</span>
                    </span>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>BACnet Digital Re-Seat & Setpoint Override</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
              <div className="p-3 rounded bg-[#050505] border border-[#1f2937] text-gray-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-300">No Zone Selected</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                  Select any zone on the 3D or 2D floor layout to inspect damper angles, thermal balance, and fault status.
                </p>
              </div>
            </div>
          )}

          {/* Quick stats footer */}
          <div className="mt-4 pt-3 border-t border-[#1f2937] flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span>Air Handling Units: {currentFloor.equipmentSummary.ahus}</span>
            <span>VAV Terminals: {currentFloor.equipmentSummary.vavs}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

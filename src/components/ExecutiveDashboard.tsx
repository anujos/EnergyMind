import React from 'react';
import { BuildingTelemetry, AnomalyEvent, FloorData, ViewTab } from '../types';
import { 
  Zap, 
  Sun, 
  BatteryCharging, 
  Flame, 
  DollarSign, 
  ShieldAlert, 
  TrendingDown, 
  ArrowUpRight, 
  Layers, 
  Bot, 
  SlidersHorizontal, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowRight,
  Activity,
  Gauge
} from 'lucide-react';

interface ExecutiveDashboardProps {
  telemetry: BuildingTelemetry;
  anomalies: AnomalyEvent[];
  floors: FloorData[];
  onNavigateTab: (tab: ViewTab) => void;
  onSelectAnomaly: (anomaly: AnomalyEvent) => void;
  onSelectFloor: (floorId: string) => void;
  onQuickBessDispatch: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  telemetry,
  anomalies,
  floors,
  onNavigateTab,
  onSelectAnomaly,
  onSelectFloor,
  onQuickBessDispatch,
}) => {
  const contractLimit = telemetry.peakDemandContractLimitKw;
  const currentDemand = telemetry.totalPowerKw;
  const headroomKw = Math.max(0, contractLimit - currentDemand);
  const capacityUsagePercent = ((currentDemand / contractLimit) * 100).toFixed(1);

  const solarOffsetPercent = ((telemetry.solarPowerKw / Math.max(1, currentDemand)) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      
      {/* Top Hero Command Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Real-time Demand vs Contract Limit */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">
            <span>Demand vs Contract</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1.5">
              <span>{telemetry.totalPowerKw.toFixed(1)}</span>
              <span className="text-xs text-gray-500 font-normal">kW / {contractLimit} kW</span>
            </div>
            <div className="text-xs text-cyan-400 font-mono mt-1 flex items-center justify-between">
              <span>{capacityUsagePercent}% Peak Limit</span>
              <span className="text-emerald-400">+{headroomKw.toFixed(0)} kW Buffer</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div
              className={`h-full ${parseFloat(capacityUsagePercent) > 85 ? 'bg-rose-500' : 'bg-cyan-400'}`}
              style={{ width: `${Math.min(100, parseFloat(capacityUsagePercent))}%` }}
            ></div>
          </div>
        </div>

        {/* Solar Self-Generation & Clean Energy */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">
            <span>Clean Solar Generation</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-amber-400 font-mono flex items-baseline gap-1.5">
              <span>{telemetry.solarPowerKw.toFixed(1)}</span>
              <span className="text-xs text-gray-500 font-normal">kW Real-Time</span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              Supplying {solarOffsetPercent}% of total building load
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400"
              style={{ width: `${Math.min(100, parseFloat(solarOffsetPercent))}%` }}
            ></div>
          </div>
        </div>

        {/* BESS Battery Peak Buffer */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">
            <span>BESS Energy Storage</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono flex items-baseline gap-1.5">
              <span>{telemetry.bessSocPercent.toFixed(1)}%</span>
              <span className="text-xs text-gray-500 font-normal">State of Charge</span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              1.2 MWh LiFePO4 • Discharging at {telemetry.bessPowerKw} kW
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${telemetry.bessSocPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Energy EUI & Carbon */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">
            <span>Building Energy EUI</span>
            <Flame className="w-4 h-4 text-teal-400" />
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold text-teal-300 font-mono flex items-baseline gap-1.5">
              <span>{telemetry.energyEUIKwhSqm}</span>
              <span className="text-xs text-gray-500 font-normal">kWh/m²/yr</span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">
              ASHRAE 90.1 Benchmark: 142 (Top 5% Eco)
            </div>
          </div>

          <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
            <div className="h-full bg-teal-400" style={{ width: '82%' }}></div>
          </div>
        </div>

      </div>

      {/* Main Command Grid (2 Cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Col (7 Cols): Active Anomaly Matrix & Quick Mitigation */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Active Anomalies Radar */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Anomaly & Fault Radar</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-rose-950/60 border border-rose-900/50 text-rose-300 rounded font-bold">
                  {anomalies.filter((a) => a.status !== 'RESOLVED').length} Active
                </span>
              </div>

              <button
                onClick={() => onNavigateTab('agents')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                <span>Open Multi-Agent Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {anomalies.map((anomaly) => {
                const isCritical = anomaly.severity === 'CRITICAL';
                const isHigh = anomaly.severity === 'HIGH';
                return (
                  <div
                    key={anomaly.id}
                    onClick={() => {
                      onSelectAnomaly(anomaly);
                      onNavigateTab('agents');
                    }}
                    className={`p-3 rounded border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-900/50 hover:bg-rose-950/40'
                        : isHigh
                        ? 'bg-amber-950/20 border-amber-900/50 hover:bg-amber-950/40'
                        : 'bg-[#050505] border-[#1f2937] hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border ${
                          isCritical ? 'bg-rose-950 text-rose-300 border-rose-800' : isHigh ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-gray-900 text-gray-300 border-gray-700'
                        }`}>
                          {anomaly.severity}
                        </span>
                        <h4 className="text-xs font-bold text-white">{anomaly.title}</h4>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {anomaly.rootCauseSummary}
                      </p>
                      <div className="text-[10px] font-mono text-gray-500 flex items-center gap-2">
                        <span>{anomaly.location}</span>
                        <span>•</span>
                        <span>{anomaly.detectedAt}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1 flex-shrink-0">
                      <span className="text-xs font-bold font-mono text-rose-400">
                        +{anomaly.excessLoadKw} kW
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        ${anomaly.costImpactPerDay.toFixed(0)}/day
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action BMS Dispatch Controls */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Executive Quick Dispatch Controls</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={onQuickBessDispatch}
                className="p-3 bg-[#050505] hover:bg-emerald-950/30 border border-[#1f2937] hover:border-emerald-900/60 rounded text-left transition-all group"
              >
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
                  <span>Discharge BESS 160 kW</span>
                  <BatteryCharging className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Buffer 15:30 peak demand charge spike
                </p>
              </button>

              <button
                onClick={() => onNavigateTab('simulator')}
                className="p-3 bg-[#050505] hover:bg-purple-950/30 border border-[#1f2937] hover:border-purple-900/60 rounded text-left transition-all group"
              >
                <div className="flex items-center justify-between text-purple-300 text-xs font-bold mb-1">
                  <span>Float CHW to 7.8°C</span>
                  <SlidersHorizontal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Simulate 4.5% chiller kW savings
                </p>
              </button>

              <button
                onClick={() => onNavigateTab('spatial')}
                className="p-3 bg-[#050505] hover:bg-cyan-950/30 border border-[#1f2937] hover:border-cyan-900/60 rounded text-left transition-all group"
              >
                <div className="flex items-center justify-between text-cyan-300 text-xs font-bold mb-1">
                  <span>Inspect Spatial Zones</span>
                  <Layers className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Floor 8 damper actuator diagnostics
                </p>
              </button>
            </div>
          </div>

        </div>

        {/* Right Col (5 Cols): Multi-Floor Thermal Glance & Sub-metering */}
        <div className="xl:col-span-5 space-y-4">
          
          {/* Multi-Floor Glance */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Multi-Floor Thermal Glance</span>
              </h3>
              <button
                onClick={() => onNavigateTab('spatial')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
              >
                View 3D Map →
              </button>
            </div>

            <div className="space-y-2">
              {floors.map((fl) => {
                const hasFault = fl.zones.some((z) => z.equipmentStatus === 'FAULT');
                return (
                  <div
                    key={fl.id}
                    onClick={() => {
                      onSelectFloor(fl.id);
                      onNavigateTab('spatial');
                    }}
                    className="p-2.5 bg-[#050505] hover:bg-[#111111] rounded border border-[#1f2937] flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded bg-[#111111] text-cyan-400 border border-[#1f2937] flex items-center justify-center text-xs font-bold font-mono">
                        L{fl.levelNumber}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{fl.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {fl.areaSqm} m² • {fl.zones.length} Zones
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-gray-300 font-bold">{fl.avgTempC.toFixed(1)}°C</span>
                      <span className="text-cyan-400 font-bold">{fl.totalLoadKw.toFixed(0)} kW</span>
                      {hasFault && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-metered Load Distribution */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Sub-Metered Load Distribution</h3>
            
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>HVAC & Central Chillers (48%)</span>
                  <span className="text-cyan-400 font-bold">685 kW</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Edge Server & Labs (16%)</span>
                  <span className="text-purple-400 font-bold">228 kW</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400" style={{ width: '16%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Lighting & Architectural (18%)</span>
                  <span className="text-amber-400 font-bold">257 kW</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: '18%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Plug Loads & Elevators (18%)</span>
                  <span className="text-emerald-400 font-bold">258 kW</span>
                </div>
                <div className="w-full h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

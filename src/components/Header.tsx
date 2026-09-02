import React from 'react';
import { BuildingTelemetry, AnomalyEvent } from '../types';
import { 
  Building2, 
  Zap, 
  Sun, 
  BatteryCharging, 
  Flame, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  Pause, 
  RefreshCw,
  Cpu,
  Bot
} from 'lucide-react';

interface HeaderProps {
  telemetry: BuildingTelemetry;
  activeAnomalies: AnomalyEvent[];
  isLiveStream: boolean;
  setIsLiveStream: (val: boolean) => void;
  onOpenCopilot: () => void;
  onOpenAnomalyModal: (anomaly: AnomalyEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  activeAnomalies,
  isLiveStream,
  setIsLiveStream,
  onOpenCopilot,
  onOpenAnomalyModal,
}) => {
  const criticalCount = activeAnomalies.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const highCount = activeAnomalies.filter((a) => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;

  return (
    <header className="border-b border-[#1f2937] bg-[#0a0a0a] sticky top-0 z-40 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1760px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        
        {/* Brand & Building Identity */}
        <div className="flex items-center justify-between xl:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/10">
              <span className="text-white font-bold text-xs font-mono">EM</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-semibold tracking-tight uppercase text-white flex items-center">
                  Energy<span className="text-cyan-400">Mind</span>
                </h1>
                <span className="px-2 py-0.5 border border-cyan-900/50 bg-cyan-950/30 text-cyan-400 text-[10px] rounded uppercase font-bold tracking-widest font-mono">
                  Industrial v4.2
                </span>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-mono">
                <Building2 className="w-3 h-3 text-gray-600" />
                <span>Cyber Tower HQ • 145,000 m² • LEED Platinum</span>
              </p>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          
          {/* Total Load */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-900/40">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Global Load</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-baseline gap-1">
                <span>{telemetry.totalPowerKw.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500 font-normal">kW</span>
              </div>
            </div>
          </div>

          {/* Solar Generation */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Solar PV Yield</div>
              <div className="text-sm font-bold text-amber-400 font-mono flex items-baseline gap-1">
                <span>{telemetry.solarPowerKw.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500 font-normal">kW</span>
              </div>
            </div>
          </div>

          {/* BESS Battery */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
              <BatteryCharging className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">BESS Storage</div>
              <div className="text-sm font-bold text-emerald-400 font-mono flex items-baseline gap-1">
                <span>{telemetry.bessSocPercent.toFixed(1)}%</span>
                <span className="text-[9px] text-gray-500 font-normal">({telemetry.bessPowerKw > 0 ? `-${telemetry.bessPowerKw}kW` : 'Idle'})</span>
              </div>
            </div>
          </div>

          {/* Grid Tariff */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-purple-950/40 text-purple-400 border border-purple-900/40">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">TOU Grid Tariff</div>
              <div className="text-sm font-bold text-cyan-300 font-mono flex items-baseline gap-1">
                <span>${telemetry.realtimeTariffRate.toFixed(2)}</span>
                <span className="text-[10px] text-gray-500 font-normal">/kWh</span>
              </div>
            </div>
          </div>

          {/* Carbon Intensity */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-teal-950/40 text-teal-400 border border-teal-900/40">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Grid Carbon</div>
              <div className="text-sm font-bold text-gray-300 font-mono flex items-baseline gap-1">
                <span>{telemetry.carbonIntensityGPerKwh}</span>
                <span className="text-[10px] text-gray-500 font-normal">g/kWh</span>
              </div>
            </div>
          </div>

          {/* Active Anomalies Alert */}
          <div 
            onClick={() => activeAnomalies[0] && onOpenAnomalyModal(activeAnomalies[0])}
            className={`cursor-pointer transition-all rounded p-2.5 flex items-center gap-2.5 border ${
              criticalCount > 0 
                ? 'bg-rose-950/30 border-rose-900/60 hover:bg-rose-950/50 text-rose-300 animate-pulse' 
                : 'bg-[#0d0d0d] border-[#1f2937] text-gray-300 hover:border-gray-700'
            }`}
          >
            <div className={`p-1.5 rounded ${criticalCount > 0 ? 'bg-rose-950 text-rose-400' : 'bg-gray-900 text-gray-400'}`}>
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold truncate">Anomaly Risk</div>
              <div className="text-sm font-bold font-mono flex items-baseline gap-1.5">
                <span className={criticalCount > 0 ? 'text-rose-400' : 'text-amber-400'}>
                  {criticalCount > 0 ? `${criticalCount} CRITICAL` : `${activeAnomalies.filter(a => a.status !== 'RESOLVED').length} Active`}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Global Controls & Copilot Button */}
        <div className="hidden xl:flex items-center gap-3">
          {/* Live Ingest Toggle */}
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono font-semibold rounded border transition-all ${
              isLiveStream
                ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/60'
                : 'bg-[#0d0d0d] border-[#1f2937] text-gray-400 hover:bg-gray-900'
            }`}
            title="Toggle Live Telemetry Stream Simulation"
          >
            {isLiveStream ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-gray-400" />}
            <span>{isLiveStream ? 'STREAM: 1s' : 'STREAM: PAUSED'}</span>
          </button>

          {/* AI BMS Copilot Button */}
          <button
            onClick={onOpenCopilot}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/30 transition-all group"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />
            <span>Nexus Copilot</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[9px] font-mono text-cyan-300">v3.7</span>
          </button>
        </div>

      </div>
    </header>
  );
};

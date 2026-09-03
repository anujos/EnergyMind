import React, { useState } from 'react';
import { PortfolioBuilding } from '../types';
import { 
  Building2, 
  Globe2, 
  Leaf, 
  ExternalLink, 
  Copy, 
  Check, 
  TrendingDown, 
  ArrowUpRight, 
  Award, 
  Zap, 
  ShieldCheck, 
  Database,
  BarChart3,
  Calendar,
  Share2
} from 'lucide-react';

interface PortfolioESGProps {
  buildings: PortfolioBuilding[];
  selectedBuildingId: string;
  onSelectBuilding: (id: string) => void;
}

export const PortfolioESG: React.FC<PortfolioESGProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
}) => {
  const [copiedLooker, setCopiedLooker] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'california' | 'texas' | 'massachusetts' | 'washington'>('all');

  const totalArea = buildings.reduce((acc, b) => acc + b.areaSqm, 0);
  const totalPower = buildings.reduce((acc, b) => acc + b.currentPowerKw, 0);
  const totalCarbon = buildings.reduce((acc, b) => acc + b.carbonTonsYtd, 0);
  const totalMonthlySpend = buildings.reduce((acc, b) => acc + b.monthlyEnergySpendUsd, 0);
  const avgEui = (buildings.reduce((acc, b) => acc + b.euiKwhSqmYear, 0) / buildings.length).toFixed(1);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];

  const handleCopyLookerUrl = () => {
    navigator.clipboard.writeText('https://datastudio.google.com/datasources/create?connectorId=energymind-bqml-connector-v4');
    setCopiedLooker(true);
    setTimeout(() => setCopiedLooker(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Commercial Real Estate Portfolio & Looker Studio ESG</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                4 Tier-1 Campuses Connected
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Enterprise portfolio rollup, Scope 2 emissions tracking, LEED certification performance, and native Google Looker Studio connector.
            </p>
          </div>
        </div>

        {/* Looker Studio Fast Sync Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLookerUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-cyan-500/40 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all"
          >
            {copiedLooker ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLooker ? 'Connector URL Copied' : 'Sync Looker Studio'}</span>
          </button>
        </div>
      </div>

      {/* Portfolio High-Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#0c0d10] border border-[#1f2937] p-3.5 rounded">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Managed Floorspace</span>
          <div className="text-lg font-mono font-bold text-white mt-1">
            {(totalArea / 1000).toFixed(0)}k <span className="text-xs text-gray-400">m²</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">4 Campuses • 44 Floors</span>
        </div>

        <div className="bg-[#0c0d10] border border-[#1f2937] p-3.5 rounded">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Aggregated Grid Load</span>
          <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
            {(totalPower / 1000).toFixed(2)} <span className="text-xs text-gray-400">MW</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Within Combined Cap (9.8 MW)</span>
        </div>

        <div className="bg-[#0c0d10] border border-[#1f2937] p-3.5 rounded">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Portfolio Avg EUI</span>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
            {avgEui} <span className="text-xs text-gray-400">kWh/m²/yr</span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">ASHRAE 90.1 Benchmark: 165</span>
        </div>

        <div className="bg-[#0c0d10] border border-[#1f2937] p-3.5 rounded">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Scope 2 Carbon YTD</span>
          <div className="text-lg font-mono font-bold text-amber-400 mt-1">
            {totalCarbon.toLocaleString()} <span className="text-xs text-gray-400">tCO₂e</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
            <TrendingDown className="w-2.5 h-2.5" /> -18.4% vs 2025 Baseline
          </span>
        </div>

        <div className="bg-[#0c0d10] border border-[#1f2937] p-3.5 rounded col-span-2 md:col-span-1">
          <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Monthly Energy Run-Rate</span>
          <div className="text-lg font-mono font-bold text-white mt-1">
            ${(totalMonthlySpend / 1000).toFixed(1)}k <span className="text-xs text-gray-400">/mo</span>
          </div>
          <span className="text-[10px] text-cyan-400 mt-1 block">AI Avoided: $34,200/mo</span>
        </div>
      </div>

      {/* Campus Selector & Deep Dive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campus List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
              Connected Commercial Assets
            </h3>
            <span className="text-[11px] text-gray-500 font-mono">Click a campus to view details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {buildings.map((building) => {
              const isSelected = building.id === selectedBuildingId;
              return (
                <div
                  key={building.id}
                  onClick={() => onSelectBuilding(building.id)}
                  className={`p-4 rounded border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#10141b] border-cyan-500 shadow-md shadow-cyan-950/30'
                      : 'bg-[#0a0a0c] border-[#1f2937] hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{building.name}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                          {building.leedStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{building.location} • {building.floorsCount} Floors</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-mono">
                    <div className="bg-[#050608] p-2 rounded border border-[#1f2937]/60">
                      <span className="text-[9px] text-gray-500 block uppercase">Area</span>
                      <span className="text-white font-bold">{building.areaSqm.toLocaleString()} m²</span>
                    </div>
                    <div className="bg-[#050608] p-2 rounded border border-[#1f2937]/60">
                      <span className="text-[9px] text-gray-500 block uppercase">Power Draw</span>
                      <span className="text-cyan-400 font-bold">{building.currentPowerKw.toFixed(0)} kW</span>
                    </div>
                    <div className="bg-[#050608] p-2 rounded border border-[#1f2937]/60">
                      <span className="text-[9px] text-gray-500 block uppercase">Variance</span>
                      <span className={`font-bold ${building.baselineDiffPercent > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {building.baselineDiffPercent > 0 ? `+${building.baselineDiffPercent}%` : `${building.baselineDiffPercent}%`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1f2937]/60 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 truncate max-w-[200px]">{building.primaryChillerType}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      building.activeFaultsCount > 0
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    }`}>
                      {building.activeFaultsCount > 0 ? `${building.activeFaultsCount} Active Fault` : 'All Optimal'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Looker Studio Connector & Integration Panel */}
        <div className="bg-[#0c0d10] border border-[#1f2937] rounded p-4 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Google Looker Studio ESG Connector</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Directly connect your BigQuery interval datasets and Gemini multi-agent incident audits into Google Looker Studio for executive and ESG committee reports.
          </p>

          <div className="space-y-2.5">
            <div className="bg-[#050608] p-2.5 rounded border border-[#1f2937] text-xs font-mono">
              <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1">
                <span>COMMUNITY CONNECTOR ID</span>
                <span className="text-emerald-400">CERTIFIED</span>
              </div>
              <div className="text-cyan-300 select-all break-all text-[11px]">
                energymind-bqml-connector-v4
              </div>
            </div>

            <div className="bg-[#050608] p-2.5 rounded border border-[#1f2937] text-xs font-mono">
              <div className="flex items-center justify-between text-gray-400 text-[10px] mb-1">
                <span>BIGQUERY ESG SCHEMA VIEW</span>
                <span className="text-purple-400">REALTIME</span>
              </div>
              <div className="text-gray-300 text-[11px]">
                `energymind_telemetry.views.esg_scope2_hourly`
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded text-xs space-y-2">
            <span className="font-bold text-cyan-300 block">Pre-Built Report Dashboards:</span>
            <ul className="space-y-1.5 text-gray-300 text-[11px]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Executive ESG & Carbon Neutrality Target Tracker</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ASHRAE Standard 90.1 Compliance vs Baseline</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>TOU Peak Demand Ratchet Avoidance Audit</span>
              </li>
            </ul>
          </div>

          <a
            href="https://lookerstudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors"
          >
            <span>Open Looker Studio Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

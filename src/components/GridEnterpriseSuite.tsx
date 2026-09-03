import React, { useState } from 'react';
import { OpenAdrEvent, EnterpriseUser, MvBaselineReport } from '../types';
import { mockOpenAdrEvents, mockEnterpriseUsers, mockMvReports } from '../data/gridEnterpriseData';
import { 
  Zap, 
  ShieldCheck, 
  FileCheck2, 
  Users, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Cpu, 
  KeyRound, 
  Download, 
  Lock, 
  TrendingDown, 
  Activity,
  AlertCircle,
  Building,
  RefreshCw,
  Send
} from 'lucide-react';

export const GridEnterpriseSuite: React.FC = () => {
  const [subTab, setSubTab] = useState<'openadr' | 'ipmvp' | 'rbac'>('openadr');
  const [adrEvents, setAdrEvents] = useState<OpenAdrEvent[]>(mockOpenAdrEvents);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [autoResponseActive, setAutoResponseActive] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const activeEvent = adrEvents[activeEventIndex] || adrEvents[0];

  const handleTriggerSimulatedGridSignal = () => {
    setAdrEvents((prev) =>
      prev.map((ev, i) =>
        i === activeEventIndex
          ? {
              ...ev,
              currentCurtailmentKw: ev.targetCurtailmentKw + 28,
              totalEarnedUsd: ev.totalEarnedUsd + 120,
              automaticBessDispatched: true,
              chillerSetbackApplied: true,
            }
          : ev
      )
    );
  };

  const handleDownloadMvReport = (reportId: string) => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">OpenADR 2.0b VEN, IPMVP M&V & Enterprise RBAC</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 rounded">
                OpenADR 2.0b Certified VEN
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Automated grid demand response dispatch, International Performance Measurement & Verification (IPMVP) reporting, and SAML/OAuth Role-Based Access Control.
            </p>
          </div>
        </div>

        {/* Global ADR VEN Status */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[9px] uppercase block font-bold">VEN ID</span>
            <span className="text-amber-400 font-bold">VEN-CYBER-TOWER-4335</span>
          </div>
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[9px] uppercase block font-bold">GRID DISPATCH</span>
            <span className="text-emerald-400 font-bold">AUTO-ARMED</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Buttons */}
      <div className="flex items-center gap-2 border-b border-[#1f2937] pb-2">
        <button
          onClick={() => setSubTab('openadr')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'openadr'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>OpenADR 2.0b Demand Response Events</span>
        </button>

        <button
          onClick={() => setSubTab('ipmvp')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'ipmvp'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>IPMVP Continuous M&V Reports</span>
        </button>

        <button
          onClick={() => setSubTab('rbac')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'rbac'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Enterprise RBAC & SSO Directory</span>
        </button>
      </div>

      {/* VIEW 1: OPENADR 2.0b DEMAND RESPONSE */}
      {subTab === 'openadr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Event List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase font-mono">OpenADR Grid Signal Queue</h3>
                <span className="text-[10px] font-mono text-emerald-400">VEN CONNECTED (TLS 1.3)</span>
              </div>

              {adrEvents.map((ev, idx) => {
                const isSelected = idx === activeEventIndex;
                return (
                  <div
                    key={ev.eventId}
                    onClick={() => setActiveEventIndex(idx)}
                    className={`p-3.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141208] border-amber-500 shadow-md shadow-amber-950/40'
                        : 'bg-[#0a0a0a] border-[#1f2937] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[180px]">{ev.eventName}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        ev.status === 'ACTIVE'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 animate-pulse'
                          : ev.status === 'UPCOMING'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[#1f2937] text-[11px] font-mono">
                      <div>
                        <span className="text-gray-500 text-[9px] block">TARGET CURTAIL</span>
                        <span className="text-amber-400 font-bold">{ev.targetCurtailmentKw} kW</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[9px] block">INCENTIVE RATE</span>
                        <span className="text-emerald-400 font-bold">${ev.incentivePpHourUsd}/kWh</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Event Detail & Execution Bench */}
            <div className="lg:col-span-2 bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1f2937] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{activeEvent.eventName}</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    Program: {activeEvent.programName} • Event ID: {activeEvent.eventId}
                  </p>
                </div>

                <button
                  onClick={handleTriggerSimulatedGridSignal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-400 text-black transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Fast Curtailment (345 kW)</span>
                </button>
              </div>

              {/* Progress Toward Curtailment Target */}
              <div className="bg-[#050608] p-3.5 rounded border border-[#1f2937] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Current Facility Curtailment Response:</span>
                  <span className="text-emerald-400 font-bold">
                    {activeEvent.currentCurtailmentKw} kW / {activeEvent.targetCurtailmentKw} kW target ({((activeEvent.currentCurtailmentKw / activeEvent.targetCurtailmentKw) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (activeEvent.currentCurtailmentKw / activeEvent.targetCurtailmentKw) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Automatic Asset Dispatches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Battery BESS Fast Discharge</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                      EXECUTED
                    </span>
                  </div>
                  <span className="text-white font-bold block text-sm">160.0 kW Inverter Power</span>
                  <span className="text-[10px] text-gray-500">Autonomous Modbus dispatch to Schneider PCS-01</span>
                </div>

                <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Central Chiller Float (+1.5°C)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                      EXECUTED
                    </span>
                  </div>
                  <span className="text-white font-bold block text-sm">185.0 kW Compressor Relief</span>
                  <span className="text-[10px] text-gray-500">ASHRAE 55 comfort zone temperature boundary maintained</span>
                </div>
              </div>

              {/* Financial Revenue Accumulator */}
              <div className="bg-[#050608] p-3 rounded border border-[#1f2937] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Grid Capacity Revenue Earned</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    ${activeEvent.totalEarnedUsd.toLocaleString()} USD
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-mono">Settlement: CAISO Direct ACH</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: IPMVP MEASUREMENT & VERIFICATION */}
      {subTab === 'ipmvp' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockMvReports.map((report) => (
              <div key={report.id} className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-3">
                <div className="flex items-start justify-between border-b border-[#1f2937] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">{report.facility}</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 block mt-0.5">{report.ipmvpOption}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    {report.certificationStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-[#050608] p-2.5 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">Baseline MWh</span>
                    <span className="text-white font-bold">{report.baselineEnergyMwh} MWh</span>
                  </div>
                  <div className="bg-[#050608] p-2.5 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">Actual MWh</span>
                    <span className="text-cyan-400 font-bold">{report.actualEnergyMwh} MWh</span>
                  </div>
                  <div className="bg-[#050608] p-2.5 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">Verified Savings</span>
                    <span className="text-emerald-400 font-bold">{report.verifiedSavingsMwh} MWh</span>
                  </div>
                </div>

                <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Statistical Measurement Uncertainty:</span>
                    <span className="text-emerald-400 font-bold">±{report.uncertaintyPercent}% (ASHRAE Guideline 14 Pass)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Net Audited Financial Value:</span>
                    <span className="text-white font-bold">${report.netFinancialSavingsUsd.toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scope 2 Carbon Offset:</span>
                    <span className="text-amber-400 font-bold">{report.ghgAvoidedTons} Metric Tons CO₂e</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadMvReport(report.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-[#10191b] hover:bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 font-semibold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadSuccess ? 'IPMVP Audit Packet Generated (PDF/CSV)' : 'Export IPMVP Certified Compliance Audit'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: ENTERPRISE RBAC & SSO */}
      {subTab === 'rbac' && (
        <div className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Enterprise Identity & Access Governance (SAML 2.0 / SSO)</span>
              </h3>
              <p className="text-xs text-gray-400">
                Enforce granular least-privilege security tiers across facility engineers, sustainability executives, and independent audit firms.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
              SSO ENFORCED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-500 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">Authorized Identity</th>
                  <th className="py-2.5 px-3">Role Tier</th>
                  <th className="py-2.5 px-3">SSO Provider</th>
                  <th className="py-2.5 px-3">Permission Scopes</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937] text-gray-300">
                {mockEnterpriseUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#14151b] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{user.name}</span>
                      <span className="text-[10px] text-gray-400">{user.email}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-cyan-400">{user.role}</td>
                    <td className="py-3 px-3 text-gray-300">
                      <span className="px-2 py-0.5 rounded bg-[#050608] border border-[#1f2937] text-[10px]">
                        {user.ssoProvider}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {user.permissions.map((p) => (
                          <span key={p} className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-[9px] text-gray-400">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

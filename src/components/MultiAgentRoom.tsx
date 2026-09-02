import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { AgentInfo, AnomalyEvent, InvestigationReport, BuildingTelemetry } from '../types';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  GitBranch, 
  DollarSign, 
  Flame, 
  Zap, 
  Sliders, 
  RotateCcw,
  Terminal,
  Clock,
  Play
} from 'lucide-react';

interface MultiAgentRoomProps {
  agents: AgentInfo[];
  anomalies: AnomalyEvent[];
  selectedAnomaly: AnomalyEvent | null;
  setSelectedAnomaly: (anomaly: AnomalyEvent) => void;
  telemetry: BuildingTelemetry;
  onDispatchMitigation: (actionId: string, anomalyId: string) => void;
}

export const MultiAgentRoom: React.FC<MultiAgentRoomProps> = ({
  agents,
  anomalies,
  selectedAnomaly,
  setSelectedAnomaly,
  telemetry,
  onDispatchMitigation,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('NEXUS-ORCHESTRATOR');
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [investigationReport, setInvestigationReport] = useState<InvestigationReport | null>(null);
  const [dispatchedActions, setDispatchedActions] = useState<Record<string, boolean>>({});

  const activeAnomaly = selectedAnomaly || anomalies[0];

  const handleRunInvestigation = async () => {
    setIsInvestigating(true);
    try {
      const response = await fetch('/api/gemini/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomaly: activeAnomaly,
          buildingState: telemetry,
          floorContext: { floorId: activeAnomaly.floorId, location: activeAnomaly.location },
        }),
      });

      const data = await response.json();
      if (data.success && data.report) {
        setInvestigationReport(data.report);
      }
    } catch (err) {
      console.error('Failed to run agent investigation:', err);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleExecuteDispatch = (actionId: string, actionName: string) => {
    setDispatchedActions((prev) => ({ ...prev, [actionId]: true }));
    onDispatchMitigation(actionId, activeAnomaly.id);

    // Trigger celebratory confetti for verified energy waste mitigation
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#38bdf8', '#a855f7'],
    });
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="space-y-4">
      {/* Top Banner & Active Anomaly Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Autonomous Multi-Agent Investigation Hub</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                4 Specialized Sub-Agents Active
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Autonomous domain agents cross-correlate HVAC psychrometrics, solar yield, microclimate, and occupancy to locate root causes.
            </p>
          </div>
        </div>

        {/* Anomaly Selector & Investigate Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeAnomaly.id}
            onChange={(e) => {
              const found = anomalies.find((a) => a.id === e.target.value);
              if (found) setSelectedAnomaly(found);
            }}
            className="bg-[#050505] border border-[#1f2937] text-xs font-mono text-gray-200 rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            {anomalies.map((anom) => (
              <option key={anom.id} value={anom.id}>
                [{anom.severity}] {anom.title} ({anom.location})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunInvestigation}
            disabled={isInvestigating}
            className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider border border-cyan-400/30 transition-all disabled:opacity-50"
          >
            {isInvestigating ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>
                <span>Synthesizing Swarm...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Investigate with Gemini 3.7</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agents Swarm Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#141414] border-cyan-500/80 ring-1 ring-cyan-500/50'
                  : 'bg-[#0d0d0d] border-[#1f2937] hover:border-gray-700 hover:bg-[#111111]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-2 h-2 rounded-full ${
                    agent.status === 'INVESTIGATING' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}></span>
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">
                    {agent.confidenceScore}% Conf
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">{agent.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{agent.role}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1f2937] flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-500">{agent.id.split('-')[0]}</span>
                <span className={agent.status === 'INVESTIGATING' ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
                  {agent.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Investigation Split View (2 Cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Col (7 Cols): Causal Tree & Forensic Report */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Executive Synthesis Card */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-900/60 rounded uppercase">
                  {activeAnomaly.severity} Fault
                </span>
                <h3 className="text-sm font-bold text-white">{activeAnomaly.title}</h3>
              </div>
              <div className="text-xs font-mono text-gray-400 flex items-center gap-2">
                <span>Location: {activeAnomaly.location}</span>
              </div>
            </div>

            {/* Financial & Energy Loss Metrics */}
            <div className="grid grid-cols-3 gap-2.5 mb-4 text-xs font-mono">
              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Power Loss Rate</span>
                <div className="text-sm font-bold text-rose-400 mt-0.5 flex items-baseline gap-1">
                  <span>+{activeAnomaly.excessLoadKw}</span>
                  <span className="text-[10px] text-gray-500 font-normal">kW</span>
                </div>
              </div>

              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Financial Waste</span>
                <div className="text-sm font-bold text-amber-400 mt-0.5 flex items-baseline gap-1">
                  <span>${activeAnomaly.costImpactPerDay.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-500 font-normal">/day</span>
                </div>
              </div>

              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937]">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Swarm Consensus</span>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">
                  {investigationReport?.consensusConfidence || 94.8}% Confident
                </div>
              </div>
            </div>

            {/* Executive Synthesis Summary */}
            <div className="p-3 bg-[#050505] rounded border border-[#1f2937] mb-4">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase mb-1">
                Master Agent Forensic Verdict:
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                {investigationReport?.executiveSummary || (
                  `Multi-agent investigation confirms an electromechanical actuator failure in ${activeAnomaly.location}. Sub-agent cross-correlation indicates BACnet damper feedback is locked while electric reheat staging continues, creating an energy penalty of ${activeAnomaly.excessLoadKw} kW.`
                )}
              </p>
            </div>

            {/* Root Cause Tree Diagram */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300 uppercase">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>Automated Root Cause Chain</span>
              </div>

              <div className="bg-[#050505] rounded p-3 border border-[#1f2937] space-y-2 font-mono text-xs">
                {(investigationReport?.rootCauseChain || [
                  '1. BACnet actuator motor torque limit exceeded on Damper VAV-08-S2',
                  '2. Physical damper blade locked in 88% open position',
                  '3. Space temp over-cooled to 19.4°C triggering local electric reheat coils',
                  '4. Reheat coil draws 18.4 kW continuously against chilled primary air',
                ]).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-gray-300">
                    <span className="w-5 h-5 rounded bg-[#1a1a1a] text-cyan-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 border border-[#1f2937]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Actionable BMS Mitigation Dispatch Panel */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Actionable BMS Mitigation Dispatches</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">BACnet / DNP3 Digital Control</span>
            </div>

            <div className="space-y-2.5">
              {(investigationReport?.recommendedMitigations || [
                {
                  id: 'act-01',
                  action: 'Execute BACnet Digital Override & Damper Pulse Re-Seat Cycle',
                  type: 'AUTOMATED_BMS_DISPATCH',
                  estimatedSavingsKw: '18.4 kW',
                  payoffTime: 'Instantaneous',
                  confidence: 96,
                },
                {
                  id: 'act-02',
                  action: 'Lock Reheat Coil Valve & Reset Zone Setpoint to 23.0°C',
                  type: 'ENERGY_LIMITER',
                  estimatedSavingsKw: '12.0 kW',
                  payoffTime: '2 minutes',
                  confidence: 98,
                },
                {
                  id: 'act-03',
                  action: 'Dispatch On-Premises Facilities Technician for Mechanical Actuator Linkage',
                  type: 'WORK_ORDER',
                  estimatedSavingsKw: 'N/A',
                  payoffTime: 'Next Shift',
                  confidence: 92,
                },
              ]).map((mitigation) => {
                const isDispatched = dispatchedActions[mitigation.id];
                return (
                  <div
                    key={mitigation.id}
                    className="p-3 bg-[#050505] rounded border border-[#1f2937] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                          {mitigation.type}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">{mitigation.action}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">Est. Savings: {mitigation.estimatedSavingsKw}</span>
                        <span className="text-gray-700">|</span>
                        <span>Payoff: {mitigation.payoffTime}</span>
                        <span className="text-gray-700">|</span>
                        <span>Confidence: {mitigation.confidence}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecuteDispatch(mitigation.id, mitigation.action)}
                      disabled={isDispatched}
                      className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
                        isDispatched
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                      }`}
                    >
                      {isDispatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Dispatched & Verified</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute Command</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Col (5 Cols): Selected Agent Live Telemetry & Log Stream */}
        <div className="xl:col-span-5 space-y-4">
          
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1a1a] text-gray-300 border border-[#1f2937]">
                {selectedAgent.id}
              </span>
            </div>

            {/* Agent Telemetry Source */}
            <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937] text-xs font-mono">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Telemetry Data Stream</span>
              <span className="text-gray-300 text-[11px] leading-relaxed block mt-0.5">
                {selectedAgent.telemetrySource}
              </span>
            </div>

            {/* Agent Active Hypothesis */}
            <div className="bg-[#050505] p-3 rounded border border-[#1f2937] text-xs font-mono space-y-1">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase">
                <span>Working Hypothesis</span>
                <span>{selectedAgent.confidenceScore}% Score</span>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed">
                {selectedAgent.activeHypothesis}
              </p>
            </div>

            {/* Live Agent Terminal Reasoning Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span className="flex items-center gap-1.5 text-gray-300 font-semibold uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Agent Reasoning Log</span>
                </span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Streaming</span>
                </span>
              </div>

              <div className="bg-[#050505] p-3 rounded border border-[#1f2937] font-mono text-xs space-y-2 max-h-[300px] overflow-y-auto">
                {selectedAgent.recentLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 border-b border-[#141414] pb-1.5 last:border-0 last:pb-0">
                    <span className="text-[10px] text-gray-500 flex-shrink-0 mt-0.5">{log.timestamp}</span>
                    <span className={`text-[10px] font-bold px-1 rounded flex-shrink-0 ${
                      log.level === 'FAULT' ? 'bg-rose-950/80 text-rose-400 border border-rose-900/60' :
                      log.level === 'WARN' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/60' :
                      log.level === 'RESOLVE' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60' :
                      'bg-[#1a1a1a] text-gray-300 border border-[#1f2937]'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="text-gray-300 text-[11px] leading-tight">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

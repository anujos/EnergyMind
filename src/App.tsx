import React, { useState } from 'react';
import { 
  BuildingTelemetry, 
  AnomalyEvent, 
  FloorData, 
  ViewTab, 
  SimulatorState 
} from './types';
import { 
  mockTelemetry, 
  mock24hTelemetry, 
  mockFloors, 
  mockAnomalies, 
  mockAgents, 
  mockPipelineStreams 
} from './data/mockData';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TelemetryChart } from './components/TelemetryChart';
import { SpatialHeatmap } from './components/SpatialHeatmap';
import { MultiAgentRoom } from './components/MultiAgentRoom';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PipelineMonitor } from './components/PipelineMonitor';
import { AgentCopilotModal } from './components/AgentCopilotModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [telemetry, setTelemetry] = useState<BuildingTelemetry>(mockTelemetry);
  const [telemetry24h, setTelemetry24h] = useState(mock24hTelemetry);
  const [floors, setFloors] = useState<FloorData[]>(mockFloors);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>(mockAnomalies);
  const [agents, setAgents] = useState(mockAgents);
  const [pipelineStreams] = useState(mockPipelineStreams);

  // Selected State
  const [selectedFloorId, setSelectedFloorId] = useState<string>(mockFloors[2].id);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(mockAnomalies[0]);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Quick BESS Dispatch Handler from Dashboard
  const handleQuickBessDispatch = () => {
    setTelemetry((prev) => ({
      ...prev,
      bessPowerKw: 160.0,
      totalPowerKw: Math.max(900, prev.totalPowerKw - 160),
    }));
  };

  // Mitigation Dispatch from MultiAgentRoom
  const handleDispatchMitigation = (actionId: string, anomalyId: string) => {
    // Mark anomaly resolved/mitigated
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === anomalyId
          ? { ...a, status: 'RESOLVED', excessLoadKw: 0, costImpactPerDay: 0 }
          : a
      )
    );

    // Reduce building power demand by the resolved excess
    const foundAnomaly = anomalies.find((a) => a.id === anomalyId);
    if (foundAnomaly) {
      setTelemetry((prev) => ({
        ...prev,
        totalPowerKw: Math.max(800, prev.totalPowerKw - foundAnomaly.excessLoadKw),
      }));

      // Update Floor zone status
      setFloors((prev) =>
        prev.map((fl) => ({
          ...fl,
          zones: fl.zones.map((z) =>
            z.id === foundAnomaly.floorId || z.equipmentStatus === 'FAULT'
              ? { ...z, equipmentStatus: 'OPTIMAL', reheatValvePercent: 0, vavDamperPositionPercent: 60 }
              : z
          ),
        }))
      );
    }
  };

  // Strategy pushed to BMS from Simulator
  const handleApplyStrategyToBMS = (state: SimulatorState) => {
    setTelemetry((prev) => ({
      ...prev,
      bessPowerKw: state.bessDischargeRateKw,
      totalPowerKw: Math.max(800, prev.totalPowerKw - (state.bessDischargeRateKw * 0.8)),
    }));
  };

  // Trigger Anomaly Investigation from Spatial or Telemetry View
  const handleSelectAnomalyAndNavigate = (anomaly: any) => {
    const matched = anomalies.find((a) => a.id === anomaly.id) || anomalies[0];
    setSelectedAnomaly(matched);
    setActiveTab('agents');
  };

  const handleSelectZoneAndInvestigate = (zone: any) => {
    const matched = anomalies.find((a) => a.floorId === zone.floorId || a.id.includes(zone.code)) || anomalies[0];
    setSelectedAnomaly(matched);
    setActiveTab('agents');
  };

  const activeAnomalyCount = anomalies.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e7eb] flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Global Header */}
      <Header
        telemetry={telemetry}
        activeAnomalies={anomalies}
        isLiveStream={true}
        setIsLiveStream={() => {}}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenAnomalyModal={handleSelectAnomalyAndNavigate}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAnomaliesCount={activeAnomalyCount}
      />

      {/* Main App Container */}
      <div className="flex-1 max-w-[1760px] w-full mx-auto p-3 sm:p-5 flex flex-col space-y-4">
        
        {/* Dynamic View Tab Rendering */}
        <main className="flex-1 animate-fade-in">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              telemetry={telemetry}
              anomalies={anomalies}
              floors={floors}
              onNavigateTab={setActiveTab}
              onSelectAnomaly={setSelectedAnomaly}
              onSelectFloor={setSelectedFloorId}
              onQuickBessDispatch={handleQuickBessDispatch}
            />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryChart
              telemetryData={telemetry24h}
              onSelectAnomaly={handleSelectAnomalyAndNavigate}
            />
          )}

          {activeTab === 'spatial' && (
            <SpatialHeatmap
              floors={floors}
              selectedFloorId={selectedFloorId}
              setSelectedFloorId={setSelectedFloorId}
              onInvestigateAnomaly={handleSelectZoneAndInvestigate}
            />
          )}

          {activeTab === 'agents' && (
            <MultiAgentRoom
              agents={agents}
              anomalies={anomalies}
              selectedAnomaly={selectedAnomaly}
              setSelectedAnomaly={setSelectedAnomaly}
              telemetry={telemetry}
              onDispatchMitigation={handleDispatchMitigation}
            />
          )}

          {activeTab === 'simulator' && (
            <ScenarioSimulator
              telemetryData={telemetry24h}
              onApplyStrategyToBMS={handleApplyStrategyToBMS}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineMonitor
              streams={pipelineStreams}
            />
          )}
        </main>

        {/* Global Industrial Footer */}
        <footer className="mt-8 pt-4 border-t border-[#1f2937] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-gray-500 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">EnergyMind Industrial v4.2</span>
            <span className="hidden sm:inline text-gray-800">|</span>
            <span>Edge Ingestion: Synchronized</span>
            <span className="hidden sm:inline text-gray-800">|</span>
            <span className="text-cyan-400">Gemini 3.7 Flash Reasoning Core</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors uppercase tracking-wider"
            >
              Open Operations Copilot
            </button>
            <span className="text-gray-800">•</span>
            <span>Zero-Trust BACnet TLS</span>
          </div>
        </footer>

      </div>

      {/* AI Operations Copilot Modal */}
      <AgentCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        telemetry={telemetry}
      />

    </div>
  );
}

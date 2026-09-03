import React, { useState, useEffect } from 'react';
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
import { PortfolioESG } from './components/PortfolioESG';
import { mockPortfolioBuildings } from './data/portfolioData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<BuildingTelemetry>(mockTelemetry);
  const [telemetry24h, setTelemetry24h] = useState(mock24hTelemetry);
  const [floors, setFloors] = useState<FloorData[]>(mockFloors);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>(mockAnomalies);
  const [agents, setAgents] = useState(mockAgents);
  const [pipelineStreams, setPipelineStreams] = useState(mockPipelineStreams);
  const [portfolioBuildings, setPortfolioBuildings] = useState(mockPortfolioBuildings);
  const [selectedPortfolioBldgId, setSelectedPortfolioBldgId] = useState<string>(mockPortfolioBuildings[0].id);

  // Selected State
  const [selectedFloorId, setSelectedFloorId] = useState<string>(mockFloors[2].id);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(mockAnomalies[0]);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);

  // Live Telemetry Ingestion Engine (1.0s Interval when isLiveStream is active)
  useEffect(() => {
    if (!isLiveStream) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      const currentHour = now.getHours();

      let liveTotal = 1420;
      let liveSolar = 410;

      // 1. Update Core Building Telemetry
      setTelemetry((prev) => {
        // Dynamic oscillation for building total power load (+/- 3.5 kW)
        const loadJitter = (Math.random() - 0.48) * 5.5;
        const newTotal = Math.max(900, Math.min(1790, +(prev.totalPowerKw + loadJitter).toFixed(1)));
        liveTotal = newTotal;

        // Solar micro-fluctuation (+/- 1.8 kW)
        const solarJitter = (Math.random() - 0.5) * 2.8;
        const newSolar = Math.max(0, +(prev.solarPowerKw + solarJitter).toFixed(1));
        liveSolar = newSolar;

        // Battery state: if discharging, decrement SOC slightly
        let newBessSoc = prev.bessSocPercent;
        if (prev.bessPowerKw > 0) {
          newBessSoc = Math.max(10, +(prev.bessSocPercent - 0.015).toFixed(2));
        }

        // Ambient temperature & carbon micro-drift
        const tempDrift = (Math.random() - 0.5) * 0.08;
        const newOutdoorTemp = +(prev.outdoorTempC + tempDrift).toFixed(1);
        const carbonJitter = Math.floor((Math.random() - 0.5) * 3);
        const newCarbon = Math.max(140, Math.min(220, prev.carbonIntensityGPerKwh + carbonJitter));

        const newGrid = Math.max(0, +(newTotal - newSolar - (prev.bessPowerKw > 0 ? prev.bessPowerKw : 0)).toFixed(1));

        return {
          ...prev,
          timestamp: timeString,
          totalPowerKw: newTotal,
          solarPowerKw: newSolar,
          gridImportKw: newGrid,
          bessSocPercent: newBessSoc,
          outdoorTempC: newOutdoorTemp,
          carbonIntensityGPerKwh: newCarbon,
          currentPeakTodayKw: Math.max(prev.currentPeakTodayKw, newTotal),
        };
      });

      // 2. Update IoT Pipeline Streams & Live Sensor Registers
      setPipelineStreams((prevStreams) =>
        prevStreams.map((st) => {
          const packetJitter = Math.floor((Math.random() - 0.5) * 18);
          const newPackets = Math.max(80, st.packetsPerSecond + packetJitter);
          const latencyJitter = +((Math.random() - 0.5) * 0.3).toFixed(1);
          const newLatency = Math.max(1.5, +(st.latencyMs + latencyJitter).toFixed(1));

          // Jitter numerical sensor values in active registers
          const updatedSensors = st.sampleSensors.map((sensor) => {
            if (sensor.val.includes('°C')) {
              const num = parseFloat(sensor.val);
              const drift = (Math.random() - 0.5) * 0.15;
              return { ...sensor, val: `${(num + drift).toFixed(1)}°C` };
            }
            if (sensor.val.includes('GPM')) {
              const num = parseFloat(sensor.val);
              const drift = (Math.random() - 0.5) * 0.4;
              return { ...sensor, val: `${(num + drift).toFixed(1)} GPM` };
            }
            if (sensor.val.includes('kW')) {
              const num = parseFloat(sensor.val);
              const drift = (Math.random() - 0.5) * 0.8;
              return { ...sensor, val: `${(num + drift).toFixed(1)} kW` };
            }
            if (sensor.val.includes('Hz')) {
              const num = parseFloat(sensor.val);
              const drift = (Math.random() - 0.5) * 0.1;
              return { ...sensor, val: `${(num + drift).toFixed(1)} Hz` };
            }
            return sensor;
          });

          return {
            ...st,
            packetsPerSecond: newPackets,
            latencyMs: newLatency,
            lastIngestTime: timeString,
            sampleSensors: updatedSensors,
          };
        })
      );

      // 3. Thermal Zone Drift & Recalculated Floor Totals
      setFloors((prevFloors) =>
        prevFloors.map((fl) => {
          const updatedZones = fl.zones.map((z, idx) => {
            if (idx % 2 === 0) {
              const tempJitter = (Math.random() - 0.5) * 0.05;
              const newTemp = +(z.currentTempC + tempJitter).toFixed(1);
              const powerJitter = (Math.random() - 0.5) * 0.3;
              const currentLoad = z.currentLoadKw ?? (z.airflowCfm ? Math.round(z.airflowCfm / 35) : 30);
              const newLoad = Math.max(1, +(currentLoad + powerJitter).toFixed(1));
              return {
                ...z,
                currentTempC: newTemp,
                currentLoadKw: newLoad,
              };
            }
            return z;
          });

          const totalZoneLoad = updatedZones.reduce((sum, z) => sum + (z.currentLoadKw || 0), 0);
          const avgZoneTemp = +(updatedZones.reduce((sum, z) => sum + z.currentTempC, 0) / updatedZones.length).toFixed(1);

          return {
            ...fl,
            zones: updatedZones,
            totalLoadKw: totalZoneLoad > 0 ? +totalZoneLoad.toFixed(0) : fl.totalLoadKw,
            avgTempC: avgZoneTemp,
          };
        })
      );

      // 4. Update the Active 24-Hour Telemetry Point in Real Time
      setTelemetry24h((prev24h) =>
        prev24h.map((pt) => {
          // Update current hour or default hour 14
          if (pt.hour === 14 || pt.hour === currentHour) {
            return {
              ...pt,
              totalKw: liveTotal,
              solarKw: liveSolar,
              hvacKw: +(liveTotal * 0.48).toFixed(1),
              lightingKw: +(liveTotal * 0.18).toFixed(1),
              plugKw: +(liveTotal * 0.18).toFixed(1),
              dataCenterKw: +(liveTotal * 0.16).toFixed(1),
            };
          }
          return pt;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  // Quick BESS Dispatch Handler from Dashboard
  const handleQuickBessDispatch = () => {
    setTelemetry((prev) => ({
      ...prev,
      bessPowerKw: 160.0,
      totalPowerKw: Math.max(900, +(prev.totalPowerKw - 160).toFixed(1)),
      gridImportKw: Math.max(0, +(prev.gridImportKw - 160).toFixed(1)),
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
        isLiveStream={isLiveStream}
        setIsLiveStream={setIsLiveStream}
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

          {activeTab === 'portfolio' && (
            <PortfolioESG
              buildings={portfolioBuildings}
              selectedBuildingId={selectedPortfolioBldgId}
              onSelectBuilding={(id) => setSelectedPortfolioBldgId(id)}
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

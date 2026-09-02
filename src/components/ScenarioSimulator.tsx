import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SimulatorState, SimulatorResult, TelemetryPoint } from '../types';
import { calculateSimulation, defaultSimulatorState } from '../data/mockData';
import { 
  SlidersHorizontal, 
  Sparkles, 
  TrendingDown, 
  DollarSign, 
  Flame, 
  Zap, 
  BatteryCharging, 
  Wind, 
  CheckCircle2, 
  RefreshCw,
  Send,
  HelpCircle
} from 'lucide-react';

interface ScenarioSimulatorProps {
  telemetryData: TelemetryPoint[];
  onApplyStrategyToBMS?: (state: SimulatorState) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  telemetryData,
  onApplyStrategyToBMS,
}) => {
  const [simState, setSimState] = useState<SimulatorState>(defaultSimulatorState);
  const [isAiOptimizing, setIsAiOptimizing] = useState<boolean>(false);
  const [aiOptimizedPlan, setAiOptimizedPlan] = useState<any | null>(null);
  const [isApplied, setIsApplied] = useState<boolean>(false);

  // Recalculate simulation physics in real-time
  const result: SimulatorResult = calculateSimulation(simState, telemetryData);

  const handleAiOptimize = async () => {
    setIsAiOptimizing(true);
    try {
      const response = await fetch('/api/gemini/optimize-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSettings: simState,
          weatherForecast: { ambientHigh: 33.5, wetBulb: 24.8, humidity: 65 },
          tariffStructure: { offPeak: 0.08, midPeak: 0.22, criticalPeak: 0.38, demandChargePerKw: 18.50 },
        }),
      });

      const data = await response.json();
      if (data.success && data.optimizedPlan) {
        setAiOptimizedPlan(data.optimizedPlan);
        // Apply optimized values to sliders
        setSimState((prev) => ({
          ...prev,
          chilledWaterSetpointC: data.optimizedPlan.recommendedChilledWaterTemp || 7.8,
          bessDischargeRateKw: data.optimizedPlan.recommendedBessDischargeRateKw || 280,
          ventilationSetbackPercent: data.optimizedPlan.ventilationSetbackPercentage || 22,
        }));
      }
    } catch (err) {
      console.error('Failed to optimize scenario:', err);
    } finally {
      setIsAiOptimizing(false);
    }
  };

  const handleApplyToBuilding = () => {
    setIsApplied(true);
    if (onApplyStrategyToBMS) onApplyStrategyToBMS(simState);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'],
    });

    setTimeout(() => setIsApplied(false), 4000);
  };

  // SVG Chart parameters for Before vs After
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxKw = Math.max(...result.simulatedLoadCurve.map((d) => Math.max(d.originalKw, d.simulatedKw)), 1800);
  const minKw = 0;

  const getY = (val: number) => {
    return padding.top + graphHeight - ((val - minKw) / (maxKw - minKw)) * graphHeight;
  };

  const generateLine = (key: 'originalKw' | 'simulatedKw') => {
    return result.simulatedLoadCurve.reduce((acc, curr, idx) => {
      const x = padding.left + (idx / (result.simulatedLoadCurve.length - 1)) * graphWidth;
      const y = getY(curr[key]);
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <span>What-If Thermodynamic & Financial Simulator</span>
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
              Real-Time Physics Engine
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Simulate setpoint adjustments, pre-cooling shifts, and BESS discharge to calculate exact demand charge savings and carbon offsets.
          </p>
        </div>

        {/* AI Optimize Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimState(defaultSimulatorState)}
            className="px-3 py-2 text-xs font-semibold rounded bg-[#141414] hover:bg-[#1f1f1f] text-gray-300 border border-[#1f2937] flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>

          <button
            onClick={handleAiOptimize}
            disabled={isAiOptimizing}
            className="flex items-center gap-2 px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider border border-purple-400/30 transition-all disabled:opacity-50"
          >
            {isAiOptimizing ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>
                <span>Calculating Physics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                <span>AI Auto-Optimize with Gemini</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Impact Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Monthly Cost Savings */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Monthly Cost Reduction</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ${result.monthlyCostSavings.toLocaleString()}
              <span className="text-xs text-gray-500 font-normal">/mo</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
              From ${result.monthlyCostBefore.toLocaleString()} → ${result.monthlyCostAfter.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Peak Demand Shaved */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Peak Demand Shaved</span>
            <TrendingDown className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-cyan-400 font-mono">
              -{result.peakKwShaved}
              <span className="text-xs text-gray-500 font-normal"> kW</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
              Peak: {result.peakKwBefore} kW → {result.peakKwAfter} kW
            </div>
          </div>
        </div>

        {/* Annual MWh Saved */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Annual Energy Saved</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {result.annualMwhSaved}
              <span className="text-xs text-gray-500 font-normal"> MWh/yr</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
              Equivalent to ~320 homes
            </div>
          </div>
        </div>

        {/* Carbon Offset */}
        <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400">
            <span>Carbon Avoidance</span>
            <Flame className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-teal-400 font-mono">
              -{result.annualCarbonSavedTonnes}
              <span className="text-xs text-gray-500 font-normal"> t CO2e/yr</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
              Scope 2 emissions reduction
            </div>
          </div>
        </div>

      </div>

      {/* Main Simulator Split (Sliders on Left, Comparison Curve on Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Col (5 Cols): Parameter Sliders */}
        <div className="xl:col-span-5 bg-[#0d0d0d] border border-[#1f2937] rounded p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
            <h3 className="text-sm font-bold text-white">Simulation Parameters</h3>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Interactive Controls</span>
          </div>

          {/* Slider 1: Chilled Water Supply Temp */}
          <div className="space-y-1.5 bg-[#050505] p-3 rounded border border-[#1f2937]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-medium">Chilled Water Supply (CHWST)</span>
              <span className="text-cyan-400 font-bold">{simState.chilledWaterSetpointC}°C</span>
            </div>
            <input
              type="range"
              min="6.0"
              max="9.0"
              step="0.1"
              value={simState.chilledWaterSetpointC}
              onChange={(e) => setSimState({ ...simState, chilledWaterSetpointC: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-[#1f2937] rounded"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>6.0°C (High Lift)</span>
              <span>Baseline: 6.5°C</span>
              <span>9.0°C (Max Efficiency)</span>
            </div>
          </div>

          {/* Slider 2: Pre-Cooling Shift */}
          <div className="space-y-1.5 bg-[#050505] p-3 rounded border border-[#1f2937]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-medium">Morning Pre-Cooling Window</span>
              <span className="text-purple-400 font-bold">
                0{simState.preCoolingStartHour}:00 - 0{simState.preCoolingStartHour + 3}:00
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="6"
              step="1"
              value={simState.preCoolingStartHour}
              onChange={(e) => setSimState({ ...simState, preCoolingStartHour: parseInt(e.target.value) })}
              className="w-full accent-purple-400 cursor-pointer h-1.5 bg-[#1f2937] rounded"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>03:00 ($0.08/kWh)</span>
              <span>04:30</span>
              <span>06:00 ($0.15/kWh)</span>
            </div>
          </div>

          {/* Slider 3: BESS Peak Shaving Rate */}
          <div className="space-y-1.5 bg-[#050505] p-3 rounded border border-[#1f2937]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-medium">BESS Battery Discharge Rate</span>
              <span className="text-emerald-400 font-bold">{simState.bessDischargeRateKw} kW</span>
            </div>
            <input
              type="range"
              min="0"
              max="400"
              step="20"
              value={simState.bessDischargeRateKw}
              onChange={(e) => setSimState({ ...simState, bessDischargeRateKw: parseInt(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#1f2937] rounded"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0 kW (Off)</span>
              <span>200 kW</span>
              <span>400 kW (Max Inverter)</span>
            </div>
          </div>

          {/* Slider 4: Ventilation Setback */}
          <div className="space-y-1.5 bg-[#050505] p-3 rounded border border-[#1f2937]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-medium">Demand-Controlled Ventilation (DCV)</span>
              <span className="text-amber-400 font-bold">{simState.ventilationSetbackPercent}% Setback</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={simState.ventilationSetbackPercent}
              onChange={(e) => setSimState({ ...simState, ventilationSetbackPercent: parseInt(e.target.value) })}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-[#1f2937] rounded"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0% (Full Airflow)</span>
              <span>20% (ASHRAE Std)</span>
              <span>40% (Aggressive DCV)</span>
            </div>
          </div>

          {/* Slider 5: Automated Demand Response Target */}
          <div className="space-y-1.5 bg-[#050505] p-3 rounded border border-[#1f2937]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-medium">Demand Response Grid Shed (15:00-17:00)</span>
              <span className="text-rose-400 font-bold">{simState.demandResponseReductionTargetPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={simState.demandResponseReductionTargetPercent}
              onChange={(e) => setSimState({ ...simState, demandResponseReductionTargetPercent: parseInt(e.target.value) })}
              className="w-full accent-rose-400 cursor-pointer h-1.5 bg-[#1f2937] rounded"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>0% (Normal)</span>
              <span>15% (Stage 1)</span>
              <span>30% (Critical Grid Alert)</span>
            </div>
          </div>

          {/* Deploy Strategy Button */}
          <button
            onClick={handleApplyToBuilding}
            disabled={isApplied}
            className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              isApplied
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Strategy Pushed to BACnet Server!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Apply Strategy to Building BMS Controllers</span>
              </>
            )}
          </button>
        </div>

        {/* Right Col (7 Cols): Comparison Load Curves & AI Optimization Plan */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Comparison Load Curve Chart */}
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3 mb-3">
              <h3 className="text-sm font-bold text-white">Load Curve Comparison: Before vs. After Strategy</h3>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2.5 h-1 rounded-full bg-gray-500"></span>
                  <span>Original Baseline</span>
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="w-2.5 h-1 rounded-full bg-cyan-400"></span>
                  <span>Simulated Strategy</span>
                </span>
              </div>
            </div>

            {/* SVG Comparison Curve */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none"
                style={{ minWidth: '600px' }}
              >
                {/* Background Grid Lines */}
                {[0, 400, 800, 1200, 1600].map((tick) => {
                  const y = getY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="#1f2937"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fill="#6b7280"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {tick}kW
                      </text>
                    </g>
                  );
                })}

                {/* Peak Period Shading */}
                <rect
                  x={padding.left + (14 / 23) * graphWidth}
                  y={padding.top}
                  width={(4 / 23) * graphWidth}
                  height={graphHeight}
                  fill="#7c3aed"
                  fillOpacity="0.08"
                />

                {/* Original Curve (Grey Line) */}
                <path
                  d={generateLine('originalKw')}
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* Simulated Curve (Cyan Line) */}
                <path
                  d={generateLine('simulatedKw')}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* X-Axis Hour Labels */}
                {result.simulatedLoadCurve.map((pt, idx) => {
                  if (idx % 3 !== 0) return null;
                  const x = padding.left + (idx / (result.simulatedLoadCurve.length - 1)) * graphWidth;
                  return (
                    <g key={pt.hour}>
                      <line
                        x1={x}
                        y1={svgHeight - padding.bottom}
                        x2={x}
                        y2={svgHeight - padding.bottom + 5}
                        stroke="#1f2937"
                      />
                      <text
                        x={x}
                        y={svgHeight - padding.bottom + 18}
                        textAnchor="middle"
                        fill="#9ca3af"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {pt.timeLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="mt-2 text-[11px] font-mono text-gray-500 text-center">
              Shaded peak window (14:00 - 18:00) highlights BESS discharge and chiller setpoint float impact.
            </div>
          </div>

          {/* AI Optimizer Thermodynamic Insight Card */}
          {aiOptimizedPlan && (
            <div className="bg-[#10081c] border border-purple-800/60 rounded p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-bold font-mono">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI OPTIMIZER THERMODYNAMIC EXPLANATION</span>
              </div>
              <h4 className="text-sm font-bold text-white">{aiOptimizedPlan.name}</h4>
              <p className="text-xs text-purple-200 leading-relaxed">
                {aiOptimizedPlan.thermodynamicExplanation}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                <div className="text-gray-300">
                  Optimal Pre-Cool: <span className="text-purple-300 font-bold">{aiOptimizedPlan.recommendedPreCoolWindow}</span>
                </div>
                <div className="text-gray-300">
                  Optimal BESS Window: <span className="text-emerald-400 font-bold">{aiOptimizedPlan.recommendedBessDischargeWindow}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

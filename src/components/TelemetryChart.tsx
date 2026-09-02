import React, { useState } from 'react';
import { TelemetryPoint, AnomalyEvent } from '../types';
import { 
  LineChart, 
  Activity, 
  Sun, 
  Flame, 
  BatteryCharging, 
  Zap, 
  Info, 
  AlertTriangle, 
  ZoomIn, 
  Eye, 
  Filter,
  DollarSign
} from 'lucide-react';

interface TelemetryChartProps {
  telemetryData: TelemetryPoint[];
  onSelectAnomaly?: (anomaly: any) => void;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  telemetryData,
  onSelectAnomaly,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(14); // default scrubber at 14:00
  const [activeSeries, setActiveSeries] = useState<{
    total: boolean;
    baseline: boolean;
    predicted: boolean;
    solar: boolean;
    bess: boolean;
    hvac: boolean;
    lighting: boolean;
    dataCenter: boolean;
  }>({
    total: true,
    baseline: true,
    predicted: true,
    solar: true,
    bess: true,
    hvac: false,
    lighting: false,
    dataCenter: false,
  });

  const [timeFilter, setTimeFilter] = useState<'24H' | 'PEAK' | 'SOLAR'>('24H');
  const [viewMetric, setViewMetric] = useState<'KW' | 'COST' | 'CARBON'>('KW');

  // Filter points based on selected time window
  const displayedPoints = telemetryData.filter((p) => {
    if (timeFilter === 'PEAK') return p.hour >= 12 && p.hour <= 20;
    if (timeFilter === 'SOLAR') return p.hour >= 6 && p.hour <= 19;
    return true;
  });

  const maxVal = Math.max(
    ...telemetryData.map((d) => Math.max(d.totalKw, d.baselineKw, d.predictedKw, d.solarKw + 400)),
    1950
  );
  const minVal = 0;

  // Chart dimensions in SVG coordinates
  const svgWidth = 1000;
  const svgHeight = 420;
  const padding = { top: 30, right: 30, bottom: 50, left: 65 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const getX = (hour: number, totalPointsCount: number) => {
    const idx = displayedPoints.findIndex((p) => p.hour === hour);
    if (idx === -1) return padding.left;
    return padding.left + (idx / (displayedPoints.length - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding.top + graphHeight - ((clamped - minVal) / (maxVal - minVal)) * graphHeight;
  };

  // Generate SVG Path for series
  const generatePath = (valExtractor: (p: TelemetryPoint) => number) => {
    if (displayedPoints.length === 0) return '';
    return displayedPoints.reduce((acc, curr, idx) => {
      const x = padding.left + (idx / (displayedPoints.length - 1)) * graphWidth;
      const y = getY(valExtractor(curr));
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  // Area Path for Solar or Load
  const generateAreaPath = (valExtractor: (p: TelemetryPoint) => number) => {
    if (displayedPoints.length === 0) return '';
    const line = generatePath(valExtractor);
    const lastX = padding.left + graphWidth;
    const firstX = padding.left;
    const bottomY = getY(0);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const currentPoint = telemetryData.find((p) => p.hour === (hoveredHour ?? 14)) || telemetryData[14];

  // Contract Limit Line Y
  const contractLimitKw = 1850;
  const contractLimitY = getY(contractLimitKw);

  return (
    <div className="space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-3.5">
        
        {/* Metric Selector & Time Range */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#050505] p-1 rounded border border-[#1f2937]">
            <button
              onClick={() => setViewMetric('KW')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMetric === 'KW' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              Power Demand (kW)
            </button>
            <button
              onClick={() => setViewMetric('COST')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMetric === 'COST' ? 'bg-purple-950/60 text-purple-300 border border-purple-800/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              TOU Cost ($/hr)
            </button>
            <button
              onClick={() => setViewMetric('CARBON')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                viewMetric === 'CARBON' ? 'bg-teal-950/60 text-teal-300 border border-teal-800/50' : 'text-gray-400 hover:text-white'
              }`}
            >
              Carbon Intensity
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#1f2937] hidden sm:block"></div>

          {/* Time Window Filters */}
          <div className="flex items-center bg-[#050505] p-1 rounded border border-[#1f2937]">
            <button
              onClick={() => setTimeFilter('24H')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                timeFilter === '24H' ? 'bg-[#1f2937] text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              24h Horizon
            </button>
            <button
              onClick={() => setTimeFilter('PEAK')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                timeFilter === 'PEAK' ? 'bg-rose-950/60 text-rose-300 border border-rose-900/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Peak Window (12-20h)
            </button>
            <button
              onClick={() => setTimeFilter('SOLAR')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                timeFilter === 'SOLAR' ? 'bg-amber-950/60 text-amber-300 border border-amber-900/50' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Solar Daylight (06-19h)
            </button>
          </div>
        </div>

        {/* Series Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setActiveSeries((s) => ({ ...s, total: !s.total }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              activeSeries.total 
                ? 'bg-cyan-950/30 border-cyan-800/60 text-cyan-400' 
                : 'bg-[#050505] border-[#1f2937] text-gray-600 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-1 rounded-full bg-cyan-400"></span>
            <span>Total Load</span>
          </button>

          <button
            onClick={() => setActiveSeries((s) => ({ ...s, predicted: !s.predicted }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              activeSeries.predicted 
                ? 'bg-blue-950/30 border-blue-800/60 text-blue-300' 
                : 'bg-[#050505] border-[#1f2937] text-gray-600 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-1 rounded-full bg-blue-400 border border-dashed border-blue-200"></span>
            <span>AI Target</span>
          </button>

          <button
            onClick={() => setActiveSeries((s) => ({ ...s, solar: !s.solar }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              activeSeries.solar 
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-400' 
                : 'bg-[#050505] border-[#1f2937] text-gray-600 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-1 rounded-full bg-amber-400"></span>
            <span>Solar PV</span>
          </button>

          <button
            onClick={() => setActiveSeries((s) => ({ ...s, bess: !s.bess }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              activeSeries.bess 
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400' 
                : 'bg-[#050505] border-[#1f2937] text-gray-600 line-through opacity-60'
            }`}
          >
            <span className="w-2.5 h-1 rounded-full bg-emerald-400"></span>
            <span>BESS Battery</span>
          </button>

          <button
            onClick={() => setActiveSeries((s) => ({ ...s, hvac: !s.hvac }))}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
              activeSeries.hvac 
                ? 'bg-indigo-950/30 border-indigo-800/60 text-indigo-300' 
                : 'bg-[#050505] border-[#1f2937] text-gray-600 opacity-60'
            }`}
          >
            <span className="w-2.5 h-1 rounded-full bg-indigo-400"></span>
            <span>HVAC Sub-load</span>
          </button>
        </div>

      </div>

      {/* Main Interactive SVG Chart Container */}
      <div className="relative bg-[#0d0d0d] border border-[#1f2937] rounded p-4 overflow-hidden">
        
        {/* Peak Demand Alert Banner */}
        <div className="flex items-center justify-between text-xs font-mono text-gray-500 border-b border-[#1f2937] pb-3 mb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-gray-300 font-semibold uppercase tracking-wider">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Interval: 15-Min Synchronous</span>
            </span>
            <span className="hidden md:inline text-gray-700">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Peak Anomaly at 14:00 (1,680 kW vs 1,540 kW Baseline)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 uppercase tracking-wider">Contract Limit:</span>
            <span className="px-2 py-0.5 rounded bg-rose-950/50 text-rose-300 border border-rose-900/50 font-bold">
              1,850 kW
            </span>
          </div>
        </div>

        {/* SVG Graphic Canvas */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto select-none overflow-visible"
            style={{ minWidth: '700px' }}
          >
            <defs>
              {/* Solar Gradient Fill */}
              <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>

              {/* Total Load Area Gradient */}
              <linearGradient id="totalLoadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
              </linearGradient>

              {/* Anomaly Pattern Hatch */}
              <pattern id="anomalyHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.3" />
              </pattern>
            </defs>

            {/* Background Grid Lines (Y-Axis) */}
            {[0, 400, 800, 1200, 1600, 2000].map((tick) => {
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
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="#6b7280"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {tick} kW
                  </text>
                </g>
              );
            })}

            {/* Peak TOU Window Shading (14:00 - 18:00) */}
            {displayedPoints.some((p) => p.hour >= 14 && p.hour <= 18) && (
              <g>
                <rect
                  x={getX(14, displayedPoints.length)}
                  y={padding.top}
                  width={getX(18, displayedPoints.length) - getX(14, displayedPoints.length)}
                  height={graphHeight}
                  fill="#7c3aed"
                  fillOpacity="0.08"
                />
                <text
                  x={getX(14, displayedPoints.length) + 8}
                  y={padding.top + 16}
                  fill="#c084fc"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ⚡ CRITICAL PEAK TOU ($0.38/kWh)
                </text>
              </g>
            )}

            {/* Anomaly Highlight Bands */}
            {displayedPoints.map((pt) => {
              if (!pt.anomaly) return null;
              const xPos = getX(pt.hour, displayedPoints.length);
              const bandWidth = graphWidth / displayedPoints.length;
              return (
                <g
                  key={pt.anomaly.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectAnomaly && onSelectAnomaly(pt.anomaly)}
                >
                  <rect
                    x={xPos - bandWidth / 2}
                    y={padding.top}
                    width={bandWidth}
                    height={graphHeight}
                    fill="url(#anomalyHatch)"
                    className="transition-opacity hover:opacity-100 opacity-60"
                  />
                  <rect
                    x={xPos - bandWidth / 2}
                    y={padding.top}
                    width={bandWidth}
                    height={3}
                    fill="#ef4444"
                  />
                  <circle
                    cx={xPos}
                    cy={getY(pt.totalKw)}
                    r="5"
                    fill="#ef4444"
                    stroke="#fee2e2"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                </g>
              );
            })}

            {/* Contract Limit Line */}
            <line
              x1={padding.left}
              y1={contractLimitY}
              x2={svgWidth - padding.right}
              y2={contractLimitY}
              stroke="#ef4444"
              strokeDasharray="6 4"
              strokeWidth="1.5"
            />
            <text
              x={svgWidth - padding.right - 8}
              y={contractLimitY - 6}
              textAnchor="end"
              fill="#ef4444"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
            >
              CONTRACT PEAK LIMIT: 1,850 kW
            </text>

            {/* Solar PV Area & Line */}
            {activeSeries.solar && (
              <g>
                <path d={generateAreaPath((p) => p.solarKw)} fill="url(#solarGradient)" />
                <path
                  d={generatePath((p) => p.solarKw)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* HVAC Sub-load */}
            {activeSeries.hvac && (
              <path
                d={generatePath((p) => p.hvacKw)}
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Baseline Curve */}
            {activeSeries.baseline && (
              <path
                d={generatePath((p) => p.baselineKw)}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* AI Predicted Target */}
            {activeSeries.predicted && (
              <path
                d={generatePath((p) => p.predictedKw)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
            )}

            {/* BESS Battery Discharge Curve */}
            {activeSeries.bess && (
              <path
                d={generatePath((p) => Math.max(0, p.bessKw * 3))} // scale for visualization
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            )}

            {/* Total Load Area & Main Path */}
            {activeSeries.total && (
              <g>
                <path d={generateAreaPath((p) => p.totalKw)} fill="url(#totalLoadGradient)" />
                <path
                  d={generatePath((p) => p.totalKw)}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* X-Axis Hour Labels & Ticks */}
            {displayedPoints.map((pt, idx) => {
              const x = padding.left + (idx / (displayedPoints.length - 1)) * graphWidth;
              const isHovered = pt.hour === hoveredHour;
              return (
                <g key={pt.hour}>
                  <line
                    x1={x}
                    y1={svgHeight - padding.bottom}
                    x2={x}
                    y2={svgHeight - padding.bottom + 6}
                    stroke={isHovered ? '#06b6d4' : '#1f2937'}
                    strokeWidth={isHovered ? '2' : '1'}
                  />
                  <text
                    x={x}
                    y={svgHeight - padding.bottom + 20}
                    textAnchor="middle"
                    fill={isHovered ? '#38bdf8' : pt.isPeakPeriod ? '#c084fc' : '#6b7280'}
                    fontSize="11"
                    fontWeight={isHovered || pt.isPeakPeriod ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    {pt.timeLabel}
                  </text>
                </g>
              );
            })}

            {/* Vertical Interactive Scrubber Line */}
            {hoveredHour !== null && (
              <g>
                <line
                  x1={getX(hoveredHour, displayedPoints.length)}
                  y1={padding.top}
                  x2={getX(hoveredHour, displayedPoints.length)}
                  y2={svgHeight - padding.bottom}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(hoveredHour, displayedPoints.length)}
                  cy={getY(currentPoint.totalKw)}
                  r="5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Invisible Hover Rectangles for scrubbing */}
            {displayedPoints.map((pt, idx) => {
              const x = padding.left + (idx / (displayedPoints.length - 1)) * graphWidth;
              const width = graphWidth / displayedPoints.length;
              return (
                <rect
                  key={pt.hour}
                  x={x - width / 2}
                  y={padding.top}
                  width={width}
                  height={graphHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredHour(pt.hour)}
                />
              );
            })}
          </svg>
        </div>

        {/* Dynamic Telemetry Scrubber Detail Card */}
        {currentPoint && (
          <div className="mt-4 p-3.5 bg-[#050505] border border-[#1f2937] rounded grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="border-l-2 border-cyan-500 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">Timestamp / Window</div>
              <div className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <span>{currentPoint.timeLabel}</span>
                {currentPoint.isPeakPeriod && (
                  <span className="text-[9px] px-1 bg-purple-950/80 text-purple-300 rounded font-semibold border border-purple-800/40">Peak</span>
                )}
              </div>
            </div>

            <div className="border-l-2 border-cyan-400 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">Total Load Demand</div>
              <div className="text-sm font-bold text-white font-mono">
                {currentPoint.totalKw} kW
              </div>
            </div>

            <div className="border-l-2 border-amber-500 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">Solar PV Output</div>
              <div className="text-sm font-bold text-amber-400 font-mono">
                {currentPoint.solarKw} kW
              </div>
            </div>

            <div className="border-l-2 border-emerald-500 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">BESS Battery Dispatch</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {currentPoint.bessKw > 0 ? `+${currentPoint.bessKw} kW (Discharge)` : currentPoint.bessKw < 0 ? `${currentPoint.bessKw} kW (Charge)` : '0 kW (Idle)'}
              </div>
            </div>

            <div className="border-l-2 border-purple-500 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">Tariff Rate</div>
              <div className="text-sm font-bold text-purple-300 font-mono">
                ${currentPoint.tariffPerKwh.toFixed(2)}/kWh
              </div>
            </div>

            <div className="border-l-2 border-gray-700 pl-2.5">
              <div className="text-[10px] uppercase font-mono text-gray-500 font-bold">Sub-meter Breakdown</div>
              <div className="text-[11px] text-gray-400 font-mono">
                HVAC: {currentPoint.hvacKw}kW | Lights: {currentPoint.lightingKw}kW
              </div>
            </div>

          </div>
        )}

        {/* Anomaly Inspection Callout if current hovered point has anomaly */}
        {currentPoint?.anomaly && (
          <div 
            onClick={() => onSelectAnomaly && onSelectAnomaly(currentPoint.anomaly)}
            className="mt-3 p-3 rounded bg-rose-950/30 border border-rose-900/50 flex items-center justify-between cursor-pointer hover:bg-rose-950/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-rose-950 text-rose-300 border border-rose-900/60">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300 font-mono uppercase">
                    [{currentPoint.anomaly.severity} ANOMALY DETECTED]
                  </span>
                  <span className="text-xs font-medium text-white">{currentPoint.anomaly.title}</span>
                </div>
                <div className="text-xs text-rose-400/80">
                  Excess Power Draw: +{currentPoint.anomaly.excessKw} kW • Flagged by Agent {currentPoint.anomaly.agent}
                </div>
              </div>
            </div>

            <button className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded bg-rose-700 hover:bg-rose-600 text-white shadow transition-all">
              Investigate with Agent Swarm →
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

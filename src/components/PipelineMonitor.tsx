import React, { useState } from 'react';
import { PipelineStream } from '../types';
import { 
  Radio, 
  Activity, 
  Wifi, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search, 
  Server,
  Zap,
  Filter
} from 'lucide-react';

interface PipelineMonitorProps {
  streams: PipelineStream[];
}

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({ streams }) => {
  const [selectedStreamId, setSelectedStreamId] = useState<string>(streams[0].id);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const totalPackets = streams.reduce((acc, s) => acc + s.packetsPerSecond, 0);
  const totalDevices = streams.reduce((acc, s) => acc + s.deviceCount, 0);
  const avgLatency = (streams.reduce((acc, s) => acc + s.latencyMs, 0) / streams.length).toFixed(1);

  const activeStream = streams.find((s) => s.id === selectedStreamId) || streams[0];

  const filteredSensors = activeStream.sampleSensors.filter(
    (s) =>
      s.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.metric.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#0a0a0a] border border-[#1f2937] rounded p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">IoT Telemetry Pipeline & Protocol Bus</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                All 5 Gateways Operational
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Low-latency edge ingestion pipeline polling BACnet MS/TP, Modbus TCP, MQTT Sparkplug B, LoRaWAN, and DALI buses.
            </p>
          </div>
        </div>

        {/* Global Pipeline KPIs */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Total Ingest</span>
            <span className="text-cyan-400 font-bold">{totalPackets.toLocaleString()} msgs/s</span>
          </div>
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Connected Devices</span>
            <span className="text-emerald-400 font-bold">{totalDevices} Nodes</span>
          </div>
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Avg Latency</span>
            <span className="text-purple-400 font-bold">{avgLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Protocol Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {streams.map((stream) => {
          const isSelected = stream.id === selectedStreamId;
          return (
            <div
              key={stream.id}
              onClick={() => setSelectedStreamId(stream.id)}
              className={`p-3.5 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#141414] border-emerald-500/80 ring-1 ring-emerald-500/50'
                  : 'bg-[#0d0d0d] border-[#1f2937] hover:border-gray-700 hover:bg-[#111111]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-gray-400 font-semibold uppercase">
                    {stream.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">{stream.protocol}</h4>
                <div className="text-[11px] font-mono text-emerald-400 font-bold mt-1">
                  {stream.packetsPerSecond.toLocaleString()} msgs/sec
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#1f2937] grid grid-cols-2 gap-1 text-[10px] font-mono text-gray-400">
                <div>
                  <span className="text-gray-500 block">Nodes:</span>
                  <span className="text-gray-200">{stream.deviceCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Latency:</span>
                  <span className="text-cyan-400">{stream.latencyMs}ms</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stream Deep-Dive & Sensor Inventory */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Col (8 Cols): Sensor Tag Heartbeat Table */}
        <div className="xl:col-span-8 bg-[#0d0d0d] border border-[#1f2937] rounded p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1f2937] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeStream.protocol} Live Sensor Register</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Active BACnet Object IDs & Modbus 40000 registers updated at 100ms polling rate.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter sensor tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#050505] border border-[#1f2937] text-xs font-mono text-gray-200 pl-8 pr-3 py-1.5 rounded focus:outline-none focus:border-cyan-500 w-48"
              />
            </div>
          </div>

          {/* Sensor Register Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-500 text-[10px] uppercase font-bold">
                  <th className="py-2 px-3">Sensor Tag ID</th>
                  <th className="py-2 px-3">Telemetry Metric</th>
                  <th className="py-2 px-3">Current Telemetry</th>
                  <th className="py-2 px-3">Data Quality</th>
                  <th className="py-2 px-3 text-right">Last Ingest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937] text-gray-300">
                {filteredSensors.map((sensor, idx) => (
                  <tr key={idx} className="hover:bg-[#141414] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{sensor.tag}</td>
                    <td className="py-2.5 px-3 text-gray-200">{sensor.metric}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{sensor.val}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sensor.quality === 'GOOD' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      }`}>
                        {sensor.quality}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 text-[11px]">
                      {activeStream.lastIngestTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col (4 Cols): Edge Gateway Diagnostic Info */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1f2937] rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Edge Gateway Status</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
                ONLINE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937] flex justify-between">
                <span className="text-gray-400">Gateway Hardware:</span>
                <span className="text-white font-bold">Advantech UNO-2484G</span>
              </div>

              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937] flex justify-between">
                <span className="text-gray-400">Packet Loss Rate:</span>
                <span className="text-emerald-400 font-bold">{activeStream.packetLossPercent}%</span>
              </div>

              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937] flex justify-between">
                <span className="text-gray-400">Buffer Queue Depth:</span>
                <span className="text-cyan-400 font-bold">0.02% (Normal)</span>
              </div>

              <div className="bg-[#050505] p-2.5 rounded border border-[#1f2937] flex justify-between">
                <span className="text-gray-400">MQTT TLS Cipher:</span>
                <span className="text-gray-300">ECDHE-RSA-AES256-GCM</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1f2937] text-[11px] font-mono text-gray-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>NTP Stratum 1 Time Synchronized</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

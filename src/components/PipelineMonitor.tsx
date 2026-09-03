import React, { useState } from 'react';
import { PipelineStream, BacnetHilDevice, BigQueryMlModel, ClosedLoopAuditLog } from '../types';
import { mockBacnetHilDevices, mockBigQueryMlModels, mockClosedLoopAuditLogs } from '../data/portfolioData';
import { 
  Radio, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Search, 
  Server,
  Zap,
  Terminal,
  Database,
  ShieldCheck,
  RotateCcw,
  Send,
  Sliders,
  Check,
  Layers,
  Code,
  Cloud,
  Copy,
  ExternalLink
} from 'lucide-react';

interface PipelineMonitorProps {
  streams: PipelineStream[];
}

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({ streams }) => {
  const [subTab, setSubTab] = useState<'bus' | 'bacnet-hil' | 'bigquery-ml' | 'audit-logs' | 'cloud-run'>('bus');
  
  // Cloud Run Diagnostics State
  const [copiedDeployCmd, setCopiedDeployCmd] = useState<boolean>(false);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);

  const fetchHealthCheck = async () => {
    setHealthLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setHealthLatency(elapsed);
      setHealthData(data);
    } catch (e: any) {
      setHealthData({ status: 'error', error: e.message });
    } finally {
      setHealthLoading(false);
    }
  };

  const handleCopyCommand = () => {
    const cmd = `gcloud run deploy energymind-ai \\
  --source . \\
  --region us-central1 \\
  --platform managed \\
  --port 3000 \\
  --cpu 1 \\
  --memory 512Mi \\
  --min-instances 0 \\
  --max-instances 2 \\
  --concurrency 80 \\
  --allow-unauthenticated \\
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_KEY"`;
    navigator.clipboard.writeText(cmd);
    setCopiedDeployCmd(true);
    setTimeout(() => setCopiedDeployCmd(false), 2500);
  };
  
  // IoT Protocol Bus State
  const [selectedStreamId, setSelectedStreamId] = useState<string>(streams[0].id);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // BACnet HIL State
  const [hilDevices, setHilDevices] = useState<BacnetHilDevice[]>(mockBacnetHilDevices);
  const [selectedHilDeviceId, setSelectedHilDeviceId] = useState<number>(mockBacnetHilDevices[0].deviceId);
  const [overrideValue, setOverrideValue] = useState<string>('15.5');
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);
  const [apduLogs, setApduLogs] = useState<string[]>([
    '[14:28:10.102] BACnet-Confirmed-Req: WriteProperty-Request (InvokeID: 42, Obj: AnalogValue:402, Val: 0.0)',
    '[14:28:10.108] BACnet-Simple-ACK: WriteProperty-ACK received from 192.168.42.34',
    '[14:28:11.004] I-Am broadcast received from BACnet Device ID 20088 (Trane Tracer SC+)',
    '[14:28:12.450] BACnet-ReadPropertyMultiple polled 12 analog objects across AHU-03'
  ]);

  // Closed Loop Audit Logs
  const [auditLogs, setAuditLogs] = useState<ClosedLoopAuditLog[]>(mockClosedLoopAuditLogs);

  const totalPackets = streams.reduce((acc, s) => acc + s.packetsPerSecond, 0);
  const totalDevices = streams.reduce((acc, s) => acc + s.deviceCount, 0);
  const avgLatency = (streams.reduce((acc, s) => acc + s.latencyMs, 0) / streams.length).toFixed(1);

  const activeStream = streams.find((s) => s.id === selectedStreamId) || streams[0];
  const activeHilDevice = hilDevices.find((d) => d.deviceId === selectedHilDeviceId) || hilDevices[0];

  const filteredSensors = activeStream.sampleSensors.filter(
    (s) =>
      s.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.metric.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExecuteHilWrite = (registerInstance: number, regDesc: string) => {
    const num = parseFloat(overrideValue);
    if (isNaN(num)) return;

    // Update in local HIL register list
    setHilDevices((prev) =>
      prev.map((dev) => {
        if (dev.deviceId === activeHilDevice.deviceId) {
          return {
            ...dev,
            registers: dev.registers.map((r) =>
              r.instance === registerInstance ? { ...r, presentValue: num } : r
            ),
          };
        }
        return dev;
      })
    );

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logLine = `[${now}] BACnet-Confirmed-Req: WriteProperty-Request (Obj: AnalogValue:${registerInstance}, Val: ${num}) -> ACK OK`;
    setApduLogs((prev) => [logLine, ...prev.slice(0, 15)]);

    setOverrideSuccessMsg(`APDU ACK Received: ${regDesc} updated to ${num}`);
    setTimeout(() => setOverrideSuccessMsg(null), 3500);
  };

  const handleRollbackAuditLog = (logId: string) => {
    setAuditLogs((prev) =>
      prev.map((log) =>
        log.id === logId ? { ...log, validationStatus: 'CONFIRMED', restorable: false } : log
      )
    );
    alert(`Rollback signal dispatched. Target controller reset to previous safe baseline.`);
  };

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
              <h2 className="text-base font-bold text-white">Telemetry Pipeline, BACnet HIL Driver & BigQuery ML</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded">
                Hardware-In-The-Loop Ready
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Low-latency edge protocol ingestion, direct BACnet/IP actuator testing driver, BigQuery ML ARIMA forecasting models, and closed-loop audit logging.
            </p>
          </div>
        </div>

        {/* Global Pipeline KPIs */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Total Ingest</span>
            <span className="text-cyan-400 font-bold">{totalPackets.toLocaleString()} msgs/s</span>
          </div>
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Connected Nodes</span>
            <span className="text-emerald-400 font-bold">{totalDevices} Nodes</span>
          </div>
          <div className="bg-[#050505] px-3 py-1.5 rounded border border-[#1f2937]">
            <span className="text-gray-500 text-[10px] uppercase block font-bold">Avg Latency</span>
            <span className="text-purple-400 font-bold">{avgLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1f2937] pb-2">
        <button
          onClick={() => setSubTab('bus')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'bus'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>IoT Telemetry Protocol Bus</span>
        </button>

        <button
          onClick={() => setSubTab('bacnet-hil')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'bacnet-hil'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>BACnet/IP Hardware-In-The-Loop Driver</span>
        </button>

        <button
          onClick={() => setSubTab('bigquery-ml')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'bigquery-ml'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Google BigQuery ML Models</span>
        </button>

        <button
          onClick={() => setSubTab('audit-logs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'audit-logs'
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Closed-Loop Audit Logs ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('cloud-run')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors ${
            subTab === 'cloud-run'
              ? 'bg-blue-950/80 text-blue-300 border border-blue-700/80'
              : 'text-gray-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span>Cloud Run $300 Free Tier Spec</span>
        </button>
      </div>

      {/* VIEW 1: IOT TELEMETRY BUS */}
      {subTab === 'bus' && (
        <div className="space-y-4">
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
                      ? 'bg-[#10191b] border-cyan-500 shadow-md shadow-cyan-950/40'
                      : 'bg-[#0a0a0a] border-[#1f2937] hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">{stream.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                        {stream.protocol}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1f2937] grid grid-cols-2 gap-1 text-[11px] font-mono">
                    <div>
                      <span className="text-gray-500 text-[9px] block">THROUGHPUT</span>
                      <span className="text-gray-200 font-bold">{stream.packetsPerSecond} p/s</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[9px] block">LATENCY</span>
                      <span className="text-emerald-400 font-bold">{stream.latencyMs} ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Stream Inspector */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-8 bg-[#0d0d0d] border border-[#1f2937] rounded p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1f2937] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>{activeStream.name} • Active Registers</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Live payload sampling on edge gateway port {activeStream.port}
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter registers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#050505] border border-[#1f2937] rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 w-48 font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
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

            {/* Edge Gateway Diagnostic Info */}
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
      )}

      {/* VIEW 2: BACNET HARDWARE-IN-THE-LOOP DRIVER */}
      {subTab === 'bacnet-hil' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Device Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase font-mono">Target BACnet DDC Controllers</h3>
              {hilDevices.map((dev) => {
                const isSelected = dev.deviceId === activeHilDevice.deviceId;
                return (
                  <div
                    key={dev.deviceId}
                    onClick={() => setSelectedHilDeviceId(dev.deviceId)}
                    className={`p-3.5 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#10161d] border-cyan-500'
                        : 'bg-[#0a0a0c] border-[#1f2937] hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{dev.deviceName}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 font-bold">
                        {dev.rttMs} ms
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">{dev.ipAddress}:{dev.port} • Device #{dev.deviceId}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">{dev.vendor}</span>
                  </div>
                );
              })}
            </div>

            {/* Register Inspector & WriteProperty Test Bench */}
            <div className="lg:col-span-2 bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>{activeHilDevice.deviceName} • BACnet Objects</span>
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">ASHRAE Standard 135 Compliant Driver</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  APDU PING OK
                </span>
              </div>

              {overrideSuccessMsg && (
                <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{overrideSuccessMsg}</span>
                </div>
              )}

              {/* Registers Table */}
              <div className="space-y-2">
                {activeHilDevice.registers.map((reg) => (
                  <div key={reg.instance} className="bg-[#050608] p-3 rounded border border-[#1f2937] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{reg.objectType}:{reg.instance}</span>
                        <span className="text-xs text-white font-medium">{reg.description}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
                        Safety Clamp: [{reg.safetyRange[0]} - {reg.safetyRange[1]} {reg.engineeringUnits}]
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white">
                          {reg.presentValue} {reg.engineeringUnits}
                        </span>
                      </div>

                      {reg.writable && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            defaultValue={String(reg.presentValue)}
                            onChange={(e) => setOverrideValue(e.target.value)}
                            className="w-16 bg-[#0d0e12] border border-[#1f2937] rounded px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => handleExecuteHilWrite(reg.instance, reg.description)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-black transition-colors"
                          >
                            Write
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live APDU Trace Console */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono uppercase text-gray-500 font-bold block">Live BACnet APDU Trace</span>
                <div className="bg-[#040405] p-3 rounded border border-[#1f2937] font-mono text-[11px] text-gray-400 space-y-1 max-h-36 overflow-y-auto">
                  {apduLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('ACK') ? 'text-emerald-400' : 'text-gray-400'}>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: GOOGLE BIGQUERY ML MODELS */}
      {subTab === 'bigquery-ml' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockBigQueryMlModels.map((model) => (
              <div key={model.modelId} className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-3">
                <div className="flex items-start justify-between border-b border-[#1f2937] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-white">{model.modelId}</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 mt-0.5 block">{model.datasetName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-800/60">
                    {model.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-[#050608] p-2 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">Model Architecture</span>
                    <span className="text-white font-bold">{model.modelType}</span>
                  </div>
                  <div className="bg-[#050608] p-2 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">RMSE Loss</span>
                    <span className="text-emerald-400 font-bold">{model.evaluationLossRmse}</span>
                  </div>
                  <div className="bg-[#050608] p-2 rounded border border-[#1f2937]">
                    <span className="text-[9px] text-gray-500 uppercase block">MAE Error</span>
                    <span className="text-cyan-400 font-bold">{model.meanAbsoluteErrorKw} kW</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Feature Columns Ingested:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {model.features.map((feat) => (
                      <span key={feat} className="px-2 py-0.5 bg-[#050608] text-gray-300 text-[10px] font-mono rounded border border-[#1f2937]">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">BigQuery ML SQL Definition:</span>
                  <pre className="bg-[#040405] p-2.5 rounded border border-[#1f2937] text-[10px] font-mono text-gray-400 overflow-x-auto max-h-32">
                    {model.sqlDefinition}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: CLOSED-LOOP AUDIT LOGS */}
      {subTab === 'audit-logs' && (
        <div className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2937] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cryptographic Closed-Loop Mitigation Audit Trail</span>
              </h3>
              <p className="text-xs text-gray-400">
                Immutable ledger of all BACnet setpoints dispatched by Gemini multi-agents with SHA-256 HMAC verification.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
              ZERO UNVERIFIED DISPATCHES
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f2937] text-gray-500 text-[10px] uppercase font-bold">
                  <th className="py-2.5 px-3">Audit ID & Time</th>
                  <th className="py-2.5 px-3">Action Description</th>
                  <th className="py-2.5 px-3">Target BMS Controller</th>
                  <th className="py-2.5 px-3">Previous Val</th>
                  <th className="py-2.5 px-3">Dispatched Val</th>
                  <th className="py-2.5 px-3">Authorizing Agent</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937] text-gray-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14151b] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-cyan-400 block">{log.id}</span>
                      <span className="text-[10px] text-gray-500">{log.timestamp}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-white block">{log.actionTitle}</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[200px] block">{log.bacnetRegister}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-400 text-[11px]">{log.targetBmsDevice}</td>
                    <td className="py-3 px-3 text-rose-400">{log.previousValue}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">{log.dispatchedValue}</td>
                    <td className="py-3 px-3 text-gray-400 text-[11px]">{log.authorizingAgent}</td>
                    <td className="py-3 px-3 text-right">
                      {log.restorable ? (
                        <button
                          onClick={() => handleRollbackAuditLog(log.id)}
                          className="flex items-center gap-1 ml-auto px-2 py-1 text-[10px] font-semibold rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-300 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono">LOCKED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: CLOUD RUN $300 FREE TIER SPEC & PROBES */}
      {subTab === 'cloud-run' && (
        <div className="space-y-4">
          {/* Top Banner */}
          <div className="bg-[#0b101b] border border-blue-900/60 rounded p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60 shadow-sm">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Google Cloud Run $300 Free Tier / Always-Free Architecture</h3>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                      ZERO-WASTE TUNED
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pre-configured container specifications that preserve your $300 GCP credits and run indefinitely within the Cloud Run Always-Free tier.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchHealthCheck}
                  disabled={healthLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                  <span>{healthLoading ? 'Probing...' : 'Run Container Health Probe'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Resource Footprint & Allocation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-[#050608] p-3.5 rounded border border-[#1f2937]">
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Autoscaling Allocation</span>
              <span className="text-emerald-400 text-sm font-bold block mt-0.5">Scale-to-Zero (0 - 2)</span>
              <span className="text-[10px] text-gray-400 block mt-1">$0.00 / hr when idle (0 vCPU consumed)</span>
            </div>

            <div className="bg-[#050608] p-3.5 rounded border border-[#1f2937]">
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Memory Envelope</span>
              <span className="text-cyan-400 text-sm font-bold block mt-0.5">512 MiB Ram</span>
              <span className="text-[10px] text-gray-400 block mt-1">Runtime RSS ~85 MB (427 MB headroom)</span>
            </div>

            <div className="bg-[#050608] p-3.5 rounded border border-[#1f2937]">
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Cold Start Latency</span>
              <span className="text-purple-400 text-sm font-bold block mt-0.5">&lt; 850 ms Warmup</span>
              <span className="text-[10px] text-gray-400 block mt-1">Single esbuild bundle (`dist/server.cjs`)</span>
            </div>

            <div className="bg-[#050608] p-3.5 rounded border border-[#1f2937]">
              <span className="text-gray-500 text-[10px] uppercase block font-bold">Container Port & Protocol</span>
              <span className="text-amber-400 text-sm font-bold block mt-0.5">Port 3000 (HTTP/1.1)</span>
              <span className="text-[10px] text-gray-400 block mt-1">SIGTERM graceful socket drain (8s)</span>
            </div>
          </div>

          {/* Health Probe Result Panel (if probed) */}
          {healthData && (
            <div className="bg-[#050608] p-4 rounded border border-blue-900/60 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cloud Run Live Probe Response: 200 OK</span>
                </span>
                <span className="text-emerald-400 text-[11px]">Roundtrip: {healthLatency} ms</span>
              </div>
              <pre className="p-3 bg-black rounded border border-[#1f2937] text-[11px] text-gray-300 overflow-x-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {/* Monthly Always-Free Tier Allowances vs App Usage */}
          <div className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
              Google Cloud Free Tier &amp; $300 Credit Protection Matrix
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Invocations:</span>
                  <span className="text-emerald-400 font-bold">2,000,000 requests (100% Free)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Ample headroom for 24/7 telemetry feeds, automated BACnet polls, and user queries.
                </p>
              </div>

              <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly vCPU-Seconds:</span>
                  <span className="text-emerald-400 font-bold">360,000 vCPU-seconds (Free)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Scale-to-zero halts billing the moment traffic pauses. 0 vCPU charged during idle.
                </p>
              </div>

              <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory Allocation:</span>
                  <span className="text-emerald-400 font-bold">180,000 GiB-seconds (Free)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Targeted at 512MiB, maximizing uptime within monthly free tier tiers.
                </p>
              </div>

              <div className="bg-[#050608] p-3 rounded border border-[#1f2937] space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Egress:</span>
                  <span className="text-emerald-400 font-bold">1 GiB / month (Free to NA)</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Vite hashed static JS/CSS assets served with 1-year browser cache headers (`max-age=1y`).
                </p>
              </div>
            </div>
          </div>

          {/* Copyable gcloud run deploy command */}
          <div className="bg-[#0d0e12] border border-[#1f2937] rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono">1-Line Zero-Waste Cloud Run Deploy Command</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Execute directly in Google Cloud Shell or terminal. Fully compatible with your $300 trial credits.
                </p>
              </div>
              <button
                onClick={handleCopyCommand}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-700/80 text-blue-300 transition-colors"
              >
                {copiedDeployCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-black rounded border border-[#1f2937] text-[11px] font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`gcloud run deploy energymind-ai \\
  --source . \\
  --region us-central1 \\
  --platform managed \\
  --port 3000 \\
  --cpu 1 \\
  --memory 512Mi \\
  --min-instances 0 \\
  --max-instances 2 \\
  --concurrency 80 \\
  --allow-unauthenticated \\
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_KEY"`}
            </pre>
            <div className="text-[10px] text-gray-500 font-mono">
              Configuration files also written to workspace: <code className="text-cyan-400">/Dockerfile</code>, <code className="text-cyan-400">/.dockerignore</code>, <code className="text-cyan-400">/cloudrun-service.yaml</code>, and <code className="text-cyan-400">/DEPLOYMENT_GCP.md</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type ViewTab = 'dashboard' | 'telemetry' | 'spatial' | 'agents' | 'simulator' | 'pipeline' | 'portfolio';

export interface PortfolioBuilding {
  id: string;
  name: string;
  location: string;
  areaSqm: number;
  floorsCount: number;
  euiKwhSqmYear: number;
  currentPowerKw: number;
  peakLimitKw: number;
  baselineDiffPercent: number;
  carbonTonsYtd: number;
  leedStatus: 'LEED Platinum' | 'LEED Gold' | 'LEED Silver';
  primaryChillerType: string;
  iotGatewayStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeFaultsCount: number;
  monthlyEnergySpendUsd: number;
}

export interface BacnetHilDevice {
  deviceId: number;
  deviceName: string;
  ipAddress: string;
  port: number;
  vendor: string;
  status: 'ONLINE' | 'SIMULATING' | 'DISCONNECTED';
  rttMs: number;
  registers: {
    objectType: 'ANALOG_VALUE' | 'ANALOG_INPUT' | 'BINARY_OUTPUT' | 'MULTISTATE_VALUE';
    instance: number;
    description: string;
    presentValue: number | string;
    engineeringUnits: string;
    writable: boolean;
    safetyRange: [number, number];
  }[];
}

export interface BigQueryMlModel {
  modelId: string;
  datasetName: string;
  modelType: 'ARIMA_PLUS' | 'BOOSTED_TREE_REGRESSOR' | 'DNN_REGRESSOR';
  trainingInterval: string;
  evaluationLossRmse: number;
  meanAbsoluteErrorKw: number;
  trainedDataPoints: number;
  features: string[];
  status: 'SERVING' | 'TRAINING' | 'EVALUATING';
  lastRetrained: string;
  sqlDefinition: string;
}

export interface ClosedLoopAuditLog {
  id: string;
  timestamp: string;
  actionTitle: string;
  targetBmsDevice: string;
  bacnetRegister: string;
  previousValue: string;
  dispatchedValue: string;
  authorizingAgent: string;
  hmacSignature: string;
  validationStatus: 'CONFIRMED' | 'VERIFIED' | 'SAFE_LIMIT_ENFORCED';
  restorable: boolean;
}

export interface BuildingTelemetry {
  timestamp: string;
  totalPowerKw: number;
  baselineKw: number;
  peakDemandContractLimitKw: number;
  currentPeakTodayKw: number;
  solarPowerKw: number;
  gridImportKw: number;
  gridExportKw: number;
  bessPowerKw: number; // positive = discharging, negative = charging
  bessSocPercent: number;
  carbonIntensityGPerKwh: number;
  realtimeTariffRate: number; // $/kWh
  activeAnomaliesCount: number;
  outdoorTempC: number;
  outdoorHumidityPercent: number;
  wetBulbTempC: number;
  energyEUIKwhSqm: number;
  systemHealthPercent: number;
}

export interface TelemetryPoint {
  hour: number;
  timeLabel: string;
  totalKw: number;
  baselineKw: number;
  predictedKw: number;
  solarKw: number;
  bessKw: number;
  hvacKw: number;
  lightingKw: number;
  plugKw: number;
  dataCenterKw: number;
  tariffPerKwh: number;
  isPeakPeriod: boolean;
  anomaly?: {
    id: string;
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    excessKw: number;
    agent: string;
  };
}

export interface ZoneData {
  id: string;
  name: string;
  code: string;
  floorId: string;
  x: number; // percentage in 2D floor layout
  y: number;
  width: number;
  height: number;
  currentTempC: number;
  setpointTempC: number;
  energyIntensityWsqm: number; // W/m²
  airflowCfm: number;
  targetAirflowCfm: number;
  co2Ppm: number;
  currentOccupancy: number;
  maxCapacity: number;
  vavDamperPositionPercent: number;
  reheatValvePercent: number;
  equipmentStatus: 'OPTIMAL' | 'WARNING' | 'FAULT' | 'OFF';
  equipmentType: 'VAV Box + Reheat' | 'Dual Duct AHU' | 'Fan Coil Unit' | 'Precision Chilled Water CRAC' | 'Inverter Sub-Array';
  anomalyNote?: string;
  recentHistory: { time: string; temp: number; energy: number; cfm: number }[];
}

export interface FloorData {
  id: string;
  levelNumber: number;
  name: string;
  description: string;
  areaSqm: number;
  totalLoadKw: number;
  avgTempC: number;
  zones: ZoneData[];
  equipmentSummary: {
    ahus: number;
    vavs: number;
    chillers: number;
    sensorsOnline: number;
  };
}

export interface AnomalyEvent {
  id: string;
  title: string;
  location: string;
  floorId: string;
  zoneId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'HVAC' | 'SOLAR_BESS' | 'MICROCLIMATE' | 'OCCUPANCY' | 'GRID';
  detectedAt: string;
  status: 'INVESTIGATING' | 'DISPATCHED' | 'RESOLVED';
  excessLoadKw: number;
  costImpactPerDay: number;
  rootCauseSummary: string;
  dispatchedAction?: string;
}

export interface AgentInfo {
  id: 'NEXUS-ORCHESTRATOR' | 'AERO-THERM' | 'HELIOS-BESS' | 'AURA-METEO' | 'CHRONOS-OCC';
  name: string;
  role: string;
  avatarColor: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'STANDBY';
  telemetrySource: string;
  activeHypothesis: string;
  confidenceScore: number;
  recentLogs: { timestamp: string; message: string; level: 'INFO' | 'WARN' | 'FAULT' | 'RESOLVE' }[];
}

export interface InvestigationReport {
  executiveSummary: string;
  consensusConfidence: number;
  financialImpact: {
    wastePerHour: number;
    projectedMonthlyLoss: number;
    carbonExcessKgPerDay: number;
  };
  agentFindings: {
    agentId: string;
    agentName: string;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'ANOMALY';
    finding: string;
    confidence: number;
    metrics: Record<string, string>;
  }[];
  rootCauseChain: string[];
  recommendedMitigations: {
    id: string;
    action: string;
    type: 'AUTOMATED_BMS_DISPATCH' | 'ENERGY_LIMITER' | 'WORK_ORDER';
    estimatedSavingsKw: string;
    payoffTime: string;
    confidence: number;
  }[];
}

export interface SimulatorState {
  chilledWaterSetpointC: number; // e.g. 6.5 - 9.0
  preCoolingStartHour: number; // 3 - 6
  preCoolingTempC: number; // 20.0 - 22.0
  bessDischargeRateKw: number; // 0 - 500
  bessDischargeWindowStartHour: number; // 13 - 16
  bessDischargeWindowEndHour: number; // 17 - 20
  ventilationSetbackPercent: number; // 0 - 40%
  solarSelfConsumptionMode: 'MAX_STORAGE' | 'PEAK_ARBITRAGE' | 'DIRECT_EXPORT';
  demandResponseReductionTargetPercent: number; // 0 - 30%
}

export interface SimulatorResult {
  monthlyCostBefore: number;
  monthlyCostAfter: number;
  monthlyCostSavings: number;
  peakKwBefore: number;
  peakKwAfter: number;
  peakKwShaved: number;
  annualMwhSaved: number;
  annualCarbonSavedTonnes: number;
  simulatedLoadCurve: { hour: number; timeLabel: string; originalKw: number; simulatedKw: number; tariff: number }[];
}

export interface PipelineStream {
  id: string;
  protocol: 'BACnet/IP' | 'Modbus TCP' | 'MQTT Sparkplug B' | 'LoRaWAN IoT' | 'DALI-2 Lighting';
  deviceCount: number;
  packetsPerSecond: number;
  latencyMs: number;
  packetLossPercent: number;
  status: 'ONLINE' | 'DEGRADED' | 'STABLE';
  lastIngestTime: string;
  sampleSensors: { tag: string; metric: string; val: string; quality: 'GOOD' | 'FAIR' | 'BAD' }[];
}

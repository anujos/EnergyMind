import { BuildingTelemetry, TelemetryPoint, FloorData, AnomalyEvent, AgentInfo, PipelineStream, SimulatorState, SimulatorResult } from '../types';

export const initialBuildingTelemetry: BuildingTelemetry = {

  timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
  totalPowerKw: 1428.4,
  baselineKw: 1290.0,
  peakDemandContractLimitKw: 1850.0,
  currentPeakTodayKw: 1512.6,
  solarPowerKw: 422.5,
  gridImportKw: 1005.9,
  gridExportKw: 0.0,
  bessPowerKw: 85.0, // 85 kW discharging
  bessSocPercent: 78.4,
  carbonIntensityGPerKwh: 385,
  realtimeTariffRate: 0.34, // $/kWh peak rate
  activeAnomaliesCount: 4,
  outdoorTempC: 31.8,
  outdoorHumidityPercent: 64,
  wetBulbTempC: 24.6,
  energyEUIKwhSqm: 118.5,
  systemHealthPercent: 99.2,
};

export const generate24hTelemetryData = (): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  
  for (let h = 0; h < 24; h++) {
    const timeLabel = `${h.toString().padStart(2, '0')}:00`;
    const isPeakPeriod = h >= 14 && h < 18;
    const isMidPeak = (h >= 9 && h < 14) || (h >= 18 && h < 21);
    
    // Base curves
    let base = 420; // night baseload
    if (h >= 6 && h <= 9) base += (h - 6) * 260; // morning ramp
    else if (h > 9 && h <= 17) base += 820 + Math.sin((h - 9) * 0.38) * 140; // daytime plateau
    else if (h > 17 && h <= 22) base += 820 - (h - 17) * 160; // evening drop
    
    // Solar generation curve (peaking around 12:00-13:00 at ~480 kW)
    let solar = 0;
    if (h >= 6 && h <= 19) {
      solar = Math.max(0, 480 * Math.sin(((h - 6) / 13) * Math.PI));
      if (h === 12) solar -= 45; // slight inverter thermal dip
    }
    
    // BESS discharge during peak hours (14:00 - 18:00)
    let bess = 0;
    if (h >= 14 && h < 18) {
      bess = 160; // discharging to shave peak
    } else if (h >= 1 && h <= 4) {
      bess = -90; // charging off-peak
    }
    
    // Sub-loads
    const hvac = base * 0.48;
    const lighting = base * 0.18;
    const plug = base * 0.16;
    const dataCenter = 160 + (h % 2 === 0 ? 5 : -5); // steady server load
    
    const totalKw = Math.round(base + (h === 14 ? 140 : h === 16 ? 95 : 0)); // anomalies
    const predictedKw = Math.round(base * 0.98);
    const baselineKw = Math.round(base * 0.94);
    
    let tariff = 0.08; // off-peak
    if (isPeakPeriod) tariff = 0.38;
    else if (isMidPeak) tariff = 0.22;
    
    let anomaly = undefined;
    if (h === 14) {
      anomaly = {
        id: 'anom-1',
        title: 'HVAC Simultaneous Heating & Cooling Fault',
        severity: 'CRITICAL',
        excessKw: 138,
        agent: 'AERO-THERM',
      };
    } else if (h === 12) {
      anomaly = {
        id: 'anom-2',
        title: 'Solar Inverter 3 Thermal Throttling',
        severity: 'MEDIUM',
        excessKw: 45,
        agent: 'HELIOS-BESS',
      };
    } else if (h === 3) {
      anomaly = {
        id: 'anom-4',
        title: 'Unscheduled Atrium Lighting Bypass',
        severity: 'LOW',
        excessKw: 32,
        agent: 'CHRONOS-OCC',
      };
    } else if (h === 16) {
      anomaly = {
        id: 'anom-3',
        title: 'Chiller 2 Low Delta-T Syndrome',
        severity: 'HIGH',
        excessKw: 95,
        agent: 'AERO-THERM',
      };
    }
    
    points.push({
      hour: h,
      timeLabel,
      totalKw,
      baselineKw,
      predictedKw,
      solarKw: Math.round(solar),
      bessKw: bess,
      hvacKw: Math.round(hvac),
      lightingKw: Math.round(lighting),
      plugKw: Math.round(plug),
      dataCenterKw: Math.round(dataCenter),
      tariffPerKwh: tariff,
      isPeakPeriod,
      anomaly,
    });
  }
  
  return points;
};

export const buildingFloors: FloorData[] = [
  {
    id: 'floor-roof',
    levelNumber: 15,
    name: 'Rooftop & Plant Deck',
    description: '500 kWp Bifacial Solar Array, Weather Station, 3x Cooling Towers, Fresh Air Intake Penthouse',
    areaSqm: 2800,
    totalLoadKw: 310.4,
    avgTempC: 33.2,
    equipmentSummary: { ahus: 4, vavs: 0, chillers: 0, sensorsOnline: 48 },
    zones: [
      {
        id: 'z-roof-pv-east',
        name: 'PV Array Sector East (Strings 1-12)',
        code: 'PV-SEC-E',
        floorId: 'floor-roof',
        x: 5,
        y: 8,
        width: 42,
        height: 40,
        currentTempC: 44.5,
        setpointTempC: 25.0,
        energyIntensityWsqm: 142.0,
        airflowCfm: 0,
        targetAirflowCfm: 0,
        co2Ppm: 410,
        currentOccupancy: 0,
        maxCapacity: 5,
        vavDamperPositionPercent: 0,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Inverter Sub-Array',
        recentHistory: [
          { time: '10:00', temp: 38, energy: 110, cfm: 0 },
          { time: '12:00', temp: 46, energy: 155, cfm: 0 },
          { time: '14:00', temp: 44.5, energy: 142, cfm: 0 },
        ],
      },
      {
        id: 'z-roof-pv-west',
        name: 'PV Array Sector West (Strings 13-24)',
        code: 'PV-SEC-W',
        floorId: 'floor-roof',
        x: 53,
        y: 8,
        width: 42,
        height: 40,
        currentTempC: 49.8,
        setpointTempC: 25.0,
        energyIntensityWsqm: 118.0,
        airflowCfm: 0,
        targetAirflowCfm: 0,
        co2Ppm: 412,
        currentOccupancy: 0,
        maxCapacity: 5,
        vavDamperPositionPercent: 0,
        reheatValvePercent: 0,
        equipmentStatus: 'WARNING',
        equipmentType: 'Inverter Sub-Array',
        anomalyNote: 'Inverter 3 MPPT clipping due to junction box overheating (72°C internal).',
        recentHistory: [
          { time: '10:00', temp: 39, energy: 105, cfm: 0 },
          { time: '12:00', temp: 51, energy: 112, cfm: 0 },
          { time: '14:00', temp: 49.8, energy: 118, cfm: 0 },
        ],
      },
      {
        id: 'z-roof-cooling-towers',
        name: 'Cooling Towers Array (CT-1, 2, 3)',
        code: 'CT-CELLS',
        floorId: 'floor-roof',
        x: 10,
        y: 55,
        width: 80,
        height: 38,
        currentTempC: 29.4,
        setpointTempC: 26.0,
        energyIntensityWsqm: 85.0,
        airflowCfm: 42000,
        targetAirflowCfm: 45000,
        co2Ppm: 408,
        currentOccupancy: 0,
        maxCapacity: 4,
        vavDamperPositionPercent: 100,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Dual Duct AHU',
        recentHistory: [
          { time: '10:00', temp: 27, energy: 65, cfm: 36000 },
          { time: '12:00', temp: 30, energy: 90, cfm: 44000 },
          { time: '14:00', temp: 29.4, energy: 85, cfm: 42000 },
        ],
      },
    ],
  },
  {
    id: 'floor-14',
    levelNumber: 14,
    name: 'Floor 14 — Executive & Boardrooms',
    description: 'Executive suites, High-density Boardrooms, Telepresence Suites, Penthouse Lounge',
    areaSqm: 3200,
    totalLoadKw: 245.8,
    avgTempC: 22.4,
    equipmentSummary: { ahus: 2, vavs: 24, chillers: 0, sensorsOnline: 96 },
    zones: [
      {
        id: 'z-14-exec-board',
        name: 'Presidential Boardroom A',
        code: 'F14-BR-A',
        floorId: 'floor-14',
        x: 6,
        y: 8,
        width: 38,
        height: 42,
        currentTempC: 21.8,
        setpointTempC: 22.0,
        energyIntensityWsqm: 42.5,
        airflowCfm: 1250,
        targetAirflowCfm: 1200,
        co2Ppm: 580,
        currentOccupancy: 18,
        maxCapacity: 28,
        vavDamperPositionPercent: 65,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'VAV Box + Reheat',
        recentHistory: [
          { time: '10:00', temp: 22.1, energy: 38, cfm: 900 },
          { time: '12:00', temp: 22.0, energy: 44, cfm: 1280 },
          { time: '14:00', temp: 21.8, energy: 42.5, cfm: 1250 },
        ],
      },
      {
        id: 'z-14-penthouse-lounge',
        name: 'Panorama Skyline Lounge',
        code: 'F14-LNG',
        floorId: 'floor-14',
        x: 48,
        y: 8,
        width: 46,
        height: 42,
        currentTempC: 23.6,
        setpointTempC: 23.0,
        energyIntensityWsqm: 36.2,
        airflowCfm: 1600,
        targetAirflowCfm: 1800,
        co2Ppm: 640,
        currentOccupancy: 24,
        maxCapacity: 60,
        vavDamperPositionPercent: 78,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Fan Coil Unit',
        recentHistory: [
          { time: '10:00', temp: 22.8, energy: 28, cfm: 1100 },
          { time: '12:00', temp: 23.9, energy: 40, cfm: 1750 },
          { time: '14:00', temp: 23.6, energy: 36.2, cfm: 1600 },
        ],
      },
      {
        id: 'z-14-exec-suites',
        name: 'Executive Wing C-Suite',
        code: 'F14-EXEC-W',
        floorId: 'floor-14',
        x: 6,
        y: 54,
        width: 88,
        height: 40,
        currentTempC: 22.1,
        setpointTempC: 22.5,
        energyIntensityWsqm: 31.0,
        airflowCfm: 2100,
        targetAirflowCfm: 2200,
        co2Ppm: 510,
        currentOccupancy: 12,
        maxCapacity: 35,
        vavDamperPositionPercent: 55,
        reheatValvePercent: 5,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'VAV Box + Reheat',
        recentHistory: [
          { time: '10:00', temp: 22.0, energy: 30, cfm: 1950 },
          { time: '12:00', temp: 22.3, energy: 33, cfm: 2150 },
          { time: '14:00', temp: 22.1, energy: 31.0, cfm: 2100 },
        ],
      },
    ],
  },
  {
    id: 'floor-08',
    levelNumber: 8,
    name: 'Floor 8 — R&D Labs & Engineering Hub',
    description: 'High-density engineering open space, hardware testing bench, edge computing lab, collaboration pods',
    areaSqm: 3800,
    totalLoadKw: 412.6,
    avgTempC: 24.1,
    equipmentSummary: { ahus: 3, vavs: 36, chillers: 0, sensorsOnline: 144 },
    zones: [
      {
        id: 'z-08-south-eng',
        name: 'Engineering Open Plan (South Wing)',
        code: 'F08-ENG-S',
        floorId: 'floor-08',
        x: 6,
        y: 8,
        width: 42,
        height: 42,
        currentTempC: 19.4,
        setpointTempC: 23.0,
        energyIntensityWsqm: 78.4,
        airflowCfm: 2850,
        targetAirflowCfm: 1600,
        co2Ppm: 460,
        currentOccupancy: 5,
        maxCapacity: 75,
        vavDamperPositionPercent: 88,
        reheatValvePercent: 62,
        equipmentStatus: 'FAULT',
        equipmentType: 'VAV Box + Reheat',
        anomalyNote: 'CRITICAL: Stuck Damper VAV-08-S2 + Reheat valve cycling at 62%. Simultaneous heating & cooling wasting 18.4 kW.',
        recentHistory: [
          { time: '10:00', temp: 20.8, energy: 54, cfm: 2100 },
          { time: '12:00', temp: 19.8, energy: 72, cfm: 2700 },
          { time: '14:00', temp: 19.4, energy: 78.4, cfm: 2850 },
        ],
      },
      {
        id: 'z-08-edge-lab',
        name: 'Edge Server & Quantum AI Lab',
        code: 'F08-LAB-CRAC',
        floorId: 'floor-08',
        x: 52,
        y: 8,
        width: 42,
        height: 42,
        currentTempC: 20.2,
        setpointTempC: 20.0,
        energyIntensityWsqm: 165.0,
        airflowCfm: 4200,
        targetAirflowCfm: 4000,
        co2Ppm: 430,
        currentOccupancy: 2,
        maxCapacity: 10,
        vavDamperPositionPercent: 95,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Precision Chilled Water CRAC',
        recentHistory: [
          { time: '10:00', temp: 20.1, energy: 160, cfm: 4100 },
          { time: '12:00', temp: 20.4, energy: 168, cfm: 4250 },
          { time: '14:00', temp: 20.2, energy: 165, cfm: 4200 },
        ],
      },
      {
        id: 'z-08-north-collab',
        name: 'North Scrum Pods & Design Studio',
        code: 'F08-SCRUM-N',
        floorId: 'floor-08',
        x: 6,
        y: 54,
        width: 88,
        height: 40,
        currentTempC: 23.4,
        setpointTempC: 23.0,
        energyIntensityWsqm: 41.2,
        airflowCfm: 2400,
        targetAirflowCfm: 2500,
        co2Ppm: 680,
        currentOccupancy: 54,
        maxCapacity: 90,
        vavDamperPositionPercent: 68,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'VAV Box + Reheat',
        recentHistory: [
          { time: '10:00', temp: 22.8, energy: 36, cfm: 2100 },
          { time: '12:00', temp: 23.6, energy: 44, cfm: 2600 },
          { time: '14:00', temp: 23.4, energy: 41.2, cfm: 2400 },
        ],
      },
    ],
  },
  {
    id: 'floor-03',
    levelNumber: 3,
    name: 'Floor 3 — Conference & Central Atrium',
    description: 'Auditorium (400 pax), Central Atrium Skylight, Commercial Kitchen, Dining Hub',
    areaSqm: 4500,
    totalLoadKw: 380.2,
    avgTempC: 23.8,
    equipmentSummary: { ahus: 4, vavs: 28, chillers: 0, sensorsOnline: 112 },
    zones: [
      {
        id: 'z-03-auditorium',
        name: 'Grand Keynote Auditorium',
        code: 'F03-AUD-MAIN',
        floorId: 'floor-03',
        x: 6,
        y: 8,
        width: 44,
        height: 44,
        currentTempC: 22.5,
        setpointTempC: 22.0,
        energyIntensityWsqm: 48.0,
        airflowCfm: 4800,
        targetAirflowCfm: 5000,
        co2Ppm: 720,
        currentOccupancy: 180,
        maxCapacity: 400,
        vavDamperPositionPercent: 72,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Dual Duct AHU',
        recentHistory: [
          { time: '10:00', temp: 21.9, energy: 32, cfm: 3200 },
          { time: '12:00', temp: 22.8, energy: 52, cfm: 5100 },
          { time: '14:00', temp: 22.5, energy: 48, cfm: 4800 },
        ],
      },
      {
        id: 'z-03-atrium',
        name: 'Central Glass Atrium & Skylight Plaza',
        code: 'F03-ATR-SKY',
        floorId: 'floor-03',
        x: 54,
        y: 8,
        width: 40,
        height: 44,
        currentTempC: 25.8,
        setpointTempC: 24.0,
        energyIntensityWsqm: 58.5,
        airflowCfm: 3600,
        targetAirflowCfm: 3800,
        co2Ppm: 510,
        currentOccupancy: 45,
        maxCapacity: 150,
        vavDamperPositionPercent: 85,
        reheatValvePercent: 0,
        equipmentStatus: 'WARNING',
        equipmentType: 'Dual Duct AHU',
        anomalyNote: 'Solar thermal radiation through skylight causing +2.8°C thermal plume above baseline.',
        recentHistory: [
          { time: '10:00', temp: 23.4, energy: 42, cfm: 2800 },
          { time: '12:00', temp: 26.2, energy: 64, cfm: 3900 },
          { time: '14:00', temp: 25.8, energy: 58.5, cfm: 3600 },
        ],
      },
      {
        id: 'z-03-cafeteria',
        name: 'Bistro Cafeteria & Kitchen Makeup Air',
        code: 'F03-KIT-EXH',
        floorId: 'floor-03',
        x: 6,
        y: 56,
        width: 88,
        height: 38,
        currentTempC: 24.0,
        setpointTempC: 23.5,
        energyIntensityWsqm: 62.0,
        airflowCfm: 5200,
        targetAirflowCfm: 5200,
        co2Ppm: 610,
        currentOccupancy: 60,
        maxCapacity: 200,
        vavDamperPositionPercent: 80,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Fan Coil Unit',
        recentHistory: [
          { time: '10:00', temp: 22.5, energy: 40, cfm: 3500 },
          { time: '12:00', temp: 25.0, energy: 88, cfm: 6800 },
          { time: '14:00', temp: 24.0, energy: 62, cfm: 5200 },
        ],
      },
    ],
  },
  {
    id: 'floor-b1',
    levelNumber: 0,
    name: 'Basement — Central Chiller Plant & BESS',
    description: '3x 400-ton Magnetic Bearing Chillers, Primary/Secondary Pumps, 1.2 MWh Battery Energy Storage System',
    areaSqm: 2400,
    totalLoadKw: 580.4,
    avgTempC: 21.0,
    equipmentSummary: { ahus: 1, vavs: 4, chillers: 3, sensorsOnline: 160 },
    zones: [
      {
        id: 'z-b1-chiller-plant',
        name: 'Chiller Central Plant (CH-1, CH-2, CH-3)',
        code: 'PLANT-CH-ALL',
        floorId: 'floor-b1',
        x: 6,
        y: 8,
        width: 48,
        height: 84,
        currentTempC: 20.8,
        setpointTempC: 20.0,
        energyIntensityWsqm: 195.0,
        airflowCfm: 6500,
        targetAirflowCfm: 6500,
        co2Ppm: 420,
        currentOccupancy: 2,
        maxCapacity: 10,
        vavDamperPositionPercent: 100,
        reheatValvePercent: 0,
        equipmentStatus: 'WARNING',
        equipmentType: 'Precision Chilled Water CRAC',
        anomalyNote: 'Chiller 2 operating at 0.78 kW/ton due to low delta-T syndrome (2.4°C across evaporator vs 5.5°C design).',
        recentHistory: [
          { time: '10:00', temp: 20.2, energy: 380, cfm: 5800 },
          { time: '12:00', temp: 21.1, energy: 510, cfm: 6800 },
          { time: '14:00', temp: 20.8, energy: 490, cfm: 6500 },
        ],
      },
      {
        id: 'z-b1-bess-room',
        name: 'BESS Battery Room (1.2 MWh LiFePO4)',
        code: 'BESS-1200-LFP',
        floorId: 'floor-b1',
        x: 58,
        y: 8,
        width: 36,
        height: 40,
        currentTempC: 21.5,
        setpointTempC: 21.0,
        energyIntensityWsqm: 35.0,
        airflowCfm: 3200,
        targetAirflowCfm: 3200,
        co2Ppm: 405,
        currentOccupancy: 0,
        maxCapacity: 4,
        vavDamperPositionPercent: 75,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Precision Chilled Water CRAC',
        recentHistory: [
          { time: '10:00', temp: 21.2, energy: 30, cfm: 3000 },
          { time: '12:00', temp: 21.8, energy: 38, cfm: 3300 },
          { time: '14:00', temp: 21.5, energy: 35, cfm: 3200 },
        ],
      },
      {
        id: 'z-b1-switchgear',
        name: 'Main MV Switchgear & Transformer Vault',
        code: 'MV-SWGR-13KV',
        floorId: 'floor-b1',
        x: 58,
        y: 52,
        width: 36,
        height: 40,
        currentTempC: 26.2,
        setpointTempC: 25.0,
        energyIntensityWsqm: 42.0,
        airflowCfm: 4100,
        targetAirflowCfm: 4000,
        co2Ppm: 410,
        currentOccupancy: 0,
        maxCapacity: 4,
        vavDamperPositionPercent: 85,
        reheatValvePercent: 0,
        equipmentStatus: 'OPTIMAL',
        equipmentType: 'Fan Coil Unit',
        recentHistory: [
          { time: '10:00', temp: 24.8, energy: 36, cfm: 3800 },
          { time: '12:00', temp: 26.5, energy: 44, cfm: 4200 },
          { time: '14:00', temp: 26.2, energy: 42, cfm: 4100 },
        ],
      },
    ],
  },
];

export const initialAnomalies: AnomalyEvent[] = [
  {
    id: 'ANOM-2026-081',
    title: 'HVAC Simultaneous Heating & Cooling Fight',
    location: 'Floor 8 (South Wing R&D)',
    floorId: 'floor-08',
    zoneId: 'z-08-south-eng',
    severity: 'CRITICAL',
    category: 'HVAC',
    detectedAt: '14:15:22 (42 min ago)',
    status: 'INVESTIGATING',
    excessLoadKw: 18.4,
    costImpactPerDay: 48.50,
    rootCauseSummary: 'Damper VAV-08-S2 jammed at 88% while electric reheat valve oscillates at 62% to maintain 22°C setpoint.',
  },
  {
    id: 'ANOM-2026-082',
    title: 'Chiller 2 Low Delta-T Syndrome & Pump Cavitation',
    location: 'Basement Central Plant',
    floorId: 'floor-b1',
    zoneId: 'z-b1-chiller-plant',
    severity: 'HIGH',
    category: 'HVAC',
    detectedAt: '13:40:10 (1h 17m ago)',
    status: 'INVESTIGATING',
    excessLoadKw: 95.0,
    costImpactPerDay: 186.00,
    rootCauseSummary: 'Evaporator Delta-T dropped to 2.4°C (vs 5.5°C rated). 2-way control bypass valve 3B failing open.',
  },
  {
    id: 'ANOM-2026-083',
    title: 'Solar Inverter 3 String Thermal Derating',
    location: 'Rooftop West Sector',
    floorId: 'floor-roof',
    zoneId: 'z-roof-pv-west',
    severity: 'MEDIUM',
    category: 'SOLAR_BESS',
    detectedAt: '12:18:05 (2h 39m ago)',
    status: 'INVESTIGATING',
    excessLoadKw: 45.0,
    costImpactPerDay: 58.00,
    rootCauseSummary: 'Internal junction temperature reached 72°C causing firmware MPPT clipping of 45 kW generation.',
  },
  {
    id: 'ANOM-2026-084',
    title: 'Off-Hours Baseload Creep & Skylight Plume',
    location: 'Floor 3 Central Atrium',
    floorId: 'floor-03',
    zoneId: 'z-03-atrium',
    severity: 'LOW',
    category: 'OCCUPANCY',
    detectedAt: '03:15:00 (11h ago)',
    status: 'RESOLVED',
    excessLoadKw: 32.0,
    costImpactPerDay: 24.00,
    rootCauseSummary: 'Cleaning shift manual override bypassed building automation schedule on 12 architectural cove fixtures.',
    dispatchedAction: 'Schedule re-synchronized via BACnet command at 04:00:00.',
  },
];

export const initialAgents: AgentInfo[] = [
  {
    id: 'NEXUS-ORCHESTRATOR',
    name: 'Nexus Master Orchestrator',
    role: 'Synthesizes multi-agent hypotheses, builds causal graph, and generates verified BACnet mitigation dispatches.',
    avatarColor: 'from-cyan-500 to-blue-600',
    status: 'ACTIVE',
    telemetrySource: 'Full BMS BACnet + Modbus + Weather + Tariff Feeds',
    activeHypothesis: 'Cross-correlated 4 distinct anomalies. Financial exposure: $316.50/day. 2 automated mitigations queued.',
    confidenceScore: 95,
    recentLogs: [
      { timestamp: '14:48:12', message: 'Received telemetry heartbeat from 4 sub-agents. Global convergence rate 99.8%.', level: 'INFO' },
      { timestamp: '14:45:00', message: 'Calculated building Coincident Peak probability: 89% between 15:30 and 16:45.', level: 'WARN' },
      { timestamp: '14:20:00', message: 'Constructed Root-Cause Tree for Floor 8 VAV fault: Confirmed mechanical damper stall.', level: 'FAULT' },
    ],
  },
  {
    id: 'AERO-THERM',
    name: 'Aero-Therm HVAC Agent',
    role: 'Specialized in Chiller kW/ton, psychrometric enthalpy, VAV reheat loops, and low Delta-T syndrome.',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'INVESTIGATING',
    telemetrySource: '36x AHU & 92x VAV BACnet MS/TP controllers, Chiller Modbus Registers',
    activeHypothesis: 'Floor 8 Damper VAV-08-S2 jammed at 88% open while 18.4 kW reheat coil is fighting 13°C primary air.',
    confidenceScore: 96,
    recentLogs: [
      { timestamp: '14:50:04', message: 'Evaporator Delta-T on Chiller 2 degraded to 2.4°C. Pumping energy wasted: 22 kW.', level: 'FAULT' },
      { timestamp: '14:38:22', message: 'Reheat coil modulating pulse width exceeds 60s without space temp recovery.', level: 'WARN' },
      { timestamp: '14:15:22', message: 'Detected simultaneous heating and cooling anomaly flag on Zone F08-ENG-S.', level: 'FAULT' },
    ],
  },
  {
    id: 'HELIOS-BESS',
    name: 'Helios Solar & BESS Agent',
    role: 'Forecasts solar string yield against satellite irradiance and optimizes battery peak-shaving dispatch.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'ACTIVE',
    telemetrySource: 'SMA Solar Inverter Modbus + Tesla Megapack/BESS DNP3 Stream',
    activeHypothesis: 'Rooftop Array Sector West experiencing 45 kW thermal clipping. BESS at 78% SOC ready for 150 kW peak shave.',
    confidenceScore: 98,
    recentLogs: [
      { timestamp: '14:49:30', message: 'Calculated optimal BESS discharge ramp: 160 kW from 14:00 to 18:00 to avoid $38.50/kW peak charge.', level: 'INFO' },
      { timestamp: '12:20:15', message: 'Inverter 3 temperature sensor reported 72°C. Initiating passive airflow advisory.', level: 'WARN' },
      { timestamp: '08:00:00', message: 'Solar array morning clean sweep verified 99.1% string voltage symmetry.', level: 'INFO' },
    ],
  },
  {
    id: 'AURA-METEO',
    name: 'Aura Microclimate Agent',
    role: 'Monitors ambient psychrometrics, solar gain, wet-bulb thresholds, and free-cooling economizer lockouts.',
    avatarColor: 'from-indigo-500 to-violet-600',
    status: 'ACTIVE',
    telemetrySource: 'Vaisala Weather Station + NOAA Open-Meteo High-Resolution Model',
    activeHypothesis: 'Outdoor wet-bulb at 24.6°C. Enthalpy at 78.2 kJ/kg. Economizer cycle locked out to prevent indoor latent moisture loading.',
    confidenceScore: 94,
    recentLogs: [
      { timestamp: '14:52:10', message: 'Outdoor ambient solar irradiance peaked at 942 W/m² on south-facing glass facade.', level: 'INFO' },
      { timestamp: '13:00:00', message: 'Enthalpy cross-over point passed: Closed outdoor air minimum dampers to 15%.', level: 'WARN' },
      { timestamp: '06:30:00', message: 'Morning pre-cooling cycle completed 04:30-07:00 at $0.07/kWh. Thermal sink created: 420 kWh.', level: 'RESOLVE' },
    ],
  },
  {
    id: 'CHRONOS-OCC',
    name: 'Chronos Occupancy Agent',
    role: 'Tracks spatial occupancy density via PIR/Wi-Fi/CO2 sensors to identify unconditioned spaces and phantom plug loads.',
    avatarColor: 'from-rose-500 to-pink-600',
    status: 'INVESTIGATING',
    telemetrySource: 'Aruba Wi-Fi Triangulation, BACnet CO2/PIR Sensors, Access Control Badge Swipes',
    activeHypothesis: 'Floor 8 South Wing occupancy is only 5 persons (14% capacity), but ventilation air is over-delivered by 1,250 CFM.',
    confidenceScore: 93,
    recentLogs: [
      { timestamp: '14:46:18', message: 'Auditorium Floor 3 occupancy reached 180 pax (45%). CO2 is 720 ppm, within ASHRAE 62.1 targets.', level: 'INFO' },
      { timestamp: '14:18:00', message: 'Discrepancy detected: Floor 8 South space is nearly empty while HVAC is demanding 100% cooling.', level: 'FAULT' },
      { timestamp: '03:15:00', message: 'Identified phantom lighting load in Floor 3 Atrium during zero occupancy window.', level: 'WARN' },
    ],
  },
];

export const initialPipelineStreams: PipelineStream[] = [
  {
    id: 'stream-bacnet',
    protocol: 'BACnet/IP',
    deviceCount: 168,
    packetsPerSecond: 4850,
    latencyMs: 14.2,
    packetLossPercent: 0.001,
    status: 'ONLINE',
    lastIngestTime: 'Just now (12ms ago)',
    sampleSensors: [
      { tag: 'BACnet_AHU04_SAT', metric: 'Supply Air Temp', val: '13.2 °C', quality: 'GOOD' },
      { tag: 'BACnet_VAV08_POS', metric: 'Damper Position', val: '88.2 %', quality: 'FAIR' },
      { tag: 'BACnet_CH02_CHWST', metric: 'Chilled Water Supply', val: '6.8 °C', quality: 'GOOD' },
    ],
  },
  {
    id: 'stream-modbus',
    protocol: 'Modbus TCP',
    deviceCount: 42,
    packetsPerSecond: 3200,
    latencyMs: 8.5,
    packetLossPercent: 0.000,
    status: 'ONLINE',
    lastIngestTime: 'Just now (8ms ago)',
    sampleSensors: [
      { tag: 'MB_PV_INV03_KW', metric: 'Active Generation', val: '118.4 kW', quality: 'GOOD' },
      { tag: 'MB_BESS_SOC', metric: 'Battery State of Charge', val: '78.4 %', quality: 'GOOD' },
      { tag: 'MB_CH02_KWTON', metric: 'Chiller Efficiency', val: '0.78 kW/ton', quality: 'FAIR' },
    ],
  },
  {
    id: 'stream-mqtt',
    protocol: 'MQTT Sparkplug B',
    deviceCount: 320,
    packetsPerSecond: 6420,
    latencyMs: 18.0,
    packetLossPercent: 0.003,
    status: 'ONLINE',
    lastIngestTime: 'Just now (22ms ago)',
    sampleSensors: [
      { tag: 'MQTT_IAQ_F08_CO2', metric: 'Indoor CO2 Level', val: '460 ppm', quality: 'GOOD' },
      { tag: 'MQTT_IAQ_F14_VOC', metric: 'Total TVOC', val: '85 ppb', quality: 'GOOD' },
      { tag: 'MQTT_METEO_IRRAD', metric: 'Solar Irradiance', val: '942 W/m²', quality: 'GOOD' },
    ],
  },
  {
    id: 'stream-lora',
    protocol: 'LoRaWAN IoT',
    deviceCount: 94,
    packetsPerSecond: 180,
    latencyMs: 142.0,
    packetLossPercent: 0.012,
    status: 'STABLE',
    lastIngestTime: '2.4s ago',
    sampleSensors: [
      { tag: 'LORA_VIB_PUMP02', metric: 'Pump Vibration RMS', val: '1.42 mm/s', quality: 'GOOD' },
      { tag: 'LORA_TEMP_ROOF_E', metric: 'Panel Backsheet Temp', val: '44.5 °C', quality: 'GOOD' },
    ],
  },
  {
    id: 'stream-dali',
    protocol: 'DALI-2 Lighting',
    deviceCount: 520,
    packetsPerSecond: 950,
    latencyMs: 24.0,
    packetLossPercent: 0.000,
    status: 'ONLINE',
    lastIngestTime: 'Just now (15ms ago)',
    sampleSensors: [
      { tag: 'DALI_F14_LUX_S', metric: 'Daylight Harvest Lux', val: '480 lux', quality: 'GOOD' },
      { tag: 'DALI_F03_DIM_ATR', metric: 'Atrium Fixture Dim', val: '40 %', quality: 'GOOD' },
    ],
  },
];

export const defaultSimulatorState: SimulatorState = {
  chilledWaterSetpointC: 7.2,
  preCoolingStartHour: 4,
  preCoolingTempC: 21.0,
  bessDischargeRateKw: 180,
  bessDischargeWindowStartHour: 14,
  bessDischargeWindowEndHour: 18,
  ventilationSetbackPercent: 20,
  solarSelfConsumptionMode: 'PEAK_ARBITRAGE',
  demandResponseReductionTargetPercent: 15,
};

export const calculateSimulation = (state: SimulatorState, telemetry: TelemetryPoint[]): SimulatorResult => {
  let originalMonthlyCost = 0;
  let simulatedMonthlyCost = 0;
  let peakKwBefore = 0;
  let peakKwAfter = 0;
  let totalKwhSavedDay = 0;

  const simulatedLoadCurve = telemetry.map((pt) => {
    let simKw = pt.totalKw;
    const hour = pt.hour;

    // Chilled water setpoint effect (each 1°C increase in CHW supply saves ~3% chiller energy)
    const deltaChw = state.chilledWaterSetpointC - 6.5; // baseline 6.5°C
    const chwSavingsKw = deltaChw > 0 ? (pt.hvacKw * 0.035 * deltaChw) : (pt.hvacKw * 0.04 * deltaChw);
    simKw -= chwSavingsKw;

    // Pre-cooling shift (cool down building 04:00-07:00, then float setpoint in afternoon peak)
    if (hour >= state.preCoolingStartHour && hour < state.preCoolingStartHour + 3) {
      simKw += 85; // slight pre-cool energy consumed during cheap off-peak
    } else if (hour >= 14 && hour <= 17) {
      simKw -= 95; // passive thermal inertia saves chiller load during peak
    }

    // BESS peak shaving discharge
    if (hour >= state.bessDischargeWindowStartHour && hour < state.bessDischargeWindowEndHour) {
      simKw -= state.bessDischargeRateKw;
    }

    // Ventilation setback (DCV)
    if (hour >= 8 && hour <= 19) {
      simKw -= (pt.hvacKw * 0.15 * (state.ventilationSetbackPercent / 100));
    }

    // Demand Response reduction target
    if (hour >= 15 && hour <= 17 && state.demandResponseReductionTargetPercent > 0) {
      simKw -= (simKw * (state.demandResponseReductionTargetPercent / 100));
    }

    simKw = Math.max(380, Math.round(simKw));

    const costOriginalHour = pt.totalKw * pt.tariffPerKwh;
    const costSimulatedHour = simKw * pt.tariffPerKwh;

    originalMonthlyCost += costOriginalHour * 30;
    simulatedMonthlyCost += costSimulatedHour * 30;

    peakKwBefore = Math.max(peakKwBefore, pt.totalKw);
    peakKwAfter = Math.max(peakKwAfter, simKw);

    totalKwhSavedDay += Math.max(0, pt.totalKw - simKw);

    return {
      hour,
      timeLabel: pt.timeLabel,
      originalKw: pt.totalKw,
      simulatedKw: simKw,
      tariff: pt.tariffPerKwh,
    };
  });

  // Demand charges: $18.50 per peak kW/month
  const demandChargeBefore = peakKwBefore * 18.50;
  const demandChargeAfter = peakKwAfter * 18.50;

  const totalMonthlyBefore = Math.round(originalMonthlyCost + demandChargeBefore);
  const totalMonthlyAfter = Math.round(simulatedMonthlyCost + demandChargeAfter);
  const savings = Math.max(0, totalMonthlyBefore - totalMonthlyAfter);

  const annualMwhSaved = Math.round((totalKwhSavedDay * 365) / 1000);
  const annualCarbonSavedTonnes = Math.round(annualMwhSaved * 0.385);

  return {
    monthlyCostBefore: totalMonthlyBefore,
    monthlyCostAfter: totalMonthlyAfter,
    monthlyCostSavings: savings,
    peakKwBefore,
    peakKwAfter,
    peakKwShaved: peakKwBefore - peakKwAfter,
    annualMwhSaved,
    annualCarbonSavedTonnes,
    simulatedLoadCurve,
  };
};

export const mockTelemetry = initialBuildingTelemetry;
export const mock24hTelemetry = generate24hTelemetryData();
export const mockFloors = buildingFloors;
export const mockAnomalies = initialAnomalies;
export const mockAgents = initialAgents;
export const mockPipelineStreams = initialPipelineStreams;


import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  LineChart, 
  Layers, 
  Bot, 
  SlidersHorizontal, 
  Radio, 
  AlertTriangle,
  Globe2,
  Zap
} from 'lucide-react';

interface NavigationProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  activeAnomaliesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  activeAnomaliesCount,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'telemetry',
      label: '24h Telemetry Curves',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      id: 'spatial',
      label: '3D/2D Spatial Heatmap',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'agents',
      label: 'Multi-Agent Investigation',
      icon: <Bot className="w-4 h-4" />,
      badge: activeAnomaliesCount > 0 ? `${activeAnomaliesCount} Anomaly` : undefined,
    },
    {
      id: 'simulator',
      label: 'What-If Simulator',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    {
      id: 'pipeline',
      label: 'HIL & BigQuery ML',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: 'portfolio',
      label: 'Portfolio & Looker Studio',
      icon: <Globe2 className="w-4 h-4" />,
    },
    {
      id: 'grid-adr',
      label: 'OpenADR & IPMVP M&V',
      icon: <Zap className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-[#080808] border-b border-[#1f2937] px-4 lg:px-6">
      <div className="max-w-[1760px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-2">
        <nav className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-all relative ${
                  isActive
                    ? 'bg-[#111111] text-cyan-400 border border-cyan-900/60 font-bold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#111111]/60 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-gray-500'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-rose-950/50 text-rose-300 border border-rose-900/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-cyan-400 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick status indicator */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-gray-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MQTT / BACnet: 14.2k msgs/s</span>
          </span>
          <span className="text-gray-700">|</span>
          <span className="text-gray-400">ASHRAE 90.1: 97.4%</span>
        </div>
      </div>
    </div>
  );
};

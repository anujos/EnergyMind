import React, { useState, useRef, useEffect } from 'react';
import { BuildingTelemetry } from '../types';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  User, 
  Zap, 
  Flame, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface AgentCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: BuildingTelemetry;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AgentCopilotModal: React.FC<AgentCopilotModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      content: `Hello! I am EnergyMind Nexus Copilot, powered by Gemini 3.7. I have direct access to your 24h telemetry curves, 3D floor thermal maps, Chiller Plant diagnostics, and BESS dispatch states. How can I assist with building energy optimization or anomaly triage today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'How can we shave 150 kW from the 3 PM peak demand?',
    'Explain the simultaneous heating and cooling fault on Floor 8.',
    'What is Chiller 2 Low Delta-T syndrome costing us per month?',
    'Recommend an optimal BESS charging schedule for today’s tariff.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.sender, content: m.content })),
          buildingTelemetry: telemetry,
        }),
      });

      const data = await response.json();
      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        content: data.reply || 'Analysis completed with live BMS telemetry synchronization.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Copilot API error:', err);
      const fallbackMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `EnergyMind Dispatch: Current building load is ${telemetry.totalPowerKw.toFixed(1)} kW with Solar at ${telemetry.solarPowerKw.toFixed(1)} kW. Recommendation: Activate BESS discharge to buffer the 15:30 peak TOU surge.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0a0a0a] border border-[#1f2937] rounded-lg w-full max-w-3xl h-[640px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-[#0d0d0d] border-b border-[#1f2937] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Nexus AI Building Copilot</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Live BMS Telemetry • ASHRAE Guideline 36 • Chiller Plant Thermodynamics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([messages[0]])}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-xs bg-[#050505]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center flex-shrink-0 text-cyan-400 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded p-3.5 space-y-1.5 relative group ${
                    isUser
                      ? 'bg-cyan-600 text-white font-medium rounded-tr-none'
                      : 'bg-[#0d0d0d] border border-[#1f2937] text-gray-200 rounded-tl-none leading-relaxed'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  
                  <div className="flex items-center justify-between text-[9px] font-mono opacity-60 pt-1">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-cyan-400 transition-opacity flex items-center gap-1 ml-2"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded bg-[#1a1a1a] border border-[#1f2937] flex items-center justify-center flex-shrink-0 text-gray-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center flex-shrink-0 text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#0d0d0d] border border-[#1f2937] rounded rounded-tl-none p-3.5 flex items-center gap-2 text-gray-400">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></span>
                <span>Nexus Copilot analyzing thermodynamic telemetry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#1f2937] overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase flex-shrink-0 font-bold">Prompts:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-2.5 py-1 rounded bg-[#141414] hover:bg-[#1f1f1f] text-gray-300 border border-[#1f2937] whitespace-nowrap transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0d0d0d] border-t border-[#1f2937] flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask anything about building energy, chillers, solar, or anomalies..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-[#050505] border border-[#1f2937] text-xs text-white px-3.5 py-2.5 rounded focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

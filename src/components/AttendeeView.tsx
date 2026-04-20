import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer } from './MapContainer';
import { useStadiumData, Stall, Zone } from '../hooks/useStadiumData';
import { MessageSquare, Navigation, Clock, AlertTriangle, User, Map as MapIcon, Utensils, DoorOpen, Activity, Accessibility, Siren, ShieldAlert } from 'lucide-react';
import { getStadiumAssistantResponse } from '../services/gemini';

const STADIUM_CENTER = { lat: 51.556, lng: -0.279 };

export const AttendeeView: React.FC = () => {
  const { zones, stalls, staff, alerts, systemState, loading } = useStadiumData();
  const [activeTab, setActiveTab] = useState<'visualization' | 'optimizer' | 'emergency' | 'staff' | 'assistant'>('visualization');
  const [assistantInput, setAssistantInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  // Evacuation Logic: Prioritize exits
  const recommendedNode = useMemo(() => {
    if (stalls.length === 0) return null;
    
    if (systemState.emergencyMode) {
      // Find nearest/best exit
      const exits = stalls.filter(s => s.type === 'gate' || s.type === 'exit');
      return [...exits].sort((a, b) => {
        const scoreA = a.queueSize / a.serviceRate;
        const scoreB = b.queueSize / b.serviceRate;
        if (accessibilityMode) {
          const isAccessibleA = a.name.toLowerCase().includes('main') || a.name.toLowerCase().includes('gate 1');
          const isAccessibleB = b.name.toLowerCase().includes('main') || b.name.toLowerCase().includes('gate 1');
          if (isAccessibleA && !isAccessibleB) return -1;
          if (!isAccessibleA && isAccessibleB) return 1;
        }
        return scoreA - scoreB;
      })[0];
    }

    return [...stalls]
      .filter(s => s.type === 'food')
      .sort((a, b) => (a.queueSize / a.serviceRate) - (b.queueSize / b.serviceRate))[0];
  }, [stalls, systemState.emergencyMode, accessibilityMode]);

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    const userMsg = assistantInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setAssistantInput('');
    setIsTyping(true);

    const context = `
      EMERGENCY_MODE_ACTIVE: ${systemState.emergencyMode}
      EVACUATION_MESSAGE: ${systemState.evacuationMessage || 'None'}
      ACCESSIBILITY_MODE: ${accessibilityMode}
      Zones: ${zones.map(z => `${z.name}: ${Math.round(z.density * 100)}% density`).join(', ')}
      Stalls: ${stalls.map(s => `${s.name} (${s.type}): ${s.queueSize} people in queue, est wait ${Math.round(s.queueSize / s.serviceRate)} min`).join(', ')}
      Active Alerts: ${alerts.map(a => a.message).join(' | ')}
    `;

    const aiResponse = await getStadiumAssistantResponse(userMsg, context);
    setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsTyping(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-black text-white font-mono">INITIALIZING SMART STADIUM AI...</div>;

  const isEmergency = systemState.emergencyMode;

  return (
    <div className={`grid h-full lg:h-screen w-full bg-bg font-sans text-ink overflow-hidden transition-colors duration-500 ${isEmergency ? 'border-4 border-high' : ''} grid-cols-1 lg:grid-cols-[280px_1fr_300px] grid-rows-[auto_1fr_auto] lg:grid-rows-[64px_1fr_120px]`}>
      {/* Header */}
      <header className={`col-span-1 lg:col-span-3 border-b flex items-center justify-between px-4 lg:px-6 z-50 transition-colors ${isEmergency ? 'bg-high text-white border-white/20' : 'bg-surface border-border'}`}>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className={`${isEmergency ? 'bg-white/20' : 'bg-accent/20'} p-1.5 lg:p-2 rounded-lg`}>
            {isEmergency ? <Siren size={20} className="animate-spin" /> : <Activity size={20} className="text-accent" />}
          </div>
          <h1 className="text-base lg:text-lg font-display font-bold tracking-tight">SMART<span className={isEmergency ? 'text-white/80' : 'text-accent'}>STADIUM</span> AI</h1>
          <span className={`hidden sm:inline-block ml-2 lg:ml-4 font-mono text-[10px] tracking-widest border px-2 py-1 rounded ${isEmergency ? 'text-white border-white/50' : 'text-neutral-500 border-border'}`}>
            {isEmergency ? 'EMERGENCY_ACTIVE' : 'v2.4.0-CORE'}
          </span>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-6">
          <button 
            onClick={() => setAccessibilityMode(!accessibilityMode)}
            className={`flex items-center gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded border transition-all text-[10px] lg:text-xs font-mono tracking-wider ${
              accessibilityMode 
                ? (isEmergency ? 'bg-white text-high border-white' : 'bg-accent text-white border-accent') 
                : (isEmergency ? 'bg-high/20 border-white/30 text-white' : 'bg-surface border-border text-neutral-500 hover:text-white')
            }`}
          >
            <Accessibility size={14} />
            <span className="hidden xs:inline">MODE: {accessibilityMode ? 'ON' : 'OFF'}</span>
          </button>

          <div className="flex gap-4 lg:gap-8 overflow-hidden">
            <div className="text-right">
              <div className={`font-mono text-[8px] lg:text-[10px] uppercase tracking-widest mb-0.5 lg:mb-1 ${isEmergency ? 'text-white/70' : 'text-neutral-500'}`}>Attendance</div>
              <div className="font-mono text-xs lg:text-lg text-white leading-none whitespace-nowrap">
                {zones.reduce((acc, z) => acc + z.currentCount, 0).toLocaleString()} <span className="text-[10px] opacity-50">/ {zones.reduce((acc, z) => acc + z.capacity, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on small screens) */}
      <div className="lg:hidden flex border-b border-border bg-surface sticky top-0 z-40 overflow-x-auto no-scrollbar">
        {[
          { id: 'visualization', label: 'Map', icon: MapIcon },
          { id: 'assistant', label: 'AI', icon: MessageSquare },
          { id: 'optimizer', label: 'Queues', icon: Clock },
          { id: 'staff', label: 'Staff', icon: ShieldAlert },
          { id: 'emergency', label: 'SOS', icon: AlertTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 gap-1 min-w-[70px] transition-all ${
              activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <tab.icon size={16} />
            <span className="text-[9px] font-mono tracking-tighter uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sidebar - AI Assistant */}
      <aside className={`lg:row-start-2 lg:row-span-2 border-r p-4 lg:p-5 flex flex-col gap-6 overflow-hidden transition-colors ${isEmergency ? 'bg-[#2D0A0A] border-high/30' : 'bg-surface border-border'} ${activeTab === 'assistant' ? 'flex' : 'hidden lg:flex'}`}>
        <div className={`border rounded-lg p-3 lg:p-4 flex flex-col h-full overflow-hidden ${isEmergency ? 'bg-black/40 border-high/50' : 'bg-neutral-900 border-border'}`}>
          <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <MessageSquare size={12} className="text-accent" /> Gemini Assistant
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-border pr-2">
            {chatHistory.length === 0 ? (
              <div className="text-xs text-neutral-400 leading-relaxed italic">
                Awaiting input. Ask about crowd density, stall wait times, or shortest paths.
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                    msg.role === 'user' ? 'bg-accent/10 border border-accent/20 text-accent' : 'bg-neutral-800 border border-border text-neutral-200'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 border border-border px-2 py-1 rounded-lg flex gap-1 items-center">
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity }} className="w-1 h-1 bg-accent rounded-full" />
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, delay: 0.2 }} className="w-1 h-1 bg-accent rounded-full" />
                   <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, delay: 0.4 }} className="w-1 h-1 bg-accent rounded-full" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAssistantSubmit} className="mt-auto">
            <div className="relative">
              <input 
                type="text" 
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Query AI..."
                className="w-full bg-bg border border-border rounded-lg pl-3 pr-10 py-3 text-xs focus:outline-none focus:border-accent transition-colors"
              />
              <button type="submit" className="absolute right-2 top-2 p-1.5 text-accent hover:text-white transition-colors">
                <Navigation size={14} className="rotate-90" />
              </button>
            </div>
          </form>
        </div>

        <nav className="flex flex-col gap-2">
           <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">System Navigation</div>
           {[
             { id: 'visualization', label: 'Spatial Visualization' },
             { id: 'optimizer', label: 'Route Optimizer' },
             { id: 'emergency', label: 'Emergency Protocols' },
             { id: 'staff', label: 'Staff Nodes' }
           ].map((tab) => (
             <div 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-4 py-2 rounded border cursor-pointer text-xs transition-all ${
                 activeTab === tab.id ? 'bg-border border-accent text-accent' : 'border-transparent text-neutral-500 hover:text-neutral-300'
               }`}
             >
               {tab.label}
             </div>
           ))}
        </nav>

        <div className="mt-auto border-t border-border pt-4 hidden lg:block">
           <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Internal Diagnostics</div>
           <div className="font-mono text-[10px] text-neutral-400 flex justify-between">
              <span>CPU_LOAD: 12%</span>
              <span>LATENCY: 24ms</span>
           </div>
        </div>
      </aside>

      {/* Main - Map */}
      <main className={`relative bg-bg ${activeTab === 'visualization' || activeTab === 'staff' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="absolute top-4 lg:top-6 left-4 lg:left-6 z-10 w-[calc(100%-32px)] lg:w-auto">
           <div className="font-mono text-[8px] lg:text-[10px] text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2 bg-bg/60 backdrop-blur-sm p-1 rounded inline-flex">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
              {activeTab === 'staff' ? 'Personnel Grid' : 'Spatial Visualization: Main Arena'}
           </div>
        </div>
        
        <div className="w-full h-full p-2 lg:p-6">
           <div className="w-full h-full rounded-lg border border-border overflow-hidden relative shadow-2xl">
              <MapContainer 
                apiKey={(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || ''} 
                center={STADIUM_CENTER} 
                zoom={17}
                zones={zones}
                stalls={stalls}
                staff={activeTab === 'staff' ? staff : []}
                emergencyMode={isEmergency}
              />
              
              {recommendedNode && (
                <div className="absolute top-2 lg:top-4 right-2 lg:right-4 pointer-events-none max-w-[180px] lg:max-w-[240px]">
                   <div className={`${isEmergency ? 'bg-high/90 border-white shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-surface/90 border-accent/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'} backdrop-blur-md border p-3 rounded-lg pointer-events-auto`}>
                      <div className="flex gap-3">
                         <div className={`${isEmergency ? 'bg-white/20' : 'bg-accent/20'} p-1.5 rounded h-fill flex items-center`}>
                           <Navigation size={14} className={isEmergency ? 'text-white' : 'text-accent'} />
                         </div>
                         <div>
                            <div className={`font-mono text-[9px] font-bold uppercase tracking-widest ${isEmergency ? 'text-white' : 'text-accent'}`}>
                              {isEmergency ? 'EVACUATION_ROUTE' : 'Route Advisory'}
                            </div>
                            <div className="text-xs text-white font-bold leading-tight mt-0.5">{recommendedNode.name}</div>
                            <div className={`${isEmergency ? 'text-white/80 font-bold' : 'text-neutral-400'} text-[10px] mt-1`}>
                              {isEmergency 
                                ? `SAFE_EXIT_LOCATED. ${accessibilityMode ? 'ACCESSIBLE_PATH_IDENTIFIED.' : 'PROCEED_IMMEDIATELY.'}`
                                : `Shortest queue found (est. ${Math.round(recommendedNode.queueSize / recommendedNode.serviceRate)}m).`
                              }
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Aside - Stats */}
      <aside className={`lg:row-start-2 lg:row-span-2 border-l p-4 lg:p-6 flex flex-col gap-6 lg:gap-8 transition-colors ${isEmergency ? 'bg-[#2D0A0A] border-high/30' : 'bg-surface border-border'} ${activeTab === 'optimizer' || activeTab === 'emergency' || activeTab === 'staff' ? 'flex' : 'hidden lg:flex'}`}>
        {activeTab === 'visualization' || activeTab === 'optimizer' ? (
          <>
            <div>
              <div className={`font-mono text-[10px] uppercase tracking-widest mb-3 lg:mb-4 ${isEmergency ? 'text-white/70' : 'text-neutral-500'}`}>
                {isEmergency ? 'EVACUATION_NODES' : 'Queue Analytics'}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[30vh] lg:max-h-none pr-1">
                {stalls
                  .filter(s => isEmergency ? (s.type === 'gate' || s.type === 'exit') : true)
                  .sort((a,b) => a.queueSize - b.queueSize)
                  .map(stall => {
                  const waitTime = Math.round(stall.queueSize / stall.serviceRate);
                  const statusColor = isEmergency ? 'text-white' : (waitTime < 5 ? 'text-low' : waitTime < 15 ? 'text-med' : 'text-high');
                  return (
                    <div key={stall.id} className={`flex justify-between items-center py-2 border-b font-mono text-[11px] lg:text-[13px] last:border-0 group transition-colors px-1 ${
                      isEmergency ? 'border-high/20 hover:bg-high/20' : 'border-border hover:bg-neutral-800/50'
                    }`}>
                      <span className={`truncate pr-4 ${isEmergency ? 'text-white font-bold' : 'text-neutral-300'}`}>{stall.name}</span>
                      <span className={`font-bold ${statusColor}`}>{isEmergency ? 'OPEN' : `${waitTime}m`}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className={`font-mono text-[10px] uppercase tracking-widest mb-2 lg:mb-3 ${isEmergency ? 'text-white/70' : 'text-neutral-500'}`}>
                {isEmergency ? 'CRITICAL_GUIDANCE' : 'Dynamic Rerouting'}
              </div>
              <div className={`${isEmergency ? 'bg-high/20 border-high/40 text-white' : 'bg-neutral-900 border-border text-neutral-400'} border border-dashed p-3 lg:p-4 rounded-lg text-xs leading-relaxed`}>
                <strong className={isEmergency ? 'text-white' : 'text-accent'}>
                  {isEmergency ? 'EM_OPS:' : 'AI ADVISORY:'}
                </strong> 
                {" "}
                {isEmergency 
                  ? (systemState.evacuationMessage || "DO NOT USE ELEVATORS. STAIRS ARE FOR EMERGENCY USE ONLY. ASSIST OTHERS AS NEEDED.")
                  : "Detected heavy clustering in South Stand. Rerouting incoming traffic to Sector 4 and 5 recommended to balance exit velocity."
                }
              </div>
            </div>
          </>
        ) : activeTab === 'emergency' ? (
          <div className="space-y-6">
             <div>
               <div className="font-mono text-[10px] uppercase tracking-widest mb-4 text-high font-bold flex items-center gap-2">
                 <AlertTriangle size={14} /> Critical Protocols
               </div>
               <div className="space-y-3">
                  {[
                    "Proceed to the nearest exit gate immediately.",
                    "Follow the lighted floor paths (ADA Compliant).",
                    "Do not use elevators under any circumstances.",
                    "Assist individuals with mobility constraints."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-3 text-xs text-neutral-300 bg-high/5 p-3 rounded border border-high/20">
                       <span className="text-high font-bold">{i+1}</span>
                       <span>{text}</span>
                    </div>
                  ))}
               </div>
             </div>
             <div className="bg-high/10 border border-high/30 p-4 rounded-lg">
                <div className="font-mono text-[10px] uppercase tracking-widest mb-2 text-white font-bold">Emergency Dispatch</div>
                <div className="text-[11px] text-white/80 leading-relaxed italic">
                  "All security personnel are currently deployed to main exits. Stay calm and follow steward directions."
                </div>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div>
               <div className="font-mono text-[10px] uppercase tracking-widest mb-4 text-accent font-bold">Personnel Deployment</div>
               <div className="space-y-2">
                  {staff.map(member => (
                    <div key={member.id} className="bg-neutral-900 border border-border p-3 rounded-lg flex justify-between items-center">
                       <div>
                          <div className="text-xs text-white font-bold">{member.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono italic">{member.role}</div>
                       </div>
                       <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                         member.status === 'responding' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-low text-low bg-low/5'
                       }`}>
                         {member.status.toUpperCase()}
                       </span>
                    </div>
                  ))}
               </div>
             </div>
             <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg">
                <div className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                  Toggle <span className="text-accent">Staff Nodes</span> in System Navigation to visualize responder locations on the spatial grid.
                </div>
             </div>
          </div>
        )}

        <div className="mt-auto">
           <div className={`border p-3 lg:p-4 rounded-lg ${isEmergency ? 'bg-high border-white text-white' : 'bg-accent/10 border-accent/20'}`}>
              <div className={`font-mono text-[10px] uppercase tracking-widest mb-0.5 lg:mb-1 font-bold ${isEmergency ? 'text-white' : 'text-accent'}`}>
                {isEmergency ? 'EVAC_STATUS' : 'Optimization Active'}
              </div>
              <div className={`text-[10px] lg:text-[11px] leading-snug ${isEmergency ? 'text-white' : 'text-accent/80'}`}>
                {isEmergency 
                  ? "Broadcast override active. Global sync frequency increased."
                  : `Dynamic weight adjustments applied to nodes.`
                }
              </div>
           </div>
        </div>
      </aside>

      {/* Footer - Alerts */}
      <footer className={`col-span-1 lg:col-start-2 border-t p-3 lg:p-5 overflow-hidden transition-colors ${isEmergency ? 'bg-high border-white/30' : 'bg-[#111215] border-border'}`}>
        <div className={`font-mono text-[9px] lg:text-[10px] uppercase tracking-widest mb-2 lg:mb-3 flex items-center gap-2 ${isEmergency ? 'text-white' : 'text-neutral-500'}`}>
           <div className={`w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full animate-ping ${isEmergency ? 'bg-white shadow-[0_0_8px_white]' : 'bg-high shadow-[0_0_8px_var(--color-high)]'}`} />
           {isEmergency ? 'EMERGENCY_FEED' : 'Active Critical Alerts'}
        </div>
        
        <div className="overflow-hidden relative h-10 lg:h-12">
          <div className="flex gap-16 whitespace-nowrap animate-marquee items-center h-full">
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 text-sm tracking-tight text-neutral-200">
                <span className="text-high font-mono font-bold">[{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                <span className="font-medium uppercase">{alert.message}</span>
              </div>
            )) : (
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span className="text-low font-mono font-bold">SYSTEM_NOMINAL</span>
                <span>All entry points and zones operating within standard thresholds.</span>
              </div>
            )}
            {/* Double the list for seamless marquee loop if alerts exist */}
            {alerts.length > 0 && alerts.map(alert => (
              <div key={`${alert.id}-loop`} className="flex items-center gap-3 text-sm tracking-tight text-neutral-200">
                <span className="text-high font-mono font-bold">[{new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                <span className="font-medium uppercase">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStadiumData } from '../hooks/useStadiumData';
import { updateSimulation } from '../services/simulationService';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Activity, Users, Map as MapIcon, Siren, Radio, Send, Play, BarChart3, AlertCircle, ShieldAlert } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { zones, stalls, alerts, systemState, loading } = useStadiumData();
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const totalAttendance = zones.reduce((acc, z) => acc + z.currentCount, 0);
  const totalCapacity = zones.reduce((acc, z) => acc + z.capacity, 0);
  const overallDensity = (totalAttendance / totalCapacity) * 100;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    try {
      await addDoc(collection(db, "alerts"), {
        message: broadcastMsg,
        type: "warning",
        timestamp: new Date().toISOString(),
        active: true
      });
      setBroadcastMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEmergency = async () => {
    try {
      const isEmergency = systemState.emergencyMode;
      await setDoc(doc(db, "system", "state"), {
        emergencyMode: !isEmergency,
        evacuationMessage: !isEmergency ? "ALL ATTENDEES: PLEASE PROCEED TO THE NEAREST EXIT IN AN ORDERLY FASHION. FOLLOW THE HIGHLIGHTED PATHS." : "",
        lastUpdated: new Date().toISOString()
      });
      
      if (!isEmergency) {
        await addDoc(collection(db, "alerts"), {
          message: "EMERGENCY EVACUATION ACTIVE",
          type: "emergency",
          timestamp: new Date().toISOString(),
          active: true
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    await updateSimulation();
    setTimeout(() => setIsSimulating(false), 500);
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      {/* Admin Header */}
      <header className="h-auto lg:h-16 border-b border-border px-4 lg:px-8 py-4 lg:py-0 flex flex-col lg:flex-row items-start lg:items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/20 p-2 rounded-lg text-accent">
            <Activity size={20} />
          </div>
          <h1 className="text-base lg:text-lg font-display font-bold tracking-tight uppercase">SMARTSTADIUM <span className="text-accent">COMMAND</span></h1>
          <span className="hidden sm:inline-block ml-4 text-neutral-500 font-mono text-[10px] tracking-widest border border-border px-2 py-0.5 rounded">ADMIN_OPS</span>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-4 w-full lg:w-auto">
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all border ${
              isSimulating ? 'bg-neutral-800 border-border text-neutral-500' : 'bg-surface border-border text-white hover:border-accent group'
            }`}
          >
            <Play size={12} className={`${isSimulating ? 'animate-pulse' : 'text-accent group-hover:scale-110 transition-transform'}`} />
            SIM_DATA
          </button>
          
          <button 
            onClick={toggleEmergency}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-[10px] font-bold tracking-widest transition-all ${
              systemState.emergencyMode 
                ? 'bg-high border-high text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'border-high/30 bg-high/10 text-high hover:bg-high/20'
            }`}
          >
            <Siren size={12} className={systemState.emergencyMode ? 'animate-spin' : ''} />
            {systemState.emergencyMode ? 'STOP_EVAC' : 'INIT_EVAC'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 grid grid-cols-12 gap-4 lg:gap-8 overflow-y-auto">
        {/* Left Column - Stats */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-border p-6 rounded-lg relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <Users size={18} className="text-accent" />
                <span className="text-[9px] text-neutral-500 font-mono tracking-widest">ATTENDANCE_METRIC</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white mb-1 slashed-zero">{totalAttendance.toLocaleString()}</div>
              <div className="text-[10px] uppercase text-neutral-400 font-mono opacity-50">Real-time sync active</div>
            </div>
            
            <div className="bg-surface border border-border p-6 rounded-lg relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <Activity size={18} className="text-emerald-400" />
                <span className="text-[9px] text-neutral-500 font-mono tracking-widest">LOAD_FACTOR</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white mb-1">{overallDensity.toFixed(1)}%</div>
              <div className="h-1 w-full bg-neutral-800 rounded-full mt-2">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${overallDensity > 80 ? 'bg-high' : 'bg-emerald-500'}`} 
                  style={{ width: `${overallDensity}%` }} 
                />
              </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-lg relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle size={18} className="text-orange-400" />
                <span className="text-[9px] text-neutral-500 font-mono tracking-widest">QUEUE_NODES</span>
              </div>
              <div className="text-4xl font-mono font-bold text-white mb-1 slashed-zero">{stalls.length}</div>
              <div className="text-[10px] uppercase text-neutral-400 font-mono opacity-50">Monitoring {stalls.length} sensors</div>
            </div>
          </div>

          {/* Zones Table */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-neutral-900/40">
              <h3 className="text-xs font-mono font-bold uppercase flex items-center gap-2"><BarChart3 size={14} className="text-accent" /> Zone Density Analysis</h3>
              <span className="text-[9px] text-accent font-mono animate-pulse">STREAMING_DATA</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#111215] text-[9px] uppercase tracking-widest text-neutral-500 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-mono font-bold">Zone_Identifier</th>
                    <th className="px-6 py-4 font-mono font-bold">Pop_Count</th>
                    <th className="px-6 py-4 font-mono font-bold">Cap_Max</th>
                    <th className="px-6 py-4 font-mono font-bold">Density_Index</th>
                    <th className="px-6 py-4 font-mono font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {zones.map(zone => (
                    <tr key={zone.id} className="hover:bg-neutral-800/40 transition-colors font-mono">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zone.color, boxShadow: `0 0 8px ${zone.color}` }} />
                        <span className="font-bold text-xs text-white uppercase">{zone.name}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">{zone.currentCount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-neutral-500">{zone.capacity.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 w-24">
                          <span className={`text-[10px] font-bold ${zone.density > 0.8 ? 'text-high' : 'text-neutral-500'}`}>{(zone.density * 100).toFixed(0)}%</span>
                          <div className="h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${zone.density > 0.8 ? 'bg-high' : 'bg-accent'}`} style={{ width: `${zone.density * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                          zone.density > 0.8 ? 'border-high text-high bg-high/5' : 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                        }`}>
                          {zone.density > 0.8 ? 'CRITICAL' : 'NOMINAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Controls & Alerts */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Broadcast Center */}
          <div className="bg-surface border border-border rounded-lg p-6 shadow-2xl">
            <h3 className="text-xs font-mono font-bold uppercase mb-4 flex items-center gap-2"><Radio size={14} className="text-accent" /> Uplink: Broadcast</h3>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <textarea 
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="PROMPT: GLOBAL ANNOUNCEMENT CONTENT..."
                className="w-full bg-bg border border-border rounded-lg p-4 text-xs font-mono text-neutral-300 focus:border-accent outline-none h-32 resize-none placeholder:opacity-30"
              />
              <button 
                type="submit"
                className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-3 rounded-lg text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors uppercase"
              >
                <Send size={14} /> Commit_Broadcast
              </button>
            </form>
          </div>

          {/* Active Alerts List */}
          <div className="bg-surface border border-border rounded-lg flex flex-col overflow-hidden max-h-[400px]">
             <div className="px-6 py-4 border-b border-border bg-neutral-900/40 flex items-center justify-between">
                <h3 className="text-[10px] font-mono font-bold uppercase">System_Alert_Log</h3>
                <span className="text-[9px] text-neutral-500 font-mono">SECURE_FEED</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-border">
                {alerts.length === 0 && <div className="text-center py-8 text-neutral-600 text-[10px] font-mono tracking-widest uppercase italic">Feed_Empty</div>}
                {alerts.map(alert => (
                  <div key={alert.id} className="bg-bg border border-border p-4 rounded-lg group hover:border-accent transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="pulse" />
                       <span className="text-[9px] font-mono font-bold text-high uppercase tracking-widest">{alert.type}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed font-mono uppercase">{alert.message}</p>
                    <div className="mt-3 text-[8px] text-neutral-600 font-mono slash-zero">LOG_ID: {alert.id.substring(0,8)} | TS: {new Date(alert.timestamp).toISOString()}</div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

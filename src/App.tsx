/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from './services/firebase';
import { initializeStadiumData } from './services/simulationService';
import { AttendeeView } from './components/AttendeeView';
import { AdminView } from './components/AdminView';
import { useStadiumData } from './hooks/useStadiumData';
import { Activity, LogIn, User as UserIcon, Shield, Siren, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'attendee' | 'admin'>('attendee');
  const [loading, setLoading] = useState(true);
  const { systemState, loading: dataLoading } = useStadiumData();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        initializeStadiumData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="bg-accent/10 p-6 rounded-full border border-accent/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
            <Activity size={48} className="text-accent" />
          </div>
          <div className="text-accent font-mono font-bold tracking-[0.3em] text-xs uppercase animate-pulse">Initializing_SmartStadium_AI</div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg p-6 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-md w-full space-y-12 text-center relative z-10">
          <div className="space-y-6">
            <div className="inline-block bg-surface p-5 rounded-2xl border border-border shadow-2xl">
              <Activity size={48} className="text-accent" />
            </div>
            <div className="space-y-2">
               <h1 className="text-5xl font-display font-bold text-white tracking-tighter uppercase">
                 Smart<span className="text-accent">Stadium</span>
               </h1>
               <div className="font-mono text-[10px] text-neutral-500 tracking-[0.4em] uppercase">Core_System_Access</div>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto font-sans">
              Autonomous crowd intelligence and real-time coordination for high-load sporting environments.
            </p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-accent text-white font-bold py-4 rounded-lg hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] border border-accent/20 font-mono text-xs tracking-widest"
            >
              <LogIn size={18} />
              AUTHENTICATE_WITH_GOOGLE
            </button>
            <div className="text-[9px] text-neutral-600 font-mono tracking-widest uppercase flex items-center justify-center gap-2">
               <div className="w-12 h-[1px] bg-border" />
               Standard Security Protocol Active
               <div className="w-12 h-[1px] bg-border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-bg overflow-hidden flex flex-col">
      {/* Global Emergency Banner */}
      <AnimatePresence>
        {systemState?.emergencyMode && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-high text-white py-2 px-4 flex items-center justify-center gap-4 z-[200] relative overflow-hidden shrink-0 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
          >
            <motion.div 
              animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Siren size={20} />
            </motion.div>
            <span className="font-display font-black tracking-[0.3em] text-sm uppercase">
              EMERGENCY EVACUATION ACTIVE
            </span>
            <div className="flex-1 text-center hidden md:block">
              <span className="font-mono text-[10px] opacity-90 animate-pulse tracking-widest uppercase">
                 {systemState.evacuationMessage || "Proceed to designated safety zones immediately"}
              </span>
            </div>
            <motion.div 
              animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Siren size={20} />
            </motion.div>
            
            <div className="absolute inset-0 opacity-10 pointer-events-none flex whitespace-nowrap font-mono text-[60px] font-black italic items-center select-none">
               <motion.div 
                 animate={{ x: [0, -1000] }} 
                 transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
               >
                 EVACUATE EVACUATE EVACUATE EVACUATE EVACUATE EVACUATE
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 overflow-hidden">
        {/* Absolute Header Overlay (Only for admin/view switching) */}
        <div className="absolute top-4 right-4 z-[100] flex gap-2 sm:top-4 sm:right-4">
           <button 
            onClick={() => setView(view === 'admin' ? 'attendee' : 'admin')}
            className="bg-surface/80 backdrop-blur border border-border p-2 lg:p-3 rounded-lg text-neutral-500 hover:text-accent transition-colors shadow-2xl group"
            title="Switch Perspective"
          >
            {view === 'admin' ? <UserIcon size={16} className="lg:w-[18px] lg:h-[18px] group-hover:scale-110 transition-transform" /> : <Shield size={16} className="lg:w-[18px] lg:h-[18px] group-hover:scale-110 transition-transform" />}
          </button>
          <button 
            onClick={signOutUser}
            className="bg-surface/80 backdrop-blur border border-border p-2 lg:p-3 rounded-lg text-neutral-500 hover:text-high transition-colors shadow-2xl group"
            title="Sign Out"
          >
            <LogIn size={16} className="lg:w-[18px] lg:h-[18px] rotate-180 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === 'attendee' ? (
            <motion.div key="attendee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AttendeeView />
            </motion.div>
          ) : (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AdminView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

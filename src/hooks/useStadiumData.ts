import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../services/firebase";

export interface SystemState {
  emergencyMode: boolean;
  evacuationMessage?: string;
}

export interface Zone {
  id: string;
  name: string;
  density: number;
  currentCount: number;
  capacity: number;
  color?: string;
}

export interface Stall {
  id: string;
  name: string;
  type: "food" | "gate" | "exit" | "restroom";
  location: { lat: number; lng: number };
  queueSize: number;
  serviceRate: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  location: { lat: number; lng: number };
  status: "on-duty" | "responding" | "break";
}

export interface Alert {
  id: string;
  message: string;
  type: "info" | "warning" | "emergency";
  timestamp: string;
  active: boolean;
}

export function useStadiumData() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({ emergencyMode: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners if auth state changes
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const unsubZones = onSnapshot(collection(db, "zones"), (snapshot) => {
        setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone)));
      });

      const unsubStalls = onSnapshot(collection(db, "stalls"), (snapshot) => {
        setStalls(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stall)));
      });

      const unsubStaff = onSnapshot(collection(db, "staff"), (snapshot) => {
        setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      });

      const unsubAlerts = onSnapshot(
        query(collection(db, "alerts"), where("active", "==", true), orderBy("timestamp", "desc")),
        (snapshot) => {
          setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
        }
      );

      const unsubSystem = onSnapshot(doc(db, "system", "state"), (snapshot) => {
        if (snapshot.exists()) {
          setSystemState(snapshot.data() as SystemState);
        }
        setLoading(false);
      });

      unsubs.push(unsubZones, unsubStalls, unsubStaff, unsubAlerts, unsubSystem);
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  return { zones, stalls, staff, alerts, systemState, loading };
}

import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export const STADIUM_CENTER = { lat: 51.556, lng: -0.279 };

const ZONES = [
  { id: "north", name: "North Stand", capacity: 20000, color: "#ef4444" },
  { id: "south", name: "South Stand", capacity: 20000, color: "#3b82f6" },
  { id: "east", name: "East Stand", capacity: 15000, color: "#10b981" },
  { id: "west", name: "West Stand", capacity: 15000, color: "#f59e0b" },
  { id: "pitch", name: "Field Access", capacity: 5000, color: "#6366f1" },
];

const STALLS = [
  { id: "burger_a", name: "Classic Burgers A", type: "food", location: { lat: 51.5565, lng: -0.2795 }, serviceRate: 2.5 },
  { id: "drink_a", name: "Refreshments North", type: "food", location: { lat: 51.5568, lng: -0.2785 }, serviceRate: 5.0 },
  { id: "gate_1", name: "Main Gate 1", type: "gate", location: { lat: 51.5555, lng: -0.2805 }, serviceRate: 10.0 },
  { id: "exit_b", name: "West Exit", type: "exit", location: { lat: 51.5562, lng: -0.2825 }, serviceRate: 20.0 },
];

const STAFF = [
  { id: "s1", name: "Officer Miller", role: "Security", location: { lat: 51.5562, lng: -0.2792 }, status: "on-duty" },
  { id: "s2", name: "Medic Chen", role: "Medical", location: { lat: 51.5558, lng: -0.2788 }, status: "on-duty" },
  { id: "s3", name: "Steward James", role: "Crowd Control", location: { lat: 51.5565, lng: -0.2800 }, status: "on-duty" },
  { id: "s4", name: "Officer Sarah", role: "Security", location: { lat: 51.5552, lng: -0.2810 }, status: "responding" },
];

export async function initializeStadiumData() {
  const zoneSnap = await getDocs(collection(db, "zones"));
  if (zoneSnap.empty) {
    const batch = writeBatch(db);
    ZONES.forEach(z => {
      const ref = doc(db, "zones", z.id);
      batch.set(ref, {
        name: z.name,
        capacity: z.capacity,
        currentCount: Math.floor(Math.random() * z.capacity * 0.7),
        density: Math.random() * 0.7,
        color: z.color
      });
    });
    STALLS.forEach(s => {
      const ref = doc(db, "stalls", s.id);
      batch.set(ref, {
        name: s.name,
        type: s.type,
        location: s.location,
        queueSize: Math.floor(Math.random() * 30),
        serviceRate: s.serviceRate
      });
    });
    STAFF.forEach(s => {
      const ref = doc(db, "staff", s.id);
      batch.set(ref, {
        name: s.name,
        role: s.role,
        location: s.location,
        status: s.status
      });
    });
    await batch.commit();
    console.log("Stadium localized data initialized.");
  }
}

export async function updateSimulation() {
  const zoneSnap = await getDocs(collection(db, "zones"));
  const stallSnap = await getDocs(collection(db, "stalls"));
  
  const batch = writeBatch(db);
  
  zoneSnap.docs.forEach(d => {
    const data = d.data();
    const change = Math.floor((Math.random() - 0.5) * 500);
    const newCount = Math.max(0, Math.min(data.capacity, data.currentCount + change));
    batch.update(d.ref, {
      currentCount: newCount,
      density: newCount / data.capacity
    });
  });

  stallSnap.docs.forEach(d => {
    const data = d.data();
    const change = Math.floor((Math.random() - 0.4) * 5); // Bias towards increasing slightly
    const newQueue = Math.max(0, data.queueSize + change);
    batch.update(d.ref, {
      queueSize: newQueue
    });
  });

  await batch.commit();
}

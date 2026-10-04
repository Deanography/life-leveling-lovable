import type { GateTemplate } from "@/engine/types";

// Dean's 3-day strength and power program (vault: 3-day strength and power training program).
// Weights are the hunter's own numbers; the app carries last session's sets forward as ghost values.
export const GATE_TEMPLATES: GateTemplate[] = [
  {
    id: "lower-power",
    name: "Lower Body Power",
    subtitle: "Squat, RDL, box jumps. Monday.",
    exercises: [
      { name: "Barbell Back Squat", sets: 5, reps: 5, restSec: 180, note: "Drive explosively on the way up. Bar speed is everything." },
      { name: "Romanian Deadlift", sets: 4, reps: 6, restSec: 150, note: "3 seconds down, explode up." },
      { name: "Box Jumps", sets: 4, reps: 5, restSec: 120, note: "Max height. Full reset between reps. Land soft." },
      { name: "Bulgarian Split Squat", sets: 3, reps: 8, restSec: 120, note: "Per leg. Perfect depth wins." },
      { name: "Nordic Curl", sets: 3, reps: 6, restSec: 90, note: "Brutal. Essential." },
      { name: "Standing Calf Raise", sets: 4, reps: 12, restSec: 60, note: "Slow up, pause, slow down." },
    ],
  },
  {
    id: "upper-push-pull",
    name: "Upper Body Push / Pull",
    subtitle: "Bench, pull-ups, OHP, rows. Wednesday.",
    exercises: [
      { name: "Barbell Bench Press", sets: 5, reps: 5, restSec: 180, note: "Full arch, leg drive, bar to lower chest." },
      { name: "Weighted Pull-Ups", sets: 5, reps: 5, restSec: 180, note: "Dead hang to chin over bar. 3 seconds down. Log added kg." },
      { name: "Overhead Press", sets: 4, reps: 6, restSec: 150, note: "Standing only. Core braced." },
      { name: "Pendlay Row", sets: 4, reps: 6, restSec: 150, note: "Dead stop on the floor each rep." },
      { name: "Dumbbell Incline Press", sets: 3, reps: 8, restSec: 120, note: "Log kg per dumbbell." },
      { name: "Face Pulls", sets: 3, reps: 15, restSec: 60 },
    ],
  },
  {
    id: "full-body",
    name: "Full Body Detonation",
    subtitle: "Deadlift, cleans, push press. Friday.",
    exercises: [
      { name: "Deadlift", sets: 5, reps: 3, restSec: 210, note: "Max intent every pull." },
      { name: "Power Clean", sets: 5, reps: 3, restSec: 180, note: "Or hang clean. Speed is the point." },
      { name: "Push Press", sets: 4, reps: 5, restSec: 150 },
      { name: "Farmer's Carry", sets: 4, reps: 40, restSec: 90, note: "Reps = metres. Log kg per hand." },
      { name: "Barbell Hip Thrust", sets: 3, reps: 8, restSec: 120 },
      { name: "Ab Wheel Rollout", sets: 3, reps: 10, restSec: 60 },
    ],
  },
  {
    id: "custom",
    name: "Custom session",
    subtitle: "Start empty, add exercises as you go.",
    exercises: [],
  },
];

export const templateById = (id: string) => GATE_TEMPLATES.find((t) => t.id === id);

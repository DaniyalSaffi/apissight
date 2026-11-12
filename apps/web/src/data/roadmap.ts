/** Roadmap tiers. Only T0 is current work. Everything else is planned or exploring. */
export interface RoadmapTier {
  tier: string;
  name: string;
  status: "Now (Phase 2 pending)" | "Planned" | "Exploring";
  description: string;
}

export const tiers: RoadmapTier[] = [
  {
    tier: "T0",
    name: "Photo disease check",
    status: "Now (Phase 2 pending)",
    description:
      "The two-stage photo check described on the Detector page. Blocked on model conversion, a labelled parity test set, and a passing parity report. No live demo until then.",
  },
  {
    tier: "T1",
    name: "Colony strength from frames",
    status: "Planned",
    description:
      "Estimating colony strength from frame photos. Research context in the FYP report (YOLO-based bee counting, research). No counting model is supplied with this site, so this tier is planned only.",
  },
  {
    tier: "T2",
    name: "Entrance monitoring",
    status: "Exploring",
    description:
      "Camera-based entrance activity: tracking, pollen, wasp and hornet sightings, dead bees. An idea from the master plan, not built work. Needs expert validation before any claim is made.",
  },
  {
    tier: "T3",
    name: "Hive sensing",
    status: "Exploring",
    description:
      "Weight, temperature, humidity, carbon dioxide, and vibration sensing. An idea from the master plan, not built work.",
  },
  {
    tier: "T4",
    name: "Acoustics",
    status: "Exploring",
    description:
      "Listening to hive sounds for health signals. An idea from the master plan, not built work. Not part of the image-based system in the report.",
  },
  {
    tier: "T5",
    name: "Fusion and forecasting",
    status: "Exploring",
    description:
      "Combining photo, sensor, and sound signals into forecasts. An idea from the master plan, not built work.",
  },
  {
    tier: "T6",
    name: "Pathogen-specific imaging",
    status: "Exploring",
    description:
      "Imaging aimed at specific pathogens. An idea from the master plan, not built work. Needs laboratory and expert validation.",
  },
];

export const sitePhases = [
  {
    phase: "Phase 0 — Foundations",
    status: "Done",
    description: "Site structure, design tokens, layout, release banner, noindex, and launch gate.",
  },
  {
    phase: "Phase 1 — Showcase",
    status: "Done",
    description: "All showcase pages filled from the report, with visible placeholders and pending markers for everything unconfirmed.",
  },
  {
    phase: "Phase 2 — Live detector",
    status: "Blocked on parity set and conversion",
    description: "Browser conversion of the two supplied models, a passing parity test, and the full detector interface (queue, history, exports). Scripts and run instructions are in ml/.",
  },
  {
    phase: "Phase 3 and later",
    status: "Planned",
    description: "Accounts and API, a mobile app, continuous monitoring, and a research hub. From the master plan §14. No dates are set.",
  },
];

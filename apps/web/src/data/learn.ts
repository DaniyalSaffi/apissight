/**
 * Learn content. Disease notes are kept to what the FYP report states about
 * visible signs, and the whole page is pending expert review. No treatment or
 * prevention advice is given. No detection figures are shown.
 */
export interface DiseaseNote {
  label: string;
  reportNotes: string[];
  source: string;
  /** Illustrative photo (freely licensed, not project field work). */
  image?: { file: string; alt: string; caption: string };
}

export const diseases: DiseaseNote[] = [
  {
    label: "Varroa Mite Infestation",
    reportNotes: [
      "Caused by the Varroa mite, a parasite visible on bees. The report describes detection from close bee images and severity bands by mite count: light (1–2 mites), moderate (3–5), heavy (6 or more).",
      "The report notes that mites can be hard to see on poor-quality photos. Photo quality matters more than any other single factor.",
    ],
    source: "FYP report §4.5.2",
    image: {
      file: "images/stock/varroa.jpg",
      alt: "A Varroa mite on a bee nymph, magnified",
      caption: "Illustrative image. A Varroa mite on a bee nymph, magnified.",
    },
  },
  {
    label: "Deformed Wing Virus (DWV)",
    reportNotes: [
      "Shows as deformed wings. The report compares wing appearance against healthy wings.",
      "Bees with deformed wings may be unable to fly normally. Early cases can be subtle in photos.",
    ],
    source: "FYP report §4.5.2 (named 'Deformed Wing Disease' in parts of the report; this site uses the labels-file name)",
    image: {
      file: "images/stock/deformed_wing.jpg",
      alt: "A honeybee with deformed wings and a visible Varroa mite",
      caption: "Illustrative image. A honeybee with deformed wings and a visible Varroa mite.",
    },
  },
  {
    label: "Chalkbrood Disease",
    reportNotes: [
      "A brood disease. The report describes recognition from hive and brood images.",
      "The report lists chalkbrood among the three diseases in scope, alongside Varroa and DWV.",
    ],
    source: "FYP report §1.4.2 and §4.5.2",
    image: {
      file: "images/stock/chalkbrood.jpg",
      alt: "Chalkbrood mummies on a hive entrance board, with worker bees",
      caption: "Illustrative image. Chalkbrood mummies on a hive entrance board, with worker bees.",
    },
  },
  {
    label: "Healthy Honey Bee or Healthy Beehive",
    reportNotes: [
      "The Stage 2 'healthy' label means the model found no visible sign of the three diseases above in that photo.",
      "A healthy label is not proof that a colony is disease-free. Some diseases show no visible signs, or signs outside the photo.",
    ],
    source: "Labels file, Stage 2 label 0; FYP report §6.3.1 (limits of visual-only detection)",
    image: {
      file: "images/stock/bee_closeup.jpg",
      alt: "A honeybee, close up",
      caption: "Illustrative image. A honeybee, close up.",
    },
  },
];

/** Photo guidance from the report's input requirements. */
export const photoTips: string[] = [
  "Use a clear, well-lit photo in natural daylight, taken close to the bees or hive (the report suggests 12–18 inches).",
  "Accepted formats in the report's prototype: JPEG, PNG, WebP. Minimum size 640 by 480 pixels.",
  "Avoid blurry, dark, or distant photos. The report's preprocessing checks image quality first, and poor photos give unreliable results.",
  "One subject per photo works best: a single bee, a small group, or one frame area. Do not expect a wide shot of a whole apiary to support a health judgement.",
];

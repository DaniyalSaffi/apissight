/**
 * Learn content. Disease notes are kept to what the FYP report states about
 * visible signs, plus general guidance from the FAO beekeeping manual and
 * university extension sources named per disease. The whole page is pending
 * expert review. Guidance is general information, not a prescription for any
 * colony. No detection figures are shown. Uncertain items (acidified syrup,
 * DWV severe-case destruction advice, DWV variants, a universal mite
 * threshold) are deliberately NOT published here; they are questions for the
 * expert reviewer, not page content.
 */
export interface DiseaseGuidance {
  signs: string[];
  spread: string[];
  firstSteps: string[];
  cautions: string[];
  source: string;
}

export interface DiseaseNote {
  label: string;
  reportNotes: string[];
  source: string;
  /** General guidance from FAO / extension sources, pending expert review. */
  guidance?: DiseaseGuidance;
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
    guidance: {
      signs: [
        "Mites visible on adult bees, on the hive bottom board, or as brown-reddish spots on white pupae after decapping. Most mites hide inside capped brood, so mites seen on adults usually mean a high infestation.",
        "Scattered brood pattern with perforated cappings holding dead bees at the end of metamorphosis.",
        "Deformed bees with stunted abdomens or deformed wings.",
        "Visible signs usually mean a severe infestation is already present.",
      ],
      spread: [
        "Direct contact between bees; drifting bees and drones entering other hives; robbing of infested hives; mites passed at flowers.",
        "Beekeeper actions: moving parasitised bees or brood combs, and migratory beekeeping with infested colonies.",
      ],
      firstSteps: [
        "Count mites before deciding: 24-hour natural mite fall on the bottom board, or an alcohol wash, soapy wash, or sugar-shake sample. Sample regularly through the season.",
        "Compare counts with a local threshold. No single number applies everywhere: thresholds vary by area and season, so track mite fall against colony losses in your own apiaries. A US extension figure of about 2 mites per 100 bees is US guidance only, not a rule for Pakistan.",
        "Use integrated pest management: combine biotechnical methods (drone-brood removal, brood breaks, screened bottom boards) with acaricides. Treat all colonies in the apiary at the same time, use only products registered for bees, never treat during nectar flow, and rotate active ingredients to slow resistance.",
        "Monitor mite fall after treatment to check it worked.",
      ],
      cautions: [
        "A photo alone cannot confirm how heavy an infestation is. Counting is needed.",
        "Do not use plant-registered pesticides on bees.",
      ],
      source:
        "FAO (2020), Good beekeeping practices, Ch. 3; Penn State Extension, Methods to Control Varroa Mites. Accessed 12 Nov 2026. Pending expert review.",
    },
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
    guidance: {
      signs: [
        "Stubby, flightless or deformed wings; shortened, rounded, darkened abdomens; leg and wing paralysis; smaller body size; very short life.",
        "Obvious symptoms usually indicate a severe infection. Deformed wings often appear with Parasitic Mite Syndrome: spotty brood, sunken larvae, removed cappings, and a dwindling adult population.",
        "Many infected colonies show no visible symptoms. Deformed wings alone do not prove DWV: the same signs appear with heavy Varroa.",
      ],
      spread: [
        "Mainly through Varroa mites, which carry the virus between bees and drive it to damaging levels. Controlling mites is the main control for DWV.",
        "Also through faeces, royal jelly, saliva, contaminated food and flowers, queen-to-brood, and beekeeper movement of frames and equipment.",
      ],
      firstSteps: [
        "Control Varroa first: uncontrolled mite populations are the main driver of DWV infections. Follow the Varroa steps above.",
        "There is no specific treatment for the virus itself. No chemical treatment for viral infections is commercially available.",
        "Reduce spread and stress: do not move frames from symptomatic colonies, clean tools and equipment after inspecting them, keep colonies well fed, and rotate out old combs.",
        "Exact diagnosis needs PCR testing in a specialised laboratory.",
      ],
      cautions: [
        "A low mite count at the time deformed wings appear does not rule out DWV: mites and virus were probably both involved earlier.",
        "Experimental findings (thymol, propolis, fungal extracts) are not commercially available treatments and are not advice here.",
      ],
      source:
        "FAO (2020), Good beekeeping practices, Ch. 12; Penn State Extension, Viruses in Honey Bees. Accessed 12 Nov 2026. Pending expert review.",
    },
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
    guidance: {
      signs: [
        "Mummified larvae: soft at first, taking the hexagonal shape of the cell, then drying hard. White to grey-black in colour.",
        "Mummies found in brood combs, on the bottom board, or at the hive entrance — often described as 'little stones'.",
        "Brood at frame edges and drone brood are hit hardest. Weaker, less-populated colonies are more susceptible.",
        "Chalkbrood mummies sit loose in the cell and feel sponge-like; stonebrood mummies are hard to crush and stick to the cell walls. The two must not be confused — get an expert check if unsure.",
      ],
      spread: [
        "Larvae ingest spores with food; spores germinate in the gut and larvae usually die after capping. Each dead larva produces billions of spores.",
        "Between hives through robbing, drifting, shared water, and contaminated equipment or combs. Spores can stay infectious in equipment and soil for many years.",
        "Favoured by chilled brood, low temperatures, high humidity, poor ventilation, and weak colonies.",
      ],
      firstSteps: [
        "There is no recommended chemical treatment. Colonies often recover on their own as the population grows under favourable conditions.",
        "Improve husbandry: sunny, dry hive sites with ventilation that does not chill the brood; avoid long cold inspections and poorly timed splits; keep food reserves up.",
        "Requeen with resistant stock where available, support hygienic behaviour (quick mummy removal), never transfer combs from infected colonies, and replace old brood comb regularly.",
        "Check colony strength and Varroa levels too: chalkbrood is stress-related and weaker colonies suffer more.",
      ],
      cautions: [
        "Colour alone does not stage the disease precisely.",
        "Spore persistence makes eradication impossible; management is about keeping colonies strong, not eliminating every spore.",
      ],
      source:
        "FAO (2020), Good beekeeping practices, Ch. 10; UF/IFAS Extension, Chalkbrood Recommendations (ENY116/AA138). Accessed 12 Nov 2026. Pending expert review.",
    },
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

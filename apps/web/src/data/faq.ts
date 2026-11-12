/** FAQ answers. No invented facts, no processing-time claims. Accuracy answers point to the reported-results section. */
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "What does the detector do?",
    answer:
      "It checks a photo in two stages. Stage 1 asks whether the photo shows a honeybee or a beehive. Only photos that pass Stage 1 go to Stage 2, which assigns one of four labels: Healthy, Deformed Wing Virus (DWV), Varroa Mite Infestation, or Chalkbrood Disease. Photos that fail Stage 1 never reach Stage 2. The live detector is not yet available; the models are being verified.",
  },
  {
    question: "Is this a diagnosis?",
    answer:
      "No. The detector is decision support only. Confirm any result with a qualified apiary inspector or lab. Some bee diseases must be reported to authorities. The system cannot detect diseases that show no visible signs in a photo, and early or subtle cases are the hardest to judge from images alone.",
  },
  {
    question: "How accurate is it?",
    answer:
      "Reported project results from the final report and the project poster are published on the Research page, each with its exact source. Three values are withheld until the team confirms in writing that each was independently measured in this project and on which test set. None of those figures describes the two demo models. The demo models will be measured only after the parity run, and only those measured figures will appear on the Models and data page.",
  },
  {
    question: "Does it count bees or assess colony strength?",
    answer:
      "No. The live detector planned here classifies photos only. YOLO-based bee counting (research) and colony-strength assessment from images are research context from the report and are labelled as planned work on the Roadmap page. No counting model is part of the demo.",
  },
  {
    question: "Which diseases does it cover?",
    answer:
      "Three, plus a healthy label: Deformed Wing Virus (DWV), Varroa Mite Infestation, and Chalkbrood Disease. It does not detect Nosema, foulbrood, or other conditions. The Learn page explains what the labels mean and is pending expert review.",
  },
  {
    question: "Are my photos uploaded?",
    answer:
      "No. Images are analysed on your device and are not uploaded. The detector interface is built, but the models are not loaded yet, so no analysis runs yet. See the Privacy page.",
  },
  {
    question: "Who built this?",
    answer:
      "A final-year project team at the Department of Computer Science, Namal University, with SAWiE Ecosystem as industrial partner. Names on the Team page are shown with consent status for each person.",
  },
  {
    question: "Where is the research paper?",
    answer:
      "The paper is under review. No title, abstract, figures, or full text are published here until the team confirms the journal and what its sharing policy allows.",
  },
  {
    question: "Can I use the models or the code?",
    answer:
      "No licence, open-source, or patent claim is made on this site. Ownership and licensing between the university, the industry partner, and the team are not yet confirmed. Do not assume any model, image, or text here may be reused until that decision is published.",
  },
  {
    question: "How do I contact the team?",
    answer:
      "Email, LinkedIn, and WhatsApp details are on the Contact page. The message form is still a placeholder and sends nothing until a form service is connected.",
  },
];

/** Journey timeline. Dates the report does not state are placeholders. */
export interface TimelineEntry {
  dateLabel: string;
  title: string;
  body: string;
  status?: "certificate to be added" | "photos to be added" | "placeholder" | "confirmed";
}

export const timeline: TimelineEntry[] = [
  {
    dateLabel: "2021–2025",
    title: "Degree cohort",
    body: "BSc Computer Science cohort, Department of Computer Science, Namal University. (FYP report, title page.)",
    status: "confirmed",
  },
  {
    dateLabel: "[PLACEHOLDER: project start date]",
    title: "Project starts",
    body: "The final-year project begins. The report gives no start date.",
    status: "placeholder",
  },
  {
    dateLabel: "[PLACEHOLDER: date]",
    title: "Industry collaboration with SAWiE Ecosystem",
    body: "SAWiE Ecosystem is the project's industrial partner, providing mentorship and technical guidance. Fritz Böhmler visited Namal University and the team collaborated by video call. (FYP report §1.8.) Dates are not stated in the report.",
    status: "placeholder",
  },
  {
    dateLabel: "[PLACEHOLDER: dates]",
    title: "Workshops and site visits at HBRI and NARC, Islamabad",
    body: "Team statement: workshops and site visits at the Honeybee Research Institute (HBRI) and the National Agricultural Research Centre (NARC), Islamabad. Dates, photos, and written confirmations are still to be supplied.",
    status: "photos to be added",
  },
  {
    dateLabel: "May 2025",
    title: "Innovative Lyallpur 3.0",
    body: "National project expo at The University of Faisalabad. The team's placing is a team statement; certificate to be added. See the Awards page.",
    status: "certificate to be added",
  },
  {
    dateLabel: "31 May 2025",
    title: "AgriFusion 2025",
    body: "National Symposium on Agricultural Innovation at Namal University, organised by ORIC. The team's placing is a team statement; certificate to be added. See the Awards page.",
    status: "certificate to be added",
  },
  {
    dateLabel: "[PLACEHOLDER: submission date]",
    title: "Research paper under review",
    body: "The research paper is under review. No title, abstract, or journal name is published here until the team confirms what may be shared.",
    status: "placeholder",
  },
  {
    dateLabel: "[PLACEHOLDER: date]",
    title: "Website early release",
    body: "This site is built from the final-year project report and the two supplied models. The live detector follows once model conversion and parity testing are complete.",
    status: "placeholder",
  },
];

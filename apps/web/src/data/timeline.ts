/** Journey timeline. Dates come from the report or public sources; tentative dates are marked approx. */
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
    dateLabel: "approx. Sep 2024",
    title: "Project starts",
    body: "The final-year project begins. The report gives no start date; September 2024 is taken from a team member's CV and is tentative.",
    status: "placeholder",
  },
  {
    dateLabel: "Date to be added",
    title: "Industry collaboration with SAWiE Ecosystem",
    body: "SAWiE Ecosystem is the project's industrial partner, providing mentorship and technical guidance. Fritz Böhmler visited Namal University and the team collaborated by video call. (FYP report §1.8.) Dates are not stated in the report, and no public source states a start date.",
    status: "placeholder",
  },
  {
    dateLabel: "Date to be added",
    title: "Workshops and site visits at HBRI and NARC, Islamabad",
    body: "Team statement: workshops and site visits at the Honeybee Research Institute (HBRI) and the National Agricultural Research Centre (NARC), Islamabad. Dates, photos, and written confirmations are still to be supplied.",
    status: "photos to be added",
  },
  {
    dateLabel: "24 May 2025",
    title: "Namal Open House & Career Fair 2025",
    body: "11th Open House and 2nd Career Fair at Namal University, where final-year projects were showcased. The project is listed in the CDC Open House 2025 projects under its full report title. (Namal event page; CDC listing.)",
    status: "confirmed",
  },
  {
    dateLabel: "approx. 29 May 2025",
    title: "Innovative Lyallpur 3.0",
    body: "National project expo at The University of Faisalabad. The date is tentative (a participating university's album page; the organiser's blog gives no date). The team's placing is a team statement; certificate to be added. See the Awards page.",
    status: "certificate to be added",
  },
  {
    dateLabel: "31 May 2025",
    title: "AgriFusion 2025",
    body: "National Symposium on Agricultural Innovation at Namal University, organised by ORIC. The team's placing is a team statement; certificate to be added. See the Awards page.",
    status: "certificate to be added",
  },
  {
    dateLabel: "29 Nov 2025",
    title: "3rd Convocation, Class of 2025",
    body: "Namal University's 3rd Convocation for the Class of 2025. (Event listing: 29 Nov 2025; a Namal recap is dated 4 Dec 2025.)",
    status: "confirmed",
  },
  {
    dateLabel: "Date to be added",
    title: "Research paper under review",
    body: "The research paper is under review. No title, abstract, or journal name is published here until the team confirms what may be shared.",
    status: "placeholder",
  },
  {
    dateLabel: "Date to be added",
    title: "Website early release",
    body: "This site is built from the final-year project report and the two supplied models. The live detector follows once model conversion and parity testing are complete.",
    status: "placeholder",
  },
];

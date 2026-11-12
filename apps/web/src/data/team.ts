/**
 * Team data. Names and roles follow the FYP report plus owner decisions of
 * 2026-11-12. Inclusion of every person named here is confirmed by the
 * project lead, 12 Nov 2026 (a statement by the project lead; written
 * confirmations can be added later). Student IDs are never shown. No bios,
 * photos, or quotes are shown; none were supplied.
 * Both co-supervisors are listed: Shehzad Arif and Fritz Böhmler
 * (industry partner). Role order follows the project lead's decision:
 * supervisor, co-supervisors, then the two students.
 * See the local open-items list (TEAM-1 to TEAM-5), kept outside the repo.
 */
export type ConsentStatus = "pending" | "verbal" | "confirmed";

export interface TeamMember {
  name: string;
  role: string;
  source: string;
  consent: ConsentStatus;
  consentNote: string;
  bio: string | null;
  photo: string | null;
  links: { email: string | null; github: string | null; linkedin: string | null };
}

const CONFIRMED_NOTE =
  "Confirmed by the project lead, 12 Nov 2026. Written confirmations can be added later.";

export const team: TeamMember[] = [
  {
    name: "Mr. Muhammad Bilal",
    role: "Supervisor",
    source: "FYP report, Declaration (p. i) and Acknowledgments (p. ii)",
    consent: "confirmed",
    consentNote: CONFIRMED_NOTE,
    bio: null,
    photo: null,
    links: { email: null, github: null, linkedin: null },
  },
  {
    name: "Mr. Shehzad Arif",
    role: "Co-supervisor",
    source: "FYP report, Acknowledgments (p. ii)",
    consent: "confirmed",
    consentNote: CONFIRMED_NOTE,
    bio: null,
    photo: null,
    links: { email: null, github: null, linkedin: null },
  },
  {
    name: "Mr. Fritz Böhmler",
    role: "Co-supervisor (industry partner), CEO and Managing Director, SAWiE Ecosystem",
    source:
      "Project poster (co-supervisor line) and owner decision of 12 Nov 2026. The report names him as SAWiE CEO (§1.8).",
    consent: "confirmed",
    consentNote: CONFIRMED_NOTE,
    bio: null,
    photo: null,
    links: { email: null, github: null, linkedin: null },
  },
  {
    name: "Muhammad Daniyal Saffi",
    role: "Co-author and project lead",
    source: "FYP report, title page and Declaration (p. i). Full name form confirmed by the owner on 12 Nov 2026; short form M. Daniyal Saffi is used in credits.",
    consent: "confirmed",
    consentNote: "Project lead. Publication of name and contact details confirmed by the person.",
    bio: null,
    photo: null,
    links: {
      email: "daniyals0316@gmail.com",
      github: null,
      linkedin: "https://www.linkedin.com/in/muhammad-daniyal-saffi-91320322a",
    },
  },
  {
    name: "Amina Ahmad",
    role: "Co-author and project partner",
    source: "FYP report, title page and Declaration (p. i)",
    consent: "confirmed",
    consentNote: CONFIRMED_NOTE,
    bio: null,
    photo: null,
    links: { email: null, github: null, linkedin: null },
  },
];

/**
 * Awards data. Organiser-confirmed facts and team statements are kept separate.
 * Team placings are statements by the project team, never verified facts;
 * certificates are to be added.
 * Team statements below are the project lead's words of 12 Nov 2026, recorded
 * exactly. See the local research notes (entries #19–#25, #43–#46) and the
 * local open-items list (AWARD-1, AWARD-2).
 */
export interface Award {
  event: string;
  organiser: string;
  eventDate: string;
  organiserFacts: string;
  organiserUrl: string;
  teamClaim: string;
  status: "certificate to be added";
  openQuestions: string[];
}

export const awards: Award[] = [
  {
    event: "AgriFusion 2025",
    organiser: "Office of Research, Innovation, and Commercialization (ORIC), Namal University, Mianwali",
    eventDate: "31 May 2025 (organiser-confirmed)",
    organiserFacts:
      "National Symposium on Agricultural Innovation: 'Multidisciplinary Technologies and Innovations for Sustainable Agriculture'. The programme included student-led agricultural projects, an idea pitch competition, panel discussions, and industry stalls. The organiser page checked names no winners. A Namal recap post lists the prizes (Idea Pitch Rs 200,000; FYP Exhibition Rs 15,000, Rs 10,000, and Rs 5,000) but names no winners.",
    organiserUrl:
      "https://namal.edu.pk/event/agrifusion-2025-highlights-multidisciplinary-innovations-for-a-sustainable-agricultural-future-0862",
    teamClaim:
      "Our team took 1st place in the overall AgriFusion competition, 1st in the Idea Pitch, and the Best Project category. (Statement by the project lead, 12 Nov 2026. Exact titles to be confirmed against the certificate or result page.)",
    status: "certificate to be added",
    openQuestions: [
      "Certificate or organiser result page needed to confirm the exact titles.",
      "The organiser page describes a faculty idea pitch competition; the certificate must confirm which competition the team's placing was in.",
      "Photo permission, if a certificate photo is published.",
    ],
  },
  {
    event: "Innovative Lyallpur 3.0",
    organiser:
      "Department of Computer Sciences, The University of Faisalabad (TUF), with IEEE TUF Student Branch, IEEE ComSoc Lahore, and IEEE Faisalabad Sub-Section",
    eventDate: "approx. 29 May 2025 (tentative; organiser coverage dated 30 May 2025)",
    organiserFacts:
      "National project expo and innovation summit. The organiser's blog describes over 250 final-year projects from more than 35 universities, and publishes three prizes only: 1st Islamia University of Bahawalpur, 2nd Khawaja Fareed University of Engineering & IT, 3rd The University of Faisalabad. No 4th place is published. A HunarNama article states the University of Southern Punjab clinched 4th position. No public source links this team to the event.",
    organiserUrl:
      "https://blog.tuf.edu.pk/innovative-lyallpur-3-0-empowering-pakistans-youth-through-technology-and-innovation/",
    teamClaim:
      "Our team was 4th. Scope, overall or category, to be confirmed. (Statement by the project lead, 12 Nov 2026.)",
    status: "certificate to be added",
    openQuestions: [
      "Scope: 4th overall, or 4th in a category or track? A HunarNama article credits 4th place to the University of Southern Punjab; the certificate must confirm this team's placing and scope.",
      "Certificate, organiser link, or photo needed. The 29 May 2025 date is tentative (a participating university's album page) and needs organiser confirmation.",
    ],
  },
];

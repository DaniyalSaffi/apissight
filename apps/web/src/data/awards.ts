/**
 * Awards data. Organiser-confirmed facts and team statements are kept separate.
 * Team placings are statements by the project team, never verified facts;
 * certificates are to be added.
 * Team statements below are the project lead's words of 12 Nov 2026, recorded
 * exactly. See the local research notes (entries #19–#25) and the local
 * open-items list (AWARD-1, AWARD-2).
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
      "National Symposium on Agricultural Innovation: 'Multidisciplinary Technologies and Innovations for Sustainable Agriculture'. The programme included student-led agricultural projects, an idea pitch competition, panel discussions, and industry stalls. The organiser page checked names no winners.",
    organiserUrl:
      "https://namal.edu.pk/event/agrifusion-2025-highlights-multidisciplinary-innovations-for-a-sustainable-agricultural-future-0862",
    teamClaim:
      "Our team took 1st place in the overall AgriFusion competition, 1st in the Idea Pitch, and the Best Project category. (Statement by the project lead, 12 Nov 2026. Exact titles to be confirmed against the certificate or result page.)",
    status: "certificate to be added",
    openQuestions: [
      "Certificate or organiser result page needed to confirm the exact titles.",
      "Photo permission, if a certificate photo is published.",
    ],
  },
  {
    event: "Innovative Lyallpur 3.0",
    organiser:
      "Department of Computer Sciences, The University of Faisalabad (TUF), with IEEE TUF Student Branch, IEEE ComSoc Lahore, and IEEE Faisalabad Sub-Section",
    eventDate: "Date to be confirmed (organiser coverage dated 30 May 2025)",
    organiserFacts:
      "National project expo and innovation summit. The organiser's blog describes over 250 final-year projects from more than 35 universities, and publishes three prizes only: 1st Islamia University of Bahawalpur, 2nd Khawaja Fareed University of Engineering & IT, 3rd The University of Faisalabad. No 4th place is published.",
    organiserUrl:
      "https://blog.tuf.edu.pk/innovative-lyallpur-3-0-empowering-pakistans-youth-through-technology-and-innovation/",
    teamClaim:
      "Our team was 4th. Scope, overall or category, to be confirmed. (Statement by the project lead, 12 Nov 2026.)",
    status: "certificate to be added",
    openQuestions: [
      "Scope: 4th overall, or 4th in a category or track? The certificate must say.",
      "Exact event date and certificate, organiser link, or photo needed.",
    ],
  },
];

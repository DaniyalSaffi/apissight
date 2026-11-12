/**
 * Single source of truth for brand, domain, base path, links, and contact details.
 * The brand name lives ONLY here. To rename the site, change `name` below
 * (and the repository name). Do not hard-code the brand name in pages.
 *
 * Name decided by the owner on 2026-11-12: "ApisSight". A public web check on
 * 2026-11-12 found no exact-name product, website, social handle, or trademark
 * for ApisSight (see the local research notes, kept outside the public repo).
 * That check is not legal clearance. Formal trademark and domain clearance is
 * still open (local open-items list, BRAND-1). Do not buy a domain, create
 * accounts, or file anything under this name until clearance is done.
 */

export const SITE = {
  /** Project name, decided 2026-11-12. See note above. */
  name: "ApisSight",
  workingName: false,
  tagline: "Healthy hives, sharper eyes.",
  description:
    "AI-assisted honeybee disease detection and colony-health monitoring, built from a final-year project at Namal University. A photo check that supports, but never replaces, inspection by a qualified apiary expert.",
  /** Search-engine indexing. ONE-LINE SWITCH: keep `false` until the owner
   * flips it to `true` after the certificates and the converted models are
   * in. While false, every page carries a noindex meta tag. */
  allowIndexing: false,
  /** Early-release banner. Keep `true` until the owner approves the full
   * launch. While true, every page shows the early-release banner. */
  earlyRelease: true,
  /** Base location of the converted model files. Default: served from this
   * site under /models. Set to a full https URL to serve from a release or
   * an external host (see docs/MODEL_PUBLISHING.md) after the IP decision
   * is recorded. Use modelHref() below to build model URLs. */
  modelBaseUrl: "/models",
  /** Set from the environment at build time (GitHub Pages variables).
   * Defaults are safe for local preview. */
  siteUrl: "https://example.github.io",
  /** Base path, e.g. "/<repo>" on GitHub Pages. Overridden by Astro `base`. */
  basePath: "/",
  /** Default language. German and Urdu structure exists with needsReview flags. */
  defaultLang: "en",
  languages: [
    { code: "en", label: "English", dir: "ltr", status: "current" },
    { code: "de", label: "Deutsch", dir: "ltr", status: "needsReview" },
    { code: "ur", label: "اردو", dir: "rtl", status: "needsReview" },
  ],
  /** Contact details, confirmed for publication by the owner on 2026-11-12. */
  contactEmail: "daniyals0316@gmail.com",
  /**
   * Message form service. Web3Forms: the access key is embedded in the
   * Contact page (its documented client-side model) and restricted to this
   * site's domain in the Web3Forms dashboard. While `accessKey` is empty,
   * the form renders disabled with an honest "being set up" state and sends
   * nothing. The owner creates the key with his email and supplies it; only
   * then does the form send. Never invent a key.
   */
  contactForm: {
    provider: "web3forms",
    endpoint: "https://api.web3forms.com/submit",
    accessKey: "",
  },
  socials: {
    github: null,
    linkedin: "https://www.linkedin.com/in/muhammad-daniyal-saffi-91320322a",
    youtube: null,
    instagram: null,
    x: null,
  },
  /**
   * WhatsApp click-to-chat. The phone number is shown as text on the Contact
   * page only, never in meta tags, JSON-LD, or the sitemap. The footer links
   * to this chat URL without showing the number.
   */
  whatsapp: {
    displayNumber: "+92 316 7078770",
    chatUrl:
      "https://wa.me/923167078770?text=Hello%2C%20I%20found%20the%20ApisSight%20project%20website%20and%20would%20like%20to%20get%20in%20touch.",
  },
  /** Public research links (see the local research notes). Link only; no
   * copied photos, logos, or text. */
  links: {
    sawieWebsite: "https://sawie.net/",
    sawieAbout: "https://sawie.net/about/",
    sawieCeoAnnouncement:
      "https://sawie.net/sawie-welcomes-mr-fritz-bholmar-as-new-ceo/",
    namalUniversity: "https://namal.edu.pk/",
    parc: "https://www.parc.gov.pk/",
    parcHbriNews:
      "https://www.parc.gov.pk/NewsDetail/NWMyYWQzYmQtMWI3NS00Y2FjLThjNWEtYjJlM2IzNDk2MzBh",
    agrifusion2025:
      "https://namal.edu.pk/event/agrifusion-2025-highlights-multidisciplinary-innovations-for-a-sustainable-agricultural-future-0862",
    lyallpur30:
      "https://blog.tuf.edu.pk/innovative-lyallpur-3-0-empowering-pakistans-youth-through-technology-and-innovation/",
  },
  partner: {
    name: "SAWiE Ecosystem",
    fullName: "Sustainable Agriculture, Water & Intelligent Ecosystem",
    /** Description drafted from public sources. Name, description, and link
     * approved: confirmed by the project lead, 12 Nov 2026. */
    descriptionPendingApproval: false,
  },
  person: {
    /** Title as used by SAWiE and Namal University. Confirmed by the project
     * lead, 12 Nov 2026. */
    boehmlerTitle: "CEO and Managing Director",
  },
  disclaimer:
    "Confirm with a qualified apiary inspector or lab. Some bee diseases must be reported to authorities.",
  privacyNote:
    "Your images are analysed on your device and are not uploaded.",
} as const;

/** Prefix a site path with the build base path (GitHub Pages repo path). */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") return cleanBase === "" ? "/" : `${cleanBase}/`;
  return `${cleanBase}${cleanPath}`;
}

/** Build a URL for a converted model file. Absolute modelBaseUrl values
 * (release or external host) are used as-is; relative values are resolved
 * through href() so the GitHub Pages base path applies. */
export function modelHref(path: string): string {
  const base = SITE.modelBaseUrl.replace(/\/$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(base)) return `${base}${clean}`;
  return href(`${base}${clean}`);
}

export type LangCode = "en" | "de" | "ur";

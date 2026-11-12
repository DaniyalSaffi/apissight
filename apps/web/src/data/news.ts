/**
 * News posts. Facts only: a post appears here only after something real
 * happened, with the real date. Nothing is invented to fill this list.
 * The RSS feed (pages/rss.xml.ts) reads the same data.
 */
export interface NewsPost {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD) of the event, not the writing date. */
  date: string;
  summary: string;
  body: string[];
  links: Array<{ label: string; path: string }>;
}

export const newsPosts: NewsPost[] = [
  {
    slug: "early-release-live-parity-passed",
    title: "Early release live; browser models pass parity testing",
    date: "2026-11-12",
    summary:
      "The ApisSight site is live in early release. The detector interface is built, and the converted models passed parity testing against the original Python pipeline on 32 images.",
    body: [
      "The early-release site went live on 12 November 2026. It carries the project story, the research summary, the team, and the detector interface.",
      "The detector interface — photo queue, history, exports, and charts — is built and runs in the browser. The converted models passed parity testing the same day: on 32 unlabelled images, the browser build agreed with the original Python pipeline on every top prediction for both stages, with maximum probability differences of 0.000001 (Stage 1) and 0.000003 (Stage 2). Parity is agreement between backends, not accuracy; the test set carries no verified labels.",
      "The models are not published yet. The live demo stays in its coming-soon state until the team decides how the converted models will be published. The research paper remains under review.",
    ],
    links: [
      { label: "Detector", path: "/detector" },
      { label: "Models & data", path: "/models-data" },
      { label: "Research", path: "/research" },
    ],
  },
];

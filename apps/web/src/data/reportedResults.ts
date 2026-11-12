/**
 * Reported project results, published by owner decision of 2026-11-12.
 * Every figure below was verified against the report text or the project
 * poster, and carries its exact source. Figures describe the project AS
 * REPORTED. They do NOT describe the two supplied demo models, which have
 * not been measured yet. See the Research page for the full framing.
 *
 * Withheld by owner decision: three values that also appear in the report's
 * literature review as other researchers' results. They are NOT printed
 * anywhere in this file or on the site. They stay withheld until the owner
 * confirms in writing that each was independently measured in this project
 * and on which test set. Do not add them back without that confirmation.
 * Processing-time figures are never published (owner decision, 2026-11-12).
 * No counting-model version number is shown anywhere (owner decision).
 */

export interface ReportedResult {
  figure: string;
  value: string;
  measures: string;
  source: string;
  /** Shown in the headline block first; all other rows sit in collapsed
   * chapter sections. Headline rows are the most conservative,
   * independently tested figures (owner decision, 2026-11-12). */
  headline?: boolean;
}

export interface ReportedResultGroup {
  group: string;
  note: string | null;
  rows: ReportedResult[];
}

export const reportedResults: ReportedResultGroup[] = [
  {
    group: "Final report, Chapter 4 — method and model design",
    note: "Table 4.3 and Table 4.5 each contain values withheld under the rule above. Only the values shown here are published from those tables.",
    rows: [
      { figure: "Binary classifier, precision", value: "97.2%", measures: "Share of photos labelled bee/hive that were actually bee/hive, in the binary classifier check.", source: "Report, Table 4.3 (Ch. 4)" },
      { figure: "Binary classifier, recall", value: "95.9%", measures: "Share of actual bee/hive photos the binary classifier found.", source: "Report, Table 4.3 (Ch. 4)" },
      { figure: "Binary classifier, F1 score", value: "96.5%", measures: "Combined precision/recall score for the binary classifier.", source: "Report, Table 4.3 (Ch. 4)" },
      { figure: "Varroa detection rate", value: "91.3%", measures: "Visible mites detected in high-quality images.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Varroa false positive rate", value: "3.7%", measures: "Share of mite-free cases wrongly flagged as Varroa.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Deformed wing sensitivity", value: "87.9%", measures: "Obvious wing deformities detected.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Deformed wing specificity", value: "93.4%", measures: "Healthy wings correctly identified as healthy.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Chalkbrood recognition rate", value: "89.7%", measures: "Chalkbrood-affected cells identified.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Chalkbrood false discovery rate", value: "4.2%", measures: "Share of chalkbrood flags that were wrong.", source: "Report, §4.5.2 (Ch. 4)" },
      { figure: "Counting, mean absolute error", value: "±8.3 bees", measures: "Average counting error for populations under 200 bees.", source: "Report, Table 4.5 (Ch. 4)" },
      { figure: "Counting, detection recall", value: "91.2%", measures: "Share of visible bees identified in counting.", source: "Report, Table 4.5 (Ch. 4)" },
    ],
  },
  {
    group: "Final report, Chapter 5 — results and comparison",
    note: "The MobileNet disease-detection row of Table 5.1 is withheld under the rule above. Counting-model rows are shown without a version number.",
    rows: [
      { figure: "Population analysis accuracy (MobileNet)", value: "90.0%", measures: "Accuracy on the bee population analysis task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Population analysis precision (MobileNet)", value: "88.5%", measures: "Precision on the bee population analysis task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Population analysis recall (MobileNet)", value: "91.2%", measures: "Recall on the bee population analysis task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Disease detection accuracy (YOLO-based)", value: "92.0%", measures: "Accuracy on the disease detection task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Disease detection precision (YOLO-based)", value: "90.8%", measures: "Precision on the disease detection task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Disease detection recall (YOLO-based)", value: "93.1%", measures: "Recall on the disease detection task.", source: "Report, Table 5.1 (Ch. 5)" },
      { figure: "Varroa Mites accuracy (MobileNet)", value: "89.2%", measures: "Per-category accuracy, 1,247 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Varroa Mites accuracy (YOLO-based)", value: "94.5%", measures: "Per-category accuracy, 1,247 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Chalkbrood accuracy (MobileNet)", value: "83.7%", measures: "Per-category accuracy, 567 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Chalkbrood accuracy (YOLO-based)", value: "88.9%", measures: "Per-category accuracy, 567 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Deformed Wing Disease accuracy (MobileNet)", value: "86.4%", measures: "Per-category accuracy, 792 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Deformed Wing Disease accuracy (YOLO-based)", value: "91.3%", measures: "Per-category accuracy, 792 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Healthy Bees accuracy (MobileNet)", value: "95.8%", measures: "Per-category accuracy, 2,103 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Healthy Bees accuracy (YOLO-based)", value: "96.7%", measures: "Per-category accuracy, 2,103 samples.", source: "Report, Table 5.3 (Ch. 5)" },
      { figure: "Cross-validation, population analysis", value: "89.8% (±1.2%)", measures: "5-fold cross-validation mean and standard deviation.", source: "Report, §5.8.1 (Ch. 5)" },
      { figure: "Cross-validation, disease detection (MobileNet)", value: "86.5% (±1.8%)", measures: "5-fold cross-validation mean and standard deviation.", source: "Report, §5.8.1 (Ch. 5)" },
      { figure: "Cross-validation, disease detection (YOLO-based)", value: "91.7% (±1.4%)", measures: "5-fold cross-validation mean and standard deviation.", source: "Report, §5.8.1 (Ch. 5)" },
    ],
  },
  {
    group: "Final report, Chapter 11 — prototype testing",
    note: "Chapter 11 describes prototype-stage testing on a smaller dataset than Chapter 4. Its figures differ from Chapters 4 and 5. Both sets are shown, with sources, rather than merged.",
    rows: [
      { figure: "Varroa Mite accuracy", value: "87.3%", measures: "Per-category accuracy in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Varroa Mite precision", value: "89.1%", measures: "Per-category precision in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Varroa Mite recall", value: "85.2%", measures: "Per-category recall in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Deformed Wing Disease accuracy", value: "82.7%", measures: "Per-category accuracy in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Deformed Wing Disease precision", value: "84.5%", measures: "Per-category precision in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Deformed Wing Disease recall", value: "81.3%", measures: "Per-category recall in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Chalkbrood accuracy", value: "85.9%", measures: "Per-category accuracy in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Chalkbrood precision", value: "88.2%", measures: "Per-category precision in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Chalkbrood recall", value: "83.7%", measures: "Per-category recall in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Healthy Bees accuracy", value: "91.4%", measures: "Per-category accuracy in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Healthy Bees precision", value: "92.8%", measures: "Per-category precision in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Healthy Bees recall", value: "90.1%", measures: "Per-category recall in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Overall average accuracy", value: "86.8%", measures: "Overall average across categories in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Overall average precision", value: "88.7%", measures: "Overall average precision in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Overall average recall", value: "85.1%", measures: "Overall average recall in prototype testing.", source: "Report, Table 11.1 (§11.4.2, Ch. 11)" },
      { figure: "Cross-validation average accuracy", value: "86.2% (±3.4%)", measures: "5-fold cross-validation on training data.", source: "Report, §11.4.3 (Ch. 11)", headline: true },
      { figure: "Real-image accuracy", value: "79.3%", measures: "Accuracy on 200 new bee images not in the training set.", source: "Report, §11.4.3 (Ch. 11)", headline: true },
      { figure: "Expert agreement", value: "76%", measures: "Agreement with expert assessments on 50 sample predictions.", source: "Report, §11.4.3 (Ch. 11)", headline: true },
      { figure: "Counting, average error", value: "±12 bees", measures: "Average counting error for populations up to 200.", source: "Report, Ch. 11, counting text following Table 11.1" },
      { figure: "Counting, mean absolute percentage error", value: "11.5%", measures: "Counting error as a percentage.", source: "Report, Ch. 11, counting text following Table 11.1" },
      { figure: "Expert validation agreement", value: "72%", measures: "Agreement between system and expert assessment, 40 images (25 with known disease conditions, 15 healthy hives).", source: "Report, §11.8.1 (Ch. 11)", headline: true },
      { figure: "Expert validation agreement, clear cases", value: "84%", measures: "Agreement on clear, obvious cases.", source: "Report, §11.8.1 (Ch. 11)", headline: true },
      { figure: "Expert validation agreement, subtle cases", value: "58%", measures: "Agreement on subtle or early-stage disease cases.", source: "Report, §11.8.1 (Ch. 11)", headline: true },
      { figure: "Field image processing success", value: "94%", measures: "Share of 50 real apiary images processed successfully; 3 failed on quality.", source: "Report, §11.8.2 (Ch. 11)" },
      { figure: "Manual inspection accuracy (experienced inspector)", value: "95%+", measures: "Manual accuracy in the manual-vs-automated comparison.", source: "Report, §11.9.1 (Ch. 11)" },
    ],
  },
  {
    group: "Final report, Chapter 12 — conclusions",
    note: "Chapter 12 restates three summary figures. Its disease-detection figure is withheld under the rule above. Note that Chapter 12 assigns the population and classification figures differently from Chapter 5; both wordings are shown with their sources and are not merged.",
    rows: [
      { figure: "Bee classification accuracy", value: "90%", measures: "Distinguishing bees from other objects, as summarised in the conclusions.", source: "Report, §12.2 (Ch. 12)" },
      { figure: "Population analysis accuracy", value: "92%", measures: "Population analysis, as summarised in the conclusions.", source: "Report, §12.2 (Ch. 12)" },
    ],
  },
  {
    group: "Final-year project poster — showcase summary",
    note: "The poster itself is not published on this site (permissions and other conflicts unresolved). Its figures are transcribed here with sources. The poster's disease-classification figure is withheld under the rule above.",
    rows: [
      { figure: "Bee-or-not-bee classification", value: "90%", measures: "Results chart on the poster, bee-or-not-bee bar.", source: "FYP poster, results chart" },
      { figure: "Bee counting", value: "92%", measures: "Results chart on the poster, bee-count bar.", source: "FYP poster, results chart" },
      { figure: "Disease detection and localization (YOLO-based)", value: "92%", measures: "Accuracy in disease detection and localization, as worded in the poster abstract.", source: "FYP poster, abstract" },
      { figure: "Precision, as worded on the poster", value: "90%+", measures: "Poster abstract wording: 90% plus precision. No test set is stated on the poster.", source: "FYP poster, abstract" },
    ],
  },
];

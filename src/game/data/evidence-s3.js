/**
 * Season 3 «أصداء الـV8» — evidence, decisions, the notebook by mission, and journal pages (gathered from the
 * mission modules, data/s3/). Evidence is collected as `s3.ev.<id>` (effect `ev3:`), decisions are `s3:dec:<key>`
 * (effect `dec3:`): both live in Season 3's own save. `rel` is the evidence's starting reliability
 * (docs/season-3/EVIDENCE_GRAPH.md); `source` groups evidence for the independence rule (P-06).
 */
import { gather } from './s3/index.js';

export const EVIDENCE_S3 = gather('evidence');
/** Decisions of Season 3 (named values): every value is made somewhere and read somewhere (tests). */
export const DECISIONS_S3 = gather('decisions');
/** The notebook, by mission, in order. */
export const CASE_S3 = gather('case');
export const JOURNAL_S3 = gather('journal');

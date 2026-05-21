// Shared types + pure stage resolver for the v1.2 status pipeline.
//
// The resolver is intentionally pure (no I/O, no network) so it is both
// trivially table-testable from scripts/smoke-feedback-status.mjs and reusable
// from any caller that already has the upstream signals collected. The Astro
// API route at src/pages/api/feedback/status/[issueNumber].ts is responsible
// for fetching the inputs (GitHub issue + PR + Vercel deployment) and feeding
// them in here.

export type FeedbackStage = 1 | 2 | 3 | 4 | 5;

export type FeedbackSub =
  | 'auto-merged'
  | 'needs-review'
  | 'needs-client-reply'
  | 'merged'
  | 'open'
  | null;

export interface FeedbackStatusInputPr {
  state: 'open' | 'closed';
  merged: boolean;
  mergeSha: string | null;
  url: string;
  number: number;
}

export interface FeedbackStatusInput {
  issueLabels: string[];
  issueHasPrLink: boolean;
  prFromComments: { url: string; number: number } | null;
  pr: FeedbackStatusInputPr | null;
  vercelDeployState: 'READY' | 'BUILDING' | 'ERROR' | 'CANCELED' | null;
}

export interface FeedbackStatusOutput {
  stage: FeedbackStage;
  sub: FeedbackSub;
  prUrl: string | null;
  prNumber: number | null;
  mergeSha: string | null;
  deployUrl: string | null;
  updatedAt: string;
}

export type FeedbackStatusResolved = Pick<
  FeedbackStatusOutput,
  'stage' | 'sub' | 'prUrl' | 'prNumber' | 'mergeSha'
>;

export function resolveStage(input: FeedbackStatusInput): FeedbackStatusResolved {
  const labels = new Set(input.issueLabels);
  const prRef = input.pr || (input.prFromComments ? { url: input.prFromComments.url, number: input.prFromComments.number } : null);

  const base: FeedbackStatusResolved = {
    stage: 1,
    sub: null,
    prUrl: prRef ? prRef.url : null,
    prNumber: prRef ? prRef.number : null,
    mergeSha: input.pr ? input.pr.mergeSha : null,
  };

  // Stage 4 sub-labels: needs-review / needs-client-reply override merged labelling
  // because the Action sets them when human attention is required.
  if (labels.has('needs-client-reply')) {
    return { ...base, stage: 4, sub: 'needs-client-reply' };
  }
  if (labels.has('needs-review')) {
    return { ...base, stage: 4, sub: 'needs-review' };
  }

  // PR present and merged → stage 4 (merged) with possible stage-5 promotion below
  if (input.pr && input.pr.merged) {
    const sub: FeedbackSub = labels.has('auto-merged') ? 'auto-merged' : 'merged';
    if (input.pr.mergeSha && input.vercelDeployState === 'READY') {
      return { ...base, stage: 5, sub: null };
    }
    return { ...base, stage: 4, sub };
  }

  // PR present and open → stage 3
  if (input.pr && input.pr.state === 'open' && !input.pr.merged) {
    return { ...base, stage: 3, sub: 'open' };
  }

  // We saw a PR reference in comments but couldn't fetch the PR record itself → stage 3 too
  if (!input.pr && input.prFromComments) {
    return { ...base, stage: 3, sub: 'open' };
  }

  // No PR reference yet — distinguish "Action picked it up" (label present) from "just submitted"
  if (labels.has('client-feedback') || labels.has('client-feedback-test')) {
    return { ...base, stage: 2, sub: null };
  }

  return base;
}

import type { APIRoute } from 'astro';
import { checkAuth } from '../../../../lib/auth';
import { resolveStage, type FeedbackStatusInput, type FeedbackStatusInputPr, type FeedbackStatusOutput } from '../../../../lib/feedback-status';

export const prerender = false;

const CACHE_TTL_MS = 5000;
type CacheEntry = { at: number; value: FeedbackStatusOutput };
const cache = new Map<string, CacheEntry>();

const GITHUB_TOKEN = (import.meta.env.GITHUB_TOKEN || '').trim();
const GITHUB_REPO = (import.meta.env.GITHUB_REPO || '').trim();
const VERCEL_TOKEN = (import.meta.env.VERCEL_TOKEN || '').trim();
const VERCEL_PROJECT_ID = (import.meta.env.VERCEL_PROJECT_ID || 'prj_RIo7DcBIYysCuz9zhnI71u1Ifrb4').trim();
const VERCEL_TEAM_ID = (import.meta.env.VERCEL_TEAM_ID || 'team_mYKN6qZrDebsHJGJaiN7XqrY').trim();

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async ({ params, request }) => {
  if (!(await checkAuth(request))) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const num = String(params.issueNumber ?? '').trim();
  if (!/^\d+$/.test(num)) {
    return json({ error: 'Invalid issue number' }, 400);
  }

  const cached = cache.get(num);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return json(cached.value, 200);
  }

  if (!GITHUB_REPO || !GITHUB_TOKEN) {
    return json({ error: 'Server misconfigured (GITHUB_REPO/GITHUB_TOKEN missing)' }, 500);
  }

  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const issueRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${num}`, { headers: ghHeaders });
  if (!issueRes.ok) {
    if (issueRes.status === 404) return json({ error: 'Issue not found' }, 404);
    return json({ error: `Issue lookup failed (${issueRes.status})` }, 502);
  }
  const issue: any = await issueRes.json();
  const issueLabels: string[] = Array.isArray(issue.labels)
    ? issue.labels.map((l: any) => (typeof l === 'string' ? l : l?.name)).filter(Boolean)
    : [];
  const issueHasPrLink = !!(issue.pull_request && issue.pull_request.url);

  let prFromComments: { url: string; number: number } | null = null;
  if (!issueHasPrLink) {
    const cRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${num}/comments?per_page=100`, { headers: ghHeaders });
    if (cRes.ok) {
      const comments: any[] = await cRes.json();
      const re = new RegExp(`https://github\\.com/${GITHUB_REPO.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}/pull/(\\d+)`);
      for (const c of comments) {
        const m = String(c.body || '').match(re);
        if (m) {
          prFromComments = { url: m[0], number: parseInt(m[1], 10) };
          break;
        }
      }
    }
  }

  let pr: FeedbackStatusInputPr | null = null;
  const prNumber = issueHasPrLink
    ? parseInt(String(issue.pull_request.url).split('/').pop() || '', 10)
    : prFromComments
      ? prFromComments.number
      : NaN;
  if (Number.isFinite(prNumber)) {
    const prRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/pulls/${prNumber}`, { headers: ghHeaders });
    if (prRes.ok) {
      const p: any = await prRes.json();
      pr = {
        state: p.state === 'closed' ? 'closed' : 'open',
        merged: !!p.merged,
        mergeSha: p.merge_commit_sha || null,
        url: p.html_url,
        number: p.number,
      };
    }
  }

  let vercelDeployState: FeedbackStatusInput['vercelDeployState'] = null;
  let deployUrl: string | null = null;
  if (VERCEL_TOKEN && pr?.merged && pr.mergeSha) {
    const teamQs = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
    const vurl = `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=20&target=production${teamQs}`;
    const vRes = await fetch(vurl, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
    if (vRes.ok) {
      const v: any = await vRes.json();
      const match = (v.deployments || []).find((d: any) => d?.meta?.githubCommitSha === pr!.mergeSha);
      if (match) {
        vercelDeployState = match.readyState || match.state || null;
        deployUrl = match.url ? `https://${match.url}` : null;
      }
    }
  }

  const resolved = resolveStage({ issueLabels, issueHasPrLink, prFromComments, pr, vercelDeployState });
  const out: FeedbackStatusOutput = {
    ...resolved,
    deployUrl,
    updatedAt: new Date().toISOString(),
  };
  cache.set(num, { at: Date.now(), value: out });
  return json(out, 200);
};

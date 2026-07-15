import { Resend } from 'resend';

type NotifyArgs = {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendNotification({ subject, html, text, replyTo }: NotifyArgs) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.NOTIFY_TO || 'lemoulinfrance@gmail.com';
  const from = import.meta.env.NOTIFY_FROM || 'Moulin à Rêves <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('[notify] RESEND_API_KEY not set — skipping email');
    return { ok: false, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error('[notify] resend error', error);
      return { ok: false, error };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error('[notify] send threw', e);
    return { ok: false, error: e };
  }
}

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

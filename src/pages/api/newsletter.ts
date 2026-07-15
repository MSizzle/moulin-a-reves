export const prerender = false;

import type { APIRoute } from 'astro';
import { sendNotification, escapeHtml } from '../../lib/notify';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const res = await fetch(
      `https://api.airtable.com/v0/${import.meta.env.AIRTABLE_BASE_ID}/${import.meta.env.AIRTABLE_NEWSLETTER_TABLE}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Email: data.email,
                Source: data.source || 'Footer',
                'Submitted At': new Date().toISOString(),
              },
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    const email = escapeHtml(data.email);
    const source = escapeHtml(data.source || 'Footer');

    await sendNotification({
      subject: `New newsletter signup — ${data.email}`,
      html: `<p>New newsletter subscriber:</p><p><strong>${email}</strong> (source: ${source})</p>`,
      text: `New newsletter subscriber: ${data.email} (source: ${data.source || 'Footer'})`,
      replyTo: data.email,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

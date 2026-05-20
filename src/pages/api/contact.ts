export const prerender = false;

import type { APIRoute } from 'astro';
import { sendNotification, escapeHtml } from '../../lib/notify';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const res = await fetch(
      `https://api.airtable.com/v0/${import.meta.env.AIRTABLE_BASE_ID}/${import.meta.env.AIRTABLE_CONTACT_TABLE}`,
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
                Name: data.name,
                Email: data.email,
                'Check-in': data.checkin || null,
                'Check-out': data.checkout || null,
                Adults: parseInt(data.adults) || 2,
                Children: parseInt(data.children) || 0,
                Dogs: parseInt(data.dogs) || 0,
                Houses: data.houses,
                Message: data.message,
                'Submitted At': new Date().toISOString(),
                Status: 'Todo',
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

    const name = escapeHtml(data.name);
    const email = escapeHtml(data.email);
    const checkin = escapeHtml(data.checkin || '—');
    const checkout = escapeHtml(data.checkout || '—');
    const adults = escapeHtml(String(data.adults ?? '2'));
    const children = escapeHtml(String(data.children ?? '0'));
    const dogs = escapeHtml(String(data.dogs ?? '0'));
    const houses = escapeHtml(Array.isArray(data.houses) ? data.houses.join(', ') : data.houses || '—');
    const message = escapeHtml(data.message || '');

    const html = `
      <h2>New booking inquiry — Moulin à Rêves</h2>
      <p><strong>${name}</strong> &lt;${email}&gt;</p>
      <table style="border-collapse:collapse">
        <tr><td><strong>Check-in</strong></td><td>${checkin}</td></tr>
        <tr><td><strong>Check-out</strong></td><td>${checkout}</td></tr>
        <tr><td><strong>Adults</strong></td><td>${adults}</td></tr>
        <tr><td><strong>Children</strong></td><td>${children}</td></tr>
        <tr><td><strong>Dogs</strong></td><td>${dogs}</td></tr>
        <tr><td><strong>Houses</strong></td><td>${houses}</td></tr>
      </table>
      <h3>Message</h3>
      <p style="white-space:pre-wrap">${message}</p>
    `;

    const text = [
      `New booking inquiry — Moulin à Rêves`,
      `${data.name} <${data.email}>`,
      `Check-in: ${data.checkin || '—'}`,
      `Check-out: ${data.checkout || '—'}`,
      `Adults: ${data.adults ?? '2'}`,
      `Children: ${data.children ?? '0'}`,
      `Dogs: ${data.dogs ?? '0'}`,
      `Houses: ${Array.isArray(data.houses) ? data.houses.join(', ') : data.houses || '—'}`,
      ``,
      `Message:`,
      data.message || '',
    ].join('\n');

    await sendNotification({
      subject: `New inquiry from ${data.name || 'website visitor'}`,
      html,
      text,
      replyTo: data.email,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

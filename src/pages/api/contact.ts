export const prerender = false;

import type { APIRoute } from 'astro';

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
                Status: { name: 'New' },
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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

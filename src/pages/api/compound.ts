export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    const res = await fetch(
      `https://api.airtable.com/v0/${import.meta.env.AIRTABLE_BASE_ID}/${import.meta.env.AIRTABLE_COMPOUND_TABLE}`,
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
                Dates: data.dates,
                Guests: data.guests,
                Occasion: data.occasion || null,
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

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

import { initDB, queries } from './db';

export async function resolveIP(ip: string): Promise<{
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}> {
  await initDB();

  // Check cache first
  const cached = await queries.getCachedGeo(ip);
  if (cached) {
    return {
      city: cached.city,
      region: cached.region,
      country: cached.country,
      lat: cached.lat,
      lon: cached.lon,
    };
  }

  // Fetch from ip-api.com
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();

    if (data.status === 'success') {
      const geo = {
        city: data.city || '',
        region: data.regionName || '',
        country: data.country || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
      };

      // Cache the result
      await queries.cacheGeo({ ip, ...geo });

      return geo;
    }
  } catch (e) {
    // Silently fail on geo lookup errors
  }

  return { city: '', region: '', country: '', lat: 0, lon: 0 };
}

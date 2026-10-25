/**
 * iOS Location Spoofer Web
 *
 * Copyright (c) 2026 akudamatata (https://github.com/akudamatata/iOS-Location-Spoofer-Web)
 * Licensed under CC BY-NC-SA 4.0
 * ⚠️【特别声明】：本项目完全免费开源，严禁以任何形式进行二次售卖、转售、商业收费代搭建！
 */

/**
 * GET /geocode?q=关键词
 * Proxies Nominatim through Cloudflare's edge and caches the result for an
 * hour. Direct calls to nominatim.openstreetmap.org are slow from mainland
 * China; the edge cache makes repeated queries fast.
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  const jsonHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  };

  if (!q) {
    return new Response('[]', { status: 200, headers: jsonHeaders });
  }

  const target = 'https://nominatim.openstreetmap.org/search?format=json&limit=10&addressdetails=1&accept-language=zh&q=' +
    encodeURIComponent(q);

  // Edge cache key includes the query so different keywords never collide.
  let cache = null;
  let cacheKey = null;
  try {
    cache = caches.default;
    cacheKey = new Request('https://geocode.internal/?q=' + encodeURIComponent(q), { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (e) {
    // Cache API unavailable (local dev) — fall through to the live request.
  }

  try {
    const resp = await fetch(target, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'iOS-Location-Spoofer-Web/1.0 (self-hosted)'
      }
    });
    if (!resp.ok) {
      return new Response('[]', { status: 200, headers: jsonHeaders });
    }
    const body = await resp.text();
    const out = new Response(body, {
      status: 200,
      headers: {
        ...jsonHeaders,
        'Cache-Control': 'public, max-age=3600'
      }
    });
    if (cache && cacheKey) {
      try { context.waitUntil(cache.put(cacheKey, out.clone())); } catch (e) {}
    }
    return out;
  } catch (err) {
    return new Response('[]', { status: 200, headers: jsonHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

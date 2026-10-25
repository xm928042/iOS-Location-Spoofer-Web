/**
 * iOS Location Spoofer Web
 *
 * Copyright (c) 2026 akudamatata (https://github.com/akudamatata/iOS-Location-Spoofer-Web)
 * Licensed under CC BY-NC-SA 4.0
 * ⚠️【特别声明】：本项目完全免费开源，严禁以任何形式进行二次售卖、转售、商业收费代搭建！
 */

import { authOk, jsonResponse, errorResponse, corsHeaders } from './_utils.js';

/**
 * POST /report
 * Receives the real coordinates read from Apple's original WLOC response while
 * the spoofer is in "restore real location" mode. Stored as `lastReal` so the
 * web panel can show the last known real position.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!authOk(request, env)) {
    return errorResponse('unauthorized', 401);
  }

  try {
    const data = await request.json();
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);

    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return errorResponse('bad coords');
    }

    const record = {
      latitude: lat,
      longitude: lon,
      horizontalAccuracy: isFinite(Number(data.horizontalAccuracy)) ? Number(data.horizontalAccuracy) : null,
      timestamp: isFinite(Number(data.timestamp)) ? Number(data.timestamp) : Date.now()
    };

    if (env.SPOOFER_DATA) {
      // Server-side throttle as a safety net: write at most once per minute.
      const prev = await env.SPOOFER_DATA.get('lastReal', { type: 'json' });
      if (!prev || !prev.timestamp || record.timestamp - prev.timestamp >= 60000) {
        await env.SPOOFER_DATA.put('lastReal', JSON.stringify(record));
      }
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse('bad json');
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

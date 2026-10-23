/**
 * iOS Location Spoofer Web
 *
 * Copyright (c) 2026 akudamatata (https://github.com/akudamatata/iOS-Location-Spoofer-Web)
 * Licensed under CC BY-NC-SA 4.0
 * ⚠️【特别声明】：本项目完全免费开源，严禁以任何形式进行二次售卖、转售、商业收费代搭建！
 */

import { DEFAULT_LOC, authOk, jsonResponse, errorResponse, corsHeaders } from './_utils.js';

/**
 * POST /restore
 * Marks the spoofing as disabled. The Shadowrocket script reads the
 * `enabled` flag from /loc.json and passes the original response through
 * when it is false, so the device falls back to its real location without
 * touching the module or VPN.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!authOk(request, env)) {
    return errorResponse('unauthorized', 401);
  }

  let current = DEFAULT_LOC;

  if (env.SPOOFER_DATA) {
    current = await env.SPOOFER_DATA.get('loc', { type: 'json' }) || DEFAULT_LOC;
  }

  const updated = { ...current, enabled: false };

  if (env.SPOOFER_DATA) {
    await env.SPOOFER_DATA.put('loc', JSON.stringify(updated));
  }

  return jsonResponse(updated);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

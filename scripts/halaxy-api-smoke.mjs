#!/usr/bin/env node
/*
 * Read-only Halaxy API smoke test.
 *
 * Required env:
 *   HALAXY_CLIENT_ID
 *   HALAXY_CLIENT_SECRET
 *
 * Optional env:
 *   HALAXY_API_BASE_URL=https://au-api.halaxy.com/main
 *   HALAXY_USER_AGENT="PouchCare (support@pouchcare.com.au)"
 *   HALAXY_SMOKE_PATHS="/Patient?_count=1,/Appointment?_count=5"
 *
 * This script prints response shape/count metadata only. It intentionally does not
 * print full patient/appointment payloads to avoid leaking clinical data into logs.
 */

const required = ['HALAXY_CLIENT_ID', 'HALAXY_CLIENT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env: ${missing.join(', ')}`);
  console.error('Example: HALAXY_CLIENT_ID=... HALAXY_CLIENT_SECRET=... node scripts/halaxy-api-smoke.mjs');
  process.exit(1);
}

const baseUrl = (process.env.HALAXY_API_BASE_URL || 'https://au-api.halaxy.com/main').replace(/\/+$/, '');
const userAgent = process.env.HALAXY_USER_AGENT || 'PouchCare (admin@pouchcare.com.au)';
const paths = (process.env.HALAXY_SMOKE_PATHS || '/Patient?_count=1,/Appointment?_count=5')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Leave json null; include a short non-sensitive preview below.
  }

  return {
    response,
    json,
    textPreview: text.slice(0, 300),
  };
}

const tokenResult = await requestJson(`${baseUrl}/oauth/token`, {
  method: 'POST',
  headers: {
    Accept: 'application/fhir+json',
    'Content-Type': 'application/json',
    'User-Agent': userAgent,
  },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.HALAXY_CLIENT_ID,
    client_secret: process.env.HALAXY_CLIENT_SECRET,
  }),
});

if (!tokenResult.response.ok) {
  console.error('Token request failed', {
    status: tokenResult.response.status,
    statusText: tokenResult.response.statusText,
    bodyPreview: tokenResult.textPreview,
  });
  process.exit(1);
}

const accessToken = tokenResult.json?.access_token;
if (!accessToken) {
  console.error('Token response did not include access_token', {
    keys: Object.keys(tokenResult.json || {}),
  });
  process.exit(1);
}

console.log('Halaxy OAuth OK', {
  tokenType: tokenResult.json?.token_type,
  expiresIn: tokenResult.json?.expires_in,
  baseUrl,
});

for (const path of paths) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  const result = await requestJson(url, {
    method: 'GET',
    headers: {
      Accept: 'application/fhir+json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': userAgent,
    },
  });

  const rate = {
    limit: result.response.headers.get('x-ratelimit-limit'),
    remaining: result.response.headers.get('x-ratelimit-remaining'),
    retryAfter: result.response.headers.get('retry-after'),
  };

  if (!result.response.ok) {
    console.log('Halaxy read failed', {
      path,
      status: result.response.status,
      statusText: result.response.statusText,
      rate,
      bodyPreview: result.textPreview,
    });
    continue;
  }

  const resourceType = result.json?.resourceType || null;
  const entries = Array.isArray(result.json?.entry) ? result.json.entry : [];
  const firstResourceType = entries[0]?.resource?.resourceType || null;

  console.log('Halaxy read OK', {
    path,
    status: result.response.status,
    resourceType,
    total: result.json?.total ?? null,
    entryCount: entries.length,
    firstResourceType,
    rate,
  });
}

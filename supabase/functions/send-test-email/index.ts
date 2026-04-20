/// <reference lib="deno.ns" />

import { sendTransactionalEmail } from "../_shared/email/index.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Keep this function public but protected by a shared token.
  const expected = Deno.env.get('TEST_EMAIL_TOKEN')
  if (!expected) return json({ error: 'Missing TEST_EMAIL_TOKEN (server misconfig)' }, 500)

  const got = req.headers.get('x-test-email-token')
  if (!got || got !== expected) return json({ error: 'Unauthorized' }, 401)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const to = body?.to
  if (!to || typeof to !== 'string') return json({ error: 'Missing to' }, 400)

  const subject = body?.subject && typeof body.subject === 'string' ? body.subject : 'PouchCare test email'

  const sendResult = await sendTransactionalEmail({
    to,
    subject,
    text: "This is a test email from Supabase Edge Functions (provider wrapper).",
  });

  return json({ ok: true, sendResult });
})

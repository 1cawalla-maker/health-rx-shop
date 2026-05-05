/// <reference lib="deno.ns" />

/**
 * Postmark transactional email sender for Supabase Edge Functions (Deno).
 * Docs: https://postmarkapp.com/developer/api/email-api
 */

type PostmarkSendEmailArgs = {
  serverToken: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export async function postmarkSendEmail(args: PostmarkSendEmailArgs) {
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": args.serverToken,
    },
    body: JSON.stringify({
      From: args.from,
      To: args.to,
      Subject: args.subject,
      TextBody: args.text,
      HtmlBody: args.html,
      ReplyTo: args.replyTo,
      MessageStream: "outbound", // default transactional stream
    }),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: {
        provider: "postmark",
        status: res.status,
        statusText: res.statusText,
        data,
      },
    } as const;
  }

  // Postmark returns { MessageID: string, ErrorCode: number, Message: string }
  const messageId = data?.MessageID ?? null;
  return { ok: true, data, messageId } as const;
}

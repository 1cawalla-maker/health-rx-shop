/// <reference lib="deno.ns" />

import { sendEmail as resendSendEmail } from "./resend.ts";
import { sesSendEmail } from "./ses.ts";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function envBool(name: string, defaultValue = false) {
  const v = (Deno.env.get(name) ?? "").trim().toLowerCase();
  if (!v) return defaultValue;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function shouldAllowSend(to: string) {
  const allowlistRegex = (Deno.env.get("EMAIL_ALLOWLIST_REGEX") ?? "").trim();
  if (!allowlistRegex) return true;

  try {
    const re = new RegExp(allowlistRegex, "i");
    return re.test(to);
  } catch (e) {
    console.warn("EMAIL_ALLOWLIST_REGEX invalid; allowing send", { allowlistRegex, error: String(e) });
    return true;
  }
}

/**
 * Provider-agnostic transactional send.
 *
 * Safety switches:
 * - EMAIL_SEND_ENABLED=false → do not actually send (returns ok: true, skipped: true)
 * - EMAIL_ALLOWLIST_REGEX=<regex> → only send when `to` matches (case-insensitive)
 *
 * Provider selection:
 * - EMAIL_PROVIDER=ses|resend (default: resend)
 */
export async function sendTransactionalEmail(email: TransactionalEmail) {
  const sendEnabled = envBool("EMAIL_SEND_ENABLED", false);
  if (!sendEnabled) {
    console.log("email: send disabled; skipping", { to: email.to, subject: email.subject });
    return { ok: true, skipped: true, reason: "EMAIL_SEND_ENABLED=false" } as const;
  }

  if (!shouldAllowSend(email.to)) {
    console.log("email: allowlist blocked; skipping", { to: email.to, subject: email.subject });
    return { ok: true, skipped: true, reason: "EMAIL_ALLOWLIST_REGEX" } as const;
  }

  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "resend").trim().toLowerCase();

  if (provider === "ses") {
    const region = (Deno.env.get("AWS_REGION") ?? "").trim();
    const accessKeyId = (Deno.env.get("AWS_ACCESS_KEY_ID") ?? "").trim();
    const secretAccessKey = (Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "").trim();
    const from = (Deno.env.get("EMAIL_FROM") ?? "").trim();

    if (!region || !accessKeyId || !secretAccessKey || !from) {
      return {
        ok: false,
        error: {
          provider: "ses",
          message: "Missing required SES env vars (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, EMAIL_FROM)",
        },
      } as const;
    }

    return await sesSendEmail({
      region,
      accessKeyId,
      secretAccessKey,
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  }

  // Default: Resend (existing MVP)
  const resendResult = await resendSendEmail({
    to: email.to,
    subject: email.subject,
    text: email.text,
  });

  return { ok: true, provider: "resend", data: resendResult } as const;
}

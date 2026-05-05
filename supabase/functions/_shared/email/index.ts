/// <reference lib="deno.ns" />

import { postmarkSendEmail } from "./postmark.ts";

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
 * - EMAIL_PROVIDER must be "postmark"
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

  const provider = (Deno.env.get("EMAIL_PROVIDER") ?? "postmark").trim().toLowerCase();
  if (provider !== "postmark") {
    return {
      ok: false,
      error: {
        provider,
        message: `EMAIL_PROVIDER must be postmark (got: ${provider})`,
      },
    } as const;
  }

  const serverToken = (Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "").trim();
  const from = (Deno.env.get("EMAIL_FROM") ?? "").trim();

  if (!serverToken || !from) {
    return {
      ok: false,
      error: {
        provider: "postmark",
        message: "Missing required Postmark env vars (POSTMARK_SERVER_TOKEN, EMAIL_FROM)",
      },
    } as const;
  }

  const pmResult = await postmarkSendEmail({
    serverToken,
    from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (pmResult.ok) {
    return { ok: true, provider: "postmark", data: pmResult.data, messageId: pmResult.messageId } as const;
  }

  return pmResult;
}

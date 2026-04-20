/// <reference lib="deno.ns" />

/**
 * Minimal Amazon SESv2 client (no deps) for Supabase Edge Functions (Deno).
 * Uses AWS SigV4 signing against the SESv2 HTTPS API.
 */

type SesSendEmailArgs = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  // Optional configuration set name, tags, etc. (future)
};

function toUint8(s: string) {
  return new TextEncoder().encode(s);
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(body: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", toUint8(body));
  return toHex(hash);
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, toUint8(msg));
}

function isoDateTimeBasic(d: Date) {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function isoDateBasic(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
}

async function getSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const kDate = await hmacSha256(toUint8("AWS4" + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  return kSigning;
}

export async function sesSendEmail(args: SesSendEmailArgs) {
  const service = "ses";
  const host = `email.${args.region}.amazonaws.com`;
  const endpoint = `https://${host}/v2/email/outbound-emails`;
  const method = "POST";
  const canonicalUri = "/v2/email/outbound-emails";
  const canonicalQuerystring = "";

  const bodyObj: any = {
    FromEmailAddress: args.from,
    Destination: { ToAddresses: [args.to] },
    Content: {
      Simple: {
        Subject: { Data: args.subject, Charset: "UTF-8" },
        Body: {},
      },
    },
  };

  if (args.html) bodyObj.Content.Simple.Body.Html = { Data: args.html, Charset: "UTF-8" };
  if (args.text || (!args.text && !args.html)) {
    bodyObj.Content.Simple.Body.Text = { Data: args.text ?? "", Charset: "UTF-8" };
  }

  const requestBody = JSON.stringify(bodyObj);
  const now = new Date();
  const amzDate = isoDateTimeBasic(now);
  const dateStamp = isoDateBasic(now);

  const payloadHash = await sha256Hex(requestBody);

  // Canonical headers must be lowercase and sorted.
  const canonicalHeaders = [
    `content-type:application/json`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n";

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const canonicalRequestHash = await sha256Hex(canonicalRequest);

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${args.region}/${service}/aws4_request`;
  const stringToSign = [algorithm, amzDate, credentialScope, canonicalRequestHash].join("\n");

  const signingKey = await getSigningKey(args.secretAccessKey, dateStamp, args.region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));

  const authorizationHeader =
    `${algorithm} Credential=${args.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method,
    headers: {
      "content-type": "application/json",
      host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      authorization: authorizationHeader,
    },
    body: requestBody,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = {
      provider: "ses",
      status: res.status,
      statusText: res.statusText,
      data,
    };
    return { ok: false, error: err } as const;
  }

  return { ok: true, data } as const;
}

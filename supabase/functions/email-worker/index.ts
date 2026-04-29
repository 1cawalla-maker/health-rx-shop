/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTransactionalEmail } from "../_shared/email/index.ts";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

type OutboxRow = {
  id: string;
  event_type: string;
  to_email: string;
  payload: any;
  scheduled_for: string;
  status: string;
  attempts: number;
};

function nowIso() {
  return new Date().toISOString();
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function computeNextAttempt(attempts: number) {
  // Basic exponential backoff: 1m, 5m, 15m, 1h, 6h
  const mins = [1, 5, 15, 60, 360][Math.min(attempts, 4)];
  const d = new Date();
  d.setUTCMinutes(d.getUTCMinutes() + mins);
  return d.toISOString();
}

function renderEmail(row: OutboxRow): { subject: string; text: string; html?: string } {
  const p = row.payload ?? {};

  switch (row.event_type) {
    case "patient.consultation_confirmed": {
      const when = p?.scheduled_at ? `Scheduled time: ${p.scheduled_at}` : undefined;
      const manageUrl = p?.manage_url;
      const lines = [
        "Your consultation payment has been confirmed.",
        when,
        manageUrl ? `Manage your booking: ${manageUrl}` : undefined,
        "",
        "If you have any questions, reply to this email.",
        "",
        "— PouchCare",
      ].filter(Boolean);

      return {
        subject: "PouchCare — Consultation confirmed",
        text: lines.join("\n"),
      };
    }

    case "doctor.consultation_assigned_immediate": {
      const when = p?.scheduled_at ? `Scheduled time: ${p.scheduled_at}` : undefined;
      const doctorUrl = p?.doctor_consultations_url;
      const lines = [
        "You’ve been assigned a new consultation.",
        when,
        doctorUrl ? `View your consultations: ${doctorUrl}` : undefined,
        "",
        "— PouchCare",
      ].filter(Boolean);

      return {
        subject: "PouchCare — New consultation assigned",
        text: lines.join("\n"),
      };
    }

    case "doctor.consultation_upcoming_24h": {
      const when = p?.scheduled_at ? `Scheduled time: ${p.scheduled_at}` : undefined;
      const doctorUrl = p?.doctor_consultations_url;
      const lines = [
        "Reminder: you have a consultation in ~24 hours.",
        when,
        doctorUrl ? `View details: ${doctorUrl}` : undefined,
        "",
        "— PouchCare",
      ].filter(Boolean);

      return {
        subject: "PouchCare — Consultation reminder (24h)",
        text: lines.join("\n"),
      };
    }

    case "patient.order_confirmed": {
      const orderName = p?.order_name ? String(p.order_name) : "";
      const ordersUrl = p?.orders_url;
      const lines = [
        `Your order ${orderName} has been confirmed.`.trim(),
        "",
        "Shipping estimate: typically 2–5 business days (Australia).",
        ordersUrl ? `View your orders: ${ordersUrl}` : undefined,
        "",
        "— PouchCare",
      ].filter(Boolean);

      return {
        subject: "PouchCare — Order confirmed",
        text: lines.join("\n"),
      };
    }

    case "patient.replenishment_70d": {
      const shopUrl = p?.shop_url;
      const lines = [
        "Time for a refill?",
        "",
        "It’s been about 70 days since your last order.",
        shopUrl ? `Reorder here: ${shopUrl}` : undefined,
        "",
        "— PouchCare",
      ].filter(Boolean);

      return {
        subject: "PouchCare — Refill reminder",
        text: lines.join("\n"),
      };
    }

    default:
      return {
        subject: `PouchCare — Notification (${row.event_type})`,
        text: "(template not implemented yet)",
      };
  }
}

serve(async (req) => {
  // Optional auth: allow cron to call with a secret to avoid public invocation.
  const expected = (Deno.env.get("EMAIL_WORKER_CRON_SECRET") ?? "").trim();
  if (expected) {
    const got = (req.headers.get("x-cron-secret") ?? "").trim();
    if (got !== expected) return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "Server misconfig" }, 500);

  const admin = createClient(supabaseUrl, serviceKey);

  const limit = 25;

  // Fetch due pending rows
  const { data: pending, error: pendErr } = await admin
    .from("email_outbox")
    .select("id,event_type,to_email,payload,scheduled_for,status,attempts")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (pendErr) return json({ ok: false, error: pendErr.message }, 500);
  if (!pending || pending.length === 0) return json({ ok: true, processed: 0 });

  let processed = 0;
  const results: any[] = [];

  for (const row of pending as OutboxRow[]) {
    // Claim row (best-effort lock)
    const { data: claimed, error: claimErr } = await admin
      .from("email_outbox")
      .update({ status: "sending", locked_at: nowIso() })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (claimErr || !claimed) continue; // someone else got it

    try {
      const rendered = renderEmail(row);
      const sendRes = await sendTransactionalEmail({
        to: row.to_email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });

      if ((sendRes as any)?.ok === false) {
        throw new Error(JSON.stringify((sendRes as any).error ?? sendRes));
      }

      const provider = (sendRes as any)?.provider ?? (Deno.env.get("EMAIL_PROVIDER") ?? "");
      const providerMessageId = (sendRes as any)?.data?.MessageId ?? null;

      await admin
        .from("email_outbox")
        .update({
          status: "sent",
          sent_at: nowIso(),
          provider: provider || null,
          provider_message_id: providerMessageId,
          last_error: null,
        })
        .eq("id", row.id);

      processed++;
      results.push({ id: row.id, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const nextTime = computeNextAttempt(row.attempts + 1);

      await admin
        .from("email_outbox")
        .update({
          status: "pending",
          attempts: row.attempts + 1,
          last_error: msg,
          scheduled_for: nextTime,
        })
        .eq("id", row.id);

      results.push({ id: row.id, ok: false, error: msg });
    }
  }

  return json({ ok: true, processed, results });
});

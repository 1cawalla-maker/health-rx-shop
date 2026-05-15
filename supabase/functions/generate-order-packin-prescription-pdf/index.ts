import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GENERATE-ORDER-PACKIN-RX] ${step}${detailsStr}`);
};

const formatDateAUShort = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateAULong = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function coalesce(...vals: Array<string | null | undefined>) {
  for (const v of vals) if (v && String(v).trim()) return String(v).trim();
  return "";
}

function parseStrengthMg(text?: string | null): number | null {
  if (!text) return null;
  const m = String(text).match(/(\d{1,2})\s*mg/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function buildPatientAddress(profile: any): string {
  const l1 = profile?.shipping_address_line1;
  const l2 = profile?.shipping_address_line2;
  const suburb = profile?.shipping_suburb;
  const state = profile?.shipping_state;
  const pc = profile?.shipping_postcode;
  const country = profile?.shipping_country;

  const parts = [l1, l2, [suburb, state, pc].filter(Boolean).join(" "), country]
    .map((s) => (s ? String(s).trim() : ""))
    .filter(Boolean);

  return parts.join(", ");
}

async function safeDownloadStorageObject(supabase: any, bucket: string, path: string): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) return null;
    const buf = await data.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

const LAYOUT_VERSION = "2026-05-15-legal-compliance-border-section";

function buildOrderShippingAddress(order: any): string {
  const shipping = order?.raw?.shipping_address || {};
  const parts = [
    shipping.address1,
    shipping.address2,
    [shipping.city, shipping.province_code || shipping.province, shipping.zip].filter(Boolean).join(" "),
    shipping.country_code || shipping.country,
  ]
    .map((s) => (s ? String(s).trim() : ""))
    .filter(Boolean);

  return parts.join(", ");
}

function buildOrderCustomerName(order: any): string {
  const shipping = order?.raw?.shipping_address || {};
  const billing = order?.raw?.billing_address || {};
  const customer = order?.raw?.customer || {};

  return coalesce(
    shipping.name,
    [shipping.first_name, shipping.last_name].filter(Boolean).join(" "),
    billing.name,
    [billing.first_name, billing.last_name].filter(Boolean).join(" "),
    [customer.first_name, customer.last_name].filter(Boolean).join(" "),
  );
}

async function generatePdfBytes(params: {
  order: any;
  items: any[];
  patientProfile: any;
  doctorProfile: any;
  doctorRow: any;
  signaturePngBytes: Uint8Array | null;
  allowance: {
    limitCans: number;
    thisOrderCans: number;
    totalSuppliedToDateCans: number;
    remainingCans: number;
    status: "AVAILABLE" | "EXHAUSTED";
  };
  importInfoUrl: string | null;
}) {
  const {
    order,
    items,
    patientProfile,
    doctorProfile,
    doctorRow,
    signaturePngBytes,
    allowance,
    importInfoUrl,
  } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height, width } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.06, 0.65, 0.91); // sky-ish
  const text = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.42, 0.45, 0.50);
  const border = rgb(0.90, 0.91, 0.93);
  const bg = rgb(0.95, 0.98, 1.0);

  const marginX = 44;
  const colGap = 18;
  const leftW = 330;
  const rightX = marginX + leftW + colGap;
  const rightW = width - rightX - marginX;

  let y = height - 58;

  const drawText = (t: string, x: number, y: number, size: number, bold = false, color = text) => {
    page.drawText(t, { x, y, size, font: bold ? fontBold : font, color });
  };

  const wrapText = (t: string, maxWidth: number, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    const words = String(t || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let line = "";

    const widthOf = (s: string) => f.widthOfTextAtSize(s, size);

    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (widthOf(candidate) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        // If single word is too long, hard-break it.
        if (widthOf(w) > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            const cand2 = chunk + ch;
            if (widthOf(cand2) <= maxWidth) chunk = cand2;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = w;
        }
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  const drawParagraph = (t: string, x: number, y: number, maxWidth: number, opts?: {
    size?: number;
    bold?: boolean;
    color?: any;
    lineHeight?: number;
  }) => {
    const size = opts?.size ?? 10;
    const bold = opts?.bold ?? false;
    const color = opts?.color ?? text;
    const lh = opts?.lineHeight ?? Math.ceil(size * 1.35);

    const lines = wrapText(t, maxWidth, size, bold);
    for (const line of lines) {
      drawText(line, x, y, size, bold, color);
      y -= lh;
    }
    return y;
  };

  // Header
  drawText("PouchCare", marginX, y, 22, true, brand);
  drawText("SUPPLIER PRINT DOCUMENT", marginX, y - 22, 11, true, text);
  drawText("Prescription Import Declaration + Patient Prescription", marginX, y - 38, 9, true, muted);
  drawText(
    "Print one copy and include inside the direct-to-patient parcel.",
    marginX,
    y - 52,
    9,
    false,
    muted,
  );

  // top border
  page.drawLine({
    start: { x: marginX, y: y - 64 },
    end: { x: width - marginX, y: y - 64 },
    thickness: 2,
    color: brand,
  });

  y = y - 82;

  const drawSectionTitle = (t: string, x: number, y0: number) => {
    drawText(t.toUpperCase(), x, y0, 9, true, muted);
    page.drawLine({
      start: { x, y: y0 - 4 },
      end: { x: x + (x === marginX ? leftW : rightW), y: y0 - 4 },
      thickness: 1,
      color: border,
    });
    return y0 - 18;
  };

  const drawKV = (k: string, v: string, x: number, y0: number, maxWidth: number) => {
    drawText(k, x, y0, 9, false, muted);
    y0 -= 12;
    y0 = drawParagraph(v || "—", x, y0, maxWidth, { size: 11, bold: true, color: text, lineHeight: 14 });
    return y0 - 6;
  };

  // LEFT COLUMN
  let yl = y;

  yl = drawSectionTitle("Prescriber details", marginX, yl);
  yl = drawKV("Prescriber", coalesce(doctorProfile?.full_name, "Doctor"), marginX, yl, leftW);
  yl = drawKV(
    "Prescriber / provider number",
    coalesce(doctorRow?.provider_number, "N/A"),
    marginX,
    yl,
    leftW,
  );
  yl = drawKV("Clinic / practice", "PouchCare Telehealth Clinic", marginX, yl, leftW);
  yl = drawKV("Phone", "(07) 3123 4567", marginX, yl, leftW);
  yl = drawKV("Address", "Level 3, 12 Creek St, Brisbane QLD 4000", marginX, yl, leftW);

  yl -= 2;
  const orderCustomerName = buildOrderCustomerName(order);
  const orderShippingAddress = buildOrderShippingAddress(order);

  yl = drawSectionTitle("Patient / importer details", marginX, yl);
  yl = drawKV("Named patient / importer", coalesce(orderCustomerName, patientProfile?.full_name, "Patient"), marginX, yl, leftW);
  yl = drawKV("Date of birth", formatDateAULong(patientProfile?.date_of_birth), marginX, yl, leftW);
  yl = drawKV("Delivery address", coalesce(orderShippingAddress, buildPatientAddress(patientProfile)), marginX, yl, leftW);

  yl -= 2;
  yl = drawSectionTitle("Medication(s)", marginX, yl);

  // Group items by (title + variant_title + strength) and sum quantities
  const medsMap = new Map<string, { display: string; strengthMg: number | null; qtyCans: number }>();
  for (const it of (items || [])) {
    const title = coalesce(it?.title, "Item");
    const variant = coalesce(it?.variant_title, "");
    const strength = it?.strength_mg ?? parseStrengthMg(`${title} ${variant}`);
    const display = `${title}${variant ? ` (${variant})` : ""}`;
    const qty = Number(it?.quantity ?? 0) || 0;
    if (qty <= 0) continue;

    const key = `${display}__${strength ?? ""}`;
    const prev = medsMap.get(key);
    if (prev) prev.qtyCans += qty;
    else medsMap.set(key, { display, strengthMg: strength, qtyCans: qty });
  }

  const meds = Array.from(medsMap.values());

  if (meds.length === 0) {
    drawText("No items found for this order.", marginX, yl, 10, false, muted);
    yl -= 16;
  } else {
    for (const [idx, med] of meds.entries()) {
      const name = med.strengthMg
        ? `Nicotine oral pouches (nicotine) — ${med.display}`
        : `Nicotine oral pouches (nicotine) — ${med.display}`;

      yl = drawParagraph(`${idx + 1}) ${name}`, marginX, yl, leftW, { size: 11, bold: true, color: text, lineHeight: 14 });
      yl -= 2;
      yl = drawParagraph(
        `Strength / form: ${med.strengthMg ? `${med.strengthMg} mg per pouch` : "—"} (oral pouch) • Pack size: 20 pouches per can • Quantity: ${med.qtyCans} cans`,
        marginX,
        yl,
        leftW,
        { size: 9, bold: false, color: muted, lineHeight: 12 },
      );
      yl -= 2;
      drawText("Directions (Sig):", marginX, yl, 9, false, muted);
      yl -= 12;
      yl = drawParagraph(
        "Place 1 pouch in the mouth as needed for cravings. Maximum 12 pouches per day. Do not swallow pouches.",
        marginX,
        yl,
        leftW,
        { size: 10, bold: false, color: text, lineHeight: 13 },
      );
      yl -= 10;

      // Separator
      if (idx !== meds.length - 1) {
        page.drawLine({
          start: { x: marginX, y: yl },
          end: { x: marginX + leftW, y: yl },
          thickness: 1,
          color: border,
        });
        yl -= 12;
      }
    }
  }

  const drawBorderSecuritySection = () => {
    const boxX = marginX;
    const boxW = leftW;
    const boxH = 178;
    const boxY = 68;
    const pad = 12;

    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      color: rgb(0.94, 0.98, 1),
      borderColor: brand,
      borderWidth: 1.8,
    });
    page.drawRectangle({
      x: boxX,
      y: boxY + boxH - 26,
      width: boxW,
      height: 26,
      color: brand,
    });
    drawText("FOR BORDER SECURITY / CUSTOMS REVIEW", boxX + pad, boxY + boxH - 17, 10, true, rgb(1, 1, 1));

    let by = boxY + boxH - 42;
    by = drawParagraph(
      "LEGAL BASIS: This parcel is for the named Australian patient/importer and is supported by the attached patient-specific prescription.",
      boxX + pad,
      by,
      boxW - (pad * 2),
      { size: 8.7, bold: true, color: text, lineHeight: 11 },
    );
    by -= 2;

    const bullets = [
      "Compliant personal importation pathway under the TGA Personal Importation Scheme; not commercial distribution.",
      `Declared quantity for this order: ${allowance.thisOrderCans} cans; prescription allowance limit: ${allowance.limitCans} cans / 3 months supply.`,
      "Nicotine is present as nicotine bitartrate salt and is prescribed for this named patient.",
      "All listed non-nicotine ingredients are common excipients/food additives and are within permitted limits; no other controlled substances are declared.",
      "Product is for the named patient's personal therapeutic use only; not for resale or supply to another person.",
    ];

    for (const bullet of bullets) {
      drawText("•", boxX + pad, by, 8.5, true, text);
      by = drawParagraph(bullet, boxX + pad + 10, by, boxW - (pad * 2) - 10, {
        size: 7.9,
        bold: false,
        color: text,
        lineHeight: 9.4,
      });
      by -= 1.2;
    }

    page.drawLine({
      start: { x: boxX + pad, y: by + 2 },
      end: { x: boxX + boxW - pad, y: by + 2 },
      thickness: 0.8,
      color: border,
    });
    by -= 9;
    drawText("Authority references:", boxX + pad, by, 7.8, true, muted);
    by -= 9;
    by = drawParagraph(
      "TGA Personal Importation Scheme: tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme",
      boxX + pad,
      by,
      boxW - (pad * 2),
      { size: 6.7, bold: false, color: muted, lineHeight: 8.2 },
    );
    by -= 1;
    by = drawParagraph(
      "TGA nicotine pouches importation guidance: tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/nicotine-pouches#importation",
      boxX + pad,
      by,
      boxW - (pad * 2),
      { size: 6.7, bold: false, color: muted, lineHeight: 8.2 },
    );
  };

  drawBorderSecuritySection();

  // RIGHT COLUMN
  let yr = y;

  yr = drawSectionTitle("Supplier / parcel details", rightX, yr);
  yr = drawKV("Order", coalesce(order?.order_name, String(order?.shopify_order_id ?? "")), rightX, yr, rightW);
  yr = drawKV(
    "Prescription / declaration date",
    formatDateAULong(order?.processed_at ?? order?.created_at ?? new Date().toISOString()),
    rightX,
    yr,
    rightW,
  );
  yr = drawKV("Print instruction", "Print this single document and include it inside the parcel.", rightX, yr, rightW);
  yr = drawKV("Shipping instruction", "Ship directly to the named patient only. Do not combine patients, prescriptions or orders into one parcel.", rightX, yr, rightW);

  // Signature box
  drawText("Prescriber signature", rightX, yr, 9, false, muted);
  yr -= 14;
  page.drawRectangle({ x: rightX, y: yr - 58, width: rightW, height: 58, borderColor: border, borderWidth: 1, color: rgb(1, 1, 1) });
  if (signaturePngBytes) {
    try {
      const png = await pdfDoc.embedPng(signaturePngBytes);
      const pngDims = png.scale(1);
      const maxW = rightW - 16;
      const maxH = 46;
      const scale = Math.min(maxW / pngDims.width, maxH / pngDims.height);
      const w = pngDims.width * scale;
      const h = pngDims.height * scale;
      page.drawImage(png, {
        x: rightX + 8,
        y: yr - 58 + 6,
        width: w,
        height: h,
      });
    } catch {
      drawText("(signature image unreadable)", rightX + 8, yr - 34, 9, false, muted);
    }
  } else {
    drawText("(signature on file: missing)", rightX + 8, yr - 34, 9, false, muted);
  }
  yr -= 70;

  yr = drawSectionTitle("Medication allowance", rightX, yr);

  // Allowance box (right column is narrow: use stacked rows instead of 2-column label/value)
  const ax = rightX + 10;
  const paddingTop = 12;
  const paddingBottom = 12;
  const rowGap = 8;
  const labelSize = 9;
  const valueSize = 10;
  const labelLH = 11;
  const valueLH = 13;
  const contentW = rightW - 20;

  const rows: Array<{ k: string; v: string; bold?: boolean }> = [
    { k: "Allowance limit", v: `${allowance.limitCans} cans per prescription (3 months supply)` },
    { k: "This order", v: `${allowance.thisOrderCans} cans`, bold: true },
    { k: "Total supplied", v: `${allowance.totalSuppliedToDateCans} cans` },
    { k: "Remaining", v: `${allowance.remainingCans} cans`, bold: true },
    { k: "Status", v: allowance.status, bold: true },
  ];

  // Pre-measure height so the box never overlaps what follows.
  const rowHeights = rows.map(({ v, bold }) => {
    const labelH = labelLH;
    const lines = wrapText(v, contentW, valueSize, !!bold);
    const valueH = Math.max(valueLH, lines.length * valueLH);
    return labelH + 2 + valueH;
  });

  const boxH = paddingTop + rowHeights.reduce((s, h) => s + h, 0) + rowGap * (rows.length - 1) + paddingBottom;

  page.drawRectangle({ x: rightX, y: yr - boxH, width: rightW, height: boxH, color: bg, borderColor: border, borderWidth: 1 });

  let ay = yr - paddingTop;
  for (let i = 0; i < rows.length; i++) {
    const { k, v, bold } = rows[i];
    drawText(`${k}:`, ax, ay, labelSize, false, muted);
    ay -= (labelLH + 2);
    ay = drawParagraph(v, ax, ay, contentW, { size: valueSize, bold: !!bold, color: text, lineHeight: valueLH });
    ay -= (i === rows.length - 1 ? 0 : rowGap);
  }

  yr -= boxH + 12;

  yr = drawSectionTitle("Prescription Import Declaration", rightX, yr);
  drawText("Active ingredient:", rightX, yr, 9, false, muted);
  yr -= 12;
  yr = drawParagraph("Nicotine (present as nicotine bitartrate salt)", rightX, yr, rightW, { size: 10, bold: true, color: text, lineHeight: 12 });
  yr -= 6;
  drawText("Other ingredients (excipients):", rightX, yr, 9, false, muted);
  yr -= 12;
  yr = drawParagraph(
    "Microcrystalline cellulose (E460), glycerol (E422), sodium carbonates (E500), tartaric acid (E334), calcium chloride (E509), acesulfame potassium (E950).",
    rightX,
    yr,
    rightW,
    { size: 9, bold: false, color: text, lineHeight: 11 },
  );
  yr -= 6;

  drawText("Declaration:", rightX, yr, 9, false, muted);
  yr -= 12;
  yr = drawParagraph(
    "Compliant prescription-supported personal importation for the named Australian patient/importer. The prescribed nicotine salt is supported by the attached prescription; listed non-nicotine excipients are within permitted limits. Supplied for personal therapeutic use only and not for resale or supply to any other person.",
    rightX,
    yr,
    rightW,
    { size: 9, bold: false, color: text, lineHeight: 11 },
  );
  yr -= 8;

  yr = drawSectionTitle("References (TGA)", rightX, yr);
  const ref1 = "https://www.tga.gov.au/products/unapproved-therapeutic-goods/access-pathways/personal-importation-scheme";
  const ref2 = "https://www.tga.gov.au/products/unapproved-therapeutic-goods/therapeutic-vaping-goods/vaping-hub/nicotine-pouches#importation";
  yr = drawParagraph(`Personal importation scheme: ${ref1}`, rightX, yr, rightW, { size: 7.6, bold: false, color: muted, lineHeight: 10 });
  yr -= 2;
  yr = drawParagraph(`Nicotine pouches (importation): ${ref2}`, rightX, yr, rightW, { size: 7.6, bold: false, color: muted, lineHeight: 10 });
  yr -= 8;

  // Footer
  const footerY = 44;
  drawText(
    `Generated: ${formatDateAUShort(new Date().toISOString())} • Order: ${order?.order_name ?? order?.shopify_order_id ?? ""} • Single supplier print document • Layout: ${LAYOUT_VERSION}`,
    marginX,
    footerY,
    8,
    false,
    muted,
  );

  if (importInfoUrl) {
    drawText(`Import information: ${importInfoUrl}`, marginX, footerY - 12, 7.5, false, muted);
  }

  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // Auth:
    // - Primary: service role (called from webhook)
    // - Secondary (for admin testing): bearer JWT for a user with user_roles.role = 'admin'
    const authHeader = req.headers.get("Authorization") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";

    const isServiceKeyCall = bearer && bearer === serviceKey;

    const isServiceRoleJwt = (() => {
      try {
        if (!bearer || !bearer.includes(".")) return false;
        const [, payloadB64] = bearer.split(".");
        const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        return payloadJson?.role === "service_role";
      } catch {
        return false;
      }
    })();

    const isServiceCall = isServiceKeyCall || isServiceRoleJwt;

    if (!isServiceCall) {
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jwt = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userData?.user?.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: roleRow, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (roleErr || roleRow?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const internalOrderId = body?.internalOrderId as string | undefined;
    if (!internalOrderId) {
      return new Response(JSON.stringify({ error: "internalOrderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Fetching order", { internalOrderId });

    const { data: order, error: orderErr } = await supabase
      .from("shopify_orders")
      .select("*")
      .eq("id", internalOrderId)
      .single();

    if (orderErr || !order) throw new Error(`Order not found: ${orderErr?.message ?? ""}`);

    const { data: items, error: itemsErr } = await supabase
      .from("shopify_order_items")
      .select("*")
      .eq("shopify_order_id", internalOrderId);

    if (itemsErr) throw new Error(`Failed to fetch order items: ${itemsErr.message}`);

    const patientId = order.user_id;

    const { data: patientProfile, error: patientErr } = await supabase
      .from("profiles")
      .select(
        "full_name, date_of_birth, phone, shipping_address_line1, shipping_address_line2, shipping_suburb, shipping_state, shipping_postcode, shipping_country",
      )
      .eq("user_id", patientId)
      .maybeSingle();

    if (patientErr) throw new Error(`Failed to fetch patient profile: ${patientErr.message}`);

    // Find latest issued prescription (doctor + patient link)
    const { data: latestRx } = await supabase
      .from("issued_prescriptions")
      .select("doctor_id, patient_id, issued_at")
      .eq("patient_id", patientId)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestRx?.doctor_id) throw new Error("No issued prescription found for patient (cannot determine prescriber)");

    const doctorId = latestRx.doctor_id;

    const { data: doctorRow, error: doctorRowErr } = await supabase
      .from("doctors")
      .select("id, user_id, provider_number")
      .eq("id", doctorId)
      .single();

    if (doctorRowErr || !doctorRow) throw new Error("Doctor record not found");

    const { data: doctorProfile, error: docProfErr } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", doctorRow.user_id)
      .maybeSingle();

    if (docProfErr) throw new Error(`Failed to fetch doctor profile: ${docProfErr.message}`);

    // Signature
    const { data: sigRow } = await supabase
      .from("doctor_signatures")
      .select("storage_bucket, storage_path")
      .eq("doctor_id", doctorId)
      .maybeSingle();

    const sigBucket = sigRow?.storage_bucket ?? "doctor-signatures";
    const sigPath = sigRow?.storage_path as string | undefined;
    const signaturePngBytes = sigPath ? await safeDownloadStorageObject(supabase, sigBucket, sigPath) : null;

    // Allowance calculations
    const limitCans = 60;

    // De-dupe within an order (we don't store Shopify line_item_id, so collapse identical variants)
    const normalizeKey = (it: any) => {
      const variantId = it?.shopify_variant_id ?? "";
      const title = coalesce(it?.title, "");
      const variant = coalesce(it?.variant_title, "");
      const strength = it?.strength_mg ?? null;
      return `${variantId}__${title}__${variant}__${strength ?? ""}`;
    };

    const normalizedThisOrder = new Map<string, { quantity: number }>();
    for (const it of (items || [])) {
      const qty = Number(it?.quantity ?? 0) || 0;
      if (qty <= 0) continue;
      const key = normalizeKey(it);
      const prev = normalizedThisOrder.get(key);
      if (prev) prev.quantity += qty;
      else normalizedThisOrder.set(key, { quantity: qty });
    }

    const thisOrderCans = Array.from(normalizedThisOrder.values()).reduce((sum, it) => sum + it.quantity, 0);

    // Total supplied to date = sum of paid order item quantities for this user
    // (Simple MVP: count orders with financial_status = 'paid')
    const { data: paidOrders, error: paidOrdersErr } = await supabase
      .from("shopify_orders")
      .select("id")
      .eq("user_id", patientId)
      .eq("financial_status", "paid");

    if (paidOrdersErr) throw new Error(`Failed to query paid orders: ${paidOrdersErr.message}`);

    const paidOrderIds = (paidOrders || []).map((o: any) => o.id);
    let totalSuppliedToDateCans = 0;
    if (paidOrderIds.length > 0) {
      const { data: paidItems, error: paidItemsErr } = await supabase
        .from("shopify_order_items")
        .select("shopify_order_id, shopify_variant_id, title, variant_title, strength_mg, quantity")
        .in("shopify_order_id", paidOrderIds);

      if (paidItemsErr) throw new Error(`Failed to query paid order items: ${paidItemsErr.message}`);

      // De-dupe within each order to avoid accidental double inserts inflating allowance.
      const normalizedPaid = new Map<string, number>();
      for (const it of (paidItems || [])) {
        const qty = Number(it?.quantity ?? 0) || 0;
        if (qty <= 0) continue;
        const key = `${it?.shopify_order_id}__${normalizeKey(it)}`;
        normalizedPaid.set(key, (normalizedPaid.get(key) ?? 0) + qty);
      }

      totalSuppliedToDateCans = Array.from(normalizedPaid.values()).reduce((s, q) => s + q, 0);
    }

    const remainingCans = Math.max(0, limitCans - totalSuppliedToDateCans);
    const status = remainingCans === 0 ? "EXHAUSTED" : "AVAILABLE";

    const importInfoUrl = (Deno.env.get("IMPORT_INFO_URL") ?? "").trim() || null;

    const pdfBytes = await generatePdfBytes({
      order,
      items: items || [],
      patientProfile: patientProfile || {},
      doctorProfile: doctorProfile || {},
      doctorRow,
      signaturePngBytes,
      allowance: {
        limitCans,
        thisOrderCans,
        totalSuppliedToDateCans,
        remainingCans,
        status,
      },
      importInfoUrl,
    });

    const filePath = `${patientId}/orders/${order.shopify_order_id}/supplier-print-document.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from("order-pdfs")
      .upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadErr) throw new Error(`Failed to upload PDF: ${uploadErr.message}`);

    const { error: upsertPdfErr } = await supabase
      .from("order_pdfs")
      .upsert(
        {
          shopify_order_id: internalOrderId,
          kind: "prescription",
          bucket: "order-pdfs",
          path: filePath,
        },
        { onConflict: "shopify_order_id,kind" },
      );

    if (upsertPdfErr) throw new Error(`Failed to upsert order_pdfs row: ${upsertPdfErr.message}`);

    const { data: signed, error: signedErr } = await supabase.storage
      .from("order-pdfs")
      .createSignedUrl(filePath, 60 * 10);

    if (signedErr) throw new Error(`Failed to create signed PDF URL: ${signedErr.message}`);

    logStep("Generated and uploaded", { filePath });

    return new Response(JSON.stringify({ success: true, path: filePath, signedUrl: signed?.signedUrl ?? null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

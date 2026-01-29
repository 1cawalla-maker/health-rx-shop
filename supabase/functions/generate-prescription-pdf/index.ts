import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GENERATE-PRESCRIPTION-PDF] ${step}${detailsStr}`);
};

const formatDateAU = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const capitalize = (s?: string | null) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const generatePrescriptionPdfBytes = async (prescription: any, patient: any, doctor: any) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { height, width } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.31, 0.27, 0.90); // Indigo-ish
  const text = rgb(0.10, 0.10, 0.10);
  const muted = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.85, 0.85, 0.85);

  const marginX = 50;
  let y = height - 60;

  const drawH1 = (t: string) => {
    page.drawText(t, { x: marginX, y, size: 20, font: fontBold, color: brand });
    y -= 28;
  };

  const drawMuted = (t: string) => {
    page.drawText(t, { x: marginX, y, size: 10, font, color: muted });
    y -= 16;
  };

  const drawSectionTitle = (t: string) => {
    y -= 10;
    page.drawText(t.toUpperCase(), { x: marginX, y, size: 11, font: fontBold, color: brand });
    y -= 4;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: width - marginX, y },
      thickness: 0.5,
      color: lightGray,
    });
    y -= 16;
  };

  const drawLine = (t: string, x = marginX) => {
    page.drawText(t, { x, y, size: 12, font, color: text });
    y -= 16;
  };

  const drawKV = (k: string, v: string) => {
    page.drawText(`${k}:`, { x: marginX, y, size: 11, font: fontBold, color: text });
    page.drawText(v || "—", { x: marginX + 160, y, size: 11, font, color: text });
    y -= 18;
  };

  // Header
  drawH1("NicoPatch Telehealth");
  drawMuted("Authorised Nicotine Prescription");
  y -= 6;

  // Reference & Status Box
  page.drawRectangle({
    x: marginX,
    y: y - 30,
    width: width - 2 * marginX,
    height: 40,
    color: rgb(0.96, 0.96, 0.98),
    borderColor: lightGray,
    borderWidth: 1,
  });
  y -= 8;
  page.drawText(`Reference: ${prescription.reference_id}`, {
    x: marginX + 12,
    y,
    size: 12,
    font: fontBold,
    color: text,
  });
  page.drawText(`Status: ${capitalize(prescription.status)}`, {
    x: width - marginX - 140,
    y,
    size: 12,
    font: fontBold,
    color: prescription.status === 'active' ? rgb(0.13, 0.55, 0.13) : muted,
  });
  y -= 40;

  // Patient Details
  drawSectionTitle("Patient Details");
  drawLine(patient?.full_name ? String(patient.full_name) : "Patient");
  if (patient?.date_of_birth) drawLine(`Date of Birth: ${formatDateAU(patient.date_of_birth)}`);
  if (patient?.phone) drawLine(`Phone: ${String(patient.phone)}`);

  // Prescriber Details
  drawSectionTitle("Prescriber Details");
  drawLine(`Dr. ${doctor?.full_name ? String(doctor.full_name) : "Doctor"}`);
  drawLine(`AHPRA Registration: ${doctor?.ahpra_number ? String(doctor.ahpra_number) : "N/A"}`);
  drawLine(`Provider Number: ${doctor?.provider_number ? String(doctor.provider_number) : "N/A"}`);

  // Prescription Details
  drawSectionTitle("Prescription Details");
  drawKV("Date of Issue", formatDateAU(prescription.issued_at));
  drawKV("Valid Until", formatDateAU(prescription.expires_at));
  drawKV("Prescription Status", capitalize(prescription.status));

  // Medication
  drawSectionTitle("Medication Information");
  drawKV("Item", "Nicotine Pouches (Schedule 4)");
  drawKV("Nicotine Strength", String(prescription.nicotine_strength || ""));
  drawKV("Usage Tier", capitalize(String(prescription.usage_tier || "")));
  drawKV("Daily Maximum", `${prescription.daily_max_pouches ?? ""} pouches per day`);
  drawKV("Supply Period", `${prescription.supply_days ?? ""} days`);
  drawKV("Total Pouches Prescribed", String(prescription.total_pouches ?? ""));
  drawKV("Containers Allowed", String(prescription.containers_allowed ?? ""));

  // Usage Instructions
  drawSectionTitle("Important Information");
  const instructions = [
    "• This prescription is only valid for the named patient.",
    "• Nicotine pouches are Schedule 4 (Prescription Only Medicine) in Australia.",
    "• Use as directed by your prescribing doctor.",
    "• Do not exceed the prescribed daily maximum.",
    "• Store in a cool, dry place away from children.",
    "• Dispose of unused pouches safely.",
  ];

  instructions.forEach(instruction => {
    page.drawText(instruction, { x: marginX, y, size: 10, font, color: muted });
    y -= 14;
  });

  // Signature Section
  y -= 20;
  page.drawLine({
    start: { x: marginX, y },
    end: { x: marginX + 200, y },
    thickness: 1,
    color: muted,
  });
  y -= 16;
  page.drawText("Prescriber Signature", { x: marginX, y, size: 11, font: fontBold, color: text });
  y -= 14;
  page.drawText(`Digitally signed on ${formatDateAU(prescription.issued_at)}`, {
    x: marginX,
    y,
    size: 10,
    font,
    color: muted,
  });
  y -= 12;
  page.drawText(`Dr. ${doctor?.full_name || 'Doctor'}`, {
    x: marginX,
    y,
    size: 10,
    font,
    color: muted,
  });
  y -= 12;
  page.drawText(`AHPRA: ${doctor?.ahpra_number || 'N/A'}`, {
    x: marginX,
    y,
    size: 10,
    font,
    color: muted,
  });

  // Footer
  const footerY = 40;
  page.drawText("NicoPatch Telehealth — Authorised Nicotine Prescription", {
    x: marginX,
    y: footerY,
    size: 8,
    font,
    color: muted,
  });
  page.drawText(`Generated: ${formatDateAU(new Date().toISOString())}`, {
    x: width - marginX - 100,
    y: footerY,
    size: 8,
    font,
    color: muted,
  });

  return await pdfDoc.save();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = authData.user;

    const { data: roleRow, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const userRole = roleRow?.role;

    if (roleError || (userRole !== "admin" && userRole !== "doctor")) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { prescriptionId } = await req.json();
    if (!prescriptionId) {
      return new Response(JSON.stringify({ error: "Prescription ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Fetching prescription", { prescriptionId, userRole, userId: user.id });

    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from("doctor_issued_prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      logStep("Prescription not found", { error: prescriptionError?.message });
      return new Response(JSON.stringify({ error: "Prescription not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Validate required prescription fields
    if (!prescription.nicotine_strength || !prescription.usage_tier) {
      logStep("Missing required prescription fields", { 
        nicotine_strength: prescription.nicotine_strength, 
        usage_tier: prescription.usage_tier 
      });
      return new Response(JSON.stringify({ 
        error: "Missing required prescription fields", 
        details: "nicotine_strength and usage_tier are required" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // If a doctor is requesting, ensure they own this prescription
    if (userRole === "doctor") {
      const { data: doctorId, error: doctorIdError } = await supabaseClient.rpc("get_doctor_id", {
        _user_id: user.id,
      });

      if (doctorIdError || !doctorId || doctorId !== prescription.doctor_id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
    }

    const { data: patientProfile } = await supabaseClient
      .from("profiles")
      .select("full_name, date_of_birth, phone")
      .eq("user_id", prescription.patient_id)
      .maybeSingle();

    const { data: doctorRecord, error: doctorRecordError } = await supabaseClient
      .from("doctors")
      .select("id, user_id, ahpra_number, provider_number")
      .eq("id", prescription.doctor_id)
      .single();

    if (doctorRecordError || !doctorRecord) {
      return new Response(JSON.stringify({ error: "Doctor record not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { data: doctorProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", doctorRecord.user_id)
      .maybeSingle();

    const doctor = {
      full_name: doctorProfile?.full_name,
      ahpra_number: doctorRecord.ahpra_number,
      provider_number: doctorRecord.provider_number,
    };

    logStep("Data fetched", {
      patientName: patientProfile?.full_name,
      doctorName: doctor.full_name,
    });

    const pdfBytes = await generatePrescriptionPdfBytes(prescription, patientProfile || {}, doctor);

    const fileName = `${prescription.patient_id}/${prescription.reference_id}.pdf`;

    const { error: uploadError } = await supabaseClient.storage
      .from("prescription-pdfs")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      logStep("Storage upload error", { error: uploadError.message });
      return new Response(JSON.stringify({ error: "Failed to upload PDF" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    await supabaseClient
      .from("doctor_issued_prescriptions")
      .update({ pdf_storage_path: fileName })
      .eq("id", prescriptionId);

    logStep("Prescription PDF generated", { fileName });

    return new Response(
      JSON.stringify({
        success: true,
        storagePath: fileName,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

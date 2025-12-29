import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PRESCRIPTION-PDF] ${step}${detailsStr}`);
};

// Simple PDF generation using text-based format
// For production, you'd want to use a proper PDF library like pdf-lib
const generatePrescriptionHTML = (prescription: any, patient: any, doctor: any) => {
  const issueDate = new Date(prescription.issued_at).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  const expiryDate = new Date(prescription.expires_at).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Prescription ${prescription.reference_id}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .subtitle { color: #666; font-size: 14px; }
    .prescription-id { font-size: 12px; color: #888; margin-top: 10px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: 0.5px; }
    .section-content { font-size: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .details-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .medication-box { background: #eef2ff; padding: 20px; border-radius: 8px; border: 1px solid #c7d2fe; }
    .medication-name { font-size: 18px; font-weight: bold; color: #4f46e5; }
    .medication-details { margin-top: 10px; }
    .medication-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .medication-row:last-child { border-bottom: none; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
    .signature-line { margin-top: 40px; border-top: 1px solid #000; width: 250px; padding-top: 8px; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">NicoPatch Telehealth</div>
    <div class="subtitle">Authorised Nicotine Prescription</div>
    <div class="prescription-id">Reference: ${prescription.reference_id}</div>
  </div>

  <div class="grid">
    <div class="section">
      <div class="section-title">Patient Details</div>
      <div class="section-content">
        <strong>${patient.full_name || 'Patient'}</strong><br>
        ${patient.date_of_birth ? `DOB: ${new Date(patient.date_of_birth).toLocaleDateString('en-AU')}` : ''}<br>
        ${patient.phone || ''}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Prescriber Details</div>
      <div class="section-content">
        <strong>Dr. ${doctor.full_name || 'Doctor'}</strong><br>
        AHPRA: ${doctor.ahpra_number || 'N/A'}<br>
        Provider: ${doctor.provider_number || 'N/A'}
      </div>
    </div>
  </div>

  <div class="details-box">
    <div class="grid">
      <div>
        <div class="section-title">Date of Issue</div>
        <div class="section-content">${issueDate}</div>
      </div>
      <div>
        <div class="section-title">Valid Until</div>
        <div class="section-content">${expiryDate}</div>
      </div>
    </div>
  </div>

  <div class="medication-box">
    <div class="medication-name">Nicotine Pouches (TGA Schedule 4)</div>
    <div class="medication-details">
      <div class="medication-row">
        <span>Nicotine Strength</span>
        <strong>${prescription.nicotine_strength}</strong>
      </div>
      <div class="medication-row">
        <span>Usage Tier</span>
        <strong>${prescription.usage_tier.charAt(0).toUpperCase() + prescription.usage_tier.slice(1)}</strong>
      </div>
      <div class="medication-row">
        <span>Daily Maximum</span>
        <strong>${prescription.daily_max_pouches} pouches/day</strong>
      </div>
      <div class="medication-row">
        <span>Supply Period</span>
        <strong>${prescription.supply_days} days</strong>
      </div>
      <div class="medication-row">
        <span>Total Pouches Authorised</span>
        <strong>${prescription.total_pouches} pouches</strong>
      </div>
      <div class="medication-row">
        <span>Containers Allowed</span>
        <strong>${prescription.containers_allowed} containers</strong>
      </div>
    </div>
  </div>

  <div class="warning">
    <strong>Important:</strong> This prescription is only valid for the named patient. 
    Nicotine pouches are a prescription-only medicine in Australia and must be used as directed. 
    Not for sale to persons under 18 years of age.
  </div>

  <div class="signature-line">
    <strong>Prescriber Signature</strong><br>
    <em>Digitally signed on ${issueDate}</em>
  </div>

  <div class="footer">
    <p>This prescription was generated by NicoPatch Telehealth platform.</p>
    <p>For verification, contact: support@nicopatch.com.au | ABN: XX XXX XXX XXX</p>
  </div>
</body>
</html>
  `;
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
    if (!authHeader) throw new Error("No authorization header provided");

    const { prescriptionId } = await req.json();
    if (!prescriptionId) throw new Error("Prescription ID is required");

    logStep("Fetching prescription", { prescriptionId });

    // Fetch prescription with related data
    const { data: prescription, error: prescriptionError } = await supabaseClient
      .from("doctor_issued_prescriptions")
      .select("*")
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      throw new Error("Prescription not found");
    }

    // Fetch patient profile
    const { data: patientProfile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", prescription.patient_id)
      .single();

    // Fetch doctor info
    const { data: doctorData } = await supabaseClient
      .from("doctors")
      .select("*, profiles!doctors_user_id_fkey(full_name)")
      .eq("id", prescription.doctor_id)
      .single();

    const doctor = {
      full_name: doctorData?.profiles?.full_name,
      ahpra_number: doctorData?.ahpra_number,
      provider_number: doctorData?.provider_number
    };

    logStep("Data fetched", { 
      patientName: patientProfile?.full_name,
      doctorName: doctor.full_name 
    });

    // Generate HTML
    const html = generatePrescriptionHTML(prescription, patientProfile || {}, doctor);

    // Convert HTML to base64 for storage/download
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));

    // Store the HTML as a file in storage
    const fileName = `${prescription.patient_id}/${prescription.reference_id}.html`;
    
    const { error: uploadError } = await supabaseClient.storage
      .from("prescription-pdfs")
      .upload(fileName, html, {
        contentType: "text/html",
        upsert: true
      });

    if (uploadError) {
      logStep("Storage upload error", { error: uploadError.message });
    } else {
      // Update prescription with storage path
      await supabaseClient
        .from("doctor_issued_prescriptions")
        .update({ pdf_storage_path: fileName })
        .eq("id", prescriptionId);
    }

    logStep("Prescription document generated", { fileName });

    return new Response(JSON.stringify({ 
      success: true, 
      html,
      storagePath: fileName
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

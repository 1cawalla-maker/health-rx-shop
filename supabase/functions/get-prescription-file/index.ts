import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client to bypass RLS for file access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const userRole = roleData?.role
    
    // Allow admins and doctors to access prescriptions
    if (roleError || (userRole !== 'admin' && userRole !== 'doctor')) {
      return new Response(
        JSON.stringify({ error: 'Access denied - admin or doctor role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get request body
    const { prescriptionId, filePath, type } = await req.json()

    let storagePath: string | null = null
    let bucketName = 'prescription-pdfs' // Default to doctor-issued prescriptions

    if (prescriptionId) {
      // First try doctor_issued_prescriptions table
      const { data: issuedPrescription, error: issuedError } = await supabase
        .from('doctor_issued_prescriptions')
        .select('pdf_storage_path')
        .eq('id', prescriptionId)
        .maybeSingle()

      if (issuedPrescription?.pdf_storage_path) {
        storagePath = issuedPrescription.pdf_storage_path
        bucketName = 'prescription-pdfs'
      } else {
        // Fall back to uploaded prescriptions table
        const { data: uploadedPrescription, error: uploadedError } = await supabase
          .from('prescriptions')
          .select('file_url')
          .eq('id', prescriptionId)
          .maybeSingle()

        if (uploadedPrescription?.file_url) {
          storagePath = uploadedPrescription.file_url
          bucketName = 'prescriptions'
        }
      }

      if (!storagePath) {
        return new Response(
          JSON.stringify({ error: 'Prescription not found or no file attached' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (filePath) {
      storagePath = filePath
      // Use type to determine bucket if provided
      if (type === 'uploaded') {
        bucketName = 'prescriptions'
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'prescriptionId or filePath required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: 'No file path found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching from bucket: ${bucketName}, path: ${storagePath}`)

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600)

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Could not generate file URL', details: signedUrlError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generated signed URL for prescription file: ${storagePath}`)

    return new Response(
      JSON.stringify({ 
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 3600 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
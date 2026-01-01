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

    // Service role client: can read DB + generate signed URLs regardless of RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const user = authData.user

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    const userRole = roleData?.role

    if (roleError || (userRole !== 'admin' && userRole !== 'doctor')) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { prescriptionId, filePath, storagePath: storagePathParam, type } = await req.json()

    let storagePath: string | null = null
    let bucketName = 'prescription-pdfs'

    if (prescriptionId) {
      // Prefer doctor-issued prescriptions
      const { data: issuedPrescription } = await supabase
        .from('doctor_issued_prescriptions')
        .select('pdf_storage_path, doctor_id')
        .eq('id', prescriptionId)
        .maybeSingle()

      if (issuedPrescription?.pdf_storage_path) {
        if (userRole === 'doctor') {
          const { data: doctorId, error: doctorIdError } = await supabase.rpc('get_doctor_id', {
            _user_id: user.id,
          })

          if (doctorIdError || !doctorId || doctorId !== issuedPrescription.doctor_id) {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }

        storagePath = issuedPrescription.pdf_storage_path
        bucketName = 'prescription-pdfs'
      } else {
        // Fallback: uploaded prescriptions
        const { data: uploadedPrescription } = await supabase
          .from('prescriptions')
          .select('file_url, doctor_id')
          .eq('id', prescriptionId)
          .maybeSingle()

        if (uploadedPrescription?.file_url) {
          // Doctors can only access prescriptions they issued (when present)
          if (userRole === 'doctor' && uploadedPrescription.doctor_id && uploadedPrescription.doctor_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Access denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          storagePath = uploadedPrescription.file_url
          bucketName = 'prescriptions'
        }
      }

      if (!storagePath) {
        return new Response(JSON.stringify({ error: 'Prescription not found or no file attached' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else if (filePath || storagePathParam) {
      // Accept either filePath or storagePath parameter
      const pathToUse = filePath || storagePathParam

      // Doctors can access paths for prescriptions they've issued
      // Check if the path belongs to a prescription this doctor issued
      if (userRole === 'doctor') {
        const { data: doctorId } = await supabase.rpc('get_doctor_id', { _user_id: user.id })
        
        const { data: prescriptionCheck } = await supabase
          .from('doctor_issued_prescriptions')
          .select('id')
          .eq('pdf_storage_path', pathToUse)
          .eq('doctor_id', doctorId)
          .maybeSingle()
        
        if (!prescriptionCheck) {
          return new Response(JSON.stringify({ error: 'Access denied - prescription not found for this doctor' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      storagePath = pathToUse
      if (type === 'uploaded') {
        bucketName = 'prescriptions'
      }
    } else {
      return new Response(JSON.stringify({ error: 'prescriptionId or filePath required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'No file path found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Fetching from bucket: ${bucketName}, path: ${storagePath}`)

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

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 3600,
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call mongodb-operations to check if admins exist
    const checkResponse = await supabase.functions.invoke('mongodb-operations', {
      body: {
        operation: 'find',
        collection: 'admins',
        filter: {}
      }
    });

    const existingAdmins = checkResponse.data?.data || [];

    // If no admins exist, create the first admin
    if (existingAdmins.length === 0) {
      const adminData = {
        telegram_user_id: 6965488457,
        username: '@Hidden_Xman',
        created_at: new Date().toISOString()
      };

      const insertResponse = await supabase.functions.invoke('mongodb-operations', {
        body: {
          operation: 'insert',
          collection: 'admins',
          data: adminData
        }
      });

      if (insertResponse.error) {
        throw insertResponse.error;
      }

      console.log('First admin created successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'First admin created successfully',
          admin: adminData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Admin already exists. This function can only be used once to create the first admin.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

  } catch (error) {
    console.error('Error initializing admin:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

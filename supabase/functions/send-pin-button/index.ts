import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telegram_user_id, bot_username } = await req.json();
    
    const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";
    const TELEGRAM_GROUP_CHAT_ID = "-1003390034266";
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('*')
      .eq('telegram_user_id', telegram_user_id)
      .maybeSingle();
    
    if (!adminData) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You are not an admin' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }
    
    // Get bot username from Telegram API
    const botInfoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );
    const botInfo = await botInfoResponse.json();
    const botName = botInfo.result.username;
    
    // Create the mini app URL - ensure it opens the full mini-app interface
    const miniAppUrl = `https://d70c826e-49fc-498b-868b-28028e643a08.lovableproject.com`;
    
    // Send message with inline button to the group
    const message = "🎲 <b>Deep Night Ludo Club - Place Your Table</b>\n\n✨ Click button to open full mini-app\n💰 Balance auto-checked\n🎮 Last table settings loaded\n📝 Complete table form available\n\n<b>Available Features:</b>\n• Amount selection (₹1000-₹10000)\n• Game type (Full, Ulta, Popular, etc.)\n• Game+ options (100-1000)\n• Custom options (Fresh ID, Code Aap Doge, No iPhone, etc.)\n• Last table copy/edit\n• Real-time balance updates\n\n<b>👇 Click below to place your table 👇</b>";
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_GROUP_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              {
                text: "🎮 Place New Table - Open Mini App",
                web_app: {
                  url: miniAppUrl
                }
              }
            ]]
          }
        }),
      }
    );
    
    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send message to group' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Get the message_id to return so admin can pin it
    const messageId = result.result.message_id;
    
    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageId,
        bot_username: botName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

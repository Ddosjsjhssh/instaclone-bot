import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, type, gamePlus, options, balance } = await req.json();

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_GROUP_CHAT_ID = Deno.env.get('TELEGRAM_GROUP_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_GROUP_CHAT_ID) {
      throw new Error('Telegram bot token or group chat ID not configured');
    }

    // Format the message
    const optionsText = Object.entries(options)
      .filter(([_, value]) => value)
      .map(([key]) => `✓ ${key}`)
      .join('\n');

    const message = `🎮 *New Table Request*\n\n` +
      `💰 *Amount:* ${amount}\n` +
      `🎯 *Type:* ${type}\n` +
      `🎮 *Game+:* ${gamePlus}\n` +
      `💳 *Balance:* ${balance}\n\n` +
      (optionsText ? `*Options:*\n${optionsText}` : 'No options selected');

    // Send message to Telegram group
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_GROUP_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!telegramResponse.ok) {
      const error = await telegramResponse.json();
      console.error('Telegram API error:', error);
      throw new Error('Failed to send message to Telegram');
    }

    const result = await telegramResponse.json();
    console.log('Message sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Message sent to Telegram group' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-telegram-message function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

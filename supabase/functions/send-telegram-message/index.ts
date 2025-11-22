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
    const { username, amount, type, gamePlus, options, balance } = await req.json();

    const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";
    const TELEGRAM_GROUP_CHAT_ID = "-5082338946";

    console.log('Sending table with username:', username);

    // Format the message
    const optionsText = Object.entries(options)
      .filter(([_, value]) => value)
      .map(([key]) => {
        const optionNames: { [key: string]: string } = {
          freshId: 'Fresh Id',
          codeAapDoge: 'Code Aap Doge',
          noIphone: 'No iPhone',
          noKingPass: 'No King Pass',
          autoLoss: 'Auto Loss'
        };
        return `=>${optionNames[key] || key}`;
      })
      .join('');

    const message = `Table by @${username}:\n${amount} | ${type}` +
      (gamePlus ? ` | ${gamePlus}+ game` : '') + '\n\n' +
      (optionsText ? optionsText : '');

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
      console.error('Bot token (first 10 chars):', TELEGRAM_BOT_TOKEN.substring(0, 10));
      console.error('Chat ID:', TELEGRAM_GROUP_CHAT_ID);
      throw new Error(`Failed to send message to Telegram: ${error.description}`);
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

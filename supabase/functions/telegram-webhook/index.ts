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
    const update = await req.json();
    console.log('Received webhook update:', JSON.stringify(update));

    const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";
    
    // Check if message exists and is a reply
    if (update.message && update.message.reply_to_message && update.message.text) {
      const replyText = update.message.text.trim().toUpperCase();
      const originalMessage = update.message.reply_to_message.text;
      const acceptingUser = update.message.from;
      
      console.log('Reply text:', replyText);
      console.log('Original message:', originalMessage);
      
      // Check if reply is "L" or "OK"
      if (replyText === 'L' || replyText === 'OK') {
        // Parse original table message to extract details
        const amountMatch = originalMessage.match(/(\d+) \| (.+)/);
        const optionsMatch = originalMessage.match(/=>(.+)/);
        
        if (amountMatch) {
          const originalUserId = update.message.reply_to_message.from.id;
          const originalUsername = update.message.reply_to_message.from.username || update.message.reply_to_message.from.first_name;
          const acceptingUsername = acceptingUser.username || acceptingUser.first_name;
          const acceptingUserId = acceptingUser.id;
          const amount = amountMatch[1];
          const gameType = amountMatch[2].split('\n')[0].trim();
          const options = optionsMatch ? optionsMatch[1] : '';
          
          // Generate random table number
          const tableNumber = Math.floor(Math.random() * 9000) + 1000;
          
          // Format the message with clickable mentions (blue usernames)
          let formattedMessage = `DeepNightClubBot\n`;
          formattedMessage += `[${originalUsername}](tg://user?id=${originalUserId}) Vs. [${acceptingUsername}](tg://user?id=${acceptingUserId})\n\n`;
          formattedMessage += `Rs.${amount}.00 | ${gameType}`;
          
          if (options) {
            formattedMessage += ` =>${options}`;
          }
          
          formattedMessage += `\n${'─'.repeat(40)}\n`;
          formattedMessage += `Table #${tableNumber}`;
          
          console.log('Sending formatted message:', formattedMessage);
          
          // Send the formatted message
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: update.message.chat.id,
                text: formattedMessage,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
              }),
            }
          );

          if (!telegramResponse.ok) {
            const error = await telegramResponse.json();
            console.error('Telegram API error:', error);
            throw new Error(`Failed to send message: ${error.description}`);
          }

          console.log('Match message sent successfully');
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in telegram-webhook function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

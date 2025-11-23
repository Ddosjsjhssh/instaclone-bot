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
    console.log('🔔 Received webhook update:', JSON.stringify(update, null, 2));

    const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";
    
    // Check if message exists and is a reply
    if (update.message && update.message.reply_to_message && update.message.text) {
      const replyText = update.message.text.trim().toUpperCase();
      const originalMessage = update.message.reply_to_message.text;
      const acceptingUser = update.message.from;
      const originalUser = update.message.reply_to_message.from;
      
      console.log('✅ Reply detected!');
      console.log('📝 Reply text:', replyText);
      console.log('📨 Original message:', originalMessage);
      console.log('👤 Accepting user:', JSON.stringify(acceptingUser));
      console.log('👤 Original user:', JSON.stringify(originalUser));
      
      // Check if reply is "L" or "OK"
      if (replyText === 'L' || replyText === 'OK') {
        console.log('✓ Valid reply detected (L or OK)');
        
        // Parse original table message to extract details
        // Expected format: "Table by @username:\n600 | Full | 200+ game\n\n=>Code Aap Doge=>No King Pass"
        const lines = originalMessage.split('\n');
        console.log('📋 Split lines:', JSON.stringify(lines));
        
        // Find the line with amount and game type (contains " | ")
        const tableInfoLine = lines.find((line: string) => line.includes(' | ') && /\d+/.test(line));
        console.log('🎯 Table info line found:', tableInfoLine);
        
        if (tableInfoLine) {
          // Extract username from "Table by @username:" in the original message
          const firstLine = lines[0];
          const usernameMatch = firstLine.match(/Table by @(\w+):/);
          const originalUsername = usernameMatch ? usernameMatch[1] : (originalUser.username || originalUser.first_name);
          const acceptingUsername = acceptingUser.username || acceptingUser.first_name;
          
          console.log('👥 Usernames - Original:', originalUsername, 'Accepting:', acceptingUsername);
          
          // Extract amount and game type
          const parts = tableInfoLine.split(' | ');
          const amount = parts[0].trim();
          const gameType = parts.slice(1).join(' | ').trim();
          
          console.log('Amount:', amount, 'Game Type:', gameType);
          
          // Extract options (everything after "=>")
          const optionsIndex = originalMessage.indexOf('=>');
          const options = optionsIndex !== -1 ? originalMessage.substring(optionsIndex) : '';
          
          console.log('Options:', options);
          
          // Generate random table number
          const tableNumber = Math.floor(Math.random() * 9000) + 1000;
          
          // Format the message exactly like the reference image
          let formattedMessage = `@${originalUsername} Vs. @${acceptingUsername}\n\n`;
          formattedMessage += `Rs.${amount}.00 | ${gameType}`;
          
          if (options) {
            formattedMessage += `\n${options}`;
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

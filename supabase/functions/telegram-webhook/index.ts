import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";

// Helper function to check if user is admin
async function isAdmin(supabase: any, telegramUserId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle();

    return !error && data !== null;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper function to send Telegram message
async function sendTelegramMessage(chatId: number, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      }),
    }
  );
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('🔔 Received webhook update:', JSON.stringify(update, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle admin commands
    if (update.message && update.message.text && update.message.text.startsWith('/')) {
      const userId = update.message.from.id;
      const chatId = update.message.chat.id;
      const messageText = update.message.text.trim();
      const command = messageText.split(' ')[0].toLowerCase();
      const args = messageText.split(' ').slice(1);

      // Check if user is admin
      const adminStatus = await isAdmin(supabase, userId);
      
      if (!adminStatus) {
        await sendTelegramMessage(chatId, '❌ You are not authorized to use admin commands.');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Handle /viewusers command
      if (command === '/viewusers') {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error || !users) {
          await sendTelegramMessage(chatId, '❌ Failed to fetch users.');
        } else {
          let message = '👥 <b>All Users and Balances:</b>\n\n';
          
          if (users.length === 0) {
            message += 'No users found.';
          } else {
            users.forEach((user: any, index: number) => {
              message += `${index + 1}. <b>@${user.username || 'N/A'}</b>\n`;
              message += `   ID: <code>${user.telegram_user_id}</code>\n`;
              message += `   Name: ${user.telegram_first_name || 'N/A'}\n`;
              message += `   Balance: ₹${(user.balance || 0).toFixed(2)}\n\n`;
            });
          }
          
          await sendTelegramMessage(chatId, message);
        }
      }
      
      // Handle /addfund command
      else if (command === '/addfund') {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, '❌ Invalid format. Use: /addfund [user_id] [amount]\n\nExample: /addfund 123456789 500');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const targetUserId = parseInt(args[0]);
        const amount = parseFloat(args[1]);

        if (isNaN(targetUserId) || isNaN(amount) || amount <= 0) {
          await sendTelegramMessage(chatId, '❌ Invalid user ID or amount.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get user's current balance
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError || !user) {
          await sendTelegramMessage(chatId, '❌ User not found.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const newBalance = (user.balance || 0) + amount;

        // Update balance
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('telegram_user_id', targetUserId);

        if (updateError) {
          await sendTelegramMessage(chatId, '❌ Failed to add funds.');
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ <b>Funds Added Successfully!</b>\n\n` +
            `User: @${user.username || 'N/A'}\n` +
            `Added: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}`
          );
        }
      }
      
      // Handle /deductfund command
      else if (command === '/deductfund') {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, '❌ Invalid format. Use: /deductfund [user_id] [amount]\n\nExample: /deductfund 123456789 500');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const targetUserId = parseInt(args[0]);
        const amount = parseFloat(args[1]);

        if (isNaN(targetUserId) || isNaN(amount) || amount <= 0) {
          await sendTelegramMessage(chatId, '❌ Invalid user ID or amount.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get user's current balance
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError || !user) {
          await sendTelegramMessage(chatId, '❌ User not found.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const newBalance = (user.balance || 0) - amount;

        if (newBalance < 0) {
          await sendTelegramMessage(chatId, `❌ Insufficient balance. Current balance: ₹${(user.balance || 0).toFixed(2)}`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Update balance
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('telegram_user_id', targetUserId);

        if (updateError) {
          await sendTelegramMessage(chatId, '❌ Failed to deduct funds.');
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ <b>Funds Deducted Successfully!</b>\n\n` +
            `User: @${user.username || 'N/A'}\n` +
            `Deducted: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}`
          );
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
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
          
          // Delete the original table message
          const deleteResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: update.message.chat.id,
                message_id: update.message.reply_to_message.message_id,
              }),
            }
          );

          if (deleteResponse.ok) {
            console.log('Original table message deleted successfully');
          } else {
            const deleteError = await deleteResponse.json();
            console.error('Failed to delete original message:', deleteError);
          }
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

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

    // Auto-register user if they send any message
    if (update.message && update.message.from) {
      const user = update.message.from;
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_user_id', user.id)
        .maybeSingle();

      if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            telegram_user_id: user.id,
            username: user.username,
            telegram_first_name: user.first_name,
            telegram_last_name: user.last_name,
            balance: 0
          });

        if (insertError) {
          console.error('Error registering user:', insertError);
        } else {
          console.log(`✅ New user registered: ${user.username || user.first_name} (${user.id})`);
        }
      }
    }

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

      // Handle /start or /admin command - Show admin panel
      if (command === '/start' || command === '/admin') {
        const panelMessage = 
          `🔧 <b>Admin Panel</b>\n\n` +
          `<b>Available commands:</b>\n` +
          `/viewusers - View all users and balances\n` +
          `/checkbalance - Check a user's balance\n` +
          `/addfund - Add funds to user\n` +
          `/deductfund - Deduct funds from user\n` +
          `/makeadmin - Make a user admin\n` +
          `/sendpinbutton - Send Place New Table button to group\n\n` +
          `<b>Usage:</b>\n` +
          `/checkbalance [user_id]\n` +
          `/addfund [user_id] [amount]\n` +
          `/deductfund [user_id] [amount]\n` +
          `/makeadmin [user_id]\n\n` +
          `<b>Example:</b>\n` +
          `/checkbalance 123456789\n` +
          `/addfund 123456789 500`;
        
        await sendTelegramMessage(chatId, panelMessage);
        
        // Get bot username to create mini-app URL
        const botInfoResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
        );
        const botInfo = await botInfoResponse.json();
        const botUsername = botInfo.result.username;
        const miniAppUrl = `https://t.me/${botUsername}/app`;
        
        // Send Place New Table button
        await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: '🎮 Click below to place a new table:',
              reply_markup: {
                inline_keyboard: [[
                  {
                    text: '🎮 Place New Table',
                    url: miniAppUrl
                  }
                ]]
              }
            })
          }
        );
        
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

        // Get user's current balance, or create user if not exists
        let { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError) {
          await sendTelegramMessage(chatId, '❌ Database error occurred.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // If user doesn't exist, create them
        if (!user) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              telegram_user_id: targetUserId,
              balance: 0
            })
            .select()
            .single();

          if (createError || !newUser) {
            await sendTelegramMessage(chatId, '❌ Failed to create user.');
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
          
          user = newUser;
          console.log(`✅ New user created: ${targetUserId}`);
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
          // Notify admin
          await sendTelegramMessage(
            chatId,
            `✅ <b>Funds Added Successfully!</b>\n\n` +
            `User: @${user.username || 'N/A'}\n` +
            `User ID: <code>${targetUserId}</code>\n` +
            `Added: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}`
          );
          
          // Notify the user receiving funds
          await sendTelegramMessage(
            targetUserId,
            `💰 <b>Funds Added to Your Account!</b>\n\n` +
            `Amount: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}\n\n` +
            `Thank you for using our service!`
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

        // Get user's current balance, or create user if not exists
        let { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError) {
          await sendTelegramMessage(chatId, '❌ Database error occurred.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // If user doesn't exist, create them with 0 balance
        if (!user) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              telegram_user_id: targetUserId,
              balance: 0
            })
            .select()
            .single();

          if (createError || !newUser) {
            await sendTelegramMessage(chatId, '❌ Failed to create user.');
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
          
          user = newUser;
          console.log(`✅ New user created: ${targetUserId}`);
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
          // Notify admin
          await sendTelegramMessage(
            chatId,
            `✅ <b>Funds Deducted Successfully!</b>\n\n` +
            `User: @${user.username || 'N/A'}\n` +
            `User ID: <code>${targetUserId}</code>\n` +
            `Deducted: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}`
          );
          
          // Notify the user about deduction
          await sendTelegramMessage(
            targetUserId,
            `⚠️ <b>Funds Deducted from Your Account</b>\n\n` +
            `Amount: ₹${amount.toFixed(2)}\n` +
            `New Balance: ₹${newBalance.toFixed(2)}\n\n` +
            `If you have any questions, please contact support.`
          );
        }
      }
      
      // Handle /makeadmin command
      else if (command === '/makeadmin') {
        if (args.length < 1) {
          await sendTelegramMessage(chatId, '❌ Invalid format. Use: /makeadmin [user_id]\n\nExample: /makeadmin 123456789');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const targetUserId = parseInt(args[0]);

        if (isNaN(targetUserId)) {
          await sendTelegramMessage(chatId, '❌ Invalid user ID.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get or create user
        let { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError) {
          await sendTelegramMessage(chatId, '❌ Database error occurred.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // If user doesn't exist, create them
        if (!user) {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              telegram_user_id: targetUserId,
              balance: 0
            })
            .select()
            .single();

          if (createError || !newUser) {
            await sendTelegramMessage(chatId, '❌ Failed to create user.');
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }
          
          user = newUser;
          console.log(`✅ New user created: ${targetUserId}`);
        }

        // Check if already admin
        const { data: existingAdmin } = await supabase
          .from('admins')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (existingAdmin) {
          await sendTelegramMessage(chatId, '⚠️ This user is already an admin.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Add user as admin
        const { error: insertError } = await supabase
          .from('admins')
          .insert({
            telegram_user_id: targetUserId,
            username: user.username
          });

        if (insertError) {
          console.error('Error making user admin:', insertError);
          await sendTelegramMessage(chatId, '❌ Failed to make user admin.');
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ <b>User Added as Admin!</b>\n\n` +
            `User: @${user.username || 'N/A'}\n` +
            `ID: <code>${targetUserId}</code>\n\n` +
            `This user now has access to all admin commands.`
          );
        }
      }
      
      // Handle /checkbalance command
      else if (command === '/checkbalance') {
        if (args.length < 1) {
          await sendTelegramMessage(chatId, '❌ Invalid format. Use: /checkbalance [user_id]\n\nExample: /checkbalance 123456789');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const targetUserId = parseInt(args[0]);

        if (isNaN(targetUserId)) {
          await sendTelegramMessage(chatId, '❌ Invalid user ID.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get user
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', targetUserId)
          .maybeSingle();

        if (userError) {
          await sendTelegramMessage(chatId, '❌ Database error occurred.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        if (!user) {
          await sendTelegramMessage(chatId, `❌ User with ID <code>${targetUserId}</code> not found.`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Send balance info
        await sendTelegramMessage(
          chatId,
          `💰 <b>User Balance Information</b>\n\n` +
          `User: @${user.username || 'N/A'}\n` +
          `Name: ${user.telegram_first_name || 'N/A'} ${user.telegram_last_name || ''}\n` +
          `User ID: <code>${targetUserId}</code>\n` +
          `Current Balance: ₹${(user.balance || 0).toFixed(2)}\n` +
          `Created: ${new Date(user.created_at).toLocaleDateString()}`
        );
      }
      
      // Handle /sendpinbutton command
      else if (command === '/sendpinbutton') {
        const TELEGRAM_GROUP_CHAT_ID = "-1003390034266";
        
        // Get bot username first
        const botInfoResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
        );
        const botInfo = await botInfoResponse.json();
        const botUsername = botInfo.result.username;
        
        // Create the mini app URL using bot username
        const miniAppUrl = `https://t.me/${botUsername}/app`;
        
        // Send message with inline button to the group
        const message = "🎲 <b>Deep Night Ludo Club</b>\n\n✅ अपना टेबल लगाने के लिए नीचे बटन दबाएं\n💰 Balance automatically checked\n🎮 Last table settings auto-loaded\n\n<b>👇 यहाँ क्लिक करें 👇</b>";
        
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
                    text: "🎮 Place New Table",
                    web_app: {
                      url: `https://d70c826e-49fc-498b-868b-28028e643a08.lovableproject.com`
                    }
                  }
                ]]
              }
            }),
          }
        );
        
        const result = await response.json();
        console.log('Send button result:', JSON.stringify(result, null, 2));
        
        if (!result.ok) {
          console.error('Telegram API error:', result);
          await sendTelegramMessage(chatId, `❌ Failed to send button: ${result.description || 'Unknown error'}`);
        } else {
          await sendTelegramMessage(chatId, '✅ Button sent to group successfully! You can now pin this message.');
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
          
          // Extract amount and game type
          const parts = tableInfoLine.split(' | ');
          const amountText = parts[0].trim();
          const gameType = parts.slice(1).join(' | ').trim();
          
          // Parse amount (remove "Rs." and ".00" if present)
          const amountMatch = amountText.match(/[\d.]+/);
          const betAmount = amountMatch ? parseFloat(amountMatch[0]) : 0;
          
          console.log('Amount:', amountText, 'Parsed amount:', betAmount, 'Game Type:', gameType);
          
          // Find the table in database using the message_id from the reply
          const originalMessageId = update.message.reply_to_message.message_id;
          console.log('Looking for table with message_id:', originalMessageId);
          
          const { data: tableRecord, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('message_id', originalMessageId)
            .eq('status', 'open')
            .maybeSingle();

          if (tableError || !tableRecord) {
            console.error('Error finding table:', tableError);
            await sendTelegramMessage(
              update.message.chat.id,
              `❌ Error: Could not find table record. Please try again.`
            );
            return new Response(JSON.stringify({ success: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }

          console.log('Found table record:', tableRecord);
          
          // Get the creator's telegram_user_id from the table record
          const creatorTelegramId = tableRecord.creator_telegram_user_id;
          const acceptorTelegramId = acceptingUser.id;
          
          // Get creator's username for display
          const { data: creatorUserData } = await supabase
            .from('users')
            .select('username, telegram_first_name')
            .eq('telegram_user_id', creatorTelegramId)
            .maybeSingle();
          
          const originalUsername = creatorUserData?.username || creatorUserData?.telegram_first_name || 'Unknown';
          const acceptingUsername = acceptingUser.username || acceptingUser.first_name;
          
          console.log('👥 Usernames - Original:', originalUsername, '(ID:', creatorTelegramId, ') Accepting:', acceptingUsername, '(ID:', acceptorTelegramId, ')');
          
          // Generate random table number for the match
          const matchTableNumber = Math.floor(Math.random() * 9000) + 1000;
          
          // Deduct balance from both users
          try {
            // Get both users' balances
            const { data: creatorUser, error: creatorError } = await supabase
              .from('users')
              .select('balance, username, telegram_first_name')
              .eq('telegram_user_id', creatorTelegramId)
              .maybeSingle();

            const { data: acceptorUser, error: acceptorError } = await supabase
              .from('users')
              .select('balance, username, telegram_first_name')
              .eq('telegram_user_id', acceptorTelegramId)
              .maybeSingle();

            if (creatorError || acceptorError || !creatorUser || !acceptorUser) {
              console.error('Error fetching user balances - Creator error:', creatorError, 'Acceptor error:', acceptorError);
              console.error('Creator user:', creatorUser, 'Acceptor user:', acceptorUser);
              await sendTelegramMessage(
                update.message.chat.id,
                `❌ Error: Could not fetch user balances. Please ensure both users are registered.`
              );
              return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              });
            }

            // Check if both users have sufficient balance
            if (creatorUser.balance < betAmount) {
              await sendTelegramMessage(
                update.message.chat.id,
                `❌ @${originalUsername} has insufficient balance. Current: ₹${creatorUser.balance.toFixed(2)}, Required: ₹${betAmount.toFixed(2)}`
              );
              return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              });
            }

            if (acceptorUser.balance < betAmount) {
              await sendTelegramMessage(
                update.message.chat.id,
                `❌ @${acceptingUsername} has insufficient balance. Current: ₹${acceptorUser.balance.toFixed(2)}, Required: ₹${betAmount.toFixed(2)}`
              );
              return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              });
            }

            // Deduct from both users
            const { error: deductCreatorError } = await supabase
              .from('users')
              .update({ 
                balance: creatorUser.balance - betAmount,
                updated_at: new Date().toISOString()
              })
              .eq('telegram_user_id', creatorTelegramId);

            const { error: deductAcceptorError } = await supabase
              .from('users')
              .update({ 
                balance: acceptorUser.balance - betAmount,
                updated_at: new Date().toISOString()
              })
              .eq('telegram_user_id', acceptorTelegramId);

            if (deductCreatorError || deductAcceptorError) {
              console.error('Error deducting balances:', deductCreatorError || deductAcceptorError);
              await sendTelegramMessage(
                update.message.chat.id,
                `❌ Error deducting balances. Please contact support.`
              );
              return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              });
            }

            // Update table status with new match table number
            const { error: updateTableError } = await supabase
              .from('tables')
              .update({ 
                acceptor_telegram_user_id: acceptorTelegramId,
                status: 'matched',
                table_number: matchTableNumber,
                completed_at: new Date().toISOString()
              })
              .eq('id', tableRecord.id);

            if (updateTableError) {
              console.error('Error updating table status:', updateTableError);
            }

            console.log(`✅ Deducted ₹${betAmount} from both users`);
            console.log(`Creator new balance: ₹${(creatorUser.balance - betAmount).toFixed(2)}`);
            console.log(`Acceptor new balance: ₹${(acceptorUser.balance - betAmount).toFixed(2)}`);

            // Notify both users
            await sendTelegramMessage(
              creatorTelegramId,
              `💰 Match confirmed! ₹${betAmount.toFixed(2)} deducted.\nNew balance: ₹${(creatorUser.balance - betAmount).toFixed(2)}`
            );

            await sendTelegramMessage(
              acceptorTelegramId,
              `💰 Match confirmed! ₹${betAmount.toFixed(2)} deducted.\nNew balance: ₹${(acceptorUser.balance - betAmount).toFixed(2)}`
            );
          } catch (balanceError) {
            console.error('Error in balance deduction:', balanceError);
            // Continue with match creation even if balance notification fails
          }
          
          // Extract options (everything after "=>")
          const optionsIndex = originalMessage.indexOf('=>');
          const options = optionsIndex !== -1 ? originalMessage.substring(optionsIndex) : '';
          
          console.log('Options:', options);
          
          // Format the message with mentions
          // Check if users have usernames
          const creatorHasUsername = creatorUserData?.username;
          const acceptorHasUsername = acceptingUser.username;
          
          // Build message text and entities for mentions
          let formattedMessage = '';
          const entities: any[] = [];
          let currentOffset = 0;
          
          // Add creator mention
          if (creatorHasUsername) {
            formattedMessage += `@${originalUsername}`;
          } else {
            const displayName = creatorUserData?.telegram_first_name || originalUsername;
            formattedMessage += displayName;
            entities.push({
              offset: currentOffset,
              length: displayName.length,
              type: 'text_mention',
              user: {
                id: creatorTelegramId,
                first_name: displayName
              }
            });
          }
          currentOffset = formattedMessage.length;
          
          formattedMessage += ' Vs. ';
          currentOffset = formattedMessage.length;
          
          // Add acceptor mention
          if (acceptorHasUsername) {
            formattedMessage += `@${acceptingUsername}`;
          } else {
            const displayName = acceptingUser.first_name || acceptingUsername;
            formattedMessage += displayName;
            entities.push({
              offset: currentOffset,
              length: displayName.length,
              type: 'text_mention',
              user: {
                id: acceptorTelegramId,
                first_name: displayName
              }
            });
          }
          
          formattedMessage += `\n\nRs.${betAmount}.00 | ${gameType}`;
          
          if (options) {
            formattedMessage += `\n${options}`;
          }
          
          formattedMessage += `\n${'─'.repeat(40)}\n`;
          formattedMessage += `Table #${matchTableNumber}`;
          
          console.log('Sending formatted message:', formattedMessage);
          console.log('With entities:', JSON.stringify(entities));
          
          // Send the formatted message with entities
          const messagePayload: any = {
            chat_id: update.message.chat.id,
            text: formattedMessage,
          };
          
          if (entities.length > 0) {
            messagePayload.entities = entities;
          }
          
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(messagePayload),
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
      
      // Check if reply is "CANCEL" by admin to refund users
      if (replyText === 'CANCEL') {
        console.log('✓ Cancel request detected');
        
        // Check if user is admin
        const isUserAdmin = await isAdmin(supabase, acceptingUser.id);
        
        if (!isUserAdmin) {
          // Silently ignore non-admin cancel attempts
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        // Parse the message to find table number
        const tableNumberMatch = originalMessage.match(/Table #(\d+)/);
        
        if (!tableNumberMatch) {
          await sendTelegramMessage(update.message.chat.id, '❌ Could not find table number in message.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        const tableNumber = parseInt(tableNumberMatch[1]);
        console.log('🎯 Found table number:', tableNumber);
        
        // Find the matched table in database
        const { data: tableRecord, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('table_number', tableNumber)
          .eq('status', 'matched')
          .maybeSingle();
        
        if (tableError || !tableRecord) {
          console.error('Error finding table:', tableError);
          await sendTelegramMessage(
            update.message.chat.id,
            `❌ Table #${tableNumber} not found or already cancelled.`
          );
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        console.log('Found table to cancel:', tableRecord);
        
        const refundAmount = tableRecord.amount;
        const creatorId = tableRecord.creator_telegram_user_id;
        const acceptorId = tableRecord.acceptor_telegram_user_id;
        
        // Extract usernames EXACTLY as shown in the confirmed table message
        let creatorDisplayName = 'User';
        let acceptorDisplayName = 'User';
        let creatorHasUsername = false;
        let acceptorHasUsername = false;
        
        // Parse the original confirmed message to get exact display format
        // Format is either "@username" or just "Name" (for users without username)
        const vsMatch = originalMessage.match(/^(.+?)\s+Vs\.\s+(.+?)(?:\n|$)/m);
        
        if (vsMatch) {
          creatorDisplayName = vsMatch[1].trim();
          acceptorDisplayName = vsMatch[2].trim();
          
          // Check if they have @ (meaning they have a username)
          creatorHasUsername = creatorDisplayName.startsWith('@');
          acceptorHasUsername = acceptorDisplayName.startsWith('@');
          
          console.log('Extracted from message - Creator:', creatorDisplayName, '(has @:', creatorHasUsername, ') Acceptor:', acceptorDisplayName, '(has @:', acceptorHasUsername, ')');
        }
        
        // Get both users for balance refund
        const { data: creatorUser } = await supabase
          .from('users')
          .select('balance')
          .eq('telegram_user_id', creatorId)
          .maybeSingle();
        
        const { data: acceptorUser } = await supabase
          .from('users')
          .select('balance')
          .eq('telegram_user_id', acceptorId)
          .maybeSingle();
        
        if (!creatorUser || !acceptorUser) {
          await sendTelegramMessage(
            update.message.chat.id,
            `❌ Could not find users for refund.`
          );
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        // Refund both users
        const { error: refundCreatorError } = await supabase
          .from('users')
          .update({ 
            balance: creatorUser.balance + refundAmount,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_user_id', creatorId);
        
        const { error: refundAcceptorError } = await supabase
          .from('users')
          .update({ 
            balance: acceptorUser.balance + refundAmount,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_user_id', acceptorId);
        
        if (refundCreatorError || refundAcceptorError) {
          console.error('Error refunding balances:', refundCreatorError || refundAcceptorError);
          await sendTelegramMessage(
            update.message.chat.id,
            `❌ Error processing refund. Please contact support.`
          );
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        // Update table status
        const { error: updateTableError } = await supabase
          .from('tables')
          .update({ 
            status: 'cancelled',
            completed_at: new Date().toISOString()
          })
          .eq('id', tableRecord.id);
        
        if (updateTableError) {
          console.error('Error updating table status:', updateTableError);
        }
        
        console.log(`✅ Refunded ₹${refundAmount} to both users`);
        
        // Build cancel message with proper entities to make names clickable (blue)
        let cancelMessageText = `✅ Table #${tableNumber} Cancelled\n\nRefunded ₹${refundAmount.toFixed(2)} to both users:\n`;
        const entities: any[] = [];
        
        // Add creator name
        let currentOffset = cancelMessageText.length;
        cancelMessageText += creatorDisplayName + '\n';
        
        // If creator doesn't have @ (no username), add text_mention entity to make it blue
        if (!creatorHasUsername) {
          entities.push({
            offset: currentOffset,
            length: creatorDisplayName.length,
            type: 'text_mention',
            user: {
              id: creatorId,
              first_name: creatorDisplayName
            }
          });
        }
        
        // Add acceptor name
        currentOffset = cancelMessageText.length;
        cancelMessageText += acceptorDisplayName;
        
        // If acceptor doesn't have @ (no username), add text_mention entity to make it blue
        if (!acceptorHasUsername) {
          entities.push({
            offset: currentOffset,
            length: acceptorDisplayName.length,
            type: 'text_mention',
            user: {
              id: acceptorId,
              first_name: acceptorDisplayName
            }
          });
        }
        
        console.log('Cancel message entities:', JSON.stringify(entities));
        
        // Send the message with entities (DO NOT use parse_mode when using entities)
        const cancelMessagePayload: any = {
          chat_id: update.message.chat.id,
          text: cancelMessageText
        };
        
        // Add entities to make names clickable (blue)
        if (entities.length > 0) {
          cancelMessagePayload.entities = entities;
        }
        
        const cancelResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cancelMessagePayload),
          }
        );
        
        if (!cancelResponse.ok) {
          const error = await cancelResponse.json();
          console.error('Error sending cancel notification:', error);
        }
        
        // Notify both users
        await sendTelegramMessage(
          creatorId,
          `🔄 <b>Table Cancelled - Refund Issued</b>\n\n` +
          `Table #${tableNumber} has been cancelled by admin.\n` +
          `Refunded: ₹${refundAmount.toFixed(2)}\n` +
          `New balance: ₹${(creatorUser.balance + refundAmount).toFixed(2)}`
        );
        
        await sendTelegramMessage(
          acceptorId,
          `🔄 <b>Table Cancelled - Refund Issued</b>\n\n` +
          `Table #${tableNumber} has been cancelled by admin.\n` +
          `Refunded: ₹${refundAmount.toFixed(2)}\n` +
          `New balance: ₹${(acceptorUser.balance + refundAmount).toFixed(2)}`
        );
      }
      
      // Check if reply is "WIN" by admin to declare winner
      if (replyText.startsWith('WIN')) {
        console.log('✓ Win request detected');
        
        // Check if user is admin
        const isUserAdmin = await isAdmin(supabase, acceptingUser.id);
        
        if (!isUserAdmin) {
          // Silently ignore non-admin win attempts
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        // Extract winner from reply - can be @username OR text_mention (name without @)
        let winnerDisplayName = '';
        let winnerTelegramIdFromReply: number | null = null;
        
        // Check for @username mention first
        const winnerMentionMatch = replyText.match(/@(\w+)/);
        if (winnerMentionMatch) {
          winnerDisplayName = `@${winnerMentionMatch[1]}`;
        } else {
          // Check for text_mention entities (users without @username)
          const replyEntities = update.message.entities || [];
          const textMentionEntity = replyEntities.find((e: any) => e.type === 'text_mention');
          
          if (textMentionEntity && textMentionEntity.user) {
            winnerTelegramIdFromReply = textMentionEntity.user.id;
            winnerDisplayName = textMentionEntity.user.first_name || 'User';
            console.log(`🎯 Winner from text_mention: ${winnerDisplayName} (ID: ${winnerTelegramIdFromReply})`);
          }
        }
        
        if (!winnerDisplayName) {
          // No winner mentioned, silently ignore
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        console.log(`🏆 Winner reply detected: ${winnerDisplayName}`);
        
        // Parse the message to find table number
        const tableNumberMatch = originalMessage.match(/Table #(\d+)/);
        
        if (!tableNumberMatch) {
          await sendTelegramMessage(update.message.chat.id, '❌ Could not find table number in message.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        const tableNumber = parseInt(tableNumberMatch[1]);
        console.log('🎯 Found table number for win:', tableNumber);
        
        // Get table details
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('table_number', tableNumber)
          .eq('status', 'matched')
          .maybeSingle();

        if (tableError || !tableData) {
          await sendTelegramMessage(update.message.chat.id, '❌ Could not find table or table already completed.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const betAmount = tableData.amount;
        const commission = betAmount * 0.05; // 5% commission from one user's bet only
        const winnerAmount = betAmount + (betAmount - commission); // First user's full bet + second user's bet minus commission
        
        console.log(`💰 Bet per user: ₹${betAmount}, Commission (5% from one bet): ₹${commission}, Winner gets: ₹${winnerAmount}`);

        // Determine winner telegram_user_id from table data
        let winnerTelegramUserId: number | null = null;
        
        // If we got winner ID directly from text_mention, use it to match
        if (winnerTelegramIdFromReply) {
          if (winnerTelegramIdFromReply === tableData.creator_telegram_user_id) {
            winnerTelegramUserId = tableData.creator_telegram_user_id;
            console.log(`✓ Winner is Player 1 (creator) by ID match: ${winnerTelegramUserId}`);
          } else if (winnerTelegramIdFromReply === tableData.acceptor_telegram_user_id) {
            winnerTelegramUserId = tableData.acceptor_telegram_user_id;
            console.log(`✓ Winner is Player 2 (acceptor) by ID match: ${winnerTelegramUserId}`);
          }
        } else {
          // Match by @username from original message
          const allMentions = update.message.reply_to_message.text.match(/@(\w+)/g);
          console.log(`📋 All @mentions in original message: ${JSON.stringify(allMentions)}`);

          if (allMentions && allMentions.length >= 2) {
            const winnerUsernameLower = winnerDisplayName.substring(1).toLowerCase(); // Remove @
            const firstPlayerUsername = allMentions[0].substring(1).toLowerCase(); // Remove @
            const secondPlayerUsername = allMentions[1].substring(1).toLowerCase(); // Remove @
            
            console.log(`🎮 Player 1: @${firstPlayerUsername}, Player 2: @${secondPlayerUsername}`);
            console.log(`🏆 Winner mentioned: @${winnerUsernameLower}`);

            if (winnerUsernameLower === firstPlayerUsername) {
              winnerTelegramUserId = tableData.creator_telegram_user_id;
              console.log(`✓ Winner is Player 1 (creator): ${winnerTelegramUserId}`);
            } else if (winnerUsernameLower === secondPlayerUsername) {
              winnerTelegramUserId = tableData.acceptor_telegram_user_id;
              console.log(`✓ Winner is Player 2 (acceptor): ${winnerTelegramUserId}`);
            }
          }
        }

        if (!winnerTelegramUserId) {
          await sendTelegramMessage(update.message.chat.id, `❌ Could not determine winner. Make sure ${winnerDisplayName} is one of the players in this table.`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Get winner user data
        const { data: winnerUser, error: winnerError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_user_id', winnerTelegramUserId)
          .maybeSingle();

        if (winnerError || !winnerUser) {
          await sendTelegramMessage(update.message.chat.id, `❌ Could not find user data for winner.`);
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Update winner's balance
        const newBalance = winnerUser.balance + winnerAmount;
        const { error: updateBalanceError } = await supabase
          .from('users')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('telegram_user_id', winnerUser.telegram_user_id);

        if (updateBalanceError) {
          console.error('Error updating winner balance:', updateBalanceError);
          await sendTelegramMessage(update.message.chat.id, '❌ Failed to update winner balance.');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        // Update table status to completed
        await supabase
          .from('tables')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('table_number', tableNumber);

        console.log(`✅ Winner ${winnerDisplayName} received ₹${winnerAmount}. New balance: ₹${newBalance}`);

        // Notify winner
        await sendTelegramMessage(
          winnerUser.telegram_user_id,
          `🎉 Congratulations! You won ₹${winnerAmount.toFixed(2)}!\n\nTable #${tableNumber}\nNew balance: ₹${newBalance.toFixed(2)}`
        );

        // Send winner message to the group with proper entities for clickable name
        let winnerMessageText = `Winner 🏆🥇🏆\n\n`;
        const winnerEntities: any[] = [];
        
        const nameOffset = winnerMessageText.length;
        winnerMessageText += winnerDisplayName;
        
        // If winner doesn't have @ (no username), add text_mention entity to make it blue/clickable
        if (!winnerDisplayName.startsWith('@')) {
          winnerEntities.push({
            offset: nameOffset,
            length: winnerDisplayName.length,
            type: 'text_mention',
            user: {
              id: winnerTelegramUserId,
              first_name: winnerDisplayName
            }
          });
        }
        
        winnerMessageText += `\n\nTable #${tableNumber}`;
        
        console.log('Winner message text:', winnerMessageText);
        console.log('Winner message entities:', JSON.stringify(winnerEntities));
        
        // Send winner announcement (DO NOT use parse_mode when using entities)
        const winnerMessagePayload: any = {
          chat_id: update.message.chat.id,
          text: winnerMessageText
        };
        
        if (winnerEntities.length > 0) {
          winnerMessagePayload.entities = winnerEntities;
        }
        
        const winnerResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(winnerMessagePayload),
          }
        );
        
        if (!winnerResponse.ok) {
          const errorData = await winnerResponse.json();
          console.error('Failed to send winner message:', errorData);
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

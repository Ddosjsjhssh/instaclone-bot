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
          `/addfund - Add funds to user\n` +
          `/deductfund - Deduct funds from user\n` +
          `/makeadmin - Make a user admin\n\n` +
          `<b>Usage:</b>\n` +
          `/addfund [user_id] [amount]\n` +
          `/deductfund [user_id] [amount]\n` +
          `/makeadmin [user_id]\n\n` +
          `<b>Example:</b>\n` +
          `/addfund 123456789 500`;
        
        await sendTelegramMessage(chatId, panelMessage);
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
          
          // Find the table in database using the message content
          const { data: tableRecord, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('amount', betAmount)
            .eq('game_type', gameType)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)
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

            // Update table status
            const { error: updateTableError } = await supabase
              .from('tables')
              .update({ 
                acceptor_telegram_user_id: acceptorTelegramId,
                status: 'matched',
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
          
          // Generate random table number
          const tableNumber = Math.floor(Math.random() * 9000) + 1000;
          
          // Format the message exactly like the reference image
          let formattedMessage = `@${originalUsername} Vs. @${acceptingUsername}\n\n`;
          formattedMessage += `Rs.${betAmount}.00 | ${gameType}`;
          
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

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
    const { username, telegram_user_id, telegram_first_name, amount, type, gamePlus, options, balance } = await req.json();

    const TELEGRAM_BOT_TOKEN = "8222802213:AAE-n9hBawD5D6EaZ82nt3vFWq6CGKLiXho";
    const TELEGRAM_GROUP_CHAT_ID = "-5082338946";
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Sending table with auto-detected username:', username);

    // Generate random table number
    const tableNumber = Math.floor(Math.random() * 9000) + 1000;
    const currentTimestamp = new Date().toISOString();

    // Atomically cancel existing open tables that are older than this request
    const { data: cancelledTables } = await supabase
      .from('tables')
      .update({ status: 'cancelled' })
      .eq('creator_telegram_user_id', telegram_user_id)
      .eq('status', 'open')
      .lt('created_at', currentTimestamp)
      .select('id, message_id');

    if (cancelledTables && cancelledTables.length > 0) {
      console.log(`✅ Cancelled ${cancelledTables.length} old table(s) for user ${telegram_user_id}`);
      
      // Delete old messages from Telegram group in background
      for (const oldTable of cancelledTables) {
        if (oldTable.message_id) {
          fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: TELEGRAM_GROUP_CHAT_ID,
                message_id: oldTable.message_id
              })
            }
          ).then(res => {
            if (res.ok) {
              console.log(`✅ Deleted old table message ${oldTable.message_id}`);
            }
          }).catch(err => console.error('Error deleting message:', err));
        }
      }
    }

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

    // Format message with username
    const userDisplay = username && username !== 'Anonymous' 
      ? `Table by @${username}:\n` 
      : telegram_first_name 
        ? `Table by ${telegram_first_name}:\n`
        : 'New Table:\n';
    
    const message = userDisplay + `${amount} | ${type}` +
      (gamePlus ? ` | ${gamePlus}+ game` : '') + '\n\n' +
      (optionsText ? optionsText : '');

    // Store table in database (will update with message_id after sending)
    const gameType = type + (gamePlus ? ` | ${gamePlus}+ game` : '');
    const { data: insertedTable, error: insertError } = await supabase
      .from('tables')
      .insert({
        creator_telegram_user_id: telegram_user_id,
        amount: parseFloat(amount),
        game_type: gameType,
        options: optionsText || null,
        table_number: tableNumber,
        status: 'open'
      })
      .select()
      .single();

    if (insertError || !insertedTable) {
      console.error('Error storing table in database:', insertError);
      // Continue even if DB insert fails
    } else {
      console.log('Table stored in database with number:', tableNumber);
    }

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

    // Update the table record with the Telegram message_id
    if (insertedTable && result.result?.message_id) {
      const { error: updateError } = await supabase
        .from('tables')
        .update({ message_id: result.result.message_id })
        .eq('id', insertedTable.id);
      
      if (updateError) {
        console.error('Error updating table with message_id:', updateError);
      } else {
        console.log('Table updated with message_id:', result.result.message_id);
      }
    }

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

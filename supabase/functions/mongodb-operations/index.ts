import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MONGODB_URI = Deno.env.get('MONGODB_URI');
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }

    const { operation, collection, data, filter } = await req.json();
    
    console.log('Connecting to MongoDB...');
    const client = new MongoClient();
    await client.connect(MONGODB_URI);
    
    const db = client.database();
    const col = db.collection(collection || 'tables');
    
    let result;
    
    switch (operation) {
      case 'insert':
        result = await col.insertOne(data);
        console.log('Document inserted:', result);
        break;
        
      case 'find':
        result = await col.find(filter || {}).toArray();
        console.log('Documents found:', result.length);
        break;
        
      case 'update':
        result = await col.updateOne(filter, { $set: data });
        console.log('Document updated:', result);
        break;
        
      case 'delete':
        result = await col.deleteOne(filter);
        console.log('Document deleted:', result);
        break;
        
      default:
        throw new Error('Invalid operation');
    }
    
    client.close();
    
    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in mongodb-operations function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

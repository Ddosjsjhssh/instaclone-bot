import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.33.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, collection, data, filter } = await req.json();
    
    console.log(`Received ${operation} request for collection: ${collection}`);
    
    // Use simple string connection for MongoDB Atlas
    const MONGODB_URI = "mongodb+srv://Ludo:RpfS4DiD5eXvt4dz@cluster0.3zphwiq.mongodb.net/test?retryWrites=true&w=majority&authMechanism=SCRAM-SHA-256";
    
    console.log('Connecting to MongoDB...');
    const client = new MongoClient();
    
    try {
      await client.connect(MONGODB_URI);
      console.log('Successfully connected to MongoDB');
    } catch (connError) {
      console.error('Connection failed:', connError);
      throw new Error(`MongoDB connection failed: ${connError instanceof Error ? connError.message : 'Unknown error'}`);
    }
    
    const db = client.database("test");
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
      JSON.stringify({ success: true, data: result }),
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatHistory, chatId, userId } = await req.json();
    
    console.log("RAG Chat request received:", { message, chatId, userId });

    const DIFY_API_KEY = Deno.env.get("DIFY_API_KEY");
    if (!DIFY_API_KEY) {
      throw new Error("DIFY_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Dify API
    console.log("Calling Dify API...");
    const response = await fetch("https://api.dify.ai/v1/chat-messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query: message,
        response_mode: "blocking",
        conversation_id: "",
        user: userId || "anonymous",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Dify API error:", response.status, errorText);
      throw new Error(`Dify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Dify API response received");

    const answer = data.answer || "माफ गर्नुहोला, यस विषयमा पर्याप्त कानुनी जानकारी उपलब्ध छैन।";

    // Save to database if chatId provided
    if (chatId) {
      // Save user message
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: message,
      });

      // Save assistant message
      await supabase.from("messages").insert({
        chat_id: chatId,
        role: "assistant",
        content: answer,
        metadata: { source: "dify" },
      });

      // Update chat title from first message
      const { data: existingMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("chat_id", chatId)
        .limit(3);
      
      if (existingMessages && existingMessages.length <= 2) {
        const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
        await supabase.from("chats").update({ title }).eq("id", chatId);
      }
    }

    return new Response(
      JSON.stringify({
        answer,
        sources: data.metadata?.retriever_resources || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("RAG Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "अज्ञात त्रुटि भयो",
        answer: "माफ गर्नुहोला, केही समस्या भयो। कृपया पुन: प्रयास गर्नुहोस्।"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

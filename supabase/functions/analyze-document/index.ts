import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANALYSIS_PROMPT = `तपाईं नेपाली आप्रवासी कामदारहरूको लागि कागजात विश्लेषक हुनुहुन्छ।
यो कागजात विश्लेषण गर्नुहोस् र निम्न जानकारी दिनुहोस्:

1) कागजातको प्रकार (contract/visa/offer letter/ID/other)
2) सरल नेपाली व्याख्या
3) स्पष्टता स्कोर (0-100)
4) रातो झण्डाहरू (Red flags) - जस्तै: तलब उल्लेख नभएको, पासपोर्ट राख्ने धारा, अस्पष्ट समाप्ति धारा, आदि
5) परामर्शदातालाई सोध्नु पर्ने प्रश्नहरू

JSON ढाँचामा जवाफ दिनुहोस्:
{
  "doc_type": "contract|visa|offer_letter|id|other",
  "summary": "नेपालीमा संक्षिप्त व्याख्या",
  "clarity_score": 75,
  "red_flags": ["रातो झण्डा 1", "रातो झण्डा 2"],
  "questions_to_ask": ["प्रश्न 1", "प्रश्न 2"]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ocrText, documentType } = await req.json();
    
    console.log("Document analysis request received");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Lovable AI for document analysis
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          { role: "user", content: `कागजातको पाठ:\n\n${ocrText}\n\n${documentType ? `कागजातको प्रकार: ${documentType}` : ''}` }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "धेरै अनुरोधहरू। कृपया केही समय पछि पुन: प्रयास गर्नुहोस्।" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "क्रेडिट आवश्यक छ।" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI analysis received");

    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // If JSON parsing fails, create a structured response from text
      analysis = {
        doc_type: documentType || "other",
        summary: content,
        clarity_score: 50,
        red_flags: [],
        questions_to_ask: [],
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Document analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "अज्ञात त्रुटि भयो",
        doc_type: "other",
        summary: "कागजात विश्लेषण गर्न सकिएन।",
        clarity_score: 0,
        red_flags: [],
        questions_to_ask: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
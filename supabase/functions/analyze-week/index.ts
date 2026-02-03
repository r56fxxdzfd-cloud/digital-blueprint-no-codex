import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // Get week start from request body
    const { weekStart } = await req.json();
    if (!weekStart) {
      return new Response(
        JSON.stringify({ error: "weekStart is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate week end (7 days from start)
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split("T")[0];

    console.log(`Fetching journal entries for user ${userId} from ${weekStart} to ${weekEnd}`);

    // Fetch journal entries for the week
    const { data: journalEntries, error: journalError } = await supabase
      .from("journal_entries")
      .select("entry_date, mood, emotion, insight, action, gratitude, free_note")
      .eq("user_id", userId)
      .gte("entry_date", weekStart)
      .lte("entry_date", weekEnd)
      .order("entry_date", { ascending: true });

    if (journalError) {
      console.error("Error fetching journal entries:", journalError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch journal data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch daily entries for additional context (morning intentions)
    const { data: dailyEntries, error: dailyError } = await supabase
      .from("daily_entries")
      .select("date, identity, critical_action, evidence, autopilot, tomorrow_adjustment")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true });

    if (dailyError) {
      console.error("Error fetching daily entries:", dailyError);
    }

    // Check if we have data to analyze
    if ((!journalEntries || journalEntries.length === 0) && (!dailyEntries || dailyEntries.length === 0)) {
      return new Response(
        JSON.stringify({ 
          error: "Sem dados suficientes",
          message: "Não há registros de diário ou entradas diárias para esta semana. Preencha alguns dias primeiro."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare data for AI analysis
    let weekData = "# Registros da Semana\n\n";

    if (dailyEntries && dailyEntries.length > 0) {
      weekData += "## Intenções Matinais (Daily Entries)\n\n";
      for (const entry of dailyEntries) {
        weekData += `### ${entry.date}\n`;
        if (entry.identity) weekData += `- Identidade: ${entry.identity}\n`;
        if (entry.critical_action) weekData += `- Ação Crítica: ${entry.critical_action}\n`;
        if (entry.evidence) weekData += `- Evidência: ${entry.evidence}\n`;
        if (entry.autopilot) weekData += `- Autopiloto a evitar: ${entry.autopilot}\n`;
        if (entry.tomorrow_adjustment) weekData += `- Ajuste para amanhã: ${entry.tomorrow_adjustment}\n`;
        weekData += "\n";
      }
    }

    if (journalEntries && journalEntries.length > 0) {
      weekData += "## Reflexões do Diário (Journal Entries)\n\n";
      for (const entry of journalEntries) {
        weekData += `### ${entry.entry_date}\n`;
        if (entry.mood) weekData += `- Humor: ${entry.mood}\n`;
        if (entry.emotion) weekData += `- Emoção: ${entry.emotion}\n`;
        if (entry.insight) weekData += `- Insight: ${entry.insight}\n`;
        if (entry.action) weekData += `- Ação: ${entry.action}\n`;
        if (entry.gratitude) weekData += `- Gratidão: ${entry.gratitude}\n`;
        if (entry.free_note) weekData += `- Nota livre: ${entry.free_note}\n`;
        weekData += "\n";
      }
    }

    console.log("Sending to AI for analysis...");

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um coach de produtividade e autoconhecimento. Analise os registros semanais do usuário e forneça insights acionáveis.

REGRAS IMPORTANTES:
1. Seja conciso e direto
2. Use no máximo 3 bullet points por seção
3. Foque em padrões observáveis nos dados
4. Seja empático mas honesto
5. Responda em português do Brasil

Você deve retornar EXATAMENTE um JSON com esta estrutura:
{
  "selfDeceptionPattern": "Uma frase concisa identificando um padrão negativo recorrente (máx 150 caracteres)",
  "wins": "• Vitória 1 identificada nos dados\\n• Vitória 2 (se houver)\\n• Vitória 3 (se houver)",
  "tacticalAdjustment": "Uma sugestão tática específica para a próxima semana (máx 200 caracteres)"
}

Se não houver dados suficientes para identificar padrões, seja honesto e sugira que o usuário registre mais consistentemente.`
          },
          {
            role: "user",
            content: `Analise os seguintes registros da semana e extraia insights:\n\n${weekData}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de AI esgotados. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise de AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received:", JSON.stringify(aiData));

    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Resposta de AI vazia" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from AI
    let analysis;
    try {
      // Try to extract JSON from the response (it might be wrapped in markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      // Fallback: return the raw content as wins
      analysis = {
        selfDeceptionPattern: "Não foi possível identificar um padrão específico com os dados disponíveis.",
        wins: content.slice(0, 500),
        tacticalAdjustment: "Continue registrando diariamente para análises mais precisas."
      };
    }

    console.log("Analysis complete:", analysis);

    return new Response(
      JSON.stringify({
        selfDeceptionPattern: analysis.selfDeceptionPattern || "",
        wins: analysis.wins || "",
        tacticalAdjustment: analysis.tacticalAdjustment || "",
        entriesAnalyzed: (journalEntries?.length || 0) + (dailyEntries?.length || 0)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

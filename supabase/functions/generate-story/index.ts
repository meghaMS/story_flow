import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StoryRequest {
  title: string;
  type?: string;
}

interface TestCase {
  title: string;
  steps: string[];
  expected: string;
}

interface StoryResponse {
  description: string;
  acceptance_criteria: string[];
  test_cases: TestCase[];
  story_points: number;
  references: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { title, type = "story", priority }: StoryRequest = await req.json();

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are an expert Agile software engineer and product manager. Generate a complete user story for the following:

Title: "${title.trim()}"
Type: ${type}
Priority: ${priority}

Respond with ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "description": "A clear user story in 'As a [user], I want to [action] so that [benefit]' format",
  "acceptance_criteria": [
    "Given/When/Then formatted acceptance criteria (at least 4-6 items)",
    "..."
  ],
  "priority": "medium",
  "references": ["https://...", "https://...", "https://..."]
  "test_cases": [
    {
      "title": "Test case title",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expected": "Expected outcome"
    }
  ],
  "story_points": <number 1-13 using fibonacci: 1,2,3,5,8,13>
}

Generate 4-6 acceptance criteria and 2-4 test cases. Make them specific, realistic, and directly relevant to the story title. Story points should reflect complexity.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      throw new Error(`Claude API error ${claudeRes.status}: ${errText}`);
    }

    const claudeData = await claudeRes.json();
    const content = claudeData.content?.[0]?.text ?? "";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");

    const result: StoryResponse = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to generate story content", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

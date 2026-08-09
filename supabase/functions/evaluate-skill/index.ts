import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.info("evaluate-skill function starting");

// ─────── CORS Headers ───────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─────── Level-specific evaluation criteria ───────
interface LevelCriteria {
  title: string;
  description: string;
  requiredHeaders: string[];
  requiredPatterns: string[];
  prohibitedPatterns: string[];
  failConditions: string;
  rubric: string;
}

const LEVELS: Record<string, LevelCriteria> = {
  guardrails: {
    title: "Customer Support Guardrails",
    description:
      "Write a `## Restrictions` section (or `## CRITICAL_REDUNDANCY`) that caps financial compensation at $15 maximum, with clear language that leaves no room for interpretation.",
    requiredHeaders: ["## Restrictions", "## CRITICAL_REDUNDANCY"],
    requiredPatterns: ["\\$\\d+", "\\d+ dollars?"],
    prohibitedPatterns: [
      "best judgment",
      "use your discretion",
      "use discretion",
      "try not to",
    ],
    failConditions:
      'If the skill uses "best judgment" without a numerical cap, score 0. If the skill lacks any compensation limit, score 0.',
    rubric: `
- Present a clear Markdown header (## Restrictions or ## CRITICAL_REDUNDANCY): up to 100 points
- Specify a hard numerical cap ($15 or 15 dollars): up to 50 points
- No ambiguous language (no "best judgment", "use discretion"): up to 50 points
- Include an escalation or approval step for exceeding the cap: up to 25 points
- Overall clarity and professionalism: up to 25 points
TOTAL: 250 points scaled to 100%.
`,
  },
  variables: {
    title: "Data Analyst Variable Dungeon",
    description:
      "Design an input block that uses a [WEEKLY_DATA_INPUT] placeholder and includes instructions to map unstructured text into a fixed JSON schema. Include handling for missing data fields.",
    requiredHeaders: ["## Data Input", "## Input"],
    requiredPatterns: ["\\[.*?\\]", "missing|null|empty"],
    prohibitedPatterns: ["hardcoded", "hard-coded", "always the same"],
    failConditions:
      'If the skill contains no placeholder (e.g. [SOMETHING]), score 0. If instructions hardcode specific data values, score 0.',
    rubric: `
- Bracket placeholder present (e.g. [WEEKLY_DATA_INPUT]): up to 50 points
- JSON schema or structured mapping defined: up to 100 points
- Missing/null data handling instructions: up to 50 points
- Clear separation between data definition and processing: up to 50 points
- Overall quality: up to 50 points
TOTAL: 300 points scaled to 100%.
`,
  },
  copywriter: {
    title: "Copywriter's Cliché Elimination Arena",
    description:
      "Build a `## Style & Tone` section with a blacklist of prohibited clichés and exactly 2 pairs of [POOR_EXAMPLE] vs [EXCELLENT_EXAMPLE] demonstrating the desired voice shift.",
    requiredHeaders: ["## Style & Tone", "## Style and Tone"],
    requiredPatterns: [
      "\\[POOR_EXAMPLE\\]",
      "\\[EXCELLENT_EXAMPLE\\]",
      "Why this works",
      "Prohibited",
    ],
    prohibitedPatterns: [],
    failConditions:
      'If fewer than 2 [POOR_EXAMPLE] counters found, score 0. If no Prohibited/Blacklist section, score 0.',
    rubric: `
- ## Style & Tone header present: up to 50 points
- Prohibited word blacklist (3+ items): up to 50 points
- 2 [POOR_EXAMPLE] / [EXCELLENT_EXAMPLE] pairs: up to 100 points
- Each excellent example has a "Why this works" explanation: up to 100 points
- Alternative vocabulary list provided: up to 100 points
TOTAL: 400 points scaled to 100%.
`,
  },
  boss: {
    title: "Automated HR Multi-Tool (Boss Fight)",
    description:
      "Write a master skill that reads profile data, checks for missing fields, and outputs an onboarding checklist only if complete, OR an error alert if data is incomplete. The skill must handle the edge case of a blank email field without crashing.",
    requiredHeaders: [
      "## Input",
      "## Data Input",
      "## Validation",
      "## Logic",
      "## Output",
    ],
    requiredPatterns: [
      "email",
      "missing|null|empty",
      "IF|if",
      "ELSE|else",
      "required|Optional",
    ],
    prohibitedPatterns: [],
    failConditions:
      'If the skill does not handle missing email, score 0. If no conditional branching (if/else), score 0.',
    rubric: `
- Data input defined with schema: up to 50 points
- Validation step checking all fields: up to 100 points
- Conditional output (checklist vs error): up to 100 points
- Blank email edge case handled specifically: up to 100 points
- No infinite loops or hallucinated data: up to 50 points
- Overall robustness: up to 100 points
TOTAL: 500 points scaled to 100%.
`,
  },
};

// ─────── Construct evaluation prompt ───────
function buildPrompt(
  levelId: string,
  skillContent: string,
): string {
  const lc = LEVELS[levelId];
  if (!lc) throw new Error(`Unknown level: ${levelId}`);

  return `You are a strict evaluator of AI agent skills written in Markdown. You are evaluating a skill for the following challenge:

Level: ${lc.title}
Challenge: ${lc.description}

Required headers: ${lc.requiredHeaders.join(", ")}
Required patterns: ${lc.requiredPatterns.join(", ")}
Prohibited patterns: ${lc.prohibitedPatterns.join(", ")}

${lc.failConditions}

Scoring Rubric:
${lc.rubric}

The user's submitted skill:
\`\`\`markdown
${skillContent}
\`\`\`

Score the skill 0-100 based on how well it meets the criteria.
Return your evaluation as valid JSON only — no extra text, no markdown fences. The JSON must have exactly this structure:
{
  "score": number (0-100),
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "hints": "short hint string",
  "foundElements": ["element1", "element2"],
  "missingElements": ["element1"]
}`;
}

// ─────── Featherless API call ───────
async function callFeatherlessAI(
  apiKey: string,
  prompt: string,
): Promise<Response> {
  return fetch("https://api.featherless.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://skillsforge.app",
      "X-Title": "SkillsForge",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: "You are a strict evaluator of AI agent skills. Always return valid JSON only." },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });
}

// ─────── Parse AI response ───────
function parseAIResponse(text: string): {
  score: number;
  strengths: string[];
  improvements: string[];
  hints: string;
  foundElements: string[];
  missingElements: string[];
} {
  // Try parsing the whole response as JSON
  let cleaned = text.trim();

  // Remove markdown fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try finding JSON inside the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
    throw new Error("Failed to parse AI response as JSON");
  }
}

// ─────── Main handler ───────
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Only POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Parse body
    let body: { level: string; skillContent: string; userId?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { level, skillContent } = body;

    // Validate input
    if (!level || !LEVELS[level]) {
      return new Response(JSON.stringify({ error: "Invalid or missing level" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!skillContent || typeof skillContent !== "string") {
      return new Response(JSON.stringify({ error: "Missing skillContent" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (skillContent.length < 10) {
      return new Response(
        JSON.stringify({ error: "Skill content too short (min 10 chars)" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    if (skillContent.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Skill content too long (max 5000 chars)" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Get Featherless API key
    const apiKey = Deno.env.get("FEATHERLESS_API_KEY");
    if (!apiKey) {
      console.error("FEATHERLESS_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "Evaluation service not configured" }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Build prompt
    const prompt = buildPrompt(level, skillContent);

    // Call Featherless AI
    const featherlessResponse = await callFeatherlessAI(apiKey, prompt);

    if (!featherlessResponse.ok) {
      const errorText = await featherlessResponse.text();
      console.error("Featherless API error:", featherlessResponse.status, errorText);

      if (featherlessResponse.status === 504) {
        return new Response(
          JSON.stringify({ error: "Evaluation timed out", code: "TIMEOUT" }),
          { status: 504, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: "AI evaluation failed", code: "AI_ERROR" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const aiData = await featherlessResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content;

    if (!aiText) {
      return new Response(
        JSON.stringify({ error: "Empty AI response", code: "EMPTY_RESPONSE" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Parse AI response
    let evaluation: ReturnType<typeof parseAIResponse>;
    try {
      evaluation = parseAIResponse(aiText);
    } catch (parseErr) {
      console.error("Failed to parse AI output:", aiText);
      return new Response(
        JSON.stringify({ error: "Failed to parse evaluation" }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // Calculate XP
    const totalLevelXP = level === "guardrails" ? 225
      : level === "variables" ? 250
      : level === "copywriter" ? 400
      : 400;

    const xpEarned = Math.round((evaluation.score / 100) * totalLevelXP);
    const passed = evaluation.score >= 50;

    const result = {
      score: evaluation.score,
      xpEarned,
      passed,
      feedback: {
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        hints: evaluation.hints || "",
      },
      requiredElements: {
        found: evaluation.foundElements || [],
        missing: evaluation.missingElements || [],
      },
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
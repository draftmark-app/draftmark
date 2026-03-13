const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/hunter-alpha";
const MAX_CONTENT_LENGTH = 12000; // ~8K tokens, safe for free models

export type StakeholderView = {
  content: string;
  model: string;
  generated_at: string;
};

export type ViewsMap = Record<"executive" | "technical" | "ux", StakeholderView>;

const VIEW_PROMPTS: Record<string, string> = {
  executive:
    "Rewrite this document as a concise executive summary (3-5 paragraphs). Focus on business impact, key decisions needed, outcomes, and timeline. Skip implementation details. Output markdown.",
  technical:
    "Rewrite this document for a technical audience. Focus on architecture, implementation details, technical trade-offs, and dependencies. Preserve code blocks and technical specifics. Output markdown.",
  ux:
    "Rewrite this document from a UX/design perspective. Focus on user impact, experience changes, design considerations, and accessibility. Output markdown.",
};

async function generateView(
  content: string,
  title: string | null,
  viewType: string
): Promise<(StakeholderView & { type: string }) | null> {
  if (!OPENROUTER_API_KEY) return null;

  const prompt = VIEW_PROMPTS[viewType];
  if (!prompt) return null;

  const truncatedContent = content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Content truncated]"
    : content;

  const userMessage = title
    ? `# ${title}\n\n${truncatedContent}`
    : truncatedContent;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://draftmark.app",
      "X-Title": "Draftmark",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    console.error(`[OpenRouter] ${viewType} view failed: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const generatedContent = data.choices?.[0]?.message?.content;
  const actualModel = data.model || MODEL;

  if (!generatedContent) return null;

  return {
    type: viewType,
    content: generatedContent,
    model: actualModel,
    generated_at: new Date().toISOString(),
  };
}

export async function generateStakeholderViews(
  content: string,
  title: string | null
): Promise<ViewsMap | null> {
  if (!OPENROUTER_API_KEY) {
    console.log("[OpenRouter] No API key configured, skipping view generation");
    return null;
  }

  const results = await Promise.allSettled(
    Object.keys(VIEW_PROMPTS).map((viewType) =>
      generateView(content, title, viewType)
    )
  );

  const views: Partial<ViewsMap> = {};
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const { type, ...view } = result.value;
      views[type as keyof ViewsMap] = view;
    }
  }

  // Return null if no views were generated
  if (Object.keys(views).length === 0) return null;

  return views as ViewsMap;
}

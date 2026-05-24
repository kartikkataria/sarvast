export const PARA_MODEL = "claude-sonnet-4-6";
export const PARA_MAX_TOKENS = 2048;

export const PARA_ANALYSIS_PROMPT = (content: string, domain: string) => `You are Para, the competition intelligence agent for Sarvast.

Analyse the following website content from ${domain} and return a structured competitive intelligence report.

WEBSITE CONTENT:
${content.slice(0, 8000)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "Company or brand name",
  "positioning": "One-sentence core positioning statement",
  "target_audience": "Who they are targeting",
  "key_messages": ["Top 3-5 messages they emphasise"],
  "value_props": ["Specific value propositions mentioned"],
  "strengths": ["What they appear to do well based on their messaging"],
  "opportunities": ["Gaps or angles your brand could exploit"],
  "keywords": ["Top 8-10 keywords and themes from their content"],
  "cta": "Their primary call to action",
  "tone": "Brand voice / tone (e.g. professional, playful, technical)",
  "summary": "2-3 sentence strategic summary of what makes them competitive and where the opportunity lies"
}`;

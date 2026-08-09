import { NextResponse } from 'next/server';
import { challenges } from '../../../src/data/challenges';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { level?: string; skillContent?: string } | null;
  const level = challenges.find((item) => item.id === body?.level);
  if (!level) return NextResponse.json({ error: 'Invalid or missing level' }, { status: 400 });
  if (!body?.skillContent || body.skillContent.length < 10 || body.skillContent.length > 5000) return NextResponse.json({ error: 'Invalid skillContent length' }, { status: 400 });
  const apiKey = process.env.FEATHERLESS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Evaluation service not configured' }, { status: 503 });
  const prompt = `Evaluate this AI skill for ${level.title}. Return JSON only with score, strengths, improvements, hints, foundElements, missingElements. Requirements: ${level.requirements.join('; ')}\n\n${body.skillContent}`;
  try {
    const upstream = await fetch('https://api.featherless.ai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'meta-llama/Llama-3.3-70B-Instruct', messages: [{ role: 'system', content: 'Return valid JSON only.' }, { role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.2 }) });
    if (!upstream.ok) throw new Error('Upstream evaluation failed');
    const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty evaluation');
    const evaluation = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')) as { score: number; strengths?: string[]; improvements?: string[]; hints?: string; foundElements?: string[]; missingElements?: string[] };
    const totalXP = level.id === 'guardrails' ? 225 : level.id === 'variables' ? 250 : 400;
    return NextResponse.json({ score: evaluation.score, xpEarned: Math.round(evaluation.score / 100 * totalXP), passed: evaluation.score >= 50, feedback: { strengths: evaluation.strengths ?? [], improvements: evaluation.improvements ?? [], hints: evaluation.hints ?? '' }, requiredElements: { found: evaluation.foundElements ?? [], missing: evaluation.missingElements ?? [] } });
  } catch {
    return NextResponse.json({ error: 'AI evaluation failed' }, { status: 502 });
  }
}

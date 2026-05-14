import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  let body: { prompt?: string; system?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const { prompt, system } = body
  if (!prompt) return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Groq error:', JSON.stringify(data))
      return NextResponse.json({ error: data.error?.message || 'AI request failed' }, { status: 500 })
    }

    const text = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    console.error('Groq error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

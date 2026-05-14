import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  let body: { prompt?: string; system?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const { prompt, system } = body
  if (!prompt || typeof prompt !== 'string')
    return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })

  try {
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: system ?? 'You are a helpful AI assistant for CampusReal, an honest Indian student college community.',
    })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    console.error('Gemini error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

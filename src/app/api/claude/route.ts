import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const rateMap = new Map()
function checkRate(ip: string) {
  const now = Date.now()
  const e = rateMap.get(ip)
  if (!e || now > e.reset) { rateMap.set(ip, { count: 1, reset: now + 60000 }); return true }
  if (e.count >= 30) return false
  e.count++; return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!checkRate(ip))
    return NextResponse.json({ error: 'Too many requests. Wait a minute.' }, { status: 429 })

  let body: { prompt?: string; system?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  const { prompt, system } = body
  if (!prompt || typeof prompt !== 'string' || prompt.length > 4000)
    return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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

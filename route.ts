import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR ?? '/tmp/campusreal'

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}
function readJSON(file: string, fallback: unknown) {
  ensureDir()
  const fp = path.join(DATA_DIR, file)
  try { if (!fs.existsSync(fp)) return fallback; return JSON.parse(fs.readFileSync(fp, 'utf8')) }
  catch { return fallback }
}
function writeJSON(file: string, data: unknown) {
  ensureDir()
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2))
}

interface User { id:string; name:string; email:string; college:string; year:string; branch:string; pass:string }
interface Comment { author:string; text:string; ts:number; isAI?:boolean }
interface Post { id:string; uid:string; college:string; type:string; text:string; likes:number; likedBy:string[]; comments:Comment[]; ts:number }

const SEED_USERS: User[] = [
  { id:'u1', name:'Rohan Mehta',  college:'IIT Bombay',  year:'3rd Year', branch:'Computer Science', email:'rohan@demo.com',   pass:'demo' },
  { id:'u2', name:'Priya Iyer',   college:'VIT Vellore', year:'Graduated',branch:'CSE',              email:'priya@demo.com',   pass:'demo' },
  { id:'u3', name:'Karthik S',    college:'NIT Trichy',  year:'4th Year', branch:'ECE',              email:'karthik@demo.com', pass:'demo' },
  { id:'u4', name:'Ananya R',     college:'BITS Pilani', year:'2nd Year', branch:'CS',               email:'ananya@demo.com',  pass:'demo' },
]
const SEED_POSTS: Post[] = [
  { id:'p1', uid:'u1', college:'IIT Bombay',  type:'review', text:'Honest 2-year review of IITB — placements are unreal but academics are brutal. Average CTC for CSE is 28 LPA. Hostel food is average but campus fests and clubs make up for it. The peer quality pushes you to be better every single day.', likes:142, likedBy:[], comments:[], ts:Date.now()-3.6e6*3 },
  { id:'p2', uid:'u2', college:'VIT Vellore', type:'tip',    text:"VIT reality check: 70% students don't get placed through campus. Most are TCS/Infosys. But if you hustle — build projects, do internships, grind LeetCode — product companies are absolutely possible. Your skills matter more than the brand.", likes:89,  likedBy:[], comments:[], ts:Date.now()-3.6e6*7 },
  { id:'p3', uid:'u3', college:'NIT Trichy',  type:'review', text:'NIT Trichy vs BITS Pilani — agonised over this 3 years ago, chose NITT. Best decision. Placement cell is incredible, alumni network is massive. CSE average 22 LPA, ECE 12 LPA. Tier-1 companies recruit heavily here.', likes:203, likedBy:[], comments:[], ts:Date.now()-3.6e6*11 },
  { id:'p4', uid:'u4', college:'BITS Pilani', type:'qa',     text:'Got 93 percentile in JEE Mains. CS at BITS Goa or Mechanical at BITS Pilani? Finance not a constraint, long-term goal is product management. Please share real insights!', likes:55,  likedBy:[], comments:[], ts:Date.now()-3.6e6*15 },
]

function getUsers(): User[] { const u = readJSON('users.json', []) as User[]; if (!u.length) { writeJSON('users.json', SEED_USERS); return SEED_USERS } return u }
function getPosts(): Post[] { const p = readJSON('posts.json', []) as Post[]; if (!p.length) { writeJSON('posts.json', SEED_POSTS); return SEED_POSTS } return p }

export async function GET(req: NextRequest) {
  const r = req.nextUrl.searchParams.get('resource')
  if (r === 'users') return NextResponse.json(getUsers().map(u => ({ ...u, pass: undefined })))
  if (r === 'posts') return NextResponse.json(getPosts())
  return NextResponse.json({ error: 'Unknown' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>
  const { action } = body

  if (action === 'register') {
    const users = getUsers()
    const { name, email, college, year, branch, pass } = body as Record<string,string>
    if (!name || !email || !pass) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (users.find(u => u.email === email)) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    const nu: User = { id:'u'+Date.now(), name, email, college:college??'', year:year??'', branch:branch??'', pass }
    users.push(nu); writeJSON('users.json', users)
    return NextResponse.json({ user: { ...nu, pass: undefined } })
  }

  if (action === 'login') {
    const { email, pass } = body as Record<string,string>
    const u = getUsers().find(x => x.email === email && x.pass === pass)
    if (!u) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    return NextResponse.json({ user: { ...u, pass: undefined } })
  }

  if (action === 'createPost') {
    const posts = getPosts()
    const post = body.post as Post
    if (!post?.id || !post?.text) return NextResponse.json({ error: 'Invalid post' }, { status: 400 })
    posts.unshift(post); writeJSON('posts.json', posts)
    return NextResponse.json({ ok: true })
  }

  if (action === 'likePost') {
    const posts = getPosts()
    const { postId, userId } = body as Record<string,string>
    const p = posts.find(x => x.id === postId)
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!p.likedBy) p.likedBy = []
    const idx = p.likedBy.indexOf(userId)
    if (idx === -1) { p.likedBy.push(userId); p.likes++ }
    else { p.likedBy.splice(idx, 1); p.likes-- }
    writeJSON('posts.json', posts)
    return NextResponse.json({ likes: p.likes, liked: idx === -1 })
  }

  if (action === 'addComment') {
    const posts = getPosts()
    const { postId, comment } = body as { postId: string; comment: Comment }
    const p = posts.find(x => x.id === postId)
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!p.comments) p.comments = []
    p.comments.push(comment); writeJSON('posts.json', posts)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

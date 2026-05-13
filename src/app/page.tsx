'use client'
import { useState, useEffect } from 'react'

const COLORS = ['#e94560','#0f3460','#f5a623','#10b981','#8b5cf6','#ec4899','#06b6d4','#d97706']
const gc  = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % COLORS.length; return COLORS[h] }
const ini = (n: string) => n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
const ago = (ts: number) => { const d = Date.now() - ts; if (d < 3.6e6) return Math.floor(d/60000)+'m ago'; if (d < 864e5) return Math.floor(d/3.6e6)+'h ago'; return Math.floor(d/864e5)+'d ago' }

const COLLEGES = [
  { id:'iitb', name:'IIT Bombay',    short:'IITB', city:'Mumbai',          type:'IIT',        cutoff:99.8, rating:4.9 },
  { id:'iitd', name:'IIT Delhi',     short:'IITD', city:'New Delhi',       type:'IIT',        cutoff:99.7, rating:4.8 },
  { id:'iitm', name:'IIT Madras',    short:'IITM', city:'Chennai',         type:'IIT',        cutoff:99.5, rating:4.9 },
  { id:'iitk', name:'IIT Kanpur',    short:'IITK', city:'Kanpur',          type:'IIT',        cutoff:99.4, rating:4.8 },
  { id:'nitt', name:'NIT Trichy',    short:'NITT', city:'Tiruchirappalli', type:'NIT',        cutoff:97,   rating:4.5 },
  { id:'nitw', name:'NIT Warangal',  short:'NITW', city:'Warangal',        type:'NIT',        cutoff:96,   rating:4.4 },
  { id:'bits', name:'BITS Pilani',   short:'BITS', city:'Pilani',          type:'Deemed',     cutoff:95,   rating:4.6 },
  { id:'dtu',  name:'DTU Delhi',     short:'DTU',  city:'New Delhi',       type:'State',      cutoff:92,   rating:4.3 },
  { id:'coep', name:'COEP Pune',     short:'COEP', city:'Pune',            type:'Autonomous', cutoff:85,   rating:4.2 },
  { id:'vit',  name:'VIT Vellore',   short:'VIT',  city:'Vellore',         type:'Deemed',     cutoff:78,   rating:4.1 },
  { id:'srm',  name:'SRM Institute', short:'SRM',  city:'Chennai',         type:'Deemed',     cutoff:70,   rating:3.8 },
]

type User    = { id:string; name:string; email:string; college:string; year:string; branch:string }
type Comment = { author:string; text:string; ts:number; isAI?:boolean }
type Post    = { id:string; uid:string; college:string; type:string; text:string; likes:number; likedBy:string[]; comments:Comment[]; ts:number }

async function callAI(prompt: string, system?: string): Promise<string> {
  const r = await fetch('/api/claude', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, system }) })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error ?? 'AI error')
  return d.text
}
async function storageGet<T>(resource: string): Promise<T> {
  const r = await fetch(`/api/storage?resource=${resource}`)
  return r.json()
}
async function storagePost<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch('/api/storage', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error)
  return d
}

function useToast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const toast = (m: string) => { setMsg(m); setShow(true); setTimeout(() => setShow(false), 2800) }
  const el = <div className={`toast${show ? ' show' : ''}`}>{msg}</div>
  return { toast, el }
}

export default function App() {
  const [page, setPage]        = useState<'landing'|'auth'|'app'>('landing')
  const [authTab, setAuthTab]  = useState<'login'|'register'>('login')
  const [user, setUser]        = useState<User|null>(null)
  const [posts, setPosts]      = useState<Post[]>([])
  const [view, setView]        = useState<'feed'|'explore'|'rankings'|'ask'|'profile'>('feed')
  const { toast, el: toastEl } = useToast()
  const [lEmail,setLE] = useState(''); const [lPass,setLP] = useState('')
  const [rName,setRN]  = useState(''); const [rEmail,setRE] = useState('')
  const [rCollege,setRC] = useState(''); const [rYear,setRY] = useState('')
  const [rBranch,setRB] = useState(''); const [rPass,setRP] = useState('')
  const [authLoading, setAL] = useState(false)

  useEffect(() => { if (page === 'app') storageGet<Post[]>('posts').then(setPosts).catch(() => {}) }, [page])

  async function doLogin() {
    setAL(true)
    try {
      const { user: u } = await storagePost<{user:User}>({ action:'login', email:lEmail, pass:lPass })
      setUser(u); setPage('app')
    } catch (e: unknown) { toast(e instanceof Error && e.message.includes('Invalid') ? 'Wrong email/password — try rohan@demo.com / demo' : 'Login failed') }
    setAL(false)
  }
  async function doRegister() {
    if (!rName||!rEmail||!rCollege||!rYear||!rPass) { toast('Please fill all fields'); return }
    setAL(true)
    try {
      const { user: u } = await storagePost<{user:User}>({ action:'register', name:rName, email:rEmail, college:rCollege, year:rYear, branch:rBranch, pass:rPass })
      setUser(u); setPage('app'); toast('Welcome to CampusReal, '+rName+'! 🎉')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Registration failed') }
    setAL(false)
  }

  if (page === 'landing') return (
    <>
      {toastEl}
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right">
          <button className="nbtn" onClick={() => { setAuthTab('login'); setPage('auth') }}>Sign In</button>
          <button className="nbtn p" onClick={() => { setAuthTab('register'); setPage('auth') }}>Join Free</button>
        </div>
      </nav>
      <div className="hero">
        <h1 className="hero-h">The <em>Real</em> Guide<br/>to Indian Colleges</h1>
        <p className="hero-p">Seniors share honest campus reviews. Juniors get real answers. AI helps you find the right college for your JEE / NEET score.</p>
        <div className="hctas">
          <button className="hcta f" onClick={() => { setAuthTab('register'); setPage('auth') }}>Join as Student</button>
          <button className="hcta o" onClick={() => { setAuthTab('register'); setPage('auth') }}>Share Your Experience</button>
        </div>
        <div className="hstats">
          {[['12K+','Students'],['800+','Colleges'],['50K+','Real Reviews']].map(([n,l]) =>
            <div key={l} style={{textAlign:'center'}}><div className="hstat-num">{n}</div><div className="hstat-lbl">{l}</div></div>)}
        </div>
        <div className="hfeats">
          {[
            ['ti-school','Honest Reviews','Seniors share placement reality, hostel life, faculty — no sugar coating.'],
            ['ti-robot','AI College Matcher','Enter your JEE/NEET percentile and get colleges you can actually target.'],
            ['ti-messages','Ask Seniors','AI surfaces the most relevant senior insights instantly for your questions.'],
            ['ti-trophy','Community Rankings','Student-powered rankings based on real experience, not sponsorships.'],
          ].map(([icon,t,d]) =>
            <div className="hfeat" key={t}>
              <div className="hfeat-icon"><i className={`ti ${icon}`}/></div>
              <div className="hfeat-t">{t}</div>
              <div className="hfeat-d">{d}</div>
            </div>)}
        </div>
      </div>
    </>
  )

  if (page === 'auth') return (
    <>
      {toastEl}
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right"><button className="nbtn" onClick={() => setPage('landing')}>← Back</button></div>
      </nav>
      <div className="awrap">
        <div className="acard">
          <div className="alogo">Campus<em>Real</em></div>
          <div className="asub">The honest student community</div>
          <div className="atabs">
            <button className={`atab${authTab==='login'?' act':''}`} onClick={() => setAuthTab('login')}>Sign In</button>
            <button className={`atab${authTab==='register'?' act':''}`} onClick={() => setAuthTab('register')}>Join Free</button>
          </div>
          {authTab === 'login' ? (
            <>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={lEmail} onChange={e=>setLE(e.target.value)} placeholder="your@email.com"/></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" type="password" value={lPass} onChange={e=>setLP(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()}/></div>
              <button className="abtn" onClick={doLogin} disabled={authLoading}>{authLoading?'Signing in…':'Sign In'}</button>
              <div className="asw">New here? <a onClick={() => setAuthTab('register')}>Create account</a></div>
              <div style={{marginTop:12,padding:10,background:'#f0f9ff',borderRadius:9,fontSize:12,color:'#0369a1'}}>Demo: <strong>rohan@demo.com</strong> / <strong>demo</strong></div>
            </>
          ) : (
            <>
              <div className="fg"><label className="fl">Full Name</label><input className="fi" value={rName} onChange={e=>setRN(e.target.value)} placeholder="Arjun Sharma"/></div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={rEmail} onChange={e=>setRE(e.target.value)} placeholder="your@email.com"/></div>
              <div className="fg"><label className="fl">College</label><input className="fi" value={rCollege} onChange={e=>setRC(e.target.value)} placeholder="IIT Bombay, NIT Trichy, VIT…"/></div>
              <div className="fg"><label className="fl">Year</label>
                <select className="fs" value={rYear} onChange={e=>setRY(e.target.value)}>
                  <option value="">Select year</option>
                  {['1st Year','2nd Year','3rd Year','4th Year','Graduated','Aspiring (12th / Drop)'].map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Branch</label><input className="fi" value={rBranch} onChange={e=>setRB(e.target.value)} placeholder="Computer Science, Mechanical…"/></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" type="password" value={rPass} onChange={e=>setRP(e.target.value)} placeholder="••••••••"/></div>
              <button className="abtn" onClick={doRegister} disabled={authLoading}>{authLoading?'Creating…':'Create Account'}</button>
              <div className="asw">Already have an account? <a onClick={() => setAuthTab('login')}>Sign In</a></div>
            </>
          )}
        </div>
      </div>
    </>
  )

  const trending = Object.entries(
    posts.reduce((acc, p) => { acc[p.college] = (acc[p.college]||0) + 1 + p.likes/10; return acc }, {} as Record<string,number>)
  ).sort((a,b)=>b[1]-a[1]).slice(0,5)

  return (
    <>
      {toastEl}
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right">
          <span className="nav-greeting">Hey, {user?.name.split(' ')[0]}!</span>
          <button className="nbtn" onClick={() => { setUser(null); setPage('landing') }}>Logout</button>
        </div>
      </nav>
      <div className="app">
        <aside className="sidebar">
          <div className="ucard">
            <div className="uavatar" style={{background:gc(user!.name)}}>{ini(user!.name)}</div>
            <div className="uname">{user!.name}</div>
            <div className="usub">{user!.college}</div>
            <div className="upill">{user!.year}{user!.branch?' · '+user!.branch:''}</div>
          </div>
          <nav className="snav">
            {(['feed','explore','rankings','ask','profile'] as const).map(v => (
              <button key={v} className={`snav-btn${view===v?' act':''}`} onClick={() => setView(v)}>
                <i className={`ti ti-${{feed:'home',explore:'compass',rankings:'trophy',ask:'message-question',profile:'user'}[v]}`}/>
                {{feed:'Home Feed',explore:'Explore Colleges',rankings:'AI Rankings',ask:'Ask Seniors',profile:'My Profile'}[v]}
              </button>
            ))}
          </nav>
        </aside>
        <main className="feed">
          {view==='feed'     && <FeedView user={user!} posts={posts} setPosts={setPosts} toast={toast}/>}
          {view==='explore'  && <ExploreView posts={posts}/>}
          {view==='rankings' && <RankingsView/>}
          {view==='ask'      && <AskSeniorsView posts={posts}/>}
          {view==='profile'  && <ProfileView user={user!} posts={posts}/>}
        </main>
        <aside className="rpanel">
          <JeeMatcher/>
          <div className="rcard">
            <div className="rtitle"><i className="ti ti-trending-up"/>Trending</div>
            {trending.map(([name,score],i) => (
              <div className="trow" key={name}>
                <div className="tnum">{i+1}</div>
                <div><div className="tname">{name}</div><div className="tcnt">{Math.floor(Number(score)*3)} discussions</div></div>
              </div>
            ))}
          </div>
          <AICounselor/>
        </aside>
      </div>
    </>
  )
}

    function FeedView({ user, posts, setPosts, toast }: { user:User; posts:Post[]; setPosts:(p:Post[])=>void; toast:(m:string)=>void }) {
  const [text,setText]       = useState('')
  const [type,setType]       = useState('review')
  const [college,setCollege] = useState('')
  const [posting,setPosting] = useState(false)
  const allColleges = [...new Set([...COLLEGES.map(c=>c.name),...posts.map(p=>p.college)])].sort()

  async function createPost() {
    if (!text.trim()) { toast('Write something first!'); return }
    setPosting(true)
    try {
      const enhanced = await callAI(`A student at ${user.college} (${user.year}, ${user.branch}) posted this ${type}:\n\n"${text}"\n\nIf under 40 words, expand slightly keeping their voice. If already detailed, return unchanged. Return ONLY the post text.`,'You help students write more informative posts about their Indian college experience. Keep their authentic voice.')
      const np: Post = { id:'p'+Date.now(), uid:user.id, college:college||user.college, type, text:enhanced, likes:0, likedBy:[], comments:[], ts:Date.now() }
      await storagePost({ action:'createPost', post:np })
      setPosts([np,...posts]); setText(''); toast('Posted! 🎉')
    } catch { toast('Post failed. Check your connection.') }
    setPosting(false)
  }

  return (
    <>
      <div className="pbox">
        <textarea className="ptxt" value={text} onChange={e=>setText(e.target.value)} placeholder="Share your campus reality — placements, hostel life, faculty, anything honest!"/>
        <div className="pmeta">
          <select className="sel" value={type} onChange={e=>setType(e.target.value)}>
            <option value="review">📝 College Review</option>
            <option value="qa">❓ Question</option>
            <option value="tip">💡 Pro Tip</option>
            <option value="rank">🏆 Ranking Insight</option>
          </select>
          <select className="sel" value={college} onChange={e=>setCollege(e.target.value)} style={{maxWidth:155}}>
            <option value="">Select College</option>
            {allColleges.map(c=><option key={c}>{c}</option>)}
          </select>
          <button className="pbtn" onClick={createPost} disabled={posting}>{posting?'Posting…':'Post →'}</button>
        </div>
      </div>
      {[...posts].sort((a,b)=>b.ts-a.ts).map(p=><PostCard key={p.id} post={p} user={user} posts={posts} setPosts={setPosts}/>)}
    </>
  )
}

function PostCard({ post, user, posts, setPosts }: { post:Post; user:User; posts:Post[]; setPosts:(p:Post[])=>void }) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [aiSummary, setAiSummary]       = useState('')
  const [summaryLoading, setSL]         = useState(false)
  const [commentLoading, setCL]         = useState(false)
  const tagMap: Record<string,string>   = { review:'📝 Review', qa:'❓ Question', tip:'💡 Tip', rank:'🏆 Ranking' }
  const tagCls: Record<string,string>   = { review:'tr', qa:'tq', tip:'tt', rank:'tk' }
  const liked = post.likedBy?.includes(user.id)

  async function toggleLike() {
    const { likes, liked: nowLiked } = await storagePost<{likes:number;liked:boolean}>({ action:'likePost', postId:post.id, userId:user.id })
    setPosts(posts.map(p => p.id===post.id ? { ...p, likes, likedBy: nowLiked ? [...(p.likedBy||[]),user.id] : p.likedBy.filter(x=>x!==user.id) } : p))
  }

  async function addComment() {
    if (!commentText.trim()) return
    setCL(true)
    const userComment: Comment = { author:user.name, text:commentText, ts:Date.now() }
    await storagePost({ action:'addComment', postId:post.id, comment:userComment })
    const updated = [...(post.comments||[]), userComment]
    setPosts(posts.map(p => p.id===post.id ? { ...p, comments:updated } : p))
    setCommentText('')
    if (commentText.includes('?')) {
      const aiReply = await callAI(`Original post from ${post.college}: "${post.text}"\n\nStudent asks: "${commentText}"\n\nAs an experienced senior, give a brief honest reply (2-3 sentences).`,'You are a senior student on CampusReal. Be direct and genuine.')
      const aiComment: Comment = { author:'AI Counselor', text:aiReply, ts:Date.now(), isAI:true }
      await storagePost({ action:'addComment', postId:post.id, comment:aiComment })
      setPosts(posts.map(p => p.id===post.id ? { ...p, comments:[...updated, aiComment] } : p))
    }
    setCL(false)
  }

  async function getSummary() {
    setSL(true)
    const s = await callAI(`Summarize in 2 bullet points starting with •, max 15 words each:\n"${post.text}"`,'You summarize Indian college posts ultra-concisely.')
    setAiSummary(s); setSL(false)
  }

  return (
    <div className="pcard">
      <div className="phead">
        <div className="pavatar" style={{background:gc(post.college)}}>{ini(post.college)}</div>
        <div style={{flex:1}}>
          <div className="pauthor-name">{post.college}</div>
          <div className="pauthor-sub"><span>{ago(post.ts)}</span></div>
        </div>
        <span className={`tbadge ${tagCls[post.type]||'tr'}`}>{tagMap[post.type]||'Post'}</span>
      </div>
      <div className="pbody">{post.text}
        {aiSummary && <div style={{background:'#f5f3ff',borderRadius:9,padding:'10px 12px',marginTop:10,fontSize:13,lineHeight:1.7,borderLeft:'3px solid #7c3aed',whiteSpace:'pre-wrap'}}><div style={{fontSize:11,fontWeight:600,color:'#4c1d95',marginBottom:4}}>✦ KEY TAKEAWAYS</div>{aiSummary}</div>}
      </div>
      <div className="pfooter">
        <button className={`pact${liked?' liked':''}`} onClick={toggleLike}><i className={`ti ${liked?'ti-heart-filled':'ti-heart'}`}/>{post.likes}</button>
        <button className="pact" onClick={() => setShowComments(!showComments)}><i className="ti ti-message-circle"/>{post.comments?.length||0} Comments</button>
        <button className="pact" onClick={getSummary} disabled={summaryLoading}>{summaryLoading?<><span className="spin"/>Reading…</>:<><i className="ti ti-sparkles"/>AI TL;DR</>}</button>
      </div>
      {showComments && (
        <div className="carea">
          {(post.comments||[]).map((c,i) => (
            <div className="crow" key={i}>
              <div className="cav" style={{background:gc(c.author)}}>{ini(c.author)}</div>
              <div className="cbody"><div className="cauth">{c.author}{c.isAI&&<span className="ailabel">AI</span>}</div>{c.text}</div>
            </div>
          ))}
          <div className="cinrow">
            <input className="cinput" value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Ask or comment… questions get AI replies" onKeyDown={e=>e.key==='Enter'&&addComment()}/>
            <button className="csend" onClick={addComment} disabled={commentLoading}>{commentLoading?'…':'Send'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExploreView({ posts }: { posts:Post[] }) {
  const [filtered, setFiltered] = useState<Post[]|null>(null)
  const [filterName, setFilterName] = useState('')
  if (filtered !== null) return (
    <div className="feed">
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{fontFamily:'Syne',fontWeight:700,fontSize:16}}>Posts about {filterName}</div>
        <button onClick={()=>{setFiltered(null);setFilterName('')}} style={{fontSize:12,background:'var(--border)',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer'}}>← Back</button>
      </div>
      {filtered.length===0
        ?<div className="scard" style={{textAlign:'center',color:'var(--muted)'}}>No posts for {filterName} yet. Be the first!</div>
        :[...filtered].sort((a,b)=>b.ts-a.ts).map(p=><PostCard key={p.id} post={p} user={{id:'',name:'Guest',email:'',college:'',year:'',branch:''}} posts={posts} setPosts={()=>{}}/>)}
    </div>
  )
  return (
    <div className="scard">
      <div className="stitle">Explore Colleges</div>
      <div className="ssub">Tap a college to see all community posts</div>
      <div className="egrid">
        {COLLEGES.map(c=>(
          <div className="etile" key={c.id} onClick={()=>{setFiltered(posts.filter(p=>p.college===c.name));setFilterName(c.name)}}>
            <div className="eabbr">{c.short}</div>
            <div className="etname">{c.name}</div>
            <div className="etsub">{c.city} · {c.type}</div>
            <div style={{marginTop:9,fontSize:12}}>⭐ {c.rating}/5</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>JEE cutoff ≈ {c.cutoff}%ile</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RankingsView() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    callAI('Rank top 8 Indian engineering colleges based on student satisfaction, real placements & campus life. Numbered list: "1. College — reason (honest about drawbacks too)". Be concise.','You give honest unbiased rankings of Indian colleges.')
      .then(setResult).finally(()=>setLoading(false))
  }, [])
  return (
    <div className="scard">
      <div className="stitle">🏆 AI + Community Rankings</div>
      <div className="ssub">Honest rankings based on real student outcomes, not sponsorships</div>
      {loading?<div style={{color:'var(--muted)',fontSize:13}}><span className="spin"/>Generating live rankings…</div>
        :<div style={{fontSize:14,lineHeight:2,whiteSpace:'pre-wrap'}}>{result}</div>}
    </div>
  )
}

function AskSeniorsView({ posts }: { posts:Post[] }) {
  const [q,setQ]       = useState('')
  const [ans,setAns]   = useState('')
  const [loading,setL] = useState(false)
  async function ask() {
    if (!q.trim()) return
    setL(true); setAns('')
    const ctx = posts.filter(p=>['review','tip'].includes(p.type)).slice(0,6).map(p=>`[${p.college}]: ${p.text}`).join('\n')
    const r = await callAI(`Student question: "${q}"\n\nCommunity posts:\n${ctx}\n\nAnswer using community insights and your knowledge. Be specific, honest, practical.`,'You are a senior student counselor on CampusReal. Give honest direct answers about Indian colleges.')
    setAns(r); setL(false)
  }
  return (
    <div className="scard">
      <div className="stitle">Ask Seniors</div>
      <div className="ssub">AI pulls insights from the community to answer your questions honestly</div>
      <textarea className="ptxt" style={{height:100}} value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. Is hostel worth it at NIT Trichy? What's the real placement scenario for ECE at VIT?"/>
      <button className="pbtn" style={{marginTop:10,padding:'10px 22px'}} onClick={ask} disabled={loading}>{loading?<><span className="spin"/>Finding insights…</>:'Ask the Community ✦'}</button>
      {ans&&<div className="aibox" style={{marginTop:16}}>{ans}</div>}
    </div>
  )
}

function ProfileView({ user, posts }: { user:User; posts:Post[] }) {
  const myPosts = posts.filter(p=>p.uid===user.id)
  return (
    <div className="scard">
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22}}>
        <div style={{width:70,height:70,borderRadius:'50%',background:gc(user.name),display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontWeight:700,fontSize:22,color:'#fff'}}>{ini(user.name)}</div>
        <div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:20}}>{user.name}</div>
          <div style={{color:'var(--muted)',fontSize:13,marginTop:4}}>{user.college}</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{user.year}{user.branch?' · '+user.branch:''}</div>
        </div>
      </div>
      <div className="pmini">
        {[['Posts',myPosts.length],['Likes',myPosts.reduce((s,p)=>s+p.likes,0)],['Replies',myPosts.reduce((s,p)=>s+(p.comments?.length||0),0)]].map(([l,n])=>
          <div className="pmini-box" key={String(l)}><div className="pmini-num">{n}</div><div className="pmini-lbl">{l}</div></div>)}
      </div>
      <div style={{fontFamily:'Syne',fontWeight:600,fontSize:14,marginBottom:12}}>My Posts</div>
      {myPosts.length
        ?myPosts.map(p=><div key={p.id} style={{background:'var(--bg)',borderRadius:9,padding:13,marginBottom:10,fontSize:13,lineHeight:1.7,borderLeft:'3px solid var(--brand2)'}}>{p.text}<div style={{fontSize:11,color:'var(--muted)',marginTop:7}}>{ago(p.ts)} · ❤ {p.likes}</div></div>)
        :<div style={{color:'var(--muted)',fontSize:13}}>No posts yet. Share your campus reality!</div>}
    </div>
  )
}

function JeeMatcher() {
  const [exam,setExam]   = useState('JEE Mains')
  const [pct,setPct]     = useState('')
  const [results,setRes] = useState<{name:string;type:string;city:string;chance:string;detail:string}[]>([])
  const [loading,setL]   = useState(false)
  async function match() {
    const p = parseFloat(pct)
    if (!p||p<0||p>100) return
    setL(true); setRes([])
    const ans = await callAI(`Student scored ${p} percentile in ${exam}. List exactly 4 realistic Indian colleges. Return ONLY a JSON array: [{"name":"...","type":"IIT/NIT/Deemed/State","city":"...","chance":"High/Medium/Low","detail":"one honest line"}]`,'You are an expert on Indian college admissions. Be accurate and realistic.')
    try { setRes(JSON.parse(ans.replace(/```json|```/g,'').trim())) } catch { setRes([]) }
    setL(false)
  }
  const cc = (c: string) => c==='High'?'#10b981':c==='Medium'?'#f5a623':'#e94560'
  const cw = (c: string) => c==='High'?85:c==='Medium'?55:30
  return (
    <div className="rcard">
      <div className="rtitle"><i className="ti ti-calculator"/>JEE / NEET Matcher</div>
      <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>Enter percentile → see colleges you can get</div>
      <div className="jrow">
        <select className="jinp" value={exam} onChange={e=>setExam(e.target.value)} style={{maxWidth:110}}>
          <option>JEE Mains</option><option>JEE Advanced</option><option>NEET</option><option>BITSAT</option>
        </select>
        <input className="jinp" type="number" value={pct} onChange={e=>setPct(e.target.value)} placeholder="Percentile" style={{maxWidth:85}}/>
        <button className="jbtn" onClick={match} disabled={loading}>{loading?'…':'Find →'}</button>
      </div>
      {loading&&<div style={{fontSize:12,color:'var(--muted)'}}><span className="spin"/>Finding colleges…</div>}
      {results.map((c,i)=>(
        <div className="cres" key={i}>
          <div className="cresname">{c.name}</div>
          <div className="cressub">{c.city} · {c.type} · <strong style={{color:cc(c.chance)}}>{c.chance} chance</strong></div>
          <div className="cressub" style={{marginTop:3}}>{c.detail}</div>
          <div className="cbar"><div className="cfill" style={{width:cw(c.chance)+'%'}}/></div>
        </div>
      ))}
    </div>
  )
}

function AICounselor() {
  const [q,setQ]       = useState('')
  const [ans,setAns]   = useState('')
  const [loading,setL] = useState(false)
  async function ask() {
    if (!q.trim()) return
    setL(true); setAns('')
    const r = await callAI(q,'You are an honest knowledgeable Indian college counselor. Give practical direct advice about IITs, NITs, BITS and other Indian colleges. Be specific and realistic in 3-5 sentences.')
    setAns(r); setL(false)
  }
  return (
    <div className="rcard">
      <div className="rtitle"><i className="ti ti-robot"/>AI Counselor</div>
      <div style={{fontSize:12,color:'var(--muted)',marginBottom:9}}>Instant honest answers about admissions & colleges</div>
      <textarea className="ptarea" value={q} onChange={e=>setQ(e.target.value)} placeholder="Which is better for CSE — NIT Trichy or BITS Pilani?"/>
      <button className="pbtn2" onClick={ask} disabled={loading}>{loading?<><span className="spin"/>Thinking…</>:'Ask AI ✦'}</button>
      {ans&&<div className="aibox">{ans}</div>}
    </div>
  )
        }
  }

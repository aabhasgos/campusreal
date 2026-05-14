'use client'
import { useState, useEffect } from 'react'

const COLORS = ['#e94560','#0f3460','#f5a623','#10b981','#8b5cf6','#ec4899','#06b6d4']
const gc = (s: string) => { let h = 0; for (const c of s) h = (h*31+c.charCodeAt(0))%COLORS.length; return COLORS[h] }
const ini = (n: string) => n.split(' ').map((w:string)=>w[0]).join('').toUpperCase().slice(0,2)
const ago = (ts: number) => { const d=Date.now()-ts; if(d<3.6e6) return Math.floor(d/60000)+'m ago'; if(d<864e5) return Math.floor(d/3.6e6)+'h ago'; return Math.floor(d/864e5)+'d ago' }

const PRESET_COLLEGES = [
  'IIT Bombay','IIT Delhi','IIT Madras','IIT Kanpur','IIT Kharagpur',
  'NIT Trichy','NIT Warangal','NIT Surathkal','BITS Pilani','BITS Goa',
  'DTU Delhi','NSIT Delhi','COEP Pune','VIT Vellore','SRM Institute',
  'Thapar University','Manipal Institute','RVCE Bangalore','PES University',
  'Anna University','Jadavpur University','BIT Mesra','KIIT Bhubaneswar',
  'Amity University','LPU','Chandigarh University','MIT Pune',
]

const COLLEGE_TILES = [
  {id:'iitb',name:'IIT Bombay',short:'IITB',city:'Mumbai',type:'IIT',cutoff:99.8,rating:4.9},
  {id:'iitd',name:'IIT Delhi',short:'IITD',city:'New Delhi',type:'IIT',cutoff:99.7,rating:4.8},
  {id:'iitm',name:'IIT Madras',short:'IITM',city:'Chennai',type:'IIT',cutoff:99.5,rating:4.9},
  {id:'nitt',name:'NIT Trichy',short:'NITT',city:'Tiruchirappalli',type:'NIT',cutoff:97,rating:4.5},
  {id:'nitw',name:'NIT Warangal',short:'NITW',city:'Warangal',type:'NIT',cutoff:96,rating:4.4},
  {id:'bits',name:'BITS Pilani',short:'BITS',city:'Pilani',type:'Deemed',cutoff:95,rating:4.6},
  {id:'dtu',name:'DTU Delhi',short:'DTU',city:'New Delhi',type:'State',cutoff:92,rating:4.3},
  {id:'thapar',name:'Thapar University',short:'TU',city:'Patiala',type:'Deemed',cutoff:80,rating:4.1},
  {id:'vit',name:'VIT Vellore',short:'VIT',city:'Vellore',type:'Deemed',cutoff:78,rating:4.1},
  {id:'srm',name:'SRM Institute',short:'SRM',city:'Chennai',type:'Deemed',cutoff:70,rating:3.8},
]

type User = {id:string;name:string;email:string;college:string;year:string;branch:string}
type Comment = {author:string;text:string;ts:number;isAI?:boolean}
type Post = {id:string;uid:string;college:string;type:string;text:string;likes:number;likedBy:string[];comments:Comment[];ts:number}

async function ai(prompt: string, system?: string): Promise<string> {
  try {
    const r = await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,system})})
    const d = await r.json()
    if(!r.ok) throw new Error(d.error||'AI error')
    return d.text as string
  } catch(e:unknown) {
    return 'AI unavailable right now. Please try again in a moment.'
  }
}

async function db(body: Record<string,unknown>) {
  const r = await fetch('/api/storage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  const d = await r.json()
  if(!r.ok) throw new Error(d.error)
  return d
}

export default function App() {
  const [page, setPage] = useState<'land'|'auth'|'app'>('land')
  const [tab, setTab] = useState<'login'|'reg'>('login')
  const [user, setUser] = useState<User|null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [view, setView] = useState<'feed'|'explore'|'rank'|'ask'|'profile'>('feed')
  const [toast, setToast] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [le,setLE]=useState('')
  const [lp,setLP]=useState('')
  const [rn,setRN]=useState('')
  const [re,setRE]=useState('')
  const [rc,setRC]=useState('')
  const [ry,setRY]=useState('')
  const [rb,setRB]=useState('')
  const [rp,setRP]=useState('')
  const [al,setAL]=useState(false)

  function showToast(m: string) {
    setToast(m)
    setToastOn(true)
    setTimeout(()=>setToastOn(false),2800)
  }

  useEffect(()=>{
    try {
      const saved = localStorage.getItem('cr_user')
      if(saved) { setUser(JSON.parse(saved)); setPage('app') }
    } catch {}
  },[])

  useEffect(()=>{
    if(page==='app') {
      fetch('/api/storage?resource=posts').then(r=>r.json()).then(setPosts).catch(()=>{})
    }
  },[page])

  function saveUser(u: User) {
    setUser(u)
    try { localStorage.setItem('cr_user', JSON.stringify(u)) } catch {}
  }

  function logout() {
    setUser(null)
    try { localStorage.removeItem('cr_user') } catch {}
    setPage('land')
  }

  async function doLogin() {
    setAL(true)
    try {
      const d = await db({action:'login',email:le,pass:lp})
      saveUser(d.user)
      setPage('app')
    } catch(e:unknown) {
      showToast(e instanceof Error && e.message.includes('Invalid') ? 'Wrong email/password' : 'Login failed')
    }
    setAL(false)
  }

  async function doReg() {
    if(!rn||!re||!rc||!ry||!rp) { showToast('Please fill all fields'); return }
    setAL(true)
    try {
      const d = await db({action:'register',name:rn,email:re,college:rc,year:ry,branch:rb,pass:rp})
      saveUser(d.user)
      setPage('app')
      showToast('Welcome '+rn+'!')
    } catch(e:unknown) {
      showToast(e instanceof Error ? e.message : 'Registration failed')
    }
    setAL(false)
  }

  if(page==='land') return (
    <div>
      <div className={`toast${toastOn?' show':''}`}>{toast}</div>
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right">
          <button className="nbtn" onClick={()=>{setTab('login');setPage('auth')}}>Sign In</button>
          <button className="nbtn p" onClick={()=>{setTab('reg');setPage('auth')}}>Join Free</button>
        </div>
      </nav>
      <div className="hero">
        <h1 className="hero-h">The <em>Real</em> Guide to Indian Colleges</h1>
        <p className="hero-p">Seniors share honest campus reviews. Juniors get real answers. AI helps you find the right college for your JEE / NEET score.</p>
        <div className="hctas">
          <button className="hcta f" onClick={()=>{setTab('reg');setPage('auth')}}>Join as Student</button>
          <button className="hcta o" onClick={()=>{setTab('reg');setPage('auth')}}>Share Your Experience</button>
        </div>
        <div className="hstats">
          <div style={{textAlign:'center'}}><div className="hstat-num">12K+</div><div className="hstat-lbl">Students</div></div>
          <div style={{textAlign:'center'}}><div className="hstat-num">800+</div><div className="hstat-lbl">Colleges</div></div>
          <div style={{textAlign:'center'}}><div className="hstat-num">50K+</div><div className="hstat-lbl">Reviews</div></div>
        </div>
        <div className="hfeats">
          <div className="hfeat"><div className="hfeat-icon"><i className="ti ti-school"/></div><div className="hfeat-t">Honest Reviews</div><div className="hfeat-d">Seniors share placement reality, hostel life, faculty — no sugar coating.</div></div>
          <div className="hfeat"><div className="hfeat-icon"><i className="ti ti-robot"/></div><div className="hfeat-t">AI College Matcher</div><div className="hfeat-d">Enter your JEE/NEET percentile and get colleges you can actually target.</div></div>
          <div className="hfeat"><div className="hfeat-icon"><i className="ti ti-messages"/></div><div className="hfeat-t">Ask Seniors</div><div className="hfeat-d">AI surfaces the most relevant senior insights instantly.</div></div>
          <div className="hfeat"><div className="hfeat-icon"><i className="ti ti-trophy"/></div><div className="hfeat-t">Community Rankings</div><div className="hfeat-d">Student-powered rankings based on real experience, not sponsorships.</div></div>
        </div>
      </div>
    </div>
  )

  if(page==='auth') return (
    <div>
      <div className={`toast${toastOn?' show':''}`}>{toast}</div>
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right"><button className="nbtn" onClick={()=>setPage('land')}>Back</button></div>
      </nav>
      <div className="awrap">
        <div className="acard">
          <div className="alogo">Campus<em>Real</em></div>
          <div className="asub">The honest student community</div>
          <div className="atabs">
            <button className={`atab${tab==='login'?' act':''}`} onClick={()=>setTab('login')}>Sign In</button>
            <button className={`atab${tab==='reg'?' act':''}`} onClick={()=>setTab('reg')}>Join Free</button>
          </div>
          {tab==='login' ? (
            <div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={le} onChange={e=>setLE(e.target.value)} placeholder="your@email.com"/></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" type="password" value={lp} onChange={e=>setLP(e.target.value)} placeholder="password" onKeyDown={e=>e.key==='Enter'&&doLogin()}/></div>
              <button className="abtn" onClick={doLogin} disabled={al}>{al?'Signing in...':'Sign In'}</button>
              <div className="asw">New here? <a onClick={()=>setTab('reg')}>Create account</a></div>
              <div style={{marginTop:12,padding:10,background:'#f0f9ff',borderRadius:9,fontSize:12,color:'#0369a1'}}>Demo: <strong>rohan@demo.com</strong> / <strong>demo</strong></div>
            </div>
          ) : (
            <div>
              <div className="fg"><label className="fl">Full Name</label><input className="fi" value={rn} onChange={e=>setRN(e.target.value)} placeholder="Arjun Sharma"/></div>
              <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={re} onChange={e=>setRE(e.target.value)} placeholder="your@email.com"/></div>
              <div className="fg"><label className="fl">College</label><input className="fi" value={rc} onChange={e=>setRC(e.target.value)} placeholder="IIT Bombay, Thapar, VIT..."/></div>
              <div className="fg"><label className="fl">Year</label>
                <select className="fs" value={ry} onChange={e=>setRY(e.target.value)}>
                  <option value="">Select year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Graduated</option>
                  <option>Aspiring (12th / Drop)</option>
                </select>
              </div>
              <div className="fg"><label className="fl">Branch</label><input className="fi" value={rb} onChange={e=>setRB(e.target.value)} placeholder="Computer Science, Mechanical..."/></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" type="password" value={rp} onChange={e=>setRP(e.target.value)} placeholder="password"/></div>
              <button className="abtn" onClick={doReg} disabled={al}>{al?'Creating...':'Create Account'}</button>
              <div className="asw">Already have an account? <a onClick={()=>setTab('login')}>Sign In</a></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const trending = Object.entries(
    posts.reduce((acc,p)=>{acc[p.college]=(acc[p.college]||0)+1+p.likes/10;return acc},{} as Record<string,number>)
  ).sort((a,b)=>b[1]-a[1]).slice(0,5)

  return (
    <div>
      <div className={`toast${toastOn?' show':''}`}>{toast}</div>
      <nav className="nav">
        <div className="logo">Campus<em>Real</em></div>
        <div className="nav-right">
          <span className="nav-greeting">Hey, {user?.name.split(' ')[0]}!</span>
          <button className="nbtn" onClick={logout}>Logout</button>
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
            <button className={`snav-btn${view==='feed'?' act':''}`} onClick={()=>setView('feed')}><i className="ti ti-home"/>Home Feed</button>
            <button className={`snav-btn${view==='explore'?' act':''}`} onClick={()=>setView('explore')}><i className="ti ti-compass"/>Explore Colleges</button>
            <button className={`snav-btn${view==='rank'?' act':''}`} onClick={()=>setView('rank')}><i className="ti ti-trophy"/>AI Rankings</button>
            <button className={`snav-btn${view==='ask'?' act':''}`} onClick={()=>setView('ask')}><i className="ti ti-message-question"/>Ask Seniors</button>
            <button className={`snav-btn${view==='profile'?' act':''}`} onClick={()=>setView('profile')}><i className="ti ti-user"/>My Profile</button>
          </nav>
        </aside>
        <main className="feed">
          {view==='feed' && <Feed user={user!} posts={posts} setPosts={setPosts} showToast={showToast}/>}
          {view==='explore' && <Explore posts={posts}/>}
          {view==='rank' && <Rankings/>}
          {view==='ask' && <AskSeniors posts={posts}/>}
          {view==='profile' && <Profile user={user!} posts={posts}/>}
        </main>
        <aside className="rpanel">
          <Matcher/>
          <div className="rcard">
            <div className="rtitle"><i className="ti ti-trending-up"/>Trending</div>
            {trending.length===0 && <div style={{fontSize:13,color:'var(--muted)'}}>No posts yet</div>}
            {trending.map(([name,score],i)=>(
              <div className="trow" key={name}>
                <div className="tnum">{i+1}</div>
                <div><div className="tname">{name}</div><div className="tcnt">{Math.floor(Number(score)*3)} discussions</div></div>
              </div>
            ))}
          </div>
          <Counselor/>
        </aside>
      </div>
    </div>
  )
}

function Feed({user,posts,setPosts,showToast}:{user:User;posts:Post[];setPosts:(p:Post[])=>void;showToast:(m:string)=>void}) {
  const [text,setText]=useState('')
  const [type,setType]=useState('review')
  const [college,setCollege]=useState('')
  const [busy,setBusy]=useState(false)
  const cols=[...new Set([...PRESET_COLLEGES,user.college,...posts.map(p=>p.college)])].filter(Boolean).sort()

  async function post() {
    if(!text.trim()) { showToast('Write something first!'); return }
    setBusy(true)
    try {
      const enhanced = await ai('Student at '+user.college+' posted this '+type+': "'+text+'". If under 40 words expand slightly keeping their voice, else return unchanged. Return ONLY the post text.')
      const np:Post={id:'p'+Date.now(),uid:user.id,college:college||user.college,type,text:enhanced,likes:0,likedBy:[],comments:[],ts:Date.now()}
      await db({action:'createPost',post:np})
      setPosts([np,...posts])
      setText('')
      showToast('Posted!')
    } catch {
      showToast('Post failed. Try again.')
    }
    setBusy(false)
  }

  return (
    <div>
      <div className="pbox">
        <textarea className="ptxt" value={text} onChange={e=>setText(e.target.value)} placeholder="Share your campus reality — placements, hostel life, faculty, anything honest!"/>
        <div className="pmeta">
          <select className="sel" value={type} onChange={e=>setType(e.target.value)}>
            <option value="review">Review</option>
            <option value="qa">Question</option>
            <option value="tip">Tip</option>
            <option value="rank">Ranking</option>
          </select>
          <select className="sel" value={college} onChange={e=>setCollege(e.target.value)} style={{maxWidth:155}}>
            <option value="">My College</option>
            {cols.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <button className="pbtn" onClick={post} disabled={busy}>{busy?'Posting...':'Post'}</button>
        </div>
      </div>
      {[...posts].sort((a,b)=>b.ts-a.ts).map(p=><Card key={p.id} post={p} user={user} posts={posts} setPosts={setPosts}/>)}
    </div>
  )
}

function Card({post,user,posts,setPosts}:{post:Post;user:User;posts:Post[];setPosts:(p:Post[])=>void}) {
  const [showC,setShowC]=useState(false)
  const [ct,setCT]=useState('')
  const [sum,setSum]=useState('')
  const [sl,setSL]=useState(false)
  const [cl,setCL]=useState(false)
  const tagMap:Record<string,string>={review:'Review',qa:'Question',tip:'Tip',rank:'Ranking'}
  const tagCls:Record<string,string>={review:'tr',qa:'tq',tip:'tt',rank:'tk'}
  const liked=post.likedBy?.includes(user.id)

  async function like() {
    try {
      const d = await db({action:'likePost',postId:post.id,userId:user.id})
      setPosts(posts.map(p=>p.id===post.id?{...p,likes:d.likes,likedBy:d.liked?[...(p.likedBy||[]),user.id]:p.likedBy.filter((x:string)=>x!==user.id)}:p))
    } catch {}
  }

  async function comment() {
    if(!ct.trim()) return
    setCL(true)
    try {
      const uc:Comment={author:user.name,text:ct,ts:Date.now()}
      await db({action:'addComment',postId:post.id,comment:uc})
      const updated=[...(post.comments||[]),uc]
      setPosts(posts.map(p=>p.id===post.id?{...p,comments:updated}:p))
      const question=ct
      setCT('')
      if(question.includes('?')) {
        const rep = await ai('Post from '+post.college+': "'+post.text+'"\nStudent asks: "'+question+'"\nGive a brief honest 2-3 sentence reply as an experienced senior.')
        const ac:Comment={author:'AI Counselor',text:rep,ts:Date.now(),isAI:true}
        await db({action:'addComment',postId:post.id,comment:ac})
        setPosts(posts.map(p=>p.id===post.id?{...p,comments:[...updated,ac]}:p))
      }
    } catch {}
    setCL(false)
  }

  async function summarize() {
    setSL(true)
    const s = await ai('Summarize in 2 bullet points starting with bullet, max 15 words each: "'+post.text+'"')
    setSum(s)
    setSL(false)
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
      <div className="pbody">
        <div>{post.text}</div>
        {sum && (
          <div style={{background:'#f5f3ff',borderRadius:9,padding:'10px 12px',marginTop:10,fontSize:13,lineHeight:1.7,borderLeft:'3px solid #7c3aed',whiteSpace:'pre-wrap'}}>
            <div style={{fontSize:11,fontWeight:600,color:'#4c1d95',marginBottom:4}}>KEY TAKEAWAYS</div>
            {sum}
          </div>
        )}
      </div>
      <div className="pfooter">
        <button className={`pact${liked?' liked':''}`} onClick={like}>
          <i className={`ti ${liked?'ti-heart-filled':'ti-heart'}`}/>{post.likes}
        </button>
        <button className="pact" onClick={()=>setShowC(!showC)}>
          <i className="ti ti-message-circle"/>{post.comments?.length||0} Comments
        </button>
        <button className="pact" onClick={summarize} disabled={sl}>
          <i className="ti ti-sparkles"/>{sl?'Reading...':'AI TL;DR'}
        </button>
      </div>
      {showC && (
        <div className="carea">
          {(post.comments||[]).map((c,i)=>(
            <div className="crow" key={i}>
              <div className="cav" style={{background:gc(c.author)}}>{ini(c.author)}</div>
              <div className="cbody">
                <div className="cauth">{c.author}{c.isAI && <span className="ailabel">AI</span>}</div>
                {c.text}
              </div>
            </div>
          ))}
          <div className="cinrow">
            <input className="cinput" value={ct} onChange={e=>setCT(e.target.value)} placeholder="Ask or comment..." onKeyDown={e=>e.key==='Enter'&&comment()}/>
            <button className="csend" onClick={comment} disabled={cl}>{cl?'...':'Send'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Explore({posts}:{posts:Post[]}) {
  const [filtered,setFiltered]=useState<Post[]|null>(null)
  const [name,setName]=useState('')

  if(filtered!==null) {
    return (
      <div className="feed">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:16}}>Posts about {name}</div>
          <button onClick={()=>{setFiltered(null);setName('')}} style={{fontSize:12,background:'var(--border)',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer'}}>Back</button>
        </div>
        {filtered.length===0 && (
          <div className="scard" style={{textAlign:'center',color:'var(--muted)'}}>No posts yet for {name}. Be the first!</div>
        )}
        {[...filtered].sort((a,b)=>b.ts-a.ts).map(p=>(
          <Card key={p.id} post={p} user={{id:'',name:'Guest',email:'',college:'',year:'',branch:''}} posts={posts} setPosts={()=>{}}/>
        ))}
      </div>
    )
  }

  return (
    <div className="scard">
      <div className="stitle">Explore Colleges</div>
      <div className="ssub">Tap a college to see all community posts</div>
      <div className="egrid">
        {COLLEGE_TILES.map(c=>(
          <div className="etile" key={c.id} onClick={()=>{setFiltered(posts.filter(p=>p.college===c.name));setName(c.name)}}>
            <div className="eabbr">{c.short}</div>
            <div className="etname">{c.name}</div>
            <div className="etsub">{c.city} - {c.type}</div>
            <div style={{marginTop:9,fontSize:12}}>Stars: {c.rating}/5</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>JEE cutoff approx {c.cutoff} percentile</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Rankings() {
  const [result,setResult]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  async function load() {
    setLoading(true)
    setError('')
    setResult('')
    const r = await ai('Rank top 8 Indian engineering colleges based on student satisfaction, real placements and campus life. Use numbered list format like: 1. College name - reason why. Be honest about drawbacks too. Keep each point to 1-2 sentences.')
    if(r.includes('unavailable')) {
      setError(r)
    } else {
      setResult(r)
    }
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  return (
    <div className="scard">
      <div className="stitle">AI + Community Rankings</div>
      <div className="ssub">Honest rankings based on real student outcomes, not sponsorships</div>
      {loading && <div style={{color:'var(--muted)',fontSize:13}}><span className="spin"/> Generating rankings... this may take 15 seconds</div>}
      {error && (
        <div>
          <div style={{color:'var(--muted)',fontSize:13,marginBottom:8}}>{error}</div>
          <button onClick={load} style={{color:'var(--brand2)',background:'none',border:'1px solid var(--brand2)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontWeight:600,fontSize:13}}>Try Again</button>
        </div>
      )}
      {result && <div style={{fontSize:14,lineHeight:2,whiteSpace:'pre-wrap'}}>{result}</div>}
    </div>
  )
}

function AskSeniors({posts}:{posts:Post[]}) {
  const [q,setQ]=useState('')
  const [ans,setAns]=useState('')
  const [loading,setL]=useState(false)

  async function ask() {
    if(!q.trim()) return
    setL(true)
    setAns('')
    const ctx=posts.filter(p=>['review','tip'].includes(p.type)).slice(0,6).map(p=>'['+p.college+']: '+p.text).join('\n')
    const r=await ai('Student question: "'+q+'"\n\nCommunity posts for context:\n'+ctx+'\n\nAnswer using community insights and your knowledge of Indian colleges. Be specific, honest, practical.')
    setAns(r)
    setL(false)
  }

  return (
    <div className="scard">
      <div className="stitle">Ask Seniors</div>
      <div className="ssub">AI pulls insights from the community to answer your questions honestly</div>
      <textarea className="ptxt" style={{height:100}} value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. Is hostel worth it at NIT Trichy? What is the real placement scenario for ECE at VIT?"/>
      <button className="pbtn" style={{marginTop:10,padding:'10px 22px'}} onClick={ask} disabled={loading}>
        {loading ? 'Finding insights...' : 'Ask the Community'}
      </button>
      {ans && <div className="aibox" style={{marginTop:16}}>{ans}</div>}
    </div>
  )
}

function Profile({user,posts}:{user:User;posts:Post[]}) {
  const mine=posts.filter(p=>p.uid===user.id)
  return (
    <div className="scard">
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22}}>
        <div style={{width:70,height:70,borderRadius:'50%',background:gc(user.name),display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne',fontWeight:700,fontSize:22,color:'#fff'}}>{ini(user.name)}</div>
        <div>
          <div style={{fontFamily:'Syne',fontWeight:700,fontSize:20}}>{user.name}</div>
          <div style={{color:'var(--muted)',fontSize:13,marginTop:4}}>{user.college}</div>
          <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{user.year}{user.branch?' - '+user.branch:''}</div>
        </div>
      </div>
      <div className="pmini">
        <div className="pmini-box"><div className="pmini-num">{mine.length}</div><div className="pmini-lbl">Posts</div></div>
        <div className="pmini-box"><div className="pmini-num">{mine.reduce((s,p)=>s+p.likes,0)}</div><div className="pmini-lbl">Likes</div></div>
        <div className="pmini-box"><div className="pmini-num">{mine.reduce((s,p)=>s+(p.comments?.length||0),0)}</div><div className="pmini-lbl">Replies</div></div>
      </div>
      <div style={{fontFamily:'Syne',fontWeight:600,fontSize:14,marginBottom:12}}>My Posts</div>
      {mine.length === 0 && <div style={{color:'var(--muted)',fontSize:13}}>No posts yet. Share your campus reality!</div>}
      {mine.map(p=>(
        <div key={p.id} style={{background:'var(--bg)',borderRadius:9,padding:13,marginBottom:10,fontSize:13,lineHeight:1.7,borderLeft:'3px solid var(--brand2)'}}>
          {p.text}
          <div style={{fontSize:11,color:'var(--muted)',marginTop:7}}>{ago(p.ts)} - Likes: {p.likes}</div>
        </div>
      ))}
    </div>
  )
}

function Matcher() {
  const [exam,setExam]=useState('JEE Mains')
  const [pct,setPct]=useState('')
  const [res,setRes]=useState<{name:string;type:string;city:string;chance:string;detail:string}[]>([])
  const [loading,setL]=useState(false)
  const [msg,setMsg]=useState('')

  async function match() {
    const p=parseFloat(pct)
    if(!p||p<0||p>100) return
    setL(true)
    setRes([])
    setMsg('')
    const ans=await ai('Student scored '+p+' percentile in '+exam+'. List exactly 4 realistic Indian colleges to target. Return ONLY valid JSON array with no markdown formatting: [{"name":"College Name","type":"IIT or NIT or Deemed or State","city":"City Name","chance":"High or Medium or Low","detail":"one honest sentence about this college for this score"}]')
    try {
      const clean=ans.replace(/```json/g,'').replace(/```/g,'').trim()
      setRes(JSON.parse(clean))
    } catch {
      setMsg('Could not load results. Please try again.')
    }
    setL(false)
  }

  const cc=(c:string)=>c==='High'?'#10b981':c==='Medium'?'#f5a623':'#e94560'
  const cw=(c:string)=>c==='High'?85:c==='Medium'?55:30

  return (
    <div className="rcard">
      <div className="rtitle"><i className="ti ti-calculator"/>JEE / NEET Matcher</div>
      <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>Enter percentile to see colleges you can get</div>
      <div className="jrow">
        <select className="jinp" value={exam} onChange={e=>setExam(e.target.value)} style={{maxWidth:110}}>
          <option>JEE Mains</option>
          <option>JEE Advanced</option>
          <option>NEET</option>
          <option>BITSAT</option>
        </select>
        <input className="jinp" type="number" value={pct} onChange={e=>setPct(e.target.value)} placeholder="Percentile" style={{maxWidth:85}}/>
        <button className="jbtn" onClick={match} disabled={loading}>{loading?'...':'Find'}</button>
      </div>
      {loading && <div style={{fontSize:12,color:'var(--muted)'}}><span className="spin"/> Finding colleges...</div>}
      {msg && <div style={{fontSize:12,color:'var(--brand2)'}}>{msg}</div>}
      {res.map((c,i)=>(
        <div className="cres" key={i}>
          <div className="cresname">{c.name}</div>
          <div className="cressub">{c.city} - {c.type} - <strong style={{color:cc(c.chance)}}>{c.chance} chance</strong></div>
          <div className="cressub" style={{marginTop:3}}>{c.detail}</div>
          <div className="cbar"><div className="cfill" style={{width:cw(c.chance)+'%'}}/></div>
        </div>
      ))}
    </div>
  )
}

function Counselor() {
  const [q,setQ]=useState('')
  const [ans,setAns]=useState('')
  const [loading,setL]=useState(false)

  async function ask() {
    if(!q.trim()) return
    setL(true)
    setAns('')
    const r=await ai(q,'You are an honest knowledgeable Indian college counselor. Give practical direct advice about IITs, NITs, BITS and other Indian colleges in 3-5 sentences.')
    setAns(r)
    setL(false)
  }

  return (
    <div className="rcard">
      <div className="rtitle"><i className="ti ti-robot"/>AI Counselor</div>
      <div style={{fontSize:12,color:'var(--muted)',marginBottom:9}}>Instant honest answers about admissions and colleges</div>
      <textarea className="ptarea" value={q} onChange={e=>setQ(e.target.value)} placeholder="Which is better for CSE - NIT Trichy or BITS Pilani?"/>
      <button className="pbtn2" onClick={ask} disabled={loading}>{loading?'Thinking...':'Ask AI'}</button>
      {ans && <div className="aibox">{ans}</div>}
    </div>
  )
}

"use client";
import "../us.css";
import { useEffect, useState } from "react";
import { categoryMeta } from "../../lib/usData";

export default function Inbox(){
  const [state,setState]=useState({loading:true,user:null,inbox:[]});
  const [draft,setDraft]=useState({title:"",content:""});
  const [ideaFromMessage,setIdeaFromMessage]=useState(null);
  const [toast,setToast]=useState("");
  const [navOpen,setNavOpen]=useState(false);

  async function load(){
    const r=await fetch("/api/us",{cache:"no-store"});
    if(!r.ok){setState({loading:false,user:null,inbox:[]});return;}
    const d=await r.json();
    setState({loading:false,user:d.user,inbox:d.inbox||[]});
  }

  useEffect(()=>{load();},[]);

  useEffect(()=>{
    if(!state.user) return;
    const unread=(state.inbox||[]).filter(x=>x.to===state.user&&!x.readAt);
    if(!unread.length) return;
    const ids=unread.map(x=>x.id);
    fetch("/api/us",{
      method:"PATCH",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"markInboxRead",ids})
    }).then(r=>{
      if(r.ok){
        const readAt=new Date().toISOString();
        setState(s=>({...s,inbox:s.inbox.map(x=>ids.includes(x.id)?{...x,readAt}:x)}));
      }
    });
  },[state.user]);

  async function doLogout(){
    await fetch("/api/us-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"logout"})});
    window.location.href="/";
  }

  async function send(){
    const title=draft.title.trim();
    const content=draft.content.trim();
    if(!title&&!content) return;
    const r=await fetch("/api/us",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"createInbox",title,content})
    });
    if(!r.ok){setToast("Couldn’t send that");setTimeout(()=>setToast(""),1600);return;}
    const d=await r.json();
    setState(s=>({...s,inbox:[...s.inbox,d.inbox]}));
    setDraft({title:"",content:""});
    setToast("Sent ✓");
    setTimeout(()=>setToast(""),1200);
  }

  async function makeIdea(entry,category){
    const r=await fetch("/api/us",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"convertInbox",id:entry.id,category})
    });
    if(!r.ok){setToast("Couldn’t make that an idea");setTimeout(()=>setToast(""),1700);return;}
    const d=await r.json();
    setState(s=>({...s,inbox:s.inbox.map(x=>x.id===entry.id?{...x,ideaItemId:d.item.id,ideaCategory:category,ideaCreatedAt:new Date().toISOString(),ideaCreatedBy:state.user}:x)}));
    setIdeaFromMessage(null);
    setToast("Added to "+categoryMeta[category].label+" ✓");
    setTimeout(()=>setToast(""),1400);
  }

  if(state.loading) return <main className="us-bg"><div className="us-shell"><div className="us-skeleton hero"/><div className="us-skeleton list"/></div></main>;
  if(!state.user) return <main className="us-bg"><div className="us-login"><div className="us-brand">US</div><h1>Just us.</h1><p>Please log in first.</p><a href="/">Back to login</a></div></main>;

  const unread=(state.inbox||[]).filter(x=>x.to===state.user&&!x.readAt).length;

  return <main className="us-bg us-inbox-page">
    <header className="us-appbar">
      <div className="us-appbar-inner">
        <div className="us-memory-header-left">
          <a className="us-back-arrow" href="/" aria-label="Back">←</a>
          <div className="us-appbar-brand">INBOX</div>
        </div>
        <button className="us-nav-toggle" aria-label="Open navigation" onClick={()=>setNavOpen(!navOpen)}>
          ☰
          {unread ? <span className="us-nav-badge">{unread}</span> : null}
        </button>
        {navOpen ? (
          <div className="us-nav-drawer">
            <div className="us-nav-links">
              <a href="/">US</a>
              <button className="active" onClick={()=>setNavOpen(false)}>Inbox</button>
              <a href="/memories">Memories</a>
            </div>
            <div className="us-nav-bottom">
              <button className="us-nav-logout" onClick={doLogout}>Log out</button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
    <div className="us-top-strip" aria-hidden="true"/>

    <div className="us-shell us-inbox-shell">
      <section className="us-inbox-page-head">
        <small>JUST US</small>
        <h1>Inbox</h1>
        <p>Send links, notes and ideas back and forth.</p>
      </section>

      <section className="us-thread us-thread-page">
        {state.inbox.length ? [...state.inbox].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(entry=>(
          <article className={"us-message "+(entry.addedBy===state.user?"mine":"theirs")} key={entry.id}>
            <div className="us-message-meta">
              <b>{entry.addedBy}</b>
              <span>{new Date(entry.createdAt).toLocaleDateString(undefined,{day:"numeric",month:"short"})}</span>
            </div>
            {entry.title ? <h3>{entry.title}</h3> : null}
            {entry.content && entry.content!==entry.url ? <p>{entry.content}</p> : null}
            {entry.url ? <a href={entry.url} target="_blank" rel="noreferrer">{entry.url.replace(/^https?:\/\//,"").slice(0,72)}{entry.url.length>78?"…":""}</a> : null}

            {entry.ideaItemId ? (
              <div className="us-message-linked">✓ Added to {categoryMeta[entry.ideaCategory]?.label || "ideas"}</div>
            ) : ideaFromMessage===entry.id ? (
              <div className="us-message-idea">
                <span>Make this an idea</span>
                <div>
                  {Object.entries(categoryMeta).map(([key,value])=>(
                    <button key={key} onClick={()=>makeIdea(entry,key)}>{value.emoji} {value.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <button className="us-make-idea" onClick={()=>setIdeaFromMessage(entry.id)}>Make idea →</button>
            )}
          </article>
        )) : <div className="us-inbox-empty">Nothing here yet. Send the first one.</div>}
      </section>

      <section className="us-thread-compose us-thread-compose-page">
        <input placeholder="Optional title" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/>
        <div>
          <textarea placeholder={"Message "+(state.user==="Charlie"?"Tayla":"Charlie")+" or paste a link…"} value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})}/>
          <button className="us-primary" disabled={!draft.title.trim()&&!draft.content.trim()} onClick={send}>SEND →</button>
        </div>
      </section>
    </div>

    {toast ? <div className="us-toast">{toast}</div> : null}
  </main>;
}

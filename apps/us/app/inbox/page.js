"use client";
import "../us.css";
import { useEffect, useRef, useState } from "react";
import { categoryMeta } from "../../lib/usData";

export default function Inbox(){
  const [state,setState]=useState({loading:true,user:null,inbox:[]});
  const [draft,setDraft]=useState({title:"",content:""});
  const [ideaFromMessage,setIdeaFromMessage]=useState(null);
  const [toast,setToast]=useState("");
  const [navOpen,setNavOpen]=useState(false);
  const [showTitle,setShowTitle]=useState(false);
  const [ideaLink,setIdeaLink]=useState("");
  const [plusOpen,setPlusOpen]=useState(false);
  const [photo,setPhoto]=useState(null);
  const photoInputRef=useRef(null);
  const [sending,setSending]=useState(false);
  const bottomRef=useRef(null);

  async function load(){
    const r=await fetch("/api/us",{cache:"no-store"});
    if(!r.ok){setState({loading:false,user:null,inbox:[]});return;}
    const d=await r.json();
    setState({loading:false,user:d.user,inbox:d.inbox||[]});
  }

  useEffect(()=>{
    load();
    const refresh=()=>{if(!document.hidden)load();};
    const timer=setInterval(refresh,5000);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{clearInterval(timer);document.removeEventListener("visibilitychange",refresh);};
  },[]);

  useEffect(()=>{if(!state.loading)bottomRef.current?.scrollIntoView({behavior:"smooth",block:"end"});},[state.inbox.length,state.loading]);

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
  },[state.user,state.inbox]);

  async function doLogout(){
    await fetch("/api/us-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"logout"})});
    window.location.href="/";
  }

  async function attachPhoto(file){
    if(!file||!file.type.startsWith("image/"))return;
    try{
      const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=reader.result;};reader.onerror=reject;reader.readAsDataURL(file);});
      const canvas=document.createElement("canvas");const ratio=Math.min(1,700/Math.max(image.width,image.height));canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL("image/jpeg",.65);if(data.length>220000)data=canvas.toDataURL("image/jpeg",.42);
      if(data.length>220000)throw Error("Photo too large");
      setPhoto(data);setPlusOpen(false);
    }catch{setToast("Couldn’t attach photo. Try a smaller image.");}
  }

  async function send(){
    if(sending)return;
    const title=draft.title.trim();
    const content=draft.content.trim();
    if(showTitle ? (!title||!ideaLink.trim()) : (!content&&!photo)) return;
    const r=await fetch("/api/us",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"createInbox",title,content})
    });
    if(!r.ok){setSending(false);setToast("Couldn’t send that");setTimeout(()=>setToast(""),1600);return;}
    const d=await r.json();
    setState(s=>({...s,inbox:[...s.inbox,d.inbox]}));
    setDraft({title:"",content:""});
    setShowTitle(false);
    setPhoto(null);
    setIdeaLink("");
    setPlusOpen(false);
    setSending(false);
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
          <div className="us-appbar-brand">Inbox</div>
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

    <div className="us-shell us-inbox-shell us-chat-shell">
      <section className="us-inbox-page-head us-chat-heading">
        <small>JUST US</small>
        <h1>Our conversation</h1>
        <p>Little messages, big plans and everything in between.</p>
      </section>

      <section className="us-chat-thread" aria-label="Conversation">
        {state.inbox.length ? [...state.inbox].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).map(entry=>{
          const mine=entry.addedBy===state.user;
          const other=mine?"You":entry.addedBy;
          const date=new Date(entry.createdAt);
          const time=Number.isNaN(date.getTime())?"":date.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"});
          const link=entry.url || (entry.content||"").match(/https?:\/\/[^\s]+/)?.[0];
          let domain="";
          try{if(link)domain=new URL(link).hostname.replace(/^www\./,"");}catch{}
          return <article className={"us-chat-message "+(mine?"mine":"theirs")} key={entry.id}>
            <div className="us-chat-bubble">
              <div className="us-chat-meta"><strong>{other}</strong><span>{time}</span></div>
              {entry.title ? <h3>{entry.title}</h3> : null}
              {entry.photo ? <a className="us-chat-photo" href={entry.photo} target="_blank" rel="noreferrer" aria-label="View shared photo"><img src={entry.photo} alt={entry.title||"Shared photo"}/></a> : null}
              {entry.content && entry.content!==entry.url ? <p>{entry.content}</p> : null}
              {link ? <a className="us-chat-link" href={link} target="_blank" rel="noopener noreferrer"><span>↗</span><span><strong>{domain||"Shared link"}</strong><small>Open shared link</small></span></a> : null}
              {entry.ideaItemId ? <div className="us-chat-saved">✓ Saved to {categoryMeta[entry.ideaCategory]?.label||"ideas"}</div> :
                ideaFromMessage===entry.id ? <div className="us-chat-category">
                  <span>Save as an idea</span>
                  <div>{Object.entries(categoryMeta).map(([key,value])=><button key={key} onClick={()=>makeIdea(entry,key)}>{value.emoji} {value.label}</button>)}</div>
                  <button className="us-chat-cancel" onClick={()=>setIdeaFromMessage(null)}>Cancel</button>
                </div> : <button className="us-chat-make-idea" onClick={()=>setIdeaFromMessage(entry.id)}>✧ Make idea →</button>}
              {mine&&entry.readAt?<div className="us-chat-read">Seen</div>:null}
            </div>
          </article>;
        }) : <div className="us-inbox-empty">Your conversation starts here. Say something lovely ✨</div>}
        <div ref={bottomRef}/>
      </section>

      <form className="us-chat-compose" onSubmit={e=>{e.preventDefault();send();}}>
        {plusOpen ? <div className="us-chat-plus-menu" role="group" aria-label="Add to conversation"><button type="button" onClick={()=>photoInputRef.current?.click()}>📷 <span>Send photo</span></button><button type="button" onClick={()=>{setShowTitle(true);setPlusOpen(false);setPhoto(null);}}>✧ <span>Share an idea</span></button></div> : null}
        <input ref={photoInputRef} type="file" accept="image/*" className="us-chat-file-input" aria-label="Choose photo to send" onChange={e=>{attachPhoto(e.target.files?.[0]);e.target.value="";}}/>
        {showTitle ? <div className="us-share-idea-form">
          <div className="us-share-idea-heading"><strong>Share an idea</strong><button type="button" onClick={()=>{setShowTitle(false);setDraft({title:"",content:""});setIdeaLink("");setPhoto(null);}}>Cancel ×</button></div>
          <label>Title <input required placeholder="e.g. Outdoor Cinema" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
          <label>Link <input required type="url" placeholder="https://…" value={ideaLink} onChange={e=>setIdeaLink(e.target.value)}/></label>
          <label>Note (optional) <textarea rows={2} placeholder="What do you think?" value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})}/></label>
          {photo ? <div className="us-chat-photo-preview"><img src={photo} alt="Idea image"/><button type="button" onClick={()=>setPhoto(null)} aria-label="Remove photo">×</button></div>:null}
          <div className="us-share-idea-actions"><button type="button" onClick={()=>photoInputRef.current?.click()}>＋ {photo?"Change picture":"Add picture (optional)"}</button><button type="submit" className="us-primary" disabled={sending||!draft.title.trim()||!/^https?:\/\//i.test(ideaLink.trim())}>Share idea →</button></div>
        </div> : <>
          {photo ? <div className="us-chat-photo-preview"><img src={photo} alt="Photo ready to send"/><button type="button" onClick={()=>setPhoto(null)} aria-label="Remove photo">×</button></div> : null}
          <div className="us-chat-compose-row">
            <button type="button" className="us-chat-add" aria-label={plusOpen?"Close attachment menu":"Add photo or idea"} aria-expanded={plusOpen} title="Add photo or idea" onClick={()=>setPlusOpen(v=>!v)}>＋</button>
            <textarea aria-label="Message" rows={1} placeholder={"Message "+(state.user==="Charlie"?"Tayla":"Charlie")+"…"} value={draft.content} onChange={e=>setDraft({...draft,content:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
            <button className="us-chat-send" type="submit" aria-label="Send message" disabled={sending||(!draft.content.trim()&&!photo)}>↑</button>
          </div>
        </>}

      </form>
    </div>

    {toast ? <div className="us-toast">{toast}</div> : null}
  </main>;
}

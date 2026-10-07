"use client";
import "../us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta } from "../../../lib/usData";

export default function Memories(){
  const [state,setState]=useState({loading:true,user:null,items:[]});
  const [lightbox,setLightbox]=useState(null);

  useEffect(()=>{
    fetch("/api/us",{cache:"no-store"})
      .then(async r=>{
        if(!r.ok){setState({loading:false,user:null,items:[]});return;}
        const d=await r.json();
        setState({loading:false,user:d.user,items:d.items||[]});
      })
      .catch(()=>setState({loading:false,user:null,items:[]}));
  },[]);

  const memories=useMemo(()=>state.items
    .filter((x)=>x.status==="done")
    .sort((a,b)=>new Date(b.doneAt||b.updatedAt||0)-new Date(a.doneAt||a.updatedAt||0)),[state.items]);

  if(state.loading) return <main className="us-bg"><div className="us-shell"><div className="us-skeleton hero"/><div className="us-skeleton list"/></div></main>;
  if(!state.user) return <main className="us-bg"><div className="us-login"><div className="us-brand">US</div><h1>Just us.</h1><p>Please log in first.</p><a href="/us">Back to login</a></div></main>;

  return <main className="us-bg us-memories-bg">
    <div className="us-shell">
      <header className="us-header">
        <div><small>OUR PRIVATE SPACE</small><b>MEMORIES</b></div>
        <a className="us-back-pill" href="/us">← US</a>
      </header>

      <section className="us-memories-hero">
        <small>DONE, BUT NOT GONE</small>
        <h1>Things we’ve actually done.</h1>
        <p>{memories.length} memor{memories.length===1?"y":"ies"} so far.</p>
      </section>

      <section className="us-memory-timeline">
        {memories.map((x,i)=>{
          const images=[...(x.cover?[x.cover]:[]),...(x.gallery||[]).map(g=>g.src)];
          return <article className="us-memory-card" key={x.id}>
            <div className="us-memory-top">
              <div className={"us-polaroid "+(i%2?"tilt-r":"tilt-l")}>
                {x.cover?<button className="us-cover-view" onClick={()=>setLightbox({src:x.cover,index:0,images,title:x.title})}><img className="us-cover-img" src={x.cover} alt=""/></button>:<div className="us-photo-placeholder">{x.emoji||categoryMeta[x.category]?.emoji||"✦"}</div>}
                <small>{x.location||""}</small>
              </div>
              <div className="us-memory-copy">
                <small>{categoryMeta[x.category]?.emoji} {x.doneAt?new Date(x.doneAt).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):"Date not set"}</small>
                <h2>{x.title}</h2>
                {x.location?<p>{x.location}</p>:null}
                {x.tryAgain?<span className="us-memory-try">TRY AGAIN</span>:null}
              </div>
            </div>

            {(x.gallery||[]).length?<div className="us-memory-gallery">
              {(x.gallery||[]).slice(0,6).map((g,idx)=><button key={g.id} onClick={()=>setLightbox({src:g.src,index:(x.cover?1:0)+idx,images,title:x.title})}><img src={g.src} alt=""/></button>)}
            </div>:null}

            <div className="us-memory-feedback">
              {["Charlie","Tayla"].map(person=><div key={person}>
                <small>{person}</small>
                <b>{x.ratings?.[person]?x.ratings[person]+"/10":"—"}</b>
                {x.reviews?.[person]?<p>{x.reviews[person]}</p>:null}
              </div>)}
            </div>
          </article>
        })}
        {!memories.length?<div className="us-empty"><b>No memories yet.</b><span>Mark something Done and it’ll land here.</span></div>:null}
      </section>
    </div>

    {lightbox?<div className="us-lightbox" onClick={()=>setLightbox(null)}>
      <button className="us-lightbox-close" onClick={()=>setLightbox(null)}>×</button>
      <div className="us-lightbox-inner" onClick={e=>e.stopPropagation()}>
        <img src={lightbox.src} alt=""/>
        <div className="us-lightbox-foot"><span>{lightbox.title}</span><small>{lightbox.index+1} / {lightbox.images.length}</small></div>
        {lightbox.images.length>1?<><button className="us-lightbox-nav prev" onClick={()=>{const idx=(lightbox.index-1+lightbox.images.length)%lightbox.images.length;setLightbox({...lightbox,index:idx,src:lightbox.images[idx]})}}>‹</button><button className="us-lightbox-nav next" onClick={()=>{const idx=(lightbox.index+1)%lightbox.images.length;setLightbox({...lightbox,index:idx,src:lightbox.images[idx]})}}>›</button></>:null}
      </div>
    </div>:null}
  </main>
}

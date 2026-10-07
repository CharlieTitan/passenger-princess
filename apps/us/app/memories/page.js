"use client";
import "../us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta } from "../../lib/usData";

export default function Memories(){
  const [state,setState]=useState({loading:true,user:null,items:[]});
  const [lightbox,setLightbox]=useState(null);
  const [tab,setTab]=useState("memories");

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

  const stats=useMemo(()=>{
    const done=memories;
    const withDates=done.filter(x=>x.doneAt).sort((a,b)=>new Date(a.doneAt)-new Date(b.doneAt));
    const first=withDates[0]||done[done.length-1]||null;
    const movies=done.filter(x=>x.category==="watch"&&x.list==="films").length;
    const series=done.filter(x=>x.category==="watch"&&x.list==="series").length;
    const cooked=done.filter(x=>x.category==="eat"&&x.list==="cook-together").length;
    const restaurants=done.filter(x=>x.category==="eat"&&x.list==="restaurants").length;
    const coffee=done.filter(x=>x.category==="eat"&&["coffee","dessert"].includes(x.list)).length;
    const trips=done.filter(x=>x.category==="go").length;
    const rematches=done.filter(x=>x.list==="rematches").length;
    const mutual=state.items.filter(x=>x.favourites?.Charlie&&x.favourites?.Tayla).length;
    const photos=state.items.reduce((n,x)=>n+(x.cover?1:0)+(x.gallery||[]).length,0);
    const ratings={Charlie:[],Tayla:[]};
    done.forEach(x=>["Charlie","Tayla"].forEach(p=>{if(x.ratings?.[p])ratings[p].push(Number(x.ratings[p]));}));
    const avg=p=>ratings[p].length?(ratings[p].reduce((a,b)=>a+b,0)/ratings[p].length).toFixed(1):"—";
    const now=new Date();
    const thisMonth=done.filter(x=>{
      const d=new Date(x.doneAt||0);
      return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    }).length;
    const wins={Charlie:0,Tayla:0,Draw:0};
    done.forEach(x=>{const w=x.challenge?.winner;if(w&&wins[w]!==undefined)wins[w]++;});
    const titles={};
    done.forEach(x=>{
      const k=(x.title||"").toLowerCase().replace(/\s+/g," ").trim();
      if(k) titles[k]=(titles[k]||0)+1;
    });
    const repeatKey=Object.keys(titles).sort((a,b)=>titles[b]-titles[a])[0];
    const repeated=repeatKey&&titles[repeatKey]>1?done.find(x=>(x.title||"").toLowerCase().replace(/\s+/g," ").trim()===repeatKey):null;
    return {first,total:done.length,movies,series,cooked,restaurants,coffee,trips,rematches,mutual,photos,avgCharlie:avg("Charlie"),avgTayla:avg("Tayla"),thisMonth,wins,repeated,repeatedCount:repeatKey?titles[repeatKey]:0};
  },[memories,state.items]);

  if(state.loading) return <main className="us-bg"><div className="us-shell"><div className="us-skeleton hero"/><div className="us-skeleton list"/></div></main>;
  if(!state.user) return <main className="us-bg"><div className="us-login"><div className="us-brand">US</div><h1>Just us.</h1><p>Please log in first.</p><a href="/">Back to login</a></div></main>;

  return <main className="us-bg us-memories-bg">
    <div className="us-shell">
      <header className="us-header">
        <div><small>OUR PRIVATE SPACE</small><b>MEMORIES</b></div>
        <a className="us-back-pill" href="/">← US</a>
      </header>

      <section className="us-memories-hero">
        <small>DONE, BUT NOT GONE</small>
        <h1>Things we’ve actually done.</h1>
        <p>{memories.length} memor{memories.length===1?"y":"ies"} so far.</p>
      </section>

      <nav className="us-memory-tabs">
        <button className={tab==="memories"?"active":""} onClick={()=>setTab("memories")}>Memories</button>
        <button className={tab==="numbers"?"active":""} onClick={()=>setTab("numbers")}>Us in Numbers</button>
      </nav>

      {tab==="numbers" ? (
        <section className="us-numbers">
          <article className="us-first-date">
            <small>FIRST DATE</small>
            <h2>{stats.first?.title || "Not dated yet"}</h2>
            <p>{stats.first ? [stats.first.doneAt?new Date(stats.first.doneAt).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):null,stats.first.location].filter(Boolean).join(" · ") : "Add completion dates and it’ll appear here."}</p>
          </article>

          <div className="us-number-grid">
            {[
              [stats.total,"things done"],
              [stats.movies,"movies watched"],
              [stats.series,"series finished"],
              [stats.cooked,"meals cooked"],
              [stats.restaurants,"restaurants tried"],
              [stats.coffee,"coffee / sweet stops"],
              [stats.trips,"trips & staycations"],
              [stats.rematches,"rematches completed"],
              [stats.mutual,"mutual favourites"],
              [stats.photos,"photos captured"],
              [stats.thisMonth,"done this month"]
            ].map(([value,label])=>(
              <article className="us-number-card" key={label}><b>{value}</b><span>{label}</span></article>
            ))}
          </div>

          <article className="us-score-card">
            <small>CHALLENGE RECORD</small>
            <h2>Charlie {stats.wins.Charlie} — {stats.wins.Tayla} Tayla</h2>
            {stats.wins.Draw ? <p>{stats.wins.Draw} draw{stats.wins.Draw===1?"":"s"}</p> : <p>No draws. Serious business.</p>}
          </article>

          <div className="us-number-wide-grid">
            <article>
              <small>AVERAGE RATING</small>
              <b>Charlie {stats.avgCharlie}/10</b>
              <span>Tayla {stats.avgTayla}/10</span>
            </article>
            <article>
              <small>MOST REPEATED</small>
              <b>{stats.repeated?.title || "Nothing yet"}</b>
              <span>{stats.repeated ? stats.repeatedCount+" times" : "One-offs so far"}</span>
            </article>
          </div>
        </section>
      ) : (
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
      )}
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

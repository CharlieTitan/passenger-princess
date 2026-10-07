"use client";
import "../us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta } from "../../lib/usData";

export default function Memories(){
  const [state,setState]=useState({loading:true,user:null,items:[]});
  const [lightbox,setLightbox]=useState(null);
  const [tab,setTab]=useState("memories");
  const [memoryFilter,setMemoryFilter]=useState(null);
  const [navOpen,setNavOpen]=useState(false);

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

  const filteredMemories=useMemo(()=>{
    if(!memoryFilter) return memories;
    if(memoryFilter.type==="id") return memories.filter(x=>x.id===memoryFilter.value);
    if(memoryFilter.type==="category") return memories.filter(x=>x.category===memoryFilter.value);
    if(memoryFilter.type==="list") return memories.filter(x=>x.list===memoryFilter.value);
    if(memoryFilter.type==="lists") return memories.filter(x=>memoryFilter.value.includes(x.list));
    if(memoryFilter.type==="mutual") return memories.filter(x=>x.favourites?.Charlie&&x.favourites?.Tayla);
    if(memoryFilter.type==="photos") return memories.filter(x=>x.cover||(x.gallery||[]).length);
    if(memoryFilter.type==="month"){
      const now=new Date();
      return memories.filter(x=>{const d=new Date(x.doneAt||0);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();});
    }
    if(memoryFilter.type==="challenge") return memories.filter(x=>x.challenge?.winner||x.challenge?.charlieScore!=null||x.challenge?.taylaScore!=null);
    if(memoryFilter.type==="title") return memories.filter(x=>(x.title||"").toLowerCase().replace(/\s+/g," ").trim()===memoryFilter.value);
    return memories;
  },[memories,memoryFilter]);

  function showMemories(label,filter){
    setMemoryFilter({label,...filter});
    setTab("memories");
    setTimeout(()=>document.querySelector(".us-memory-timeline")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }

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
    <div className="us-top-strip" aria-hidden="true" />
    <div className="us-shell">
      <header className="us-header">
        <div className="us-memory-header-left">
          <button
            className="us-back-arrow"
            aria-label="Back"
            onClick={()=>{
              if(memoryFilter){setMemoryFilter(null);setTab("numbers");}
              else if(tab==="numbers") setTab("memories");
              else window.location.href="/";
            }}
          >←</button>
          <div className="us-header-brand"><small>OUR PRIVATE SPACE</small><b>{tab==="numbers"?"US IN NUMBERS":"MEMORIES"}</b></div>
        </div>
        <div className="us-header-actions">
          <button className="us-nav-toggle" aria-label="Open navigation" onClick={()=>setNavOpen(!navOpen)}>☰</button>
        </div>
        {navOpen ? (
          <div className="us-nav-menu">
            <a href="/">US</a>
            <button className={tab==="memories"?"active":""} onClick={()=>{setTab("memories");setMemoryFilter(null);setNavOpen(false);}}>Memories</button>
            <button className={tab==="numbers"?"active":""} onClick={()=>{setTab("numbers");setMemoryFilter(null);setNavOpen(false);}}>Us in Numbers</button>
          </div>
        ) : null}
      </header>

      <section className="us-memories-hero">
        <small>DONE, BUT NOT GONE</small>
        <h1>Things we’ve actually done.</h1>
        <p>{memories.length} memor{memories.length===1?"y":"ies"} so far.</p>
      </section>


      {tab==="numbers" ? (
        <section className="us-numbers">
          <button className="us-first-date" disabled={!stats.first} onClick={()=>stats.first&&showMemories("first date",{type:"id",value:stats.first.id})}>
            <small>FIRST DATE</small>
            <h2>{stats.first?.title || "Not dated yet"}</h2>
            <p>{stats.first ? [stats.first.doneAt?new Date(stats.first.doneAt).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):null,stats.first.location].filter(Boolean).join(" · ") : "Add completion dates and it’ll appear here."}</p>
            {stats.first?<span>VIEW MEMORY →</span>:null}
          </button>

          <div className="us-number-grid">
            {[
              {value:stats.total,label:"things done",filter:{type:"all"}},
              {value:stats.movies,label:"movies watched",filter:{type:"list",value:"films"}},
              {value:stats.series,label:"series finished",filter:{type:"list",value:"series"}},
              {value:stats.cooked,label:"meals cooked",filter:{type:"list",value:"cook-together"}},
              {value:stats.restaurants,label:"restaurants tried",filter:{type:"list",value:"restaurants"}},
              {value:stats.coffee,label:"coffee / sweet stops",filter:{type:"lists",value:["coffee","dessert"]}},
              {value:stats.trips,label:"trips & staycations",filter:{type:"category",value:"go"}},
              {value:stats.rematches,label:"rematches completed",filter:{type:"list",value:"rematches"}},
              {value:stats.mutual,label:"mutual favourites",filter:{type:"mutual"}},
              {value:stats.photos,label:"photos captured",filter:{type:"photos"}},
              {value:stats.thisMonth,label:"done this month",filter:{type:"month"}}
            ].map((stat)=>(
              <button
                className={"us-number-card"+(!stat.value?" empty":"")}
                key={stat.label}
                disabled={!stat.value}
                onClick={()=>showMemories(stat.label,stat.filter.type==="all"?{type:null}:stat.filter)}
              >
                <b>{stat.value}</b><span>{stat.label}</span>{stat.value?<small>VIEW →</small>:null}
              </button>
            ))}
          </div>

          <button className="us-score-card" disabled={!(stats.wins.Charlie+stats.wins.Tayla+stats.wins.Draw)} onClick={()=>showMemories("challenge results",{type:"challenge"})}>
            <small>CHALLENGE RECORD</small>
            <h2>Charlie {stats.wins.Charlie} — {stats.wins.Tayla} Tayla</h2>
            {stats.wins.Draw ? <p>{stats.wins.Draw} draw{stats.wins.Draw===1?"":"s"}</p> : <p>No draws. Serious business.</p>}
            {(stats.wins.Charlie+stats.wins.Tayla+stats.wins.Draw)>0?<span>VIEW RESULTS →</span>:null}
          </button>

          <div className="us-number-wide-grid">
            <article className="us-number-wide-static">
              <small>AVERAGE RATING</small>
              <b>Charlie {stats.avgCharlie}/10</b>
              <span>Tayla {stats.avgTayla}/10</span>
            </article>
            <button disabled={!stats.repeated} onClick={()=>stats.repeated&&showMemories("most repeated",{type:"title",value:(stats.repeated.title||"").toLowerCase().replace(/\s+/g," ").trim()})}>
              <small>MOST REPEATED</small>
              <b>{stats.repeated?.title || "Nothing yet"}</b>
              <span>{stats.repeated ? stats.repeatedCount+" times · VIEW →" : "One-offs so far"}</span>
            </button>
          </div>
        </section>
      ) : (
      <section className="us-memory-timeline">
        {memoryFilter ? <div className="us-memory-filter"><span>Showing: <b>{memoryFilter.label}</b></span><button onClick={()=>setMemoryFilter(null)}>Show all</button></div> : null}
        {filteredMemories.map((x,i)=>{
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
        {!filteredMemories.length?<div className="us-empty"><b>No memories here yet.</b><span>{memoryFilter?"Try another stat or show all.":"Mark something Done and it’ll land here."}</span></div>:null}
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

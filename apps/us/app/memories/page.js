"use client";
import "../us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta } from "../../lib/usData";

export default function Memories(){
  const [state,setState]=useState({loading:true,user:null,items:[],inbox:[]});
  const [lightbox,setLightbox]=useState(null);
  const touchStartX=useRef(null);
  const [expandedMemoryId,setExpandedMemoryId]=useState(null);
  const [tab,setTab]=useState("memories");
  const [memoryFilter,setMemoryFilter]=useState(null);
  const [navOpen,setNavOpen]=useState(false);
  const [galleryCategory,setGalleryCategory]=useState("all");
  const [galleryMonth,setGalleryMonth]=useState(null);
  const [uploadItemId,setUploadItemId]=useState("");
  const [uploadBusy,setUploadBusy]=useState(false);
  const [uploadSearch,setUploadSearch]=useState("");
  const [uploadSelectorOpen,setUploadSelectorOpen]=useState(false);
  const [galleryReturn,setGalleryReturn]=useState(null);
  const nowForMonth=new Date();
  const [recapMonth,setRecapMonth]=useState(nowForMonth.getFullYear()+"-"+String(nowForMonth.getMonth()+1).padStart(2,"0"));

  async function doLogout(){
    await fetch("/api/us-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"logout"})});
    window.location.href="/";
  }

  useEffect(()=>{
    fetch("/api/us",{cache:"no-store"})
      .then(async r=>{
        if(!r.ok){setState({loading:false,user:null,items:[],inbox:[]});return;}
        const d=await r.json();
        setState({loading:false,user:d.user,items:d.items||[],inbox:d.inbox||[]});
      })
      .catch(()=>setState({loading:false,user:null,items:[],inbox:[]}));
  },[]);

  const unreadInbox=(state.inbox||[]).filter(x=>x.to===state.user&&!x.readAt).length;

  const memories=useMemo(()=>state.items
    .filter((x)=>x.status==="done")
    .sort((a,b)=>new Date(b.doneAt||b.updatedAt||0)-new Date(a.doneAt||a.updatedAt||0)),[state.items]);

  const galleryPhotos=useMemo(()=>state.items
    .filter(x=>!x.isSurprise)
    .flatMap(item=>{
      const photos=[];
      const seen=new Set();
      const add=(src,id,date,who)=>{
        if(!src||seen.has(src))return;
        seen.add(src);
        photos.push({id,src,item,date:item.doneAt||date||item.updatedAt||item.createdAt||null,who});
      };
      add(item.cover,item.id+":cover",item.updatedAt,null);
      (item.gallery||[]).forEach((g,i)=>add(g.src,item.id+":"+(g.id||i),g.at,g.addedBy||null));
      return photos;
    })
    .sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)),[state.items]);

  const visibleGallery=useMemo(()=>galleryPhotos.filter(photo=>{
    if(galleryCategory!=="all" && photo.item.category!==galleryCategory)return false;
    if(galleryMonth){
      const d=new Date(photo.item.doneAt||photo.date||0);
      if(Number.isNaN(d.getTime()))return false;
      const ym=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
      return ym===galleryMonth;
    }
    return true;
  }),[galleryPhotos,galleryCategory,galleryMonth]);

  const galleryStacks=useMemo(()=>{
    const groups=new Map();
    visibleGallery.forEach(photo=>{
      const id=photo.item.id;
      if(!groups.has(id))groups.set(id,{item:photo.item,photos:[]});
      groups.get(id).photos.push(photo);
    });
    return Array.from(groups.values()).map(group=>{
      const cover=group.photos.find(photo=>photo.src===group.item.cover);
      const photos=cover?[cover,...group.photos.filter(photo=>photo!==cover)]:group.photos;
      return {...group,photos};
    });
  },[visibleGallery]);

  function returnToGallery(){
    if(!galleryReturn)return;
    setGalleryCategory(galleryReturn.category);
    setGalleryMonth(galleryReturn.month);
    setMemoryFilter(null);
    setTab("gallery");
    setGalleryReturn(null);
  }

  function openGallery(month=null){
    setGalleryReturn(null);
    setGalleryCategory("all");
    setGalleryMonth(month);
    setTab("gallery");
  }

  async function uploadGallery(input,targetItemId=uploadItemId){
    const files=(Array.isArray(input)?input:[input]).filter(file=>file&&file.type.startsWith("image/"));
    if(!files.length||!targetItemId||uploadBusy)return;
    setUploadBusy(true);
    try{
      const item=state.items.find(x=>x.id===targetItemId);
      if(!item||item.isSurprise)throw Error("Invalid item");
      const photos=[];
      for(const file of files){
        const image=await new Promise((resolve,reject)=>{
          const reader=new FileReader();
          reader.onload=()=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=reader.result;};
          reader.onerror=reject;reader.readAsDataURL(file);
        });
        const canvas=document.createElement("canvas");
        const ratio=Math.min(1,1000/Math.max(image.width,image.height));
        canvas.width=Math.round(image.width*ratio);
        canvas.height=Math.round(image.height*ratio);
        canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
        photos.push({id:crypto.randomUUID(),src:canvas.toDataURL("image/jpeg",0.78),addedBy:state.user,at:new Date().toISOString()});
      }
      const response=await fetch("/api/us",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:item.id,gallery:[...(item.gallery||[]),...photos]})});
      if(!response.ok)throw Error("Upload failed");
      const result=await response.json();
      setState(s=>({...s,items:s.items.map(x=>x.id===item.id?result.item:x)}));
    }catch(e){alert("Couldn’t add those photos. Please try again.");}
    finally{setUploadBusy(false);}
  }

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
    if(tab==="gallery")setGalleryReturn({category:galleryCategory,month:galleryMonth});
    else setGalleryReturn(null);
    setMemoryFilter({label,...filter});
    setTab("memories");
    if(filter.type==="id")setExpandedMemoryId(filter.value);
    setTimeout(()=>document.querySelector(".us-memory-timeline")?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }

  const monthlyRecap=useMemo(()=>{
    const [year,month]=recapMonth.split("-").map(Number);
    const monthItems=memories.filter(x=>{
      const d=new Date(x.doneAt||0);
      return d.getFullYear()===year&&d.getMonth()===month-1;
    });
    const photos=monthItems.reduce((n,x)=>n+(x.cover?1:0)+(x.gallery||[]).length,0);
    const counts={eat:0,watch:0,go:0,do:0};
    monthItems.forEach(x=>{if(counts[x.category]!==undefined)counts[x.category]++;});
    const favourites=monthItems.filter(x=>x.favourites?.Charlie&&x.favourites?.Tayla);
    const ratings=[];
    monthItems.forEach(x=>["Charlie","Tayla"].forEach(p=>{if(x.ratings?.[p])ratings.push(Number(x.ratings[p]));}));
    const average=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):null;
    const wins={Charlie:0,Tayla:0,Draw:0};
    monthItems.forEach(x=>{const w=x.challenge?.winner;if(w&&wins[w]!==undefined)wins[w]++;});
    const featured=favourites[0]||monthItems.find(x=>x.cover||(x.gallery||[]).length)||monthItems[0]||null;
    const label=new Date(year,month-1,1).toLocaleDateString(undefined,{month:"long",year:"numeric"});
    return {items:monthItems,photos,counts,favourites,average,wins,featured,label};
  },[memories,recapMonth]);

  function shiftRecapMonth(delta){
    const [year,month]=recapMonth.split("-").map(Number);
    const d=new Date(year,month-1+delta,1);
    setRecapMonth(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));
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
    <header className="us-appbar">
      <div className="us-appbar-inner">
        <div className="us-memory-header-left">
          <button
            className="us-back-arrow"
            aria-label="Back"
            onClick={()=>{
              if(memoryFilter){if(galleryReturn)returnToGallery();else{setMemoryFilter(null);setTab("numbers");}}
              else if(tab==="numbers"||tab==="recap"||tab==="gallery") setTab("memories");
              else window.location.href="/";
            }}
          >←</button>
          <div className="us-appbar-brand">Memories</div>
        </div>
        <button className="us-nav-toggle" aria-label="Open navigation" onClick={()=>setNavOpen(!navOpen)}>
          ☰
          {unreadInbox ? <span className="us-nav-badge">{unreadInbox}</span> : null}
        </button>
        {navOpen ? (
          <div className="us-nav-drawer">
            <div className="us-nav-links">
              <a href="/">US</a>
              <a href="/inbox"><span>Inbox</span>{unreadInbox ? <span className="us-menu-badge">{unreadInbox}</span> : null}</a>
              <button className="active" onClick={()=>{setTab("memories");setMemoryFilter(null);setNavOpen(false);}}>Memories</button>
            </div>
            <div className="us-nav-bottom">
              <button className="us-nav-logout" onClick={doLogout}>Log out</button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
    <div className="us-top-strip" aria-hidden="true" />
    <div className="us-shell">

      <section className="us-memories-hero">
        <small>{tab==="gallery"?"OUR SCRAPBOOK":"DONE, BUT NOT GONE"}</small>
        <h1>{tab==="gallery"?"The little things.":"Things we’ve actually done."}</h1>
        <p>{tab==="gallery"?galleryPhotos.length+" photo"+(galleryPhotos.length===1?"":"s")+" collected.":memories.length+" memor"+(memories.length===1?"y":"ies")+" so far."}</p>
      </section>

      <nav className="us-memory-tabs">
        <button className={tab==="memories"?"active":""} onClick={()=>{setTab("memories");setMemoryFilter(null);setGalleryReturn(null);}}>Memories</button>
        <button className={tab==="numbers"?"active":""} onClick={()=>{setTab("numbers");setMemoryFilter(null);setGalleryReturn(null);}}>Us in Numbers</button>
        <button className={tab==="recap"?"active":""} onClick={()=>{setTab("recap");setMemoryFilter(null);setGalleryReturn(null);}}>Monthly Recap</button>
        <button className={tab==="gallery"?"active":""} onClick={()=>openGallery()}>Gallery</button>
      </nav>


      {tab==="gallery" ? (
        <section className="us-gallery-hub">
          <div className="us-gallery-title">
            <div><small>OUR PHOTOS</small><h2>Little moments.</h2></div>
            <span>{visibleGallery.length} photo{visibleGallery.length===1?"":"s"}</span>
          </div>
          {galleryMonth?<div className="us-gallery-month"><span>{new Date(galleryMonth+"-01T12:00:00").toLocaleDateString(undefined,{month:"long",year:"numeric"})}</span><button onClick={()=>setGalleryMonth(null)}>All months ×</button></div>:null}
          <div className="us-gallery-tabs">
            {[["all","All"],...Object.entries(categoryMeta).map(([key,value])=>[key,value.emoji+" "+value.label])].map(([key,label])=>
              <button key={key} className={galleryCategory===key?"active":""} onClick={()=>setGalleryCategory(key)}>{label}</button>
            )}
          </div>
          <div className="us-gallery-collection">
            {galleryStacks.map((stack,index)=>{
              const first=stack.photos[0];
              const images=stack.photos.map(photo=>photo.src);
              return <button key={stack.item.id} className={"us-gallery-polaroid us-gallery-stack"+(images.length>1?" has-multiple":"")} style={{"--stack-jiggle-delay":((index*7)%13)+"s"}} onClick={()=>setLightbox({src:first.src,index:0,images,title:stack.item.title,caption:[stack.item.location,first.date?new Date(first.date).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):null].filter(Boolean).join(" · "),itemId:stack.item.id})} aria-label={"View "+stack.item.title+", "+images.length+" photo"+(images.length===1?"":"s")}>
                {images.length>1?<span className="us-stack-papers" aria-hidden="true"><span/><span/></span>:null}
                <span className="us-gallery-stack-front">
                  <span className="us-gallery-polaroid-image"><img src={first.src} alt=""/></span>
                  <span className="us-gallery-polaroid-title">{stack.item.title}</span>
                  <span className="us-gallery-polaroid-note">{stack.item.doneAt?new Date(stack.item.doneAt).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}):stack.item.location||categoryMeta[stack.item.category]?.label}</span>
                  {images.length>1?<span className="us-stack-count">{images.length} photos ↗</span>:null}
                </span>
              </button>;
            })}

          </div>
          {!visibleGallery.length?<div className="us-recap-empty"><b>No photos here yet.</b><span>Photos added to your activities will appear here.</span></div>:null}
          <div className="us-gallery-upload">
            <h3>Add a photo</h3>
            <p>Choose an activity so the photo stays with its memory.</p>
            <button className="us-gallery-activity-trigger" onClick={()=>setUploadSelectorOpen(v=>!v)}>
              {uploadItemId ? state.items.find(x=>x.id===uploadItemId)?.title||"Choose an activity" : "Choose an activity"} <span>⌄</span>
            </button>
            {uploadSelectorOpen ? <div className="us-gallery-activity-options">
              <input aria-label="Search activities" placeholder="Search our activities…" value={uploadSearch} onChange={e=>setUploadSearch(e.target.value)}/>
              <div className="us-gallery-activity-results">
                {state.items.filter(x=>!x.isSurprise&&x.status!=="archived"&&x.title.toLowerCase().includes(uploadSearch.trim().toLowerCase()))
                  .sort((a,b)=>a.title.localeCompare(b.title))
                  .map(x=><button key={x.id} onClick={()=>{setUploadItemId(x.id);setUploadSelectorOpen(false);setUploadSearch("");}}>
                    <span className="us-gallery-activity-thumb">{x.cover?<img src={x.cover} alt=""/>:x.emoji||categoryMeta[x.category]?.emoji||"✦"}</span>
                    <span>{x.title}<small>{categoryMeta[x.category]?.label||""}</small></span>
                    {uploadItemId===x.id?"✓":""}
                  </button>)}
              </div>
            </div>:null}
            <label className={uploadItemId&&!uploadBusy?"enabled":""}>+ Add photo<input type="file" accept="image/*" disabled={!uploadItemId||uploadBusy} onChange={async e=>{await uploadGallery(e.target.files?.[0]);e.target.value="";}}/></label>
          </div>
        </section>
      ) : tab==="recap" ? (
        <section className="us-monthly-recap">
          <div className="us-recap-nav">
            <button onClick={()=>shiftRecapMonth(-1)}>←</button>
            <div><small>MONTHLY RECAP</small><h2>{monthlyRecap.label}</h2></div>
            <button
              onClick={()=>shiftRecapMonth(1)}
              disabled={recapMonth===nowForMonth.getFullYear()+"-"+String(nowForMonth.getMonth()+1).padStart(2,"0")}
            >→</button>
          </div>

          {monthlyRecap.featured ? (
            <button className="us-recap-feature" onClick={()=>showMemories(monthlyRecap.label,{type:"month"})}>
              <div className="us-recap-feature-media">
                {monthlyRecap.featured.cover ? <img src={monthlyRecap.featured.cover} alt=""/> : <span>{monthlyRecap.featured.emoji||categoryMeta[monthlyRecap.featured.category]?.emoji||"✦"}</span>}
              </div>
              <div>
                <small>{monthlyRecap.favourites.includes(monthlyRecap.featured)?"MUTUAL FAVOURITE":"A MEMORY FROM THIS MONTH"}</small>
                <h3>{monthlyRecap.featured.title}</h3>
                <p>{monthlyRecap.featured.location||"Tap to see this month’s memories"}</p>
              </div>
            </button>
          ) : <div className="us-recap-empty"><b>Nothing completed this month yet.</b><span>Once something is Done, it’ll show up here.</span></div>}

          <div className="us-recap-grid">
            <button onClick={()=>showMemories(monthlyRecap.label,{type:"month"})} disabled={!monthlyRecap.items.length}><b>{monthlyRecap.items.length}</b><span>things done</span></button>
            <button onClick={()=>openGallery(recapMonth)} disabled={!monthlyRecap.photos}><b>{monthlyRecap.photos}</b><span>photos · VIEW →</span></button>
            <article><b>{monthlyRecap.average||"—"}</b><span>avg rating</span></article>
            <article><b>{monthlyRecap.favourites.length}</b><span>mutual favourites</span></article>
          </div>

          <div className="us-recap-breakdown">
            {Object.entries(monthlyRecap.counts).map(([key,value])=>(
              <button key={key} disabled={!value} onClick={()=>showMemories(monthlyRecap.label+" · "+categoryMeta[key].label,{type:"category",value:key})}>
                <span>{categoryMeta[key].emoji}</span><b>{value}</b><small>{categoryMeta[key].label}</small>
              </button>
            ))}
          </div>

          {(monthlyRecap.wins.Charlie+monthlyRecap.wins.Tayla+monthlyRecap.wins.Draw)>0 ? (
            <article className="us-recap-challenge">
              <small>CHALLENGE RECORD THIS MONTH</small>
              <h3>Charlie {monthlyRecap.wins.Charlie} — {monthlyRecap.wins.Tayla} Tayla</h3>
              {monthlyRecap.wins.Draw ? <p>{monthlyRecap.wins.Draw} draw{monthlyRecap.wins.Draw===1?"":"s"}</p> : null}
            </article>
          ) : null}
        </section>
      ) : tab==="numbers" ? (
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
        {galleryReturn&&memoryFilter?<button className="us-gallery-return" onClick={returnToGallery}>← Back to Gallery{galleryReturn.month?" · "+new Date(galleryReturn.month+"-01T12:00:00").toLocaleDateString(undefined,{month:"long",year:"numeric"}):""}</button>:null}
        {memoryFilter ? <div className="us-memory-filter"><span>Showing: <b>{memoryFilter.label}</b></span><button onClick={()=>{setMemoryFilter(null);setGalleryReturn(null);}}>Show all</button></div> : null}
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
                <h2><button className="us-memory-open" aria-expanded={expandedMemoryId===x.id} onClick={()=>setExpandedMemoryId(v=>v===x.id?null:x.id)}>{x.title} <span>{expandedMemoryId===x.id?"−":"↗"}</span></button></h2>
                {x.location?<p>{x.location}</p>:null}
                {x.tryAgain?<span className="us-memory-try">TRY AGAIN</span>:null}
              </div>
            </div>

            <button className="us-memory-details-trigger" aria-expanded={expandedMemoryId===x.id} onClick={()=>setExpandedMemoryId(v=>v===x.id?null:x.id)}>{expandedMemoryId===x.id?"Close memory details ↑":"Open memory & photos →"}</button>
            {expandedMemoryId===x.id?<section className="us-memory-expanded" aria-label={x.title+" photo gallery"}>
              <div className="us-memory-expanded-head"><div><small>OUR PHOTOS</small><h3>{x.title}</h3><p>{images.length} photo{images.length===1?"":"s"} in this memory</p></div></div>
              <div className="us-memory-expanded-photos">
                {images.map((src,idx)=><button key={idx} onClick={()=>setLightbox({src,index:idx,images,title:x.title,itemId:x.id})}><img src={src} alt={x.title+" photo "+(idx+1)}/></button>)}
              </div>
              <label className={"us-memory-add-photo"+(uploadBusy?" busy":"")}>＋ {uploadBusy?"Adding photo…":"Add photos"}
                <input type="file" accept="image/*" multiple disabled={uploadBusy} onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value="";await uploadGallery(files,x.id);}}/>
              </label>
            </section>:null}

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
      <div className="us-lightbox-inner" onClick={e=>e.stopPropagation()} onTouchStart={e=>{touchStartX.current=e.touches[0]?.clientX??null;}} onTouchEnd={e=>{if(touchStartX.current===null||lightbox.images.length<2)return;const delta=(e.changedTouches[0]?.clientX??touchStartX.current)-touchStartX.current;touchStartX.current=null;if(Math.abs(delta)<45)return;const idx=(lightbox.index+(delta<0?1:-1)+lightbox.images.length)%lightbox.images.length;setLightbox({...lightbox,index:idx,src:lightbox.images[idx]});}}>
        <img src={lightbox.src} alt=""/>
        <div className="us-lightbox-foot"><span>{lightbox.title}{lightbox.caption?<><small>{lightbox.caption}</small></>:null}</span><small>{lightbox.index+1} / {lightbox.images.length}</small></div>
        {lightbox.itemId?<button className="us-gallery-view-memory" onClick={()=>{setLightbox(null);showMemories("gallery memory",{type:"id",value:lightbox.itemId});}}>View memory →</button>:null}
        {lightbox.images.length>1?<><button className="us-lightbox-nav prev" onClick={()=>{const idx=(lightbox.index-1+lightbox.images.length)%lightbox.images.length;setLightbox({...lightbox,index:idx,src:lightbox.images[idx]})}}>‹</button><button className="us-lightbox-nav next" onClick={()=>{const idx=(lightbox.index+1)%lightbox.images.length;setLightbox({...lightbox,index:idx,src:lightbox.images[idx]})}}>›</button></>:null}
      </div>
    </div>:null}
  </main>
}

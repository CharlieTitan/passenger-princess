"use client";
import { useEffect, useState } from "react";

export default function UsAdmin(){
  const [state,setState]=useState("loading");
  const [user,setUser]=useState(null);

  useEffect(()=>{
    fetch("/api/us",{cache:"no-store"})
      .then(async r=>{
        if(!r.ok){ setState("forbidden"); return; }
        const d=await r.json();
        setUser(d.user);
        setState(d.user==="Charlie"?"ok":"forbidden");
      })
      .catch(()=>setState("forbidden"));
  },[]);

  if(state==="loading"){
    return <main style={{minHeight:"100svh",display:"grid",placeItems:"center",background:"#f4efe9",color:"#2d2729",fontFamily:"system-ui"}}>Checking access…</main>;
  }

  if(state==="forbidden"){
    return <main style={{minHeight:"100svh",display:"grid",placeItems:"center",background:"#f4efe9",color:"#2d2729",fontFamily:"system-ui",padding:24}}><div style={{textAlign:"center"}}><h1 style={{fontFamily:"Georgia,serif"}}>Not available.</h1><p style={{color:"#85767a"}}>This page is only available to Charlie.</p><a href="/us" style={{color:"#66575c"}}>Back to us</a></div></main>;
  }

  return (
    <main style={{minHeight:"100svh",background:"#f4efe9",padding:"36px 18px",color:"#2d2729",fontFamily:"system-ui"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <small style={{letterSpacing:2,color:"#9a8d90"}}>HIDDEN MAINTENANCE</small>
        <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"10px 0 8px"}}>US admin</h1>
        <p style={{color:"#7e7074",marginTop:0}}>Signed in as {user}. This page is intentionally not linked anywhere in the normal app.</p>

        <div style={{background:"#fff",border:"1px solid #e5dddd",borderRadius:18,padding:18,marginTop:22}}>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:22,marginTop:0}}>Account maintenance</h2>
          <p style={{color:"#7e7074",fontSize:14}}>Password recovery is available from the login screen. Active device/session controls are the next admin item to wire here.</p>
        </div>

        <div style={{marginTop:20}}>
          <a href="/us" style={{color:"#66575c"}}>← Back to us</a>
        </div>
      </div>
    </main>
  );
}

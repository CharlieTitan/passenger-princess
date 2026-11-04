"use client";
import {useEffect} from "react";
export default function PwaRegistration(){
  useEffect(()=>{
    if(!("serviceWorker" in navigator))return;
    let active=true;
    const update=()=>navigator.serviceWorker.getRegistration("/").then(r=>r?.update()).catch(()=>{});
    navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(r=>{if(active)r.update().catch(()=>{});}).catch(()=>{});
    window.addEventListener("online",update);
    return ()=>{active=false;window.removeEventListener("online",update);};
  },[]);
  return null;
}

"use client";
import {useCallback,useEffect,useRef} from "react";
import {createSyncGuard} from "../../lib/syncGuard.mjs";

const guard=createSyncGuard();
const requests=new Set();
let sessionGeneration=0;
export async function sharedFetch(input,options={}) {
  const url=typeof input==="string"?input:input.url;
  const isShared=/^\/api\/us(?:[/?]|$)/.test(url);
  if(!isShared)return globalThis.fetch(input,options);
  const controller=new AbortController();
  requests.add(controller);
  const signal=options.signal?AbortSignal.any([options.signal,controller.signal]):controller.signal;
  const end=(options.method||"GET").toUpperCase()==="GET"?()=>{}:guard.beginMutation();
  const version=sessionGeneration;
  let responseReady=false;
  try{
    const networkResponse=await globalThis.fetch(input,{...options,cache:"no-store",signal});
    // Buffer before releasing the mutation guard so body I/O cannot race a background read.
    const bytes=await networkResponse.arrayBuffer();
    if(version!==sessionGeneration)throw new DOMException("Session changed","AbortError");
    const response=new Response(bytes,{status:networkResponse.status,statusText:networkResponse.statusText,headers:networkResponse.headers});
    const readJson=response.json.bind(response);
    response.json=async()=>{
      try{
        const data=await readJson();
        if(version!==sessionGeneration)throw new DOMException("Session changed","AbortError");
        return data;
      }finally{end();}
    };
    responseReady=true;
    // Callers which only inspect .ok do not consume JSON. Their synchronous updates
    // finish before this task, while JSON consumers release the guard explicitly.
    setTimeout(end,0);
    return response;
  }finally{if(!responseReady)end();requests.delete(controller);}

}

// A read made before a write, logout, newer read, or route change cannot replace current state.
export function useSharedSync({user,onData,onExpired}) {
  const callbacks=useRef({onData,onExpired});
  callbacks.current={onData,onExpired};
  const generation=useRef(0);
  const mounted=useRef(true);
  const inFlight=useRef(null);
  const reset=useCallback(()=>{
    generation.current++;sessionGeneration++;guard.reset();inFlight.current=null;
    for(const request of requests)request.abort();
    requests.clear();
  },[]);
  const refresh=useCallback(async()=>{
    if(guard.busy()||inFlight.current)return null;
    const ticket=guard.beginRead(),version=generation.current;
    inFlight.current=ticket;
    try{
      const response=await sharedFetch("/api/us");
      if(!mounted.current||version!==generation.current||!guard.accepts(ticket))return null;
      if(response.status===401){reset();callbacks.current.onExpired();return null;}
      if(!response.ok)throw Error("Shared refresh failed");
      const data=await response.json();
      if(!mounted.current||version!==generation.current||!guard.accepts(ticket))return null;
      callbacks.current.onData(data);return data;
    }catch(error){return null;}
    finally{if(inFlight.current===ticket)inFlight.current=null;}
  },[reset]);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;reset();};},[reset]);
  useEffect(()=>{
    if(!user)return;
    const reconnect=()=>{if(!document.hidden&&navigator.onLine!==false)refresh();};
    const timer=setInterval(reconnect,3000);
    window.addEventListener("focus",reconnect);
    window.addEventListener("online",reconnect);
    document.addEventListener("visibilitychange",reconnect);
    return ()=>{clearInterval(timer);window.removeEventListener("focus",reconnect);window.removeEventListener("online",reconnect);document.removeEventListener("visibilitychange",reconnect);};
  },[user,refresh]);
  return {refresh,reset};
}

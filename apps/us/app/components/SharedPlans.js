"use client";
import {useState} from "react";
import {sharedFetch as fetch} from "./useSharedSync";

export function recurrenceLabel(value) {
  if (!value || value === "none") return "";
  if (typeof value === "string") return ({weekly:"Weekly",monthly:"Monthly",yearly:"Yearly","every-2-weeks":"Every 2 weeks"})[value] || value;
  const unit={weekly:"week",monthly:"month",yearly:"year"}[value.frequency];
  return unit ? `Every ${value.interval || 1} ${unit}${Number(value.interval || 1)===1?"":"s"}` : "";
}
export function RecurrenceFields({value,onChange}) {
  const frequency=typeof value==="object" ? value.frequency : value==="every-2-weeks"?"weekly":value||"none";
  const interval=typeof value==="object" ? value.interval : value==="every-2-weeks"?2:1;
  return <div className="us-repeat-fields"><label>Repeat<select value={frequency} onChange={e=>onChange(e.target.value==="none"?"none":{frequency:e.target.value,interval:1})}><option value="none">Doesn’t repeat</option><option value="weekly">Weeks</option><option value="monthly">Months</option><option value="yearly">Years</option></select></label>{frequency!=="none"?<label>Every<input aria-label="Repeat interval" type="number" min="1" max="52" required value={interval} onChange={e=>onChange({frequency,interval:e.target.value===""?"":Number(e.target.value)})}/><small>{frequency==="weekly"?"weeks":frequency==="monthly"?"months":"years"}</small></label>:null}<small>Mark this plan Done to create the next date. Your completed memory stays here.</small></div>;
}

async function request(method,body) {
  const response=await fetch("/api/us",{method,headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Couldn’t save. Please try again.");
  return data;
}

export function PackingChecklist({item,onItem}) {
  const [text,setText]=useState("");
  const [editing,setEditing]=useState(null);
  const [editText,setEditText]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const entries=item.checklist||[];
  async function save(action,fields={}) {
    setBusy(true);setError("");
    try{const data=await request("PATCH",{action,id:item.id,...fields});onItem(data.item);if(action==="addChecklistEntry")setText("");setEditing(null);}catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <section className="us-shared-plans us-packing"><div className="us-shared-heading"><div><small>PACK TOGETHER</small><h3>Trip checklist</h3></div><span>{entries.filter(e=>e.done).length} / {entries.length}</span></div>{entries.length?<ul>{entries.map(entry=><li key={entry.id}>{editing===entry.id?<form onSubmit={e=>{e.preventDefault();save("updateChecklistEntry",{entryId:entry.id,text:editText.trim()});}}><input aria-label="Edit packing item" maxLength={200} required value={editText} onChange={e=>setEditText(e.target.value)}/><button disabled={busy||!editText.trim()}>Save</button><button type="button" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button></form>:<><label><input type="checkbox" checked={!!entry.done} disabled={busy} onChange={e=>save("updateChecklistEntry",{entryId:entry.id,done:e.target.checked})}/><span className={entry.done?"is-packed":""}>{entry.text}</span></label><button type="button" disabled={busy} onClick={()=>{setEditing(entry.id);setEditText(entry.text);}}>Edit</button><button type="button" disabled={busy} aria-label={"Remove "+entry.text} onClick={()=>save("removeChecklistEntry",{entryId:entry.id})}>Remove</button></>}</li>)}</ul>:<p>What do we need to bring?</p>}<form onSubmit={e=>{e.preventDefault();save("addChecklistEntry",{text:text.trim()});}}><input aria-label="New packing item" placeholder="Add something to pack…" maxLength={200} required value={text} onChange={e=>setText(e.target.value)}/><button disabled={busy||!text.trim()}>Add</button></form>{error?<p className="us-shared-error" role="alert">{error}</p>:null}</section>;
}

const emptyGoal={title:"",target:1,progress:0,itemIds:[]};
export function SharedGoals({goals,items,onGoals}) {
  const [form,setForm]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const visibleItems=items.filter(item=>!item.isSurprise);
  async function save(e){e.preventDefault();setBusy(true);setError("");try{const data=await request(form.id?"PATCH":"POST",{...form,action:form.id?"updateGoal":"createGoal",target:Number(form.target),progress:Number(form.progress)});onGoals(current=>form.id?current.map(g=>g.id===data.goal.id?data.goal:g):[...current,data.goal]);setForm(null);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function remove(goal){if(!window.confirm(`Delete goal “${goal.title}”?`))return;setBusy(true);setError("");try{await request("DELETE",{type:"goal",id:goal.id});onGoals(current=>current.filter(g=>g.id!==goal.id));if(form?.id===goal.id)setForm(null);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section className="us-shared-plans us-goals" id="us-goals"><div className="us-shared-heading"><div><small>SOMETHING TO AIM FOR</small><h2>Our goals</h2></div><button disabled={busy} onClick={()=>{setForm({...emptyGoal});setError("");}}>+ New goal</button></div>{goals.length?<div className="us-goal-list">{goals.map(goal=>{const progress=Number(goal.progress||0)+(goal.itemIds||[]).filter(id=>items.some(item=>item.id===id&&item.status==="done"&&!item.isSurprise)).length;return <article key={goal.id}><h3>{goal.title}</h3><p>{progress} / {goal.target}{progress>=goal.target?" · We did it!":""}</p><progress max={goal.target} value={Math.min(goal.target,progress)} aria-label={goal.title+" progress"}/><div><button disabled={busy} onClick={()=>{setForm({...goal,itemIds:goal.itemIds||[]});setError("");}}>Edit progress</button><button disabled={busy} onClick={()=>remove(goal)}>Delete</button></div></article>;})}</div>:<p>Save a small ambition for the two of us.</p>}{form?<form className="us-goal-form" onSubmit={save}><h3>{form.id?"Edit goal":"A new goal"}</h3><label>Goal<input required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><div className="us-plan-grid"><label>Target<input type="number" required min="1" max="100000" step="1" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></label><label>Progress added by us<input type="number" required min="0" max="100000" step="1" value={form.progress} onChange={e=>setForm({...form,progress:e.target.value})}/></label></div><fieldset><legend>Count these shared items when Done</legend><p>Each linked item adds one. Add any earlier progress above.</p>{visibleItems.length?<div className="us-goal-links">{visibleItems.map(item=><label key={item.id}><input type="checkbox" checked={form.itemIds.includes(item.id)} onChange={e=>setForm({...form,itemIds:e.target.checked?[...form.itemIds,item.id]:form.itemIds.filter(id=>id!==item.id)})}/><span>{item.title}{item.status==="done"?" ✓":""}</span></label>)}</div>:<p>No shared items yet.</p>}</fieldset><div className="us-shared-actions"><button disabled={busy||!form.title.trim()}>{busy?"Saving…":"Save goal"}</button><button type="button" disabled={busy} onClick={()=>setForm(null)}>Cancel</button></div></form>:null}{error?<p className="us-shared-error" role="alert">{error}</p>:null}</section>;
}

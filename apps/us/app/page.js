"use client";
import "./us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta, quickShortcuts, mealTypes } from "../lib/usData";

const quickReactions=["❤️","😂","👀","👍"];

const quickAddMeta={
  eat:{label:"Eat",emoji:"🍝",subLabel:"What kind of eat?",subOptions:[["restaurants","Restaurant"],["coffee","Coffee"],["dessert","Dessert"],["cook-together","Cook together"],["drinks","Drinks"]]},
  watch:{label:"Watch",emoji:"🎬",subLabel:"What are we watching?",subOptions:[["films","Film"],["series","Series"],["rewatch","Rewatch"]]},
  go:{label:"Go",emoji:"✈️",subLabel:"What kind of trip?",subOptions:[["holidays","Holiday"],["staycations","Staycation"],["day-trips","Day trip"],["revisit","Revisit"]]},
  do:{label:"Do",emoji:"🎳",subLabel:"What kind of plan?",subOptions:[["date-ideas","Date idea"],["weekend","Weekend"],["challenges","Challenge"],["rematches","Rematch"],["bucket","Bucket list"]]}
};

export default function Us() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [polls, setPolls] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState({ username: "Charlie", password: "" });
  const [category, setCategory] = useState("eat");
  const [sublist, setSublist] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  const [shortcut, setShortcut] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [quick, setQuick] = useState(false);
  const [quickMore, setQuickMore] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any", location:"", priority:"normal", budget:"", duration:"", tagsText:"", notes:"", isSurprise:false, surpriseDate:"", surpriseTime:"", surpriseDressCode:"", surpriseMeetMode:"meet", surprisePickupTime:"", surpriseLocation:"", surpriseTeaser:"", surpriseNote:"", surpriseRevealPreset:"start", surpriseRevealCustom:"" });
  const [wheel, setWheel] = useState(false);
  const [wheelPick, setWheelPick] = useState(null);
  const [pickerMode, setPickerMode] = useState(null);
  const [pickerFilters, setPickerFilters] = useState({category:"any",effort:"any",duration:"any",timeHorizon:"any"});
  const [pendingIds, setPendingIds] = useState({});
  const [toast, setToast] = useState("");
  const [editValues, setEditValues] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [recovering, setRecovering] = useState(false);
  const [recovery, setRecovery] = useState({ recoveryCode: "", newPassword: "" });
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [newListOpen, setNewListOpen] = useState(false);
  const [newList, setNewList] = useState({ name:"", emoji:"✨" });
  const [editingList, setEditingList] = useState(null);
  const [planningItem, setPlanningItem] = useState(null);
  const [planDraft, setPlanDraft] = useState({ date:"", time:"", location:"", bookingUrl:"", notes:"", recurrence:"none", reminderPreset:"none" });
  const [pollOpen, setPollOpen] = useState(false);
  const [pollDraft, setPollDraft] = useState({ question:"", options:[{label:"",itemId:null},{label:"",itemId:null}] });
  const [challengeItem, setChallengeItem] = useState(null);
  const [challengeDraft, setChallengeDraft] = useState({scoring:"winner",stakes:"",winner:"",charlieScore:"",taylaScore:"",outcome:""});
  const [navOpen,setNavOpen]=useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/us", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setUser(d.user);
      setItems(d.items);
      setActivity(d.activity);
      setPolls(d.polls || []);
      setCustomLists(d.customLists || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doLogout() {
    await fetch("/api/us-auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setUser(null);
    setItems([]);
    setActivity([]);
    setPolls([]);
    setCustomLists([]);
    setLogin({ username: "Charlie", password: "" });
  }

  async function doRecover() {
    setRecoveryMessage("");
    const r = await fetch("/api/us-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "recover", username: login.username, recoveryCode: recovery.recoveryCode, newPassword: recovery.newPassword })
    });
    if (r.ok) {
      setRecoveryMessage("Password updated. You can log in now.");
      setLogin({ ...login, password: "" });
      setRecovery({ recoveryCode: "", newPassword: "" });
    } else {
      setRecoveryMessage("That recovery code did not work.");
    }
  }

  async function doLogin() {
    const r = await fetch("/api/us-auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "login", ...login })
    });
    if (r.ok) load();
    else alert("Wrong password");
  }

  async function add() {
    if (!draft.title.trim()) return;
    const r = await fetch("/api/us", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...draft, tags: draft.tagsText ? draft.tagsText.split(",").map((x)=>x.trim()).filter(Boolean) : [] })
    });
    if (r.ok) {
      setQuick(false);
      setQuickMore(false);
      setDraft({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any", location:"", priority:"normal", budget:"", duration:"", tagsText:"", notes:"", isSurprise:false, surpriseDate:"", surpriseTime:"", surpriseDressCode:"", surpriseMeetMode:"meet", surprisePickupTime:"", surpriseLocation:"", surpriseTeaser:"", surpriseNote:"", surpriseRevealPreset:"start", surpriseRevealCustom:"" });
      load();
    }
  }

  async function deleteItem(item) {
    const ok = window.confirm("Delete “" + item.title + "” permanently? Archive is safer if you might want it later.");
    if (!ok) return;
    setPendingIds((s)=>({...s,[item.id]:true}));
    const previous=items;
    setItems((current)=>current.filter((x)=>x.id!==item.id));
    try {
      const r=await fetch("/api/us",{
        method:"DELETE",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({id:item.id})
      });
      if(!r.ok) throw new Error("Delete failed");
      setToast("Deleted");
      setTimeout(()=>setToast(""),1600);
    } catch(e) {
      setItems(previous);
      setToast("Couldn’t delete that");
      setTimeout(()=>setToast(""),2200);
    } finally {
      setPendingIds((s)=>({...s,[item.id]:false}));
    }
  }

  async function patch(item, changes, successMessage = "Saved") {
    const previous = items;
    setPendingIds((s) => ({ ...s, [item.id]: true }));
    setItems((current) => current.map((x) => x.id === item.id ? { ...x, ...changes, updatedBy: user } : x));
    try {
      const r = await fetch("/api/us", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id, ...changes })
      });
      if (!r.ok) throw new Error("Save failed");
      const d = await r.json();
      setItems((current) => current.map((x) => x.id === item.id ? d.item : x));
      setToast(successMessage);
      setTimeout(() => setToast(""), 1600);
      return true;
    } catch (e) {
      setItems(previous);
      setToast("Couldn’t save that");
      setTimeout(() => setToast(""), 2200);
      return false;
    } finally {
      setPendingIds((s) => ({ ...s, [item.id]: false }));
    }
  }

  function editValue(item, field) {
    const key = item.id + ":" + field;
    return editValues[key] !== undefined ? editValues[key] : (item[field] || "");
  }

  function setEditValue(item, field, value) {
    const key = item.id + ":" + field;
    setEditValues((s) => ({ ...s, [key]: value }));
  }

  async function saveTextField(item, field, message) {
    const key = item.id + ":" + field;
    if (editValues[key] === undefined || editValues[key] === (item[field] || "")) return;
    const value = editValues[key];
    const ok = await patch(item, { [field]: value }, message);
    if (ok) setEditValues((s) => { const n = { ...s }; delete n[key]; return n; });
  }


  function listsForCategory(cat) {
    const defaults = categoryMeta[cat].sublists.map(([value,label,emoji]) => ({ id:value, label, emoji, custom:false }));
    const extras = customLists.filter((x) => x.category === cat).map((x) => ({ id:x.id, label:x.name, emoji:x.emoji || "✨", custom:true }));
    return [...defaults, ...extras];
  }

  async function createCustomList() {
    const name = newList.name.trim();
    if (!name) return;
    const r = await fetch("/api/us", {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({ action:"createList", category, name, emoji:newList.emoji || "✨" })
    });
    if (!r.ok) {
      setToast("Couldn’t create that list");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    const d = await r.json();
    setCustomLists((x)=>[...x,d.list]);
    setSublist(d.list.id);
    setNewList({name:"",emoji:"✨"});
    setNewListOpen(false);
    setToast("List created ✓");
    setTimeout(()=>setToast(""),1600);
  }


  async function updateCustomList() {
    if (!editingList || !editingList.name.trim()) return;
    const r = await fetch("/api/us", {
      method:"PATCH",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({ action:"updateList", id:editingList.id, name:editingList.name.trim(), emoji:editingList.emoji || "✨" })
    });
    if (!r.ok) {
      setToast("Couldn’t update that list");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    const d = await r.json();
    setCustomLists((current)=>current.map((list)=>list.id===d.list.id?d.list:list));
    setEditingList(null);
    setToast("List updated ✓");
    setTimeout(()=>setToast(""),1600);
  }

  function itemListLabel(item) {
    return listsForCategory(item.category).find((list) => list.id === item.list)?.label || item.list || "";
  }

  function itemSecondary(item) {
    const parts = [];
    const listLabel = itemListLabel(item);
    if (listLabel) parts.push(listLabel);
    if (item.category === "eat" && item.mealType && item.mealType !== "any") {
      const meal = mealTypes.find(([value]) => value === item.mealType)?.[1];
      if (meal) parts.push(meal);
    }
    if (item.location && !item.title.toLowerCase().includes(item.location.toLowerCase())) parts.push(item.location);
    return parts.join(" · ");
  }

  async function compressImageFile(file) {
    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      setToast("Pick an image file");
      setTimeout(()=>setToast(""),1600);
      return null;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const max = 1000;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  }

  async function handleCoverUpload(item, file) {
    const compressed = await compressImageFile(file);
    if (!compressed) return;
    await patch(item, { cover: compressed }, "Photo added ✓");
  }

  async function handleGalleryUpload(item, files) {
    const selected = Array.from(files || []).slice(0, 6);
    if (!selected.length) return;
    const additions=[];
    for (const file of selected) {
      const compressed=await compressImageFile(file);
      if (compressed) additions.push({id:(globalThis.crypto?.randomUUID?.()||String(Date.now()+additions.length)),src:compressed,addedBy:user,at:new Date().toISOString()});
    }
    if (!additions.length) return;
    await patch(item,{gallery:[...(item.gallery||[]),...additions]},"Gallery updated ✓");
  }

  async function removeGalleryPhoto(item, photoId) {
    const gallery=(item.gallery||[]).filter((photo)=>photo.id!==photoId);
    await patch(item,{gallery},"Photo removed");
  }


  function openPlan(item) {
    setPlanningItem(item);
    setPlanDraft({
      date:item.planDate || "",
      time:item.planTime || "",
      location:item.location || "",
      bookingUrl:item.bookingUrl || "",
      notes:item.planNotes || "",
      recurrence:item.recurrence || "none",
      reminderPreset:item.reminderPreset || "none"
    });
  }

  async function savePlan() {
    if (!planningItem || !planDraft.date) {
      setToast("Pick a date first");
      setTimeout(()=>setToast(""),1600);
      return;
    }
    const ok = await patch(planningItem, {
      status:"planned",
      planDate:planDraft.date,
      planTime:planDraft.time || "",
      location:planDraft.location || planningItem.location || "",
      bookingUrl:planDraft.bookingUrl || "",
      planNotes:planDraft.notes || "",
      recurrence:planDraft.recurrence || "none",
      reminderPreset:planDraft.reminderPreset || "none"
    }, "Plan locked in ✓");
    if (ok) {
      setPlanningItem(null);
      setPlanDraft({ date:"", time:"", location:"", bookingUrl:"", notes:"", recurrence:"none", reminderPreset:"none" });
    }
  }

  function googleCalendarUrl(item) {
    if (!item.planDate) return "#";
    const start=(item.planDate.replaceAll("-",""))+"T"+((item.planTime||"1900").replace(":","")+"00");
    let end=start;
    try {
      const d=new Date(item.planDate+"T"+(item.planTime||"19:00"));
      d.setHours(d.getHours()+2);
      const pad=(n)=>String(n).padStart(2,"0");
      end=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+"T"+pad(d.getHours())+pad(d.getMinutes())+"00";
    } catch {}
    const params=new URLSearchParams({
      action:"TEMPLATE",
      text:item.title,
      dates:start+"/"+end,
      details:item.planNotes||"",
      location:item.location||""
    });
    return "https://calendar.google.com/calendar/render?"+params.toString();
  }

  function plannedTimestamp(item) {
    if (!item.planDate) return Number.POSITIVE_INFINITY;
    const time=item.planTime || "23:59";
    const ts=new Date(item.planDate+"T"+time).getTime();
    return Number.isNaN(ts)?Number.POSITIVE_INFINITY:ts;
  }

  function favouriteState(item) {
    const favs = item.favourites || { Charlie:false, Tayla:false };
    return {
      mine: !!favs[user],
      mutual: !!favs.Charlie && !!favs.Tayla,
      favs
    };
  }

  async function toggleFavourite(item) {
    const state = favouriteState(item);
    const favourites = { ...state.favs, [user]: !state.mine };
    await patch(
      item,
      { favourites },
      favourites.Charlie && favourites.Tayla ? "Mutual favourite ❤️" : (!state.mine ? "Favourited ❤️" : "Favourite removed")
    );
  }

  async function addComment(item) {
    const text=(commentDrafts[item.id] || "").trim();
    if(!text) return;
    const comment={
      id:(globalThis.crypto?.randomUUID?.() || String(Date.now())),
      user,
      text,
      at:new Date().toISOString()
    };
    const comments=[...(item.comments || []),comment];
    const ok=await patch(item,{comments},"Comment added");
    if(ok) setCommentDrafts((s)=>({...s,[item.id]:""}));
  }

  async function deleteComment(item, commentId) {
    const comments=(item.comments || []).filter((c)=>c.id!==commentId);
    await patch(item,{comments},"Comment removed");
  }

  async function toggleItemReaction(item, emoji) {
    const current=item.reactions || {};
    const users=Array.isArray(current[emoji]) ? current[emoji] : [];
    const nextUsers=users.includes(user) ? users.filter((u)=>u!==user) : [...users,user];
    const reactions={...current,[emoji]:nextUsers};
    await patch(item,{reactions},"Reaction updated");
  }

  async function toggleCommentReaction(item, commentId, emoji) {
    const comments=(item.comments || []).map((comment)=>{
      if(comment.id!==commentId) return comment;
      const current=comment.reactions || {};
      const users=Array.isArray(current[emoji]) ? current[emoji] : [];
      const nextUsers=users.includes(user) ? users.filter((u)=>u!==user) : [...users,user];
      return {...comment,reactions:{...current,[emoji]:nextUsers}};
    });
    await patch(item,{comments},"Reaction updated");
  }

  async function createPoll() {
    const question=pollDraft.question.trim();
    const options=pollDraft.options.map((x)=>({label:(x.label||"").trim(),itemId:x.itemId||null})).filter((x)=>x.label);
    if(!question || options.length<2) return;
    const r=await fetch("/api/us",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"createPoll",question,options})
    });
    if(!r.ok){
      setToast("Couldn’t create poll");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    const d=await r.json();
    setPolls((current)=>[d.poll,...current]);
    setPollOpen(false);
    setPollDraft({question:"",options:[{label:"",itemId:null},{label:"",itemId:null}]});
    setToast("Poll created ✓");
    setTimeout(()=>setToast(""),1600);
  }

  async function votePoll(poll, optionId) {
    const r=await fetch("/api/us",{
      method:"PATCH",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"votePoll",id:poll.id,optionId})
    });
    if(!r.ok){
      setToast("Couldn’t save vote");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    const d=await r.json();
    setPolls((current)=>current.map((x)=>x.id===d.poll.id?d.poll:x));
    setToast("Vote saved ✓");
    setTimeout(()=>setToast(""),1400);
  }

  async function deletePoll(poll) {
    if (!window.confirm("Delete this poll?")) return;
    const previous=polls;
    setPolls((current)=>current.filter((x)=>x.id!==poll.id));
    const r=await fetch("/api/us",{
      method:"DELETE",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({type:"poll",id:poll.id})
    });
    if(!r.ok){
      setPolls(previous);
      setToast("Couldn’t delete poll");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    setToast("Poll deleted");
    setTimeout(()=>setToast(""),1400);
  }

  function openChallenge(item) {
    const c=item.challenge || {};
    setChallengeItem(item);
    setChallengeDraft({
      scoring:c.scoring || "winner",
      stakes:c.stakes || "",
      winner:c.winner || "",
      charlieScore:c.charlieScore ?? "",
      taylaScore:c.taylaScore ?? "",
      outcome:c.outcome || ""
    });
  }

  async function saveChallenge() {
    if(!challengeItem) return;
    const previous=challengeItem.challenge || {};
    const challenge={
      ...previous,
      scoring:challengeDraft.scoring,
      stakes:challengeDraft.stakes.trim(),
      winner:challengeDraft.winner || null,
      charlieScore:challengeDraft.charlieScore === "" ? null : challengeDraft.charlieScore,
      taylaScore:challengeDraft.taylaScore === "" ? null : challengeDraft.taylaScore,
      outcome:challengeDraft.outcome.trim(),
      resultAt:(challengeDraft.winner || challengeDraft.charlieScore !== "" || challengeDraft.taylaScore !== "" || challengeDraft.outcome.trim()) ? (previous.resultAt || new Date().toISOString()) : null,
      seriesId: previous.seriesId || challengeItem.repeatOf || challengeItem.id
    };
    const ok=await patch(challengeItem,{challenge,list:challengeItem.list==="date-ideas"?"challenges":challengeItem.list},"Challenge saved 🏆");
    if(ok) setChallengeItem(null);
  }

  async function removeChallenge(item) {
    await patch(item,{challenge:null},"Challenge removed");
  }

  async function rematchChallenge(item) {
    const c=item.challenge || {};
    const r=await fetch("/api/us",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({
        title:item.title,
        category:"do",
        list:"rematches",
        status:"idea",
        effort:item.effort || "normal",
        timeHorizon:"soon",
        priority:item.priority || "normal",
        budget:item.budget || "",
        duration:item.duration || "",
        location:item.location || "",
        tags:item.tags || [],
        notes:item.notes || "",
        emoji:item.emoji || null,
        repeatOf:item.id,
        challenge:{
          scoring:c.scoring || "winner",
          stakes:c.stakes || "",
          winner:null,
          charlieScore:null,
          taylaScore:null,
          outcome:"",
          resultAt:null,
          rematchOf:item.id,
          seriesId:c.seriesId || item.repeatOf || item.id
        }
      })
    });
    if(!r.ok){
      setToast("Couldn’t create rematch");
      setTimeout(()=>setToast(""),1800);
      return;
    }
    const d=await r.json();
    setItems((current)=>[...current,d.item]);
    setToast("Rematch added 🏆");
    setTimeout(()=>setToast(""),1600);
  }

  function challengeSeries(item) {
    const explicit=item.challenge?.seriesId;
    const rootId=explicit || item.repeatOf || item.challenge?.rematchOf || item.id;
    const normalTitle=(value="")=>value.toLowerCase().replace(/\s+/g," ").trim();

    const related=items.filter((candidate)=>{
      if(!candidate.challenge) return false;
      const candidateRoot=candidate.challenge.seriesId || candidate.repeatOf || candidate.challenge?.rematchOf || candidate.id;
      if(candidateRoot===rootId || candidate.id===rootId) return true;

      // Legacy challenge/rematch items created before seriesId was introduced.
      const legacyPair =
        ["challenges","rematches"].includes(item.list) &&
        ["challenges","rematches"].includes(candidate.list) &&
        normalTitle(candidate.title)===normalTitle(item.title);
      return legacyPair;
    });

    if(item.challenge && !related.some((x)=>x.id===item.id)) related.push(item);

    const wins={Charlie:0,Tayla:0,Draw:0};
    related.forEach((round)=>{
      const winner=round.challenge?.winner;
      if(winner && wins[winner]!==undefined) wins[winner]+=1;
    });

    const completed=related
      .filter((round)=>round.challenge?.winner || round.challenge?.charlieScore!=null || round.challenge?.taylaScore!=null || round.challenge?.score!=null)
      .sort((a,b)=>new Date(a.challenge?.resultAt || a.doneAt || a.createdAt || 0)-new Date(b.challenge?.resultAt || b.doneAt || b.createdAt || 0));

    return {wins,completed,rounds:related.length};
  }

  function pollResult(poll){
    const votes=poll.votes||{};
    const both=!!votes.Charlie && !!votes.Tayla;
    if(!both) return null;
    const counts={};
    for(const id of Object.values(votes)) counts[id]=(counts[id]||0)+1;
    const max=Math.max(...Object.values(counts));
    const winners=(poll.options||[]).filter((o)=>(counts[o.id]||0)===max);
    return {tie:winners.length>1,winners,counts};
  }

  async function planPollWinner(poll, winner) {
    if (!winner) return;
    let item = winner.itemId ? items.find((x)=>x.id===winner.itemId) : null;

    // Keep completed memories intact: repeats become a fresh plan rather than rewriting history.
    if (!item || item.status === "done") {
      const source=item;
      const r=await fetch("/api/us",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          title:winner.label,
          category:source?.category || "do",
          list:source?.list || "date-ideas",
          effort:source?.effort || "normal",
          timeHorizon:"soon",
          mealType:source?.mealType,
          location:source?.location || "",
          priority:source?.priority || "normal",
          budget:source?.budget || "",
          duration:source?.duration || "",
          tags:source?.tags || [],
          notes:source?.notes || "",
          emoji:source?.emoji || null,
          repeatOf:source?.id || null
        })
      });
      if(!r.ok){
        setToast("Couldn’t turn that into a plan");
        setTimeout(()=>setToast(""),1800);
        return;
      }
      const d=await r.json();
      item=d.item;
      setItems((current)=>[...current,item]);
    }

    openPlan(item);
  }

  const filtered = useMemo(() => {
    return items.filter((x) => {
      if (shortcut === "Planned" && x.status !== "planned") return false;
      if (shortcut === "Try Again" && !x.tryAgain) return false;
      if (shortcut === "Surprises" && !x.isSurprise) return false;
      if (!shortcut && x.category !== category) return false;
      if (!shortcut && lifecycleFilter === "all" && x.status === "archived") return false;
      if (!shortcut && sublist !== "all" && x.list !== sublist) return false;
      if (!shortcut && lifecycleFilter === "favourites") {
        const favs = x.favourites || {};
        if (!(favs.Charlie || favs.Tayla)) return false;
      } else if (!shortcut && lifecycleFilter !== "all") {
        const status = x.status === "maybe" ? "idea" : x.status;
        if (status !== lifecycleFilter) return false;
      }
      if (query && !x.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, category, sublist, lifecycleFilter, shortcut, query]);

  function eligibleForPicker(item, mode) {
    if (item.status === "done" || item.status === "archived") return false;
    if (pickerFilters.category !== "any" && item.category !== pickerFilters.category) return false;
    if (pickerFilters.effort !== "any" && item.effort !== pickerFilters.effort) return false;
    if (pickerFilters.duration !== "any" && item.duration !== pickerFilters.duration) return false;
    if (pickerFilters.timeHorizon !== "any" && item.timeHorizon !== pickerFilters.timeHorizon) return false;
    if (mode === "tonight") {
      if (item.timeHorizon === "someday") return false;
      if (item.effort === "big") return false;
    }
    return true;
  }

  function openPicker(mode) {
    setShortcut("");
    setSublist("all");
    setPickerMode(mode);
    setWheelPick(null);
    setPickerFilters(
      mode === "tonight"
        ? { category:"any", effort:"any", duration:"any", timeHorizon:"any" }
        : { category:"any", effort:"any", duration:"any", timeHorizon:"any" }
    );
    setTimeout(() => {
      document.querySelector(".us-picker-panel")?.scrollIntoView({ behavior:"smooth", block:"start" });
    }, 0);
  }

  function spin(mode = pickerMode) {
    const pool = items.filter((x) => eligibleForPicker(x, mode));
    if (!pool.length) {
      setToast("Nothing matches those filters");
      setTimeout(() => setToast(""), 1800);
      return;
    }
    setWheel(true);
    setWheelPick(null);
    setTimeout(() => {
      setWheelPick(pool[Math.floor(Math.random() * pool.length)]);
      setWheel(false);
    }, 1100);
  }

  if (loading && !user) {
    return (
      <main className="us-bg">
        <div className="us-shell">
          <div className="us-skeleton hero" />
          <div className="us-skeleton grid" />
          <div className="us-skeleton list" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="us-bg">
        <div className="us-login">
          <div className="us-brand">US</div>
          <h1>Just us.</h1>
          <label className="us-login-label">Name</label>
          <div className="us-user-switch">
            <button
              className={login.username === "Charlie" ? "active" : ""}
              onClick={() => setLogin({ ...login, username: "Charlie" })}
            >
              Charlie
            </button>
            <button
              className={login.username === "Tayla" ? "active" : ""}
              onClick={() => setLogin({ ...login, username: "Tayla" })}
            >
              Tayla
            </button>
          </div>
          <input
            type="password"
            placeholder="Password"
            value={login.password}
            onChange={(e) => setLogin({ ...login, password: e.target.value })}
          />
          {login.username === "Tayla" ? <p className="us-login-hint">Hint: your Instagram handle 👀</p> : null}
          <button className="us-primary" onClick={doLogin}>ENTER →</button>
          <button className="us-forgot" onClick={() => { setRecovering(!recovering); setRecoveryMessage(""); }}>
            {recovering ? "Back to login" : "Forgot password?"}
          </button>
          {recovering ? (
            <div className="us-recovery">
              <small>RECOVER {login.username.toUpperCase()}</small>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Recovery code"
                value={recovery.recoveryCode}
                onChange={(e) => setRecovery({ ...recovery, recoveryCode: e.target.value })}
              />
              <input
                type="password"
                placeholder="New password"
                value={recovery.newPassword}
                onChange={(e) => setRecovery({ ...recovery, newPassword: e.target.value })}
              />
              <button className="us-primary" disabled={!recovery.recoveryCode || recovery.newPassword.length < 4} onClick={doRecover}>
                RESET PASSWORD
              </button>
              {recoveryMessage ? <p className="us-recovery-message">{recoveryMessage}</p> : null}
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  const planned = items.filter((x) => x.status === "planned").sort((a,b)=>plannedTimestamp(a)-plannedTimestamp(b));
  const tonight = items.filter((x) => x.status !== "done" && x.status !== "archived" && x.timeHorizon === "tonight");
  const soon = items.filter((x) => x.status !== "done" && x.status !== "archived" && x.timeHorizon === "soon");

  return (
    <main className={"us-bg theme-" + category}>
      <div className="us-top-strip" aria-hidden="true" />
      <div className="us-shell">
        <header className="us-header">
          <div className="us-header-brand"><small>OUR PRIVATE SPACE</small><b>US</b></div>
          <div className="us-header-actions">
            <button className="us-nav-toggle" aria-label="Open navigation" onClick={()=>setNavOpen(!navOpen)}>☰</button>
            <button className="us-logout" onClick={doLogout}>Log out</button>
            <button onClick={() => setQuick(true)}>＋</button>
          </div>
          {navOpen ? (
            <div className="us-nav-menu">
              <button className="active" onClick={()=>setNavOpen(false)}>US</button>
              <a href="/memories">Memories</a>
            </div>
          ) : null}
        </header>

        <section className="us-hero">
          <span>{greet}, {user}</span>
          <h1>What are we doing next?</h1>
          <div className="us-now">
            <small>{planned[0] ? "NEXT UP" : "NOW"}</small>
            <b>{planned[0] ? planned[0].title : "Nothing on."}</b>
            <p>
              {planned[0]
                ? [planned[0].planDate, planned[0].planTime].filter(Boolean).join(" · ") || "Planned — add a date when you know it."
                : "Pick something and make a plan."}
            </p>
            {!planned[0] ? (
              <button className="us-now-cta" onClick={()=>openPicker("pick")}>PICK SOMETHING →</button>
            ) : null}
          </div>
        </section>

        <section className="us-polls">
          <div className="us-polls-head">
            <div>
              <small>POLL IT</small>
              <h2>Can’t decide?</h2>
            </div>
            <button onClick={()=>setPollOpen(true)}>+ New poll</button>
          </div>

          {polls.length ? (
            <div className="us-poll-list">
              {polls.slice(0,3).map((poll)=>{
                const result=pollResult(poll);
                const myVote=poll.votes?.[user];
                return (
                  <article className="us-poll-card" key={poll.id}>
                    <div className="us-poll-title-row">
                      <h3>{poll.question}</h3>
                      <div className="us-poll-meta">
                        <small>{poll.createdBy}</small>
                        <button className="us-poll-delete" onClick={()=>deletePoll(poll)}>Delete</button>
                      </div>
                    </div>
                    <div className="us-poll-options">
                      {(poll.options||[]).map((option)=>(
                        <button
                          key={option.id}
                          className={myVote===option.id?"active":""}
                          onClick={()=>votePoll(poll,option.id)}
                        >
                          <span>{option.label}</span>
                          {result ? <small>{result.counts[option.id]||0}</small> : null}
                        </button>
                      ))}
                    </div>
                    <div className="us-poll-status">
                      {result ? (
                        result.tie
                          ? <span>Tie. Very helpful 😂</span>
                          : <span className="us-poll-winner">Winner: <b>{result.winners[0]?.label}</b><button onClick={()=>planPollWinner(poll,result.winners[0])}>PLAN IT →</button></span>
                      ) : (
                        <span>{myVote ? "Your vote is in. Waiting for the other one." : "Vote once. You can change it until both have voted."}</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="us-poll-empty">Film? Restaurant? Date? Make it democratic.</div>
          )}
        </section>


        <section className="us-cats">
          {Object.entries(categoryMeta).map(([k, v]) => (
            <button key={k} className={category === k && !shortcut ? "active" : ""} onClick={() => { setCategory(k); setSublist("all"); setLifecycleFilter("all"); setShortcut(""); setPickerMode(null); setWheelPick(null); }}>
              <span>{v.emoji}</span><b>{v.label}</b><small>{items.filter((x) => x.category === k).length} items</small>
            </button>
          ))}
        </section>

        {!shortcut ? (
          <section className="us-sublists" aria-label={categoryMeta[category].label + " lists"}>
            <button className={sublist==="all"?"active":""} onClick={()=>setSublist("all")}>
              <span>All</span>
              <small>{items.filter((x)=>x.category===category).length}</small>
            </button>
            {listsForCategory(category).map((list) => (
              <div key={list.id} className={"us-sublist-wrap"+(sublist===list.id?" active":"")}>
                <button className="us-sublist-main" onClick={()=>setSublist(list.id)}>
                  <span>{list.emoji} {list.label}</span>
                  <small>{items.filter((x)=>x.category===category && x.list===list.id).length}</small>
                </button>
                {list.custom ? (
                  <button
                    className="us-sublist-edit"
                    aria-label={"Edit "+list.label}
                    onClick={()=>setEditingList({id:list.id,name:list.label,emoji:list.emoji,category})}
                  >
                    ···
                  </button>
                ) : null}
              </div>
            ))}
            <button className="us-new-list-btn" onClick={()=>setNewListOpen(true)}>
              <span>＋ New list</span>
            </button>
          </section>
        ) : null}

        {!shortcut ? (
          <section className="us-lifecycle-filter" aria-label="Item status">
            {[["all","All"],["idea","Ideas"],["planned","Planned"],["done","Done"],["archived","Archived"]].map(([value,label]) => (
              <button
                key={value}
                className={lifecycleFilter===value?"active":""}
                onClick={()=>setLifecycleFilter(value)}
              >
                {label}
                <small>
                  {value==="all"
                    ? items.filter((x)=>x.category===category && x.status!=="archived" && (sublist==="all" || x.list===sublist)).length
                    : items.filter((x)=>{
                        const status=x.status==="maybe"?"idea":x.status;
                        return x.category===category && (sublist==="all" || x.list===sublist) && status===value;
                      }).length}
                </small>
              </button>
            ))}
          </section>
        ) : null}

        {!shortcut ? (
          <section className="us-favourite-filter">
            <button
              className={lifecycleFilter==="favourites"?"active":""}
              onClick={()=>setLifecycleFilter(lifecycleFilter==="favourites"?"all":"favourites")}
            >
              ♥ Favourites
            </button>
          </section>
        ) : null}

        <section className="us-shortcuts">
          {quickShortcuts.map((s) => (
            <button
              key={s}
              className={shortcut === s ? "active" : ""}
              onClick={() => {
                if (s === "Pick for us") { openPicker("pick"); setShortcut(""); }
                else if (s === "Tonight") { openPicker("tonight"); setShortcut(""); }
                else if (s === "Quick add") { setPickerMode(null); setWheelPick(null); setQuick(true); }
                else if (s === "Recent activity") {
                  setPickerMode(null); setWheelPick(null); setShortcut("");
                  setTimeout(() => document.querySelector(".us-activity")?.scrollIntoView({behavior:"smooth",block:"start"}), 0);
                }
                else {
                  setPickerMode(null); setWheelPick(null);
                  setSublist("all");
                  setLifecycleFilter("all");
                  setShortcut(shortcut === s ? "" : s);
                }
              }}
            >
              {s}
            </button>
          ))}
        </section>

                {pickerMode ? (
          <section className="us-picker-panel">
            <div className="us-picker-head">
              <div>
                <small>{pickerMode === "tonight" ? "TONIGHT" : "PICK FOR US"}</small>
                <h2>{pickerMode === "tonight" ? "What kind of night is it?" : "Narrow it down or leave it open."}</h2>
              </div>
              <button className="us-picker-close" onClick={() => { setPickerMode(null); setWheelPick(null); }}>×</button>
            </div>

            <div className="us-picker-group">
              <span>Category</span>
              <div className="us-picker-chips">
                {[["any","Anything"],["eat","Eat"],["watch","Watch"],["go","Go"],["do","Do"]].map(([v,l]) => (
                  <button key={v} className={pickerFilters.category===v?"active":""} onClick={() => setPickerFilters({...pickerFilters,category:v})}>{l}</button>
                ))}
              </div>
            </div>

            <div className="us-picker-group">
              <span>Effort</span>
              <div className="us-picker-chips">
                {[["any","Any"],["low","Low effort"],["normal","Normal"],["big","Big plan"]].map(([v,l]) => (
                  <button key={v} className={pickerFilters.effort===v?"active":""} onClick={() => setPickerFilters({...pickerFilters,effort:v})}>{l}</button>
                ))}
              </div>
            </div>

            <div className="us-picker-row">
              <label>Duration
                <select value={pickerFilters.duration} onChange={(e)=>setPickerFilters({...pickerFilters,duration:e.target.value})}>
                  <option value="any">Any</option>
                  <option value="30m">30 mins</option>
                  <option value="1-2h">1–2 hours</option>
                  <option value="half-day">Half day</option>
                  <option value="full-day">Full day</option>
                  <option value="overnight">Overnight / Trip</option>
                </select>
              </label>
              <label>When
                <select value={pickerFilters.timeHorizon} onChange={(e)=>setPickerFilters({...pickerFilters,timeHorizon:e.target.value})}>
                  <option value="any">Any</option>
                  <option value="tonight">Tonight</option>
                  <option value="soon">Soon</option>
                  <option value="someday">Someday</option>
                </select>
              </label>
            </div>

            <div className="us-picker-count">
              {items.filter((x)=>eligibleForPicker(x,pickerMode)).length} option{items.filter((x)=>eligibleForPicker(x,pickerMode)).length===1?"":"s"} match
            </div>

            <button className="us-primary us-picker-go" onClick={()=>spin()}>
              {pickerMode === "tonight" ? "PICK TONIGHT →" : "SPIN FOR US →"}
            </button>

            {wheel ? <div className="us-wheel-inline"><span />Picking…</div> : null}
            {wheelPick ? (
              <div className="us-picker-result-inline">
                <small>HOW ABOUT</small>
                <h3>{wheelPick.title}</h3>
                <p>{wheelPick.category ? categoryMeta[wheelPick.category]?.label : ""}{wheelPick.effort ? " · "+wheelPick.effort : ""}</p>
                <div>
                  <button className="us-primary" onClick={()=>openPlan(wheelPick)}>LOCK IT IN</button>
                  <button className="us-secondary" onClick={()=>spin()}>PICK AGAIN</button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {shortcut === "Surprises" ? (
          <section className="us-surprise-head">
            <div>
              <small>SURPRISES</small>
              <h2>Keep something up your sleeve.</h2>
              <p>Plan it here. Tayla only sees the safe teaser until you reveal it.</p>
            </div>
            <button
              className="us-primary"
              onClick={() => {
                setDraft({ title:"", category:"do", list:"date-ideas", effort:"normal", timeHorizon:"soon", mealType:undefined, location:"", priority:"normal", budget:"", duration:"", tagsText:"", notes:"", isSurprise:true, surpriseDate:"", surpriseTime:"", surpriseDressCode:"", surpriseMeetMode:"meet", surprisePickupTime:"", surpriseLocation:"", surpriseTeaser:"", surpriseNote:"", surpriseRevealPreset:"start", surpriseRevealCustom:"" });
                setQuick(true);
              }}
            >
              + NEW SURPRISE
            </button>
          </section>
        ) : null}

        {shortcut !== "Surprises" ? <section className="us-toolbar">
          <input placeholder="Search our lists…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => setQuick(true)}>Quick add</button>
        </section> : null}

        <section className="us-list">
          {filtered.map((x, i) => (
            <article className={"us-card status-" + x.status + (x.cover ? " has-photo" : " no-photo")} key={x.id} onClick={() => setOpen(open === x.id ? null : x.id)}>
              <div className={"us-polaroid " + (i % 2 ? "tilt-r" : "tilt-l")}>
                {x.cover ? (
                  <button className="us-cover-view" onClick={(e)=>{e.stopPropagation();setLightbox({src:x.cover,title:x.title,index:0,images:[x.cover,...(x.gallery||[]).map((g)=>g.src)]});}}><img className="us-cover-img" src={x.cover} alt="" /></button>
                ) : (
                  <div className="us-photo-placeholder">{x.emoji || categoryMeta[x.category]?.emoji || "✦"}</div>
                )}
                <small>{x.location || itemListLabel(x)}</small>
              </div>

              <div className="us-card-summary">
                <div className="us-card-top">
                  <small>{categoryMeta[x.category]?.emoji} {(x.status === "maybe" ? "IDEA" : x.status.toUpperCase())} · {x.effort}</small>
                  <div className="us-card-badges">
                    {x.tryAgain ? <span>TRY AGAIN</span> : null}
                    {favouriteState(x).mutual ? <span className="us-mutual-badge">MUTUAL FAVOURITE</span> : null}
                    <button
                      className={"us-heart"+(favouriteState(x).mine?" active":"")}
                      aria-label={favouriteState(x).mine ? "Remove favourite" : "Add favourite"}
                      onClick={(e)=>{e.stopPropagation();toggleFavourite(x);}}
                    >
                      {favouriteState(x).mine ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
                <h3>{x.title}</h3>
                {x.isSurprise && x.surprise?.teaser ? <p className="us-surprise-teaser">👀 ${x.surprise.teaser}</p> : null}
                {itemSecondary(x) ? <p className="us-card-subtitle">{itemSecondary(x)}</p> : null}
                <div className="us-reaction-row us-item-reactions" onClick={(e)=>e.stopPropagation()}>
                  {quickReactions.map((emoji)=>{
                    const users=Array.isArray(x.reactions?.[emoji]) ? x.reactions[emoji] : [];
                    return (
                      <button
                        key={emoji}
                        className={users.includes(user)?"active":""}
                        title={users.length ? users.join(", ") : "React"}
                        onClick={()=>toggleItemReaction(x,emoji)}
                      >
                        <span>{emoji}</span>
                        {users.length ? <small>{users.length}</small> : null}
                      </button>
                    );
                  })}
                </div>
                {pendingIds[x.id] ? <div className="us-saving"><span />Saving…</div> : null}
              </div>

              {open === x.id ? (
                <div className="us-detail us-detail-full" onClick={(e) => e.stopPropagation()}>
                  {x.isSurprise ? (
                    <div className={"us-surprise-detail"+(x.surprise?.isRevealed?" revealed":" locked")}>
                      <div className="us-surprise-detail-head">
                        <span>{x.surprise?.isRevealed ? "SURPRISE REVEALED" : "SURPRISE LOCKED"}</span>
                        {x.surprise?.creator===user && !x.surprise?.isRevealed ? (
                          <button onClick={()=>patch(x,{action:"revealSurprise"},"Surprise revealed ✨")}>Reveal early</button>
                        ) : null}
                      </div>
                      {x.surprise?.isRevealed ? (
                        <div className="us-surprise-revealed-grid">
                          {x.surprise?.dressCode ? <div><small>Dress code</small><b>{x.surprise.dressCode}</b></div> : null}
                          {x.surprise?.meetMode ? <div><small>Plan</small><b>{x.surprise.meetMode==="pickup"?"Pickup":"Meet there"}</b></div> : null}
                          {x.surprise?.pickupTime ? <div><small>Pickup</small><b>{x.surprise.pickupTime}</b></div> : null}
                          {x.surprise?.location ? <div><small>Location</small><b>{x.surprise.location}</b></div> : null}
                          {x.surprise?.note ? <div><small>Note</small><b>{x.surprise.note}</b></div> : null}
                        </div>
                      ) : (
                        <div className="us-surprise-locked-copy">
                          <b>{x.surprise?.date || "Date TBC"}{x.surprise?.time ? " · "+x.surprise.time : ""}</b>
                          <span>{x.surprise?.teaser || "No clues yet."}</span>
                          {x.surprise?.revealAt ? <small>Unlocks {new Date(x.surprise.revealAt).toLocaleString()}</small> : null}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="us-detail-audit">Added by {x.addedBy} · Last updated by {x.updatedBy}</div>
                  <div className="us-actions">
                    <button className={(x.status === "idea" || x.status === "maybe") ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "idea" }, "Saved as Idea")}>Idea</button>
                    <button className={x.status === "planned" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => openPlan(x)}>Planned</button>
                    <button className={x.status === "done" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "done", doneAt: new Date().toISOString() }, "Done ✓")}>Done</button>
                  </div>
                  <div className="us-archive-row">
                    <div className="us-archive-actions">
                      {x.status === "archived" ? (
                        <button
                          className="us-restore-btn"
                          disabled={!!pendingIds[x.id]}
                          onClick={() => patch(x, { status: x.archivedFrom || "idea", archivedFrom: null }, "Restored ✓")}
                        >
                          RESTORE ITEM
                        </button>
                      ) : (
                        <button
                          className="us-archive-btn"
                          disabled={!!pendingIds[x.id]}
                          onClick={() => patch(x, { archivedFrom: x.status, status: "archived" }, "Archived")}
                        >
                          ARCHIVE
                        </button>
                      )}
                      <button
                        className="us-delete-btn"
                        disabled={!!pendingIds[x.id]}
                        onClick={() => deleteItem(x)}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>

                  <div className="us-detail-grid">
                    <label>Try Again <input type="checkbox" checked={!!x.tryAgain} disabled={!!pendingIds[x.id]} onChange={(e) => patch(x, { tryAgain: e.target.checked }, e.target.checked ? "Added to Try Again" : "Removed from Try Again")} /></label>
                    <label>Location <input value={editValue(x,"location")} onChange={(e) => setEditValue(x,"location",e.target.value)} onBlur={() => saveTextField(x,"location","Location saved")} onKeyDown={(e) => { if(e.key==="Enter"){ e.currentTarget.blur(); } }} /></label>
                    {x.category === "eat" ? <label>Meal type <select value={x.mealType || "any"} onChange={(e) => patch(x,{mealType:e.target.value},"Meal type updated")}>{mealTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label> : null}
                  </div>

                  {(x.challenge || (x.category === "do" && ["challenges","rematches"].includes(x.list))) ? (
                    <div className={"us-challenge-card"+(x.challenge?" active":"")}>
                      <div className="us-challenge-head">
                        <div>
                          <small>CHALLENGE MODE</small>
                          <b>{x.challenge ? "Charlie vs Tayla" : "Make this competitive?"}</b>
                        </div>
                        <button onClick={()=>openChallenge(x)}>{x.challenge ? "Edit" : "SET UP →"}</button>
                      </div>
                      {x.challenge ? (
                        <>
                          <div className="us-challenge-meta">
                            <span>{x.challenge.scoring==="winner"?"Winner only":x.challenge.scoring==="points"?"Points":"Score"}</span>
                            {x.challenge.stakes ? <span>Stakes: {x.challenge.stakes}</span> : null}
                          </div>
                          {(()=>{
                            const series=challengeSeries(x);
                            return series.completed.length ? (
                              <div className="us-challenge-series">
                                <div>
                                  <small>SERIES</small>
                                  <b>Charlie {series.wins.Charlie} — {series.wins.Tayla} Tayla</b>
                                  {series.wins.Draw ? <span>{series.wins.Draw} draw{series.wins.Draw===1?"":"s"}</span> : null}
                                </div>
                                <div className="us-challenge-rounds">
                                  {series.completed.map((round,index)=>(
                                    <span key={round.id}>
                                      R{index+1} · {round.challenge?.winner || "Result"}
                                      {(round.challenge?.charlieScore!=null || round.challenge?.taylaScore!=null)
                                        ? " · "+(round.challenge?.charlieScore ?? "—")+"–"+(round.challenge?.taylaScore ?? "—")
                                        : (round.challenge?.score!=null ? " · "+round.challenge.score : "")}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                          {(x.challenge.winner || x.challenge.charlieScore!=null || x.challenge.taylaScore!=null || x.challenge.outcome) ? (
                            <div className="us-challenge-result">
                              {x.challenge.winner ? <b>🏆 {x.challenge.winner}</b> : null}
                              {(x.challenge.charlieScore!=null || x.challenge.taylaScore!=null) ? <span>Charlie {x.challenge.charlieScore ?? "—"} · {x.challenge.taylaScore ?? "—"} Tayla</span> : null}
                              {x.challenge.outcome ? <small>{x.challenge.outcome}</small> : null}
                            </div>
                          ) : x.status==="done" ? <button className="us-challenge-result-btn" onClick={()=>openChallenge(x)}>ADD RESULT →</button> : <small className="us-challenge-waiting">Result goes in once it’s done.</small>}
                          <div className="us-challenge-actions">
                            {x.status==="done" ? <button onClick={()=>rematchChallenge(x)}>REMATCH →</button> : null}
                            <button onClick={()=>removeChallenge(x)}>Remove challenge</button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {x.status === "planned" ? (
                    <div className="us-planned-summary">
                      <div className="us-planned-summary-head">
                        <span>Plan</span>
                        <button onClick={()=>openPlan(x)}>Edit plan</button>
                      </div>
                      <div className="us-planned-meta">
                        <span>{x.planDate || "No date"}</span>
                        {x.planTime ? <span>{x.planTime}</span> : null}
                        {x.location ? <span>{x.location}</span> : null}
                        {x.recurrence && x.recurrence!=="none" ? <span>{x.recurrence}</span> : null}
                        {x.reminderPreset && x.reminderPreset!=="none" ? <span>Reminder: {x.reminderPreset}</span> : null}
                      </div>
                      {x.planNotes ? <p>{x.planNotes}</p> : null}
                      <div className="us-calendar-actions">
                        <a href={googleCalendarUrl(x)} target="_blank" rel="noreferrer">Google Calendar</a>
                        <a href={"/api/us-calendar?id="+encodeURIComponent(x.id)}>Apple / .ics</a>
                        {x.bookingUrl ? <a href={x.bookingUrl} target="_blank" rel="noreferrer">Booking / link</a> : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="us-media-controls">
                    <label>Card emoji
                      <input
                        className="us-emoji-input"
                        value={editValues[x.id + ":emoji"] !== undefined ? editValues[x.id + ":emoji"] : (x.emoji || categoryMeta[x.category]?.emoji || "✦")}
                        maxLength={4}
                        onFocus={() => {
                          const key=x.id + ":emoji";
                          if(editValues[key]===undefined) setEditValues((s)=>({...s,[key]:x.emoji || categoryMeta[x.category]?.emoji || "✦"}));
                        }}
                        onChange={(e) => setEditValue(x,"emoji",e.target.value)}
                        onBlur={() => saveTextField(x,"emoji","Emoji updated")}
                        onKeyDown={(e) => { if(e.key==="Enter") e.currentTarget.blur(); }}
                      />
                    </label>
                    <label className="us-photo-control">
                      {x.cover ? "Change photo" : "Add photo"}
                      <input type="file" accept="image/*" onChange={(e) => handleCoverUpload(x,e.target.files?.[0])} />
                    </label>
                    {x.cover ? <button className="us-remove-photo" onClick={()=>patch(x,{cover:null},"Photo removed")}>Remove photo</button> : null}
                  </div>

                  {x.status === "done" ? (
                    <label className="us-completion-date">Completion date
                      <input
                        type="date"
                        value={x.doneAt ? String(x.doneAt).slice(0,10) : ""}
                        onChange={(e) => patch(
                          x,
                          { doneAt: e.target.value ? e.target.value + "T12:00:00.000Z" : null },
                          "Completion date saved"
                        )}
                      />
                    </label>
                  ) : null}

                  <div className="us-comments">
                    <div className="us-comments-head">
                      <span>Comments</span>
                      <small>{(x.comments || []).length}</small>
                    </div>

                    {(x.comments || []).length ? (
                      <div className="us-comment-list">
                        {(x.comments || []).map((comment)=>(
                          <div className="us-comment" key={comment.id}>
                            <div>
                              <b>{comment.user}</b>
                              <span>{comment.text}</span>
                            </div>
                            <div className="us-comment-side">
                              <div className="us-comment-meta">
                                <small>{new Date(comment.at).toLocaleDateString(undefined,{day:"numeric",month:"short"})}</small>
                                {comment.user===user ? (
                                  <button onClick={()=>deleteComment(x,comment.id)}>Delete</button>
                                ) : null}
                              </div>
                              <div className="us-reaction-row us-comment-reactions">
                                {quickReactions.map((emoji)=>{
                                  const users=Array.isArray(comment.reactions?.[emoji]) ? comment.reactions[emoji] : [];
                                  return (
                                    <button
                                      key={emoji}
                                      className={users.includes(user)?"active":""}
                                      title={users.length ? users.join(", ") : "React"}
                                      onClick={()=>toggleCommentReaction(x,comment.id,emoji)}
                                    >
                                      <span>{emoji}</span>
                                      {users.length ? <small>{users.length}</small> : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="us-comments-empty">Nothing here yet.</p>}

                    <div className="us-comment-compose">
                      <input
                        placeholder="Add a comment…"
                        value={commentDrafts[x.id] || ""}
                        onChange={(e)=>setCommentDrafts((s)=>({...s,[x.id]:e.target.value}))}
                        onKeyDown={(e)=>{if(e.key==="Enter" && !e.shiftKey){e.preventDefault();addComment(x);}}}
                      />
                      <button
                        className="us-primary"
                        disabled={!(commentDrafts[x.id] || "").trim()}
                        onClick={()=>addComment(x)}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <div className="us-gallery-section">
                    <div className="us-gallery-head">
                      <span>Gallery</span>
                      <small>{(x.gallery || []).length} photo{(x.gallery || []).length===1?"":"s"}</small>
                    </div>

                    {(x.gallery || []).length ? (
                      <div className="us-gallery-grid">
                        {(x.gallery || []).map((photo)=>(
                          <div className="us-gallery-tile" key={photo.id}>
                            <button className="us-gallery-view" onClick={()=>setLightbox({src:photo.src,title:x.title,index:(x.cover?1:0)+(x.gallery||[]).findIndex((g)=>g.id===photo.id),images:[...(x.cover?[x.cover]:[]),...(x.gallery||[]).map((g)=>g.src)]})}><img src={photo.src} alt="" /></button>
                            <button
                              aria-label="Remove photo"
                              onClick={()=>removeGalleryPhoto(x,photo.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="us-gallery-empty">Add a few photos when you’ve got them.</p>}

                    <label className="us-gallery-add">
                      + Add gallery photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e)=>handleGalleryUpload(x,e.target.files)}
                      />
                    </label>
                  </div>

                  <div className="us-rating-section">
                    <div className="us-rating-head">
                      <span>Afterwards</span>
                      {x.ratings?.Charlie && x.ratings?.Tayla ? <small className="complete">Feedback complete ✓</small> : <small>Waiting for both</small>}
                    </div>
                    <div className="us-ratings">
                      {["Charlie","Tayla"].map((person)=>(
                        <div className={"us-rating-card"+(person===user?" editable":" locked")} key={person}>
                          <label>{person} /10</label>
                          {person===user ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={x.ratings?.[person] || ""}
                                placeholder="—"
                                onChange={(e)=>patch(x,{ratings:{[person]:Number(e.target.value)||null}},person+" rating saved")}
                              />
                              <input
                                className="us-review-input"
                                placeholder="Your note (optional)"
                                value={editValues[x.id + ":review:" + person] !== undefined ? editValues[x.id + ":review:" + person] : (x.reviews?.[person] || "")}
                                onFocus={() => {
                                  const key=x.id + ":review:" + person;
                                  if(editValues[key]===undefined) setEditValues((s)=>({...s,[key]:x.reviews?.[person] || ""}));
                                }}
                                onChange={(e)=>setEditValues((s)=>({...s,[x.id + ":review:" + person]:e.target.value}))}
                                onBlur={async () => {
                                  const key=x.id + ":review:" + person;
                                  if(editValues[key]===undefined) return;
                                  const ok=await patch(x,{reviews:{[person]:editValues[key]}},"Review saved");
                                  if(ok) setEditValues((s)=>{const n={...s};delete n[key];return n;});
                                }}
                                onKeyDown={(e)=>{if(e.key==="Enter")e.currentTarget.blur();}}
                              />
                            </>
                          ) : (
                            <div className="us-rating-readonly">
                              {x.ratings?.[person] ? <b>{x.ratings[person]}/10</b> : <span>Waiting for {person}</span>}
                              {x.reviews?.[person] ? <p>{x.reviews[person]}</p> : null}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
          {!filtered.length ? (
            <div className="us-empty">
              {shortcut === "Surprises" ? (
                <>
                  <div className="us-surprise-empty-icon">🎁</div>
                  <b>No surprises hiding here yet.</b>
                  <span>Create one when you want to plan something without giving the game away.</span>

                </>
              ) : shortcut === "Planned" ? (
                <>
                  <b>Nothing planned yet.</b>
                  <span>Lock something in and it’ll appear here.</span>
                </>
              ) : shortcut === "Try Again" ? (
                <>
                  <b>Nothing queued for a rematch.</b>
                  <span>Mark a Done item as Try Again and it’ll show up here.</span>
                </>
              ) : (
                <>
                  <b>Nothing here yet.</b>
                  <span>That feels temporary.</span>
                </>
              )}
            </div>
          ) : null}
        </section>

        <a className="us-memories-link" href="/memories"><span>Memories</span><small>Done, but not gone →</small></a><section className="us-activity">
          <div className="us-section-title"><span>Recent activity</span></div>
          {activity.slice(0, 8).map((a) => (
            <div key={a.id}><b>{a.user}</b> {a.type} {a.title || "an item"}</div>
          ))}
        </section>
      </div>

      {toast ? <div className="us-toast">{toast}</div> : null}

      {pollOpen ? (
        <div className="us-modal">
          <div className="us-modal-card us-poll-modal">
            <button className="us-close" onClick={()=>setPollOpen(false)}>×</button>
            <small>NEW POLL</small>
            <h2>Make us choose.</h2>

            <label className="us-poll-field">Question
              <input
                autoFocus
                placeholder="Which film tonight?"
                value={pollDraft.question}
                onChange={(e)=>setPollDraft({...pollDraft,question:e.target.value})}
              />
            </label>

            <div className="us-poll-ideas">
              <span>Pick from our ideas</span>
              <div className="us-picker-chips">
                {items
                  .filter((item)=>item.status!=="archived" && !item.isSurprise)
                  .slice(0,12)
                  .map((item)=>{
                    const selected=pollDraft.options.some((x)=>x.itemId===item.id);
                    return (
                      <button
                        key={item.id}
                        className={selected?"active":""}
                        onClick={()=>{
                          let options=selected
                            ? pollDraft.options.filter((x)=>x.itemId!==item.id)
                            : [...pollDraft.options.filter((x)=>x.label),{label:item.title,itemId:item.id}];
                          while(options.length<2) options.push({label:"",itemId:null});
                          setPollDraft({...pollDraft,options});
                        }}
                      >
                        {item.emoji || categoryMeta[item.category]?.emoji || "✨"} {item.title}{item.status==="done" ? " ↻" : ""}
                      </button>
                    );
                  })}
              </div>
              <small>Or add your own below.</small>
            </div>

            <div className="us-poll-option-edit">
              {pollDraft.options.map((option,index)=>(
                <div key={index}>
                  <input
                    placeholder={"Option "+(index+1)}
                    value={option.label}
                    onChange={(e)=>{
                      const options=[...pollDraft.options];
                      options[index]={label:e.target.value,itemId:null};
                      setPollDraft({...pollDraft,options});
                    }}
                  />
                  {pollDraft.options.length>2 ? <button onClick={()=>setPollDraft({...pollDraft,options:pollDraft.options.filter((_,i)=>i!==index)})}>×</button> : null}
                </div>
              ))}
            </div>

            <button
              className="us-poll-add-option"
              onClick={()=>setPollDraft({...pollDraft,options:[...pollDraft.options,{label:"",itemId:null}]})}
            >
              + Add option
            </button>

            <button
              className="us-primary us-quick-submit"
              disabled={!pollDraft.question.trim() || pollDraft.options.filter((x)=>x.label.trim()).length<2}
              onClick={createPoll}
            >
              CREATE POLL →
            </button>
          </div>
        </div>
      ) : null}

      {planningItem ? (
        <div className="us-modal">
          <div className="us-modal-card us-plan-modal">
            <button className="us-close" onClick={()=>setPlanningItem(null)}>×</button>
            <small>PLAN IT</small>
            <h2>{planningItem.title}</h2>
            <p>Give it enough detail that Future Us doesn’t have to remember anything.</p>

            <div className="us-plan-grid">
              <label>Date
                <input type="date" value={planDraft.date} onChange={(e)=>setPlanDraft({...planDraft,date:e.target.value})} />
              </label>
              <label>Time <span>optional</span>
                <input type="time" value={planDraft.time} onChange={(e)=>setPlanDraft({...planDraft,time:e.target.value})} />
              </label>
            </div>

            <label className="us-plan-field">Location
              <input placeholder="Where?" value={planDraft.location} onChange={(e)=>setPlanDraft({...planDraft,location:e.target.value})} />
            </label>

            <label className="us-plan-field">Booking / link <span>optional</span>
              <input type="url" placeholder="Maps, booking, tickets…" value={planDraft.bookingUrl} onChange={(e)=>setPlanDraft({...planDraft,bookingUrl:e.target.value})} />
            </label>

            <label className="us-plan-field">Notes <span>optional</span>
              <textarea placeholder="Anything useful…" value={planDraft.notes} onChange={(e)=>setPlanDraft({...planDraft,notes:e.target.value})} />
            </label>

            <div className="us-plan-grid">
              <label>Recurrence
                <select value={planDraft.recurrence} onChange={(e)=>setPlanDraft({...planDraft,recurrence:e.target.value})}>
                  <option value="none">Doesn’t repeat</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="every-2-weeks">Every 2 weeks</option>
                </select>
              </label>

              <label>Reminder
                <select value={planDraft.reminderPreset} onChange={(e)=>setPlanDraft({...planDraft,reminderPreset:e.target.value})}>
                  <option value="none">No reminder</option>
                  <option value="day-before">Day before</option>
                  <option value="few-hours">A few hours before</option>
                  <option value="one-hour">1 hour before</option>
                </select>
              </label>
            </div>

            <button className="us-primary us-quick-submit" disabled={!planDraft.date} onClick={savePlan}>
              {planningItem.status==="planned" ? "SAVE PLAN →" : "LOCK IN PLAN →"}
            </button>
          </div>
        </div>
      ) : null}

      {editingList ? (
        <div className="us-modal">
          <div className="us-modal-card us-list-modal">
            <button className="us-close" onClick={()=>setEditingList(null)}>×</button>
            <small>EDIT LIST</small>
            <h2>Make it yours.</h2>
            <label className="us-list-field">Emoji
              <input value={editingList.emoji} maxLength={4} onChange={(e)=>setEditingList({...editingList,emoji:e.target.value})} />
            </label>
            <label className="us-list-field">List name
              <input value={editingList.name} onChange={(e)=>setEditingList({...editingList,name:e.target.value})} onKeyDown={(e)=>{if(e.key==="Enter")updateCustomList();}} />
            </label>
            <button className="us-primary us-quick-submit" disabled={!editingList.name.trim()} onClick={updateCustomList}>SAVE CHANGES →</button>
          </div>
        </div>
      ) : null}

      {newListOpen ? (
        <div className="us-modal">
          <div className="us-modal-card us-list-modal">
            <button className="us-close" onClick={()=>setNewListOpen(false)}>×</button>
            <small>NEW {categoryMeta[category].label.toUpperCase()} LIST</small>
            <h2>Make it yours.</h2>
            <label className="us-list-field">Emoji
              <input value={newList.emoji} maxLength={4} onChange={(e)=>setNewList({...newList,emoji:e.target.value})} />
            </label>
            <label className="us-list-field">List name
              <input autoFocus placeholder="e.g. Late night spots" value={newList.name} onChange={(e)=>setNewList({...newList,name:e.target.value})} onKeyDown={(e)=>{if(e.key==="Enter")createCustomList();}} />
            </label>
            <button className="us-primary us-quick-submit" disabled={!newList.name.trim()} onClick={createCustomList}>CREATE LIST →</button>
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <div className="us-lightbox" onClick={()=>setLightbox(null)}>
          <button className="us-lightbox-close" onClick={()=>setLightbox(null)}>×</button>
          <div className="us-lightbox-inner" onClick={(e)=>e.stopPropagation()}>
            <img src={lightbox.src} alt="" />
            <div className="us-lightbox-foot">
              <span>{lightbox.title}</span>
              <small>{lightbox.index+1} / {lightbox.images.length}</small>
            </div>
            {lightbox.images.length>1 ? (
              <>
                <button
                  className="us-lightbox-nav prev"
                  onClick={()=>{
                    const idx=(lightbox.index-1+lightbox.images.length)%lightbox.images.length;
                    setLightbox({...lightbox,index:idx,src:lightbox.images[idx]});
                  }}
                >‹</button>
                <button
                  className="us-lightbox-nav next"
                  onClick={()=>{
                    const idx=(lightbox.index+1)%lightbox.images.length;
                    setLightbox({...lightbox,index:idx,src:lightbox.images[idx]});
                  }}
                >›</button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {challengeItem ? (
        <div className="us-modal">
          <div className="us-modal-card us-challenge-modal">
            <button className="us-close" onClick={()=>setChallengeItem(null)}>×</button>
            <small>CHALLENGE MODE</small>
            <h2>Charlie vs Tayla.</h2>

            <div className="us-quick-section">
              <span>How are we scoring it?</span>
              <div className="us-picker-chips">
                {[["winner","Winner only"],["points","Points"],["score","Score"]].map(([value,label])=>(
                  <button key={value} className={challengeDraft.scoring===value?"active":""} onClick={()=>setChallengeDraft({...challengeDraft,scoring:value})}>{label}</button>
                ))}
              </div>
            </div>

            <label className="us-challenge-field">Stakes <span>optional</span>
              <input placeholder="Loser buys coffee, winner picks dinner…" value={challengeDraft.stakes} onChange={(e)=>setChallengeDraft({...challengeDraft,stakes:e.target.value})}/>
            </label>

            {challengeItem.status==="done" ? (
              <div className="us-challenge-result-form">
                <span>Result</span>
                <div className="us-picker-chips">
                  {[["Charlie","Charlie won"],["Tayla","Tayla won"],["Draw","Draw"]].map(([value,label])=>(
                    <button key={value} className={challengeDraft.winner===value?"active":""} onClick={()=>setChallengeDraft({...challengeDraft,winner:value})}>{label}</button>
                  ))}
                </div>

                {challengeDraft.scoring!=="winner" ? (
                  <div className="us-plan-grid">
                    <label>Charlie
                      <input inputMode="decimal" placeholder="Score" value={challengeDraft.charlieScore} onChange={(e)=>setChallengeDraft({...challengeDraft,charlieScore:e.target.value})}/>
                    </label>
                    <label>Tayla
                      <input inputMode="decimal" placeholder="Score" value={challengeDraft.taylaScore} onChange={(e)=>setChallengeDraft({...challengeDraft,taylaScore:e.target.value})}/>
                    </label>
                  </div>
                ) : null}

                <label className="us-challenge-field">Outcome <span>optional</span>
                  <input placeholder="What happened to the stakes?" value={challengeDraft.outcome} onChange={(e)=>setChallengeDraft({...challengeDraft,outcome:e.target.value})}/>
                </label>
              </div>
            ) : null}

            <button className="us-primary us-quick-submit" onClick={saveChallenge}>
              {challengeItem.challenge ? "SAVE CHALLENGE →" : "MAKE IT A CHALLENGE →"}
            </button>
          </div>
        </div>
      ) : null}

      {quick ? (
        <div className="us-modal">
          <div className="us-modal-card us-quick-card">
            <button className="us-close" onClick={() => setQuick(false)}>×</button>
            {draft.isSurprise ? <small>SURPRISE PLAN</small> : <small>QUICK ADD</small>}
            <h2>{draft.isSurprise ? "Keep it under wraps." : "Add something"}</h2>

            <input
              placeholder={draft.isSurprise?"Give the surprise a private title":draft.category==="eat"?"Where / what are we eating?":draft.category==="watch"?"What are we watching?":draft.category==="go"?"Where are we going?":"What should we do?"}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />

            <div className="us-mini-grid">
              {Object.entries(categoryMeta).map(([k, v]) => (
                <button
                  key={k}
                  className={draft.category === k ? "active" : ""}
                  onClick={() => setDraft({
                    ...draft,
                    category: k,
                    list: listsForCategory(k)[0]?.id || categoryMeta[k].sublists[0][0],
                    mealType: k === "eat" ? (draft.mealType || "any") : undefined
                  })}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>

            <div className="us-quick-section">
              <span>{quickAddMeta[draft.category].subLabel}</span>
              <div className="us-picker-chips">
                {listsForCategory(draft.category).map((list) => (
                  <button key={list.id} className={draft.list===list.id?"active":""} onClick={() => setDraft({...draft,list:list.id})}>{list.emoji} {list.label}</button>
                ))}
              </div>
            </div>

            {draft.category === "eat" ? (
              <div className="us-quick-section">
                <span>Meal type</span>
                <div className="us-picker-chips">
                  {mealTypes.map(([value,label]) => (
                    <button key={value} className={(draft.mealType||"any")===value?"active":""} onClick={() => setDraft({...draft,mealType:value})}>{label}</button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="us-quick-section">
              <span>Effort</span>
              <div className="us-picker-chips">
                {[["low","Low effort"],["normal","Normal"],["big","Big plan"]].map(([value,label]) => (
                  <button key={value} className={draft.effort===value?"active":""} onClick={() => setDraft({...draft,effort:value})}>{label}</button>
                ))}
              </div>
            </div>

            <div className="us-quick-section">
              <span>When</span>
              <div className="us-picker-chips">
                {[["tonight","Tonight"],["soon","Soon"],["someday","Someday"]].map(([value,label]) => (
                  <button key={value} className={draft.timeHorizon===value?"active":""} onClick={() => setDraft({...draft,timeHorizon:value})}>{label}</button>
                ))}
              </div>
            </div>

            {draft.isSurprise ? (
              <div className="us-surprise-fields">
                <div className="us-plan-grid">
                  <label>Date
                    <input type="date" value={draft.surpriseDate || ""} onChange={(e)=>setDraft({...draft,surpriseDate:e.target.value})} />
                  </label>
                  <label>Time <span>optional</span>
                    <input type="time" value={draft.surpriseTime || ""} onChange={(e)=>setDraft({...draft,surpriseTime:e.target.value})} />
                  </label>
                </div>

                <div className="us-quick-section">
                  <span>Dress code <em>hidden</em></span>
                  <input placeholder="e.g. Smart casual, trainers…" value={draft.surpriseDressCode || ""} onChange={(e)=>setDraft({...draft,surpriseDressCode:e.target.value})} />
                </div>

                <div className="us-quick-section">
                  <span>How are we getting there?</span>
                  <div className="us-picker-chips">
                    {[["meet","Meet there"],["pickup","I’m picking you up"]].map(([value,label])=>(
                      <button key={value} className={draft.surpriseMeetMode===value?"active":""} onClick={()=>setDraft({...draft,surpriseMeetMode:value})}>{label}</button>
                    ))}
                  </div>
                </div>

                {draft.surpriseMeetMode==="pickup" ? (
                  <div className="us-quick-section">
                    <span>Pickup time <em>hidden</em></span>
                    <input type="time" value={draft.surprisePickupTime || ""} onChange={(e)=>setDraft({...draft,surprisePickupTime:e.target.value})} />
                  </div>
                ) : null}

                <div className="us-quick-section">
                  <span>Location <em>hidden</em></span>
                  <input placeholder="Where are you actually going?" value={draft.surpriseLocation || ""} onChange={(e)=>setDraft({...draft,surpriseLocation:e.target.value})} />
                </div>

                <div className="us-quick-section">
                  <span>Clue / teaser <em>safe to show</em></span>
                  <input placeholder="Optional clue for Tayla…" value={draft.surpriseTeaser || ""} onChange={(e)=>setDraft({...draft,surpriseTeaser:e.target.value})} />
                </div>

                <div className="us-quick-section">
                  <span>Practical note <em>hidden</em></span>
                  <input placeholder="Bring trainers, don’t eat beforehand…" value={draft.surpriseNote || ""} onChange={(e)=>setDraft({...draft,surpriseNote:e.target.value})} />
                </div>

                <div className="us-quick-section">
                  <span>Reveal timing</span>
                  <div className="us-picker-chips">
                    {[["start","At start"],["10m","10 mins before"],["30m","30 mins before"],["1h","1 hour before"],["custom","Custom"]].map(([value,label])=>(
                      <button key={value} className={draft.surpriseRevealPreset===value?"active":""} onClick={()=>setDraft({...draft,surpriseRevealPreset:value})}>{label}</button>
                    ))}
                  </div>
                </div>

                {draft.surpriseRevealPreset==="custom" ? (
                  <div className="us-quick-section">
                    <span>Custom reveal</span>
                    <input type="datetime-local" value={draft.surpriseRevealCustom || ""} onChange={(e)=>setDraft({...draft,surpriseRevealCustom:e.target.value})} />
                  </div>
                ) : null}
              </div>
            ) : null}

            {!draft.isSurprise ? (            <div className="us-quick-section">
              <span>Location</span>
              <input
                placeholder="e.g. JVC, Home, Hatta, London"
                value={draft.location || ""}
                onChange={(e)=>setDraft({...draft,location:e.target.value})}
              />
            </div>) : null}

            <button className="us-more-toggle" onClick={()=>setQuickMore(!quickMore)}>
              <span>{quickMore ? "Hide details" : "More details"}</span>
              <span>{quickMore ? "−" : "+"}</span>
            </button>

            {quickMore ? (
              <div className="us-quick-more">
                <div className="us-quick-section">
                  <span>Priority</span>
                  <div className="us-picker-chips">
                    {[["low","Low"],["normal","Normal"],["high","High"]].map(([value,label])=>(
                      <button key={value} className={draft.priority===value?"active":""} onClick={()=>setDraft({...draft,priority:value})}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="us-quick-section">
                  <span>Budget</span>
                  <div className="us-picker-chips">
                    {[["","Not set"],["free","Free"],["cheap","Cheap"],["mid","Mid"],["spenny","Spenny"]].map(([value,label])=>(
                      <button key={value||"none"} className={(draft.budget||"")===value?"active":""} onClick={()=>setDraft({...draft,budget:value})}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="us-quick-section">
                  <span>Duration</span>
                  <div className="us-picker-chips">
                    {[["","Not set"],["30m","30 mins"],["1-2h","1–2 hours"],["half-day","Half day"],["full-day","Full day"],["overnight","Overnight / Trip"]].map(([value,label])=>(
                      <button key={value||"none"} className={(draft.duration||"")===value?"active":""} onClick={()=>setDraft({...draft,duration:value})}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="us-quick-section">
                  <span>Tags <em>optional</em></span>
                  <input className="us-quick-input" placeholder="romantic, outdoors…" value={draft.tagsText || ""} onChange={(e)=>setDraft({...draft,tagsText:e.target.value})} />
                </div>

                <div className="us-quick-section">
                  <span>Notes <em>optional</em></span>
                  <textarea className="us-quick-notes" placeholder="Anything useful to remember…" value={draft.notes || ""} onChange={(e)=>setDraft({...draft,notes:e.target.value})} />
                </div>
              </div>
            ) : null}

            <button className="us-primary us-quick-submit" onClick={add} disabled={!draft.title.trim() || (draft.isSurprise && !draft.surpriseDate)}>
              {draft.isSurprise ? "SAVE SURPRISE →" : "ADD TO US →"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

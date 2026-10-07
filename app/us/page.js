"use client";
import "./us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta, quickShortcuts, mealTypes } from "../../lib/usData";

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
  const [draft, setDraft] = useState({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any", location:"", priority:"normal", budget:"", duration:"", tagsText:"", notes:"", isSurprise:false });
  const [wheel, setWheel] = useState(false);
  const [wheelPick, setWheelPick] = useState(null);
  const [pickerMode, setPickerMode] = useState(null);
  const [pickerFilters, setPickerFilters] = useState({category:"any",effort:"any",duration:"any",timeHorizon:"any"});
  const [pendingIds, setPendingIds] = useState({});
  const [toast, setToast] = useState("");
  const [editValues, setEditValues] = useState({});
  const [recovering, setRecovering] = useState(false);
  const [recovery, setRecovery] = useState({ recoveryCode: "", newPassword: "" });
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [newListOpen, setNewListOpen] = useState(false);
  const [newList, setNewList] = useState({ name:"", emoji:"✨" });
  const [editingList, setEditingList] = useState(null);
  const [planningItem, setPlanningItem] = useState(null);
  const [planDraft, setPlanDraft] = useState({ date:"", time:"" });

  async function load() {
    setLoading(true);
    const r = await fetch("/api/us", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setUser(d.user);
      setItems(d.items);
      setActivity(d.activity);
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
      setDraft({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any", location:"", priority:"normal", budget:"", duration:"", tagsText:"", notes:"", isSurprise:false });
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

  async function handleCoverUpload(item, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("Pick an image file");
      setTimeout(()=>setToast(""),1600);
      return;
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
    const compressed = canvas.toDataURL("image/jpeg", 0.78);

    await patch(item, { cover: compressed }, "Photo added ✓");
  }


  function openPlan(item) {
    setPlanningItem(item);
    setPlanDraft({ date:item.planDate || "", time:item.planTime || "" });
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
      planTime:planDraft.time || ""
    }, "Plan locked in ✓");
    if (ok) {
      setPlanningItem(null);
      setPlanDraft({date:"",time:""});
    }
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
      <div className="us-shell">
        <header className="us-header">
          <div><small>OUR PRIVATE SPACE</small><b>US</b></div>
          <div className="us-header-actions"><button className="us-logout" onClick={doLogout}>Log out</button><button onClick={() => setQuick(true)}>＋</button></div>
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
                setDraft({ title:"", category:"do", list:"date-ideas", effort:"normal", timeHorizon:"soon", mealType:undefined, isSurprise:true });
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
                  <img className="us-cover-img" src={x.cover} alt="" />
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
                {itemSecondary(x) ? <p className="us-card-subtitle">{itemSecondary(x)}</p> : null}
                {pendingIds[x.id] ? <div className="us-saving"><span />Saving…</div> : null}
              </div>

              {open === x.id ? (
                <div className="us-detail us-detail-full" onClick={(e) => e.stopPropagation()}>
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

                  <div className="us-ratings">
                    <label>Charlie /10 <input type="number" min="1" max="10" value={x.ratings?.Charlie || ""} onChange={(e) => patch(x, { ratings: { ...x.ratings, Charlie: Number(e.target.value) || null } }, "Charlie rating saved")} /></label>
                    <label>Tayla /10 <input type="number" min="1" max="10" value={x.ratings?.Tayla || ""} onChange={(e) => patch(x, { ratings: { ...x.ratings, Tayla: Number(e.target.value) || null } }, "Tayla rating saved")} /></label>
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

        <section className="us-activity">
          <div className="us-section-title"><span>Recent activity</span></div>
          {activity.slice(0, 8).map((a) => (
            <div key={a.id}><b>{a.user}</b> {a.type} {a.title || "an item"}</div>
          ))}
        </section>
      </div>

      {toast ? <div className="us-toast">{toast}</div> : null}

      {planningItem ? (
        <div className="us-modal">
          <div className="us-modal-card us-plan-modal">
            <button className="us-close" onClick={()=>setPlanningItem(null)}>×</button>
            <small>PLAN IT</small>
            <h2>{planningItem.title}</h2>
            <p>Give it a date so it can become the next thing on your home screen.</p>
            <div className="us-plan-grid">
              <label>Date
                <input type="date" value={planDraft.date} onChange={(e)=>setPlanDraft({...planDraft,date:e.target.value})} />
              </label>
              <label>Time <span>optional</span>
                <input type="time" value={planDraft.time} onChange={(e)=>setPlanDraft({...planDraft,time:e.target.value})} />
              </label>
            </div>
            <button className="us-primary us-quick-submit" disabled={!planDraft.date} onClick={savePlan}>LOCK IN PLAN →</button>
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

            <div className="us-quick-section">
              <span>Location</span>
              <input
                placeholder="e.g. JVC, Home, Hatta, London"
                value={draft.location || ""}
                onChange={(e)=>setDraft({...draft,location:e.target.value})}
              />
            </div>

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

            <button className="us-primary us-quick-submit" onClick={add} disabled={!draft.title.trim()}>
              {draft.isSurprise ? "SAVE SURPRISE →" : "ADD TO US →"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

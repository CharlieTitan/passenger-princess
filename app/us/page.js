"use client";
import "./us.css";
import { useEffect, useMemo, useState } from "react";
import { categoryMeta, quickShortcuts, mealTypes } from "../../lib/usData";

export default function Us() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState({ username: "Charlie", password: "" });
  const [category, setCategory] = useState("eat");
  const [shortcut, setShortcut] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [quick, setQuick] = useState(false);
  const [draft, setDraft] = useState({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any" });
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

  async function load() {
    setLoading(true);
    const r = await fetch("/api/us", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setUser(d.user);
      setItems(d.items);
      setActivity(d.activity);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doLogout() {
    await fetch("/api/us-auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setUser(null);
    setItems([]);
    setActivity([]);
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
      body: JSON.stringify(draft)
    });
    if (r.ok) {
      setQuick(false);
      setDraft({ title: "", category: "eat", list: "restaurants", effort: "normal", timeHorizon: "soon", mealType: "any" });
      load();
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

  const filtered = useMemo(() => {
    return items.filter((x) => {
      if (shortcut === "Planned" && x.status !== "planned") return false;
      if (shortcut === "Try Again" && !x.tryAgain) return false;
      if (!shortcut && x.category !== category) return false;
      if (query && !x.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, category, shortcut, query]);

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
    setPickerMode(mode);
    setWheelPick(null);
    setPickerFilters(mode === "tonight"
      ? { category:"any", effort:"any", duration:"any", timeHorizon:"any" }
      : { category:"any", effort:"any", duration:"any", timeHorizon:"any" });
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
  const planned = items.filter((x) => x.status === "planned");
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
            <small>NOW</small>
            <b>{planned[0] ? planned[0].title : tonight[0] ? tonight[0].title : soon[0] ? soon[0].title : "Add something worth doing."}</b>
            <p>{planned[0] ? "You already planned this." : tonight[0] ? "One for tonight." : soon[0] ? "One for soon." : "The lists are waiting."}</p>
          </div>
        </section>

        <section className="us-cats">
          {Object.entries(categoryMeta).map(([k, v]) => (
            <button key={k} className={category === k && !shortcut ? "active" : ""} onClick={() => { setCategory(k); setShortcut(""); }}>
              <span>{v.emoji}</span><b>{v.label}</b><small>{items.filter((x) => x.category === k).length} items</small>
            </button>
          ))}
        </section>

        <section className="us-shortcuts">
          {quickShortcuts.map((s) => (
            <button
              key={s}
              className={shortcut === s ? "active" : ""}
              onClick={() => {
                if (s === "Pick for us") { openPicker("pick"); setShortcut(""); }
                else if (s === "Tonight") { openPicker("tonight"); setShortcut(""); }
                else if (s === "Quick add") setQuick(true);
                else setShortcut(shortcut === s ? "" : s);
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
                  <button className="us-primary" onClick={()=>patch(wheelPick,{status:"planned"}, "Planned ✓")}>LOCK IT IN</button>
                  <button className="us-secondary" onClick={()=>spin()}>PICK AGAIN</button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="us-toolbar">
          <input placeholder="Search our lists…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={() => setQuick(true)}>Quick add</button>
        </section>

        <section className="us-list">
          {filtered.map((x, i) => (
            <article className={"us-card status-" + x.status} key={x.id} onClick={() => setOpen(open === x.id ? null : x.id)}>
              <div className={"us-polaroid " + (i % 2 ? "tilt-r" : "tilt-l")}>
                <div className="us-photo-placeholder">{categoryMeta[x.category]?.emoji || "✦"}</div>
                <small>{x.location || x.list}</small>
              </div>
              <div className="us-card-body">
                <div className="us-card-top">
                  <small>{x.status.toUpperCase()} · {x.effort}</small>
                  {x.tryAgain ? <span>TRY AGAIN</span> : null}
                </div>
                <h3>{x.title}</h3>
                {pendingIds[x.id] ? <div className="us-saving"><span />Saving…</div> : null}
                <p>Added by {x.addedBy} · Updated by {x.updatedBy}</p>
                {open === x.id ? (
                  <div className="us-detail" onClick={(e) => e.stopPropagation()}>
                    <div className="us-actions">
                      <button className={x.status === "maybe" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "maybe" }, "Moved to Maybe")}>Maybe</button>
                      <button className={x.status === "idea" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "idea" }, "Moved to Idea")}>Idea</button>
                      <button className={x.status === "planned" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "planned" }, "Planned ✓")}>Planned</button>
                      <button className={x.status === "done" ? "active" : ""} disabled={!!pendingIds[x.id]} onClick={() => patch(x, { status: "done", doneAt: new Date().toISOString() }, "Done ✓")}>Done</button>
                    </div>
                    <label>Try Again <input type="checkbox" checked={!!x.tryAgain} disabled={!!pendingIds[x.id]} onChange={(e) => patch(x, { tryAgain: e.target.checked }, e.target.checked ? "Added to Try Again" : "Removed from Try Again")} /></label>
                    <label>Location <input value={editValue(x,"location")} onChange={(e) => setEditValue(x,"location",e.target.value)} onBlur={() => saveTextField(x,"location","Location saved")} onKeyDown={(e) => { if(e.key==="Enter"){ e.currentTarget.blur(); } }} /></label>{x.category === "eat" ? <label>Meal type <select value={x.mealType || "any"} onChange={(e) => patch(x,{mealType:e.target.value},"Meal type updated")}>{mealTypes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label> : null}
                    <div className="us-ratings">
                      <label>Charlie /10 <input type="number" min="1" max="10" value={x.ratings?.Charlie || ""} onChange={(e) => patch(x, { ratings: { ...x.ratings, Charlie: Number(e.target.value) || null } }, "Charlie rating saved")} /></label>
                      <label>Tayla /10 <input type="number" min="1" max="10" value={x.ratings?.Tayla || ""} onChange={(e) => patch(x, { ratings: { ...x.ratings, Tayla: Number(e.target.value) || null } }, "Tayla rating saved")} /></label>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
          {!filtered.length ? <div className="us-empty">Nothing here yet. That feels temporary.</div> : null}
        </section>

        <section className="us-activity">
          <div className="us-section-title"><span>Recent activity</span></div>
          {activity.slice(0, 8).map((a) => (
            <div key={a.id}><b>{a.user}</b> {a.type} {a.title || "an item"}</div>
          ))}
        </section>
      </div>

      {toast ? <div className="us-toast">{toast}</div> : null}

      {quick ? (
        <div className="us-modal">
          <div className="us-modal-card">
            <button className="us-close" onClick={() => setQuick(false)}>×</button>
            <small>QUICK ADD</small>
            <h2>Add something</h2>
            <input placeholder="What should we add?" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="us-mini-grid">
              {Object.entries(categoryMeta).map(([k, v]) => (
                <button key={k} className={draft.category === k ? "active" : ""} onClick={() => setDraft({ ...draft, category: k, list: v.sublists[0][0], mealType: k === "eat" ? (draft.mealType || "any") : undefined })}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
            <select value={draft.effort} onChange={(e) => setDraft({ ...draft, effort: e.target.value })}>
              <option value="low">Low effort</option><option value="normal">Normal</option><option value="big">Big plan</option>
            </select>
            <select value={draft.timeHorizon} onChange={(e) => setDraft({ ...draft, timeHorizon: e.target.value })}>
              <option value="tonight">Tonight</option><option value="soon">Soon</option><option value="someday">Someday</option>
            </select>
            <button className="us-primary" onClick={add}>ADD TO US →</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "today" | "mobility" | "history" | "more";
type Effort = "" | "easy" | "moderate" | "hard";
type Status = "partial" | "completed" | "rest";

type Injury = {
  impact: "" | "modified" | "stopped" | "prevented";
  bodyArea: string;
  note: string;
};

type Video = { url: string; label: string };

type Session = {
  id: string;
  date: string;
  activity: string;
  duration: string;
  distance: string;
  effort: Effort;
  notes: string;
  completedExercises: string[];
  status: Status;
  injury: Injury;
  videos: Video[];
  updatedAt: string;
  completedAt?: string;
};

const schedule = [
  { short: "Sun", theme: "Rest / Recovery", key: "rest", guidance: "Rest is part of the plan. Easy walking and recovery are welcome.", activities: ["Rest", "Easy walk", "Gentle mobility"] },
  { short: "Mon", theme: "Mobility + Optional Ride", key: "mobility", guidance: "Move well, address what needs attention, and ride only if it serves you.", activities: ["Mobility", "Peloton HIIT", "Easy ride", "Other"] },
  { short: "Tue", theme: "Easy Aerobic", key: "aerobic", guidance: "30–45 minutes at a conversational, Zone 2 effort.", activities: ["Walk", "Easy run", "Peloton", "Bike", "Other"] },
  { short: "Wed", theme: "Full-Body Strength", key: "strength", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
  { short: "Thu", theme: "Speed / Intensity", key: "speed", guidance: "Intervals, tempo, hills, Peloton HIIT or other speed work.", activities: ["Track intervals", "Tempo run", "Hill repeats", "Peloton HIIT", "Other"] },
  { short: "Fri", theme: "Full-Body Strength", key: "strength", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
  { short: "Sat", theme: "Endurance", key: "endurance", guidance: "60+ minutes of steady aerobic work. Choose the activity that fits today.", activities: ["Run", "Bike", "Peloton", "Hike / hike-run", "Swim", "Other"] },
] as const;

const exerciseGroups = [
  {
    title: "Shoulder & elbow",
    subtitle: "Mobility + strength",
    exercises: [
      ["Block Up + Overs", "2 yoga blocks"], ["Plank to Rotation", "Bodyweight · light dumbbell optional"],
      ["Scapular Push-Up", "Bodyweight"], ["Overhead Press", "Light weight"], ["I, T, Y", "Light weight"],
      ["Face Pulls", "Band or cable"], ["Swimmers", "No weight"], ["Open Book", "No weight"],
      ["Banded 7's", "Light band"], ["Windmill", "Light weight"], ["KB Waiter — Elbow Forward", "Light to moderate"],
      ["Crossovers — Face Pull to Overhead Press", "Band"],
    ],
  },
  {
    title: "Core + upper body",
    subtitle: "Strength + stability",
    exercises: [["Push-Ups", "Bodyweight"], ["Bench Press with Dumbbells", "Moderate weight"], ["Hollow Body Hold", "Bodyweight"], ["Wall Slide", "Overhead flexibility"]],
  },
  {
    title: "Grip, balance + carry",
    subtitle: "Useful capacity",
    exercises: [["Dead Hang", "Bar"], ["Balance — One Leg, Eyes Closed", "Bodyweight"], ["Farmer's Carry", "Dumbbells or kettlebells"], ["Side Plank", "Bodyweight · optional"]],
  },
] as const;

const strengthExercises = [["Warm-up", "Move through a comfortable range"], ["Hinge or squat", "Controlled reps"], ["Push", "Choose a comfortable variation"], ["Pull or carry", "Choose a comfortable variation"], ["Cool-down", "Easy breathing + movement"]] as const;
const speedExercises = [["Warm-up", "Easy movement + a few pickups"], ["Main workout", "Intervals, tempo, hills, or HIIT"], ["Cool-down", "Return to an easy effort"]] as const;
const mobilityDefaults = [["Face Pulls", "2 × 10"], ["Open Book", "2 × 8 each side"], ["Wall Slide", "2 × 10"], ["Dead Hang", "Comfortable time"], ["Side Plank", "2 rounds each side"]] as const;

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function easternToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
}

function emptySession(date: string, rest = false): Session {
  return { id: date, date, activity: "", duration: "", distance: "", effort: "", notes: "", completedExercises: [], status: rest ? "rest" : "partial", injury: { impact: "", bodyArea: "", note: "" }, videos: [], updatedAt: new Date().toISOString() };
}

const DB_NAME = "training-for-life";
const STORE = "sessions";

function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction(STORE, mode);
      const operation = action(transaction.objectStore(STORE));
      operation.onsuccess = () => resolve(operation.result);
      operation.onerror = () => reject(operation.error);
    };
  });
}

const saveSession = (session: Session) => withStore("readwrite", (store) => store.put(session));
const getSession = (id: string) => withStore<Session | undefined>("readonly", (store) => store.get(id));
const getAllSessions = () => withStore<Session[]>("readonly", (store) => store.getAll());

function MovementMark({ type = 0 }: { type?: number }) {
  return <span className={`movement-mark pose-${type % 3}`} aria-hidden="true"><i className="head"/><i className="body"/><i className="arm a"/><i className="arm b"/><i className="leg a"/><i className="leg b"/></span>;
}

function NavIcon({ name }: { name: Tab }) {
  if (name === "today") return <span aria-hidden="true">●</span>;
  if (name === "mobility") return <span aria-hidden="true">↗</span>;
  if (name === "history") return <span aria-hidden="true">▦</span>;
  return <span aria-hidden="true">•••</span>;
}

export default function Home() {
  const [now, setNow] = useState(() => new Date(2026, 7, 20, 12));
  const todayKey = dateKey(now);
  const plan = schedule[now.getDay()];
  const [tab, setTab] = useState<Tab>("today");
  const [session, setSession] = useState<Session>(() => emptySession(todayKey, plan.key === "rest"));
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("Loading your plan…");
  const [history, setHistory] = useState<Session[]>([]);
  const [historyView, setHistoryView] = useState<"week" | "month">("week");
  const [showInjury, setShowInjury] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLabel, setVideoLabel] = useState("");
  const [ptExercises, setPtExercises] = useState(() => [
    { id: "pt-1", name: "Face pulls", prescription: "2 × 10", archived: false },
    { id: "pt-2", name: "Thoracic rotations at wall", prescription: "2 × 12 each", archived: false },
    { id: "pt-3", name: "Supination / pronation with band", prescription: "2 × 10 each", archived: false },
    { id: "pt-4", name: "KB wrist flexion / extension", prescription: "Elbow at 90° · as prescribed", archived: false },
  ]);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setNow(easternToday()), []);

  useEffect(() => {
    getSession(todayKey).then((saved) => {
      if (saved) setSession(saved);
      else setSession(emptySession(todayKey, plan.key === "rest"));
      setLoaded(true);
      setSaveState("Saved on this iPhone");
    }).catch(() => {
      const fallback = localStorage.getItem(`t4l:${todayKey}`);
      if (fallback) setSession(JSON.parse(fallback));
      setLoaded(true);
      setSaveState("Saved on this iPhone");
    });
    const savedPt = localStorage.getItem("t4l:pt");
    if (savedPt) setPtExercises(JSON.parse(savedPt));
  }, [todayKey]);

  useEffect(() => {
    if (!loaded) return;
    setSaveState("Saving…");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      const next = { ...session, updatedAt: new Date().toISOString() };
      saveSession(next).then(() => setSaveState("Saved on this iPhone")).catch(() => {
        localStorage.setItem(`t4l:${todayKey}`, JSON.stringify(next));
        setSaveState("Saved on this iPhone");
      });
    }, 450);
    return () => { if (noteTimer.current) clearTimeout(noteTimer.current); };
  }, [session, loaded, todayKey]);

  useEffect(() => {
    if (tab === "history") getAllSessions().then((items) => setHistory(items.sort((a, b) => b.date.localeCompare(a.date)))).catch(() => setHistory([]));
  }, [tab, session]);

  useEffect(() => {
    localStorage.setItem("t4l:pt", JSON.stringify(ptExercises));
  }, [ptExercises]);

  const update = (patch: Partial<Session>) => setSession((current) => ({ ...current, ...patch }));
  const dayExercises = plan.key === "strength" ? strengthExercises : plan.key === "speed" ? speedExercises : plan.key === "mobility" ? mobilityDefaults : [];
  const toggleExercise = (name: string) => update({ completedExercises: session.completedExercises.includes(name) ? session.completedExercises.filter((item) => item !== name) : [...session.completedExercises, name] });

  function finishWorkout() {
    update({ status: plan.key === "rest" ? "rest" : "completed", completedAt: new Date().toISOString() });
    setSaveState(plan.key === "rest" ? "Recovery day honored" : "Workout finished + saved");
  }

  function attachVideo() {
    if (!videoUrl.trim()) return;
    update({ videos: [...session.videos, { url: videoUrl.trim(), label: videoLabel.trim() || "Workout video" }] });
    setVideoUrl(""); setVideoLabel(""); setShowVideo(false);
  }

  const completedThisWeek = history.filter((item) => item.status === "completed").length + (plan.key === "rest" ? 1 : 0);

  return (
    <div className="app-shell">
      <header className="brand-bar">
        <button className="wordmark" onClick={() => { setTab("today"); window.scrollTo(0, 0); }} aria-label="Go to Today"><span className="brand-leaf">⌁</span><span>TRAINING <b>4</b> LIFE</span></button>
        <span className="privacy-dot">LOCAL + PRIVATE</span>
      </header>

      <main>
        {tab === "today" && (
          <div className="today-page">
            <section className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">{now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}</p>
                <p className="day-count">DAY {((now.getDay() + 6) % 7) + 1} <span>OF 7</span></p>
                <div className="hero-title-row"><MovementMark type={now.getDay()} /><h1>{plan.theme}</h1></div>
                <p className="guidance">{plan.guidance}</p>
              </div>
              <aside className="consistency-card">
                <span>THIS WEEK</span>
                <strong>{completedThisWeek}<small> / 6</small></strong>
                <p>planned sessions</p>
                <div className="week-dots" aria-label={`${completedThisWeek} planned sessions complete`}>
                  {schedule.slice(1).map((day, i) => <i key={day.short} className={i < completedThisWeek ? "filled" : ""}>{day.short[0]}</i>)}
                </div>
              </aside>
            </section>

            <section className="section-block">
              <div className="section-heading"><div><span className="section-number">01</span><h2>Choose today’s activity</h2></div><span className="optional">OPTIONAL</span></div>
              <div className="activity-grid">
                {plan.activities.map((activity) => <button key={activity} className={`activity-chip ${session.activity === activity ? "selected" : ""}`} onClick={() => update({ activity: session.activity === activity ? "" : activity })}><span>{session.activity === activity ? "✓" : "+"}</span>{activity}</button>)}
              </div>
            </section>

            {dayExercises.length > 0 && <section className="section-block work-section">
              <div className="section-heading"><div><span className="section-number">02</span><h2>Today’s work</h2></div><span className="optional">TAP TO CHECK</span></div>
              <div className="checklist">
                {dayExercises.map(([name, detail], index) => {
                  const checked = session.completedExercises.includes(name);
                  return <button key={name} className={`exercise-row ${checked ? "checked" : ""}`} onClick={() => toggleExercise(name)}><MovementMark type={index}/><span className="exercise-copy"><strong>{name}</strong><small>{detail}</small></span><span className="check-target" aria-label={checked ? `Mark ${name} incomplete` : `Mark ${name} complete`}>{checked ? "✓" : ""}</span></button>;
                })}
              </div>
            </section>}

            <section className="section-block details-section">
              <div className="section-heading"><div><span className="section-number">{dayExercises.length ? "03" : "02"}</span><h2>Useful details</h2></div><span className="optional">ALL OPTIONAL</span></div>
              <div className="field-grid">
                <label><span>Duration</span><div><input inputMode="numeric" value={session.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="—"/><em>MIN</em></div></label>
                <label><span>Distance</span><div><input inputMode="decimal" value={session.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="—"/><em>MI</em></div></label>
              </div>
              <div className="effort-row"><span>Perceived effort</span><div>{(["easy", "moderate", "hard"] as Effort[]).map((effort) => <button key={effort} className={session.effort === effort ? "selected" : ""} onClick={() => update({ effort: session.effort === effort ? "" : effort })}>{effort}</button>)}</div></div>
              <label className="notes-field"><span>Workout note</span><textarea value={session.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="What did you do? How did it feel? Dictation works here…" rows={5}/><small>Automatically saved as you type.</small></label>

              <div className="secondary-actions">
                <button onClick={() => setShowInjury(!showInjury)}>⚑ {session.injury.impact ? "Edit modification" : "Injury / Modification"}</button>
                <button onClick={() => setShowVideo(!showVideo)}>＋ Add YouTube video</button>
              </div>

              {showInjury && <div className="inline-sheet">
                <p className="sheet-title">How was today affected?</p>
                <div className="sheet-options">
                  {[["modified", "Modified workout"], ["stopped", "Stopped early"], ["prevented", "Could not train"]].map(([value, label]) => <button key={value} className={session.injury.impact === value ? "selected" : ""} onClick={() => update({ injury: { ...session.injury, impact: value as Injury["impact"] } })}>{label}</button>)}
                </div>
                <input value={session.injury.bodyArea} onChange={(e) => update({ injury: { ...session.injury, bodyArea: e.target.value } })} placeholder="Body area (optional)"/>
                <textarea value={session.injury.note} onChange={(e) => update({ injury: { ...session.injury, note: e.target.value } })} placeholder="Modification note (optional)" rows={3}/>
                {session.injury.impact && <button className="text-button" onClick={() => update({ injury: { impact: "", bodyArea: "", note: "" } })}>Clear flag</button>}
              </div>}

              {showVideo && <div className="inline-sheet">
                <p className="sheet-title">Attach a workout video</p>
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube URL"/>
                <input value={videoLabel} onChange={(e) => setVideoLabel(e.target.value)} placeholder="Your label (optional)"/>
                <button className="compact-primary" onClick={attachVideo}>Attach video</button>
              </div>}
              {session.videos.map((video, i) => <a className="video-card" href={video.url} target="_blank" rel="noreferrer" key={`${video.url}-${i}`}><span>▶</span><div><strong>{video.label}</strong><small>Opens YouTube · internet required</small></div></a>)}
            </section>

            <div className="finish-zone">
              <div className="save-status"><span>✓</span><div><strong>{saveState}</strong><small>Your workout never leaves this device.</small></div></div>
              <button className="finish-button" onClick={finishWorkout}>{session.status === "completed" || session.status === "rest" ? "✓ Day recorded" : plan.key === "rest" ? "Honor recovery day" : "Finish workout"}<span>→</span></button>
            </div>
          </div>
        )}

        {tab === "mobility" && <div className="subpage">
          <section className="page-intro"><p className="eyebrow">MOVE WELL</p><h1>Mobility library</h1><p>Choose what your body needs today. Controlled movement matters more than completing every item.</p></section>
          <div className="atlas-card"><img src="/og.png" alt="Line drawings of face pulls, open book rotation, farmer carry, side plank, dead hang, and single-leg balance"/><p>Movement reference · use a comfortable range and appropriate load.</p></div>
          {exerciseGroups.map((group, groupIndex) => <section className="library-group" key={group.title}><div className="group-title"><span>0{groupIndex + 1}</span><div><h2>{group.title}</h2><p>{group.subtitle}</p></div></div><div className="library-list">{group.exercises.map(([name, equipment], i) => <button key={name} onClick={() => { if (!session.completedExercises.includes(name)) toggleExercise(name); }}><MovementMark type={i + groupIndex}/><span><strong>{name}</strong><small>{equipment}</small></span><em>{session.completedExercises.includes(name) ? "✓ ADDED" : "+ ADD"}</em></button>)}</div></section>)}
        </div>}

        {tab === "history" && <HistoryView now={now} sessions={history} view={historyView} setView={setHistoryView}/>} 

        {tab === "more" && <MoreView ptExercises={ptExercises} setPtExercises={setPtExercises} sessions={history} setHistory={setHistory}/>} 
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {(["today", "mobility", "history", "more"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); window.scrollTo(0, 0); }}><NavIcon name={item}/><small>{item[0].toUpperCase() + item.slice(1)}</small></button>)}
      </nav>
    </div>
  );
}

function HistoryView({ now, sessions, view, setView }: { now: Date; sessions: Session[]; view: "week" | "month"; setView: (view: "week" | "month") => void }) {
  const sessionMap = new Map(sessions.map((session) => [session.date, session]));
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const currentPlanStreak = sessions.filter((s) => s.status === "completed" || s.status === "rest" || s.injury.impact === "prevented").length;
  return <div className="subpage history-page">
    <section className="page-intro"><p className="eyebrow">CONSISTENCY, NOT PERFECTION</p><h1>Your history</h1><p>See whether you followed the plan. Recovery and injury-protected decisions count as good judgment.</p></section>
    <section className="history-summary"><div><span>THIS WEEK</span><strong>{sessions.filter((s) => s.status === "completed").length}<small> sessions</small></strong></div><div><span>PLAN STREAK</span><strong>{currentPlanStreak}<small> days</small></strong></div><div><span>30-DAY ADHERENCE</span><strong>{sessions.length ? Math.round((sessions.filter((s) => s.status !== "partial").length / sessions.length) * 100) : 0}<small>%</small></strong></div></section>
    <div className="segmented"><button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Weekly</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Monthly</button></div>
    {view === "week" ? <section className="week-card"><div className="week-heading"><div><span>WEEK OF</span><h2>{monday.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</h2></div><span>{sessions.filter((s) => s.status === "completed").length} / 6 TRAINING DAYS</span></div>{week.map((day) => { const plan = schedule[day.getDay()]; const saved = sessionMap.get(dateKey(day)); const state = saved?.status ?? (plan.key === "rest" ? "rest" : "missed"); return <div className="history-row" key={dateKey(day)}><span className={`status-mark ${state}`}>{state === "completed" ? "✓" : state === "rest" ? "R" : state === "partial" ? "◐" : "—"}</span><div><strong>{day.toLocaleDateString("en-US", { weekday: "short" })} · {plan.theme}</strong><small>{saved?.activity || (state === "rest" ? "Recovery day" : "No entry yet")}{saved?.injury.impact ? ` · ⚑ ${saved.injury.impact}` : ""}</small></div><time>{day.getDate()}</time></div>; })}</section> : <section className="month-card"><div className="month-title"><h2>{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2><div className="legend"><span>■ Complete</span><span>◐ Partial</span><span>R Rest</span><span>— No entry</span></div></div><div className="calendar-grid">{["M","T","W","T","F","S","S"].map((d,i) => <b key={`${d}-${i}`}>{d}</b>)}{Array.from({ length: firstOffset }, (_, i) => <i key={`empty-${i}`}/>)}{Array.from({ length: daysInMonth }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth(), i + 1); const plan = schedule[d.getDay()]; const saved = sessionMap.get(dateKey(d)); const state = saved?.status ?? (plan.key === "rest" ? "rest" : "missed"); return <span className={`${state} ${i + 1 === now.getDate() ? "today" : ""}`} key={i + 1}><em>{i + 1}</em><small>{state === "completed" ? "✓" : state === "rest" ? "R" : state === "partial" ? "◐" : "—"}</small></span>; })}</div></section>}
    <section className="milestone"><span>⌁</span><div><p>MILESTONE PATH</p><h3>{sessions.length ? "Every return strengthens the pattern." : "Your first recorded day starts the pattern."}</h3><small>No guilt, no leaderboard—just a useful record of showing up.</small></div></section>
  </div>;
}

function MoreView({ ptExercises, setPtExercises, sessions, setHistory }: { ptExercises: {id:string;name:string;prescription:string;archived:boolean}[]; setPtExercises: React.Dispatch<React.SetStateAction<{id:string;name:string;prescription:string;archived:boolean}[]>>; sessions: Session[]; setHistory: (sessions: Session[]) => void }) {
  const [newPt, setNewPt] = useState("");
  const [notice, setNotice] = useState("");
  function exportData() {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), sessions, ptExercises, settings: { weekStartsOn: "monday", adherenceThreshold: 5 } };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `training-for-life-backup-${dateKey()}.json`; a.click(); URL.revokeObjectURL(url); setNotice("Backup created. Save it to Files or iCloud Drive.");
  }
  async function restoreData(file: File) {
    try { const payload = JSON.parse(await file.text()); if (payload.schemaVersion !== 1 || !Array.isArray(payload.sessions)) throw new Error(); await Promise.all(payload.sessions.map((s: Session) => saveSession(s))); if (Array.isArray(payload.ptExercises)) setPtExercises(payload.ptExercises); setHistory(payload.sessions); setNotice(`Restored ${payload.sessions.length} sessions from a validated backup.`); } catch { setNotice("That file is not a valid Training for Life backup."); }
  }
  return <div className="subpage more-page">
    <section className="page-intro"><p className="eyebrow">YOUR PLAN, YOUR DATA</p><h1>More</h1><p>Shape the useful details. The weekly rhythm stays simple.</p></section>
    <section className="settings-card"><div className="settings-title"><span>01</span><div><h2>Weekly schedule</h2><p>The stable baseline</p></div></div>{schedule.slice(1).concat(schedule.slice(0,1)).map((day) => <div className="schedule-row" key={day.short}><b>{day.short}</b><span>{day.theme}</span></div>)}</section>
    <section className="settings-card"><div className="settings-title"><span>02</span><div><h2>My PT exercises</h2><p>Track prescriptions without medical claims</p></div></div>{ptExercises.filter((p) => !p.archived).map((pt) => <div className="pt-row" key={pt.id}><div><input aria-label="Exercise name" value={pt.name} onChange={(e) => setPtExercises((items) => items.map((x) => x.id === pt.id ? { ...x, name: e.target.value } : x))}/><input aria-label="Prescription" value={pt.prescription} onChange={(e) => setPtExercises((items) => items.map((x) => x.id === pt.id ? { ...x, prescription: e.target.value } : x))}/></div><button onClick={() => setPtExercises((items) => items.map((x) => x.id === pt.id ? { ...x, archived: true } : x))}>Archive</button></div>)}<div className="add-pt"><input value={newPt} onChange={(e) => setNewPt(e.target.value)} placeholder="Add a PT exercise"/><button onClick={() => { if (newPt.trim()) { setPtExercises((items) => [...items, { id: crypto.randomUUID(), name: newPt.trim(), prescription: "", archived: false }]); setNewPt(""); } }}>Add</button></div></section>
    <section className="settings-card"><div className="settings-title"><span>03</span><div><h2>Backup + restore</h2><p>Keep an external copy in Files or iCloud Drive</p></div></div><button className="wide-action" onClick={exportData}>Back up my data <span>↓</span></button><label className="wide-action file-action">Restore from backup <span>↑</span><input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && restoreData(e.target.files[0])}/></label>{notice && <p className="notice">✓ {notice}</p>}<p className="backup-note">Clearing browser or site data can erase local history. A monthly backup is a good habit.</p></section>
    <section className="privacy-card"><span>LOCAL + PRIVATE</span><h2>Your history stays on this device.</h2><p>Training for Life requires no account and does not upload personal workout history to GitHub or a Training for Life server. Opening a saved YouTube link contacts YouTube/Google.</p><p className="disclaimer">This is a tracking tool, not medical advice. Use controlled movement and an appropriate load; stop for sharp pain and seek qualified care when needed.</p></section>
  </div>;
}

"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "today" | "week" | "history" | "more";
type Effort = "" | "easy" | "moderate" | "hard";
type Status = "partial" | "completed" | "rest";
type Injury = { impact: "" | "modified" | "stopped" | "prevented"; bodyArea: string; note: string };
type Video = { url: string; label: string; videoId?: string; thumbnailData?: string };
type Session = {
  id: string; date: string; activity: string; duration: string; distance: string; effort: Effort;
  notes: string; completedExercises: string[]; status: Status; injury: Injury; videos: Video[];
  updatedAt: string; completedAt?: string;
};
type PtExercise = { id: string; name: string; prescription: string; archived: boolean };
type BackupHandle = { createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>; queryPermission?: (options: { mode: "readwrite" }) => Promise<PermissionState>; requestPermission?: (options: { mode: "readwrite" }) => Promise<PermissionState> };
type SavePickerWindow = Window & { showSaveFilePicker?: (options: { suggestedName: string; id: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<BackupHandle> };

const schedule = [
  { short: "Sun", label: "S", theme: "Rest / Recovery", key: "rest", icon: "☾", guidance: "Rest is training, too. Easy walking and gentle recovery are welcome.", activities: ["Rest", "Easy walk", "Gentle mobility"] },
  { short: "Mon", label: "M", theme: "Mobility + Ride", key: "mobility", icon: "↗", guidance: "Move well, address what needs attention, and ride only if it serves you.", activities: ["Mobility", "Peloton HIIT", "Easy ride", "Other"] },
  { short: "Tue", label: "T", theme: "Easy Aerobic", key: "aerobic", icon: "≈", guidance: "30–45 minutes at a conversational, Zone 2 effort.", activities: ["Walk", "Easy run", "Peloton", "Bike", "Other"] },
  { short: "Wed", label: "W", theme: "Full-Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
  { short: "Thu", label: "T", theme: "Speed / Intensity", key: "speed", icon: "⚡", guidance: "Intervals, tempo, hills, Peloton HIIT or other speed work.", activities: ["Track intervals", "Tempo run", "Hill repeats", "Peloton HIIT", "Other"] },
  { short: "Fri", label: "F", theme: "Full-Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
  { short: "Sat", label: "S", theme: "Endurance", key: "endurance", icon: "∞", guidance: "60+ minutes of steady aerobic work. Choose the activity that fits today.", activities: ["Run", "Bike", "Peloton", "Hike / hike-run", "Swim", "Other"] },
] as const;

const exerciseGroups = [
  { title: "Shoulder & elbow", subtitle: "Mobility + strength", exercises: [
    ["Block Up + Overs", "2 yoga blocks"], ["Plank to Rotation", "Bodyweight · light dumbbell optional"], ["Scapular Push-Up", "Bodyweight"],
    ["Overhead Press", "Light weight"], ["I, T, Y", "Light weight"], ["Face Pulls", "Band or cable"], ["Swimmers", "No weight"],
    ["Open Book", "No weight"], ["Banded 7's", "Light band"], ["Windmill", "Light weight"], ["KB Waiter — Elbow Forward", "Light to moderate"],
    ["Crossovers — Face Pull to Overhead Press", "Band"],
  ] },
  { title: "Core + upper body", subtitle: "Strength + stability", exercises: [
    ["Push-Ups", "Bodyweight"], ["Bench Press with Dumbbells", "Moderate weight"], ["Hollow Body Hold", "Bodyweight"], ["Wall Slide", "Overhead flexibility"],
  ] },
  { title: "Grip, balance + carry", subtitle: "Useful capacity", exercises: [
    ["Dead Hang", "Bar"], ["Balance — One Leg, Eyes Closed", "Bodyweight"], ["Farmer's Carry", "Dumbbells or kettlebells"], ["Side Plank", "Bodyweight · optional"],
  ] },
] as const;

const strengthExercises = [["Warm-up", "Move through a comfortable range"], ["Hinge or squat", "Controlled reps"], ["Push", "Choose a comfortable variation"], ["Pull or carry", "Choose a comfortable variation"], ["Cool-down", "Easy breathing + movement"]] as const;
const speedExercises = [["Warm-up", "Easy movement + a few pickups"], ["Main workout", "Intervals, tempo, hills, or HIIT"], ["Cool-down", "Return to an easy effort"]] as const;
const mobilityDefaults = [["Face Pulls", "2 × 10"], ["Open Book", "2 × 8 each side"], ["Wall Slide", "2 × 10"], ["Dead Hang", "Comfortable time"], ["Side Plank", "2 rounds each side"]] as const;

function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateFromKey(key: string) { return new Date(`${key}T12:00:00`); }
function easternToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
}
function emptySession(date: string, rest = false): Session {
  return { id: date, date, activity: "", duration: "", distance: "", effort: "", notes: "", completedExercises: [], status: rest ? "rest" : "partial", injury: { impact: "", bodyArea: "", note: "" }, videos: [], updatedAt: new Date().toISOString() };
}
function weekDates(date: Date) {
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day; });
}
function youtubeId(url: string) { return url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/)?.[1] ?? ""; }
function blobAsDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
async function captureYoutubeThumbnail(id: string) {
  const response = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`);
  if (!response.ok) throw new Error("Thumbnail unavailable");
  return blobAsDataUrl(await response.blob());
}

const DB_NAME = "training-for-life";
const STORE = "sessions";
const BACKUP_NAME = "training-for-life-backup.json";
function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" }); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const operation = action(request.result.transaction(STORE, mode).objectStore(STORE));
      operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error);
    };
  });
}
const saveSession = (session: Session) => withStore("readwrite", (store) => store.put(session));
const getSession = (id: string) => withStore<Session | undefined>("readonly", (store) => store.get(id));
const getAllSessions = () => withStore<Session[]>("readonly", (store) => store.getAll());

function backupHandleRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("training-for-life-backup-target", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("target");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { const operation = action(request.result.transaction("target", mode).objectStore("target")); operation.onsuccess = () => resolve(operation.result); operation.onerror = () => reject(operation.error); };
  });
}
const getBackupHandle = () => backupHandleRequest<BackupHandle | undefined>("readonly", (store) => store.get("daily"));
const rememberBackupHandle = (handle: BackupHandle) => backupHandleRequest("readwrite", (store) => store.put(handle, "daily"));
let cachedBackupHandle: BackupHandle | undefined;
function makeBackupFile(sessions: Session[], ptExercises: PtExercise[]) {
  const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), sessions, ptExercises, settings: { weekStartsOn: "monday", adherenceThreshold: 5 } };
  return new File([JSON.stringify(payload, null, 2)], BACKUP_NAME, { type: "application/json" });
}
async function saveBackup(sessions: Session[], ptExercises: PtExercise[]) {
  const file = makeBackupFile(sessions, ptExercises);
  const pickerWindow = window as SavePickerWindow;
  if (pickerWindow.showSaveFilePicker) {
    let handle = cachedBackupHandle;
    let permission = handle?.queryPermission ? await handle.queryPermission({ mode: "readwrite" }) : handle ? "granted" : "prompt";
    if (handle && permission !== "granted" && handle.requestPermission) permission = await handle.requestPermission({ mode: "readwrite" });
    if (!handle || permission !== "granted") {
      handle = await pickerWindow.showSaveFilePicker({ suggestedName: BACKUP_NAME, id: "training-for-life-daily-backup", types: [{ description: "Training for Life backup", accept: { "application/json": [".json"] } }] });
      cachedBackupHandle = handle; void rememberBackupHandle(handle).catch(() => undefined);
    }
    const writable = await handle.createWritable(); await writable.write(file); await writable.close();
    return "Backup updated in your saved location.";
  }
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Training for Life Backup" });
    return "Backup ready. In Save to Files, replace the existing backup.";
  }
  const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = BACKUP_NAME; link.click(); URL.revokeObjectURL(url);
  return "Backup downloaded with the same filename.";
}

function stateFor(session: Session | undefined, planKey: string) {
  if (session?.injury?.impact === "prevented") return "protected";
  if (session?.injury?.impact === "modified") return "modified";
  if (session?.status === "completed") return "completed";
  if (planKey === "rest" || session?.status === "rest") return "rest";
  if (session && (session.activity || session.notes || session.completedExercises.length)) return "partial";
  return "missed";
}
function stateSymbol(state: string) { return state === "completed" ? "✓" : state === "modified" ? "↗" : state === "protected" ? "⚑" : state === "rest" ? "R" : state === "partial" ? "◐" : "·"; }

function MovementMark({ type = 0 }: { type?: number }) {
  return <span className={`movement-mark pose-${type % 3}`} aria-hidden="true"><i className="head"/><i className="body"/><i className="arm a"/><i className="arm b"/><i className="leg a"/><i className="leg b"/></span>;
}
function NavIcon({ name }: { name: Tab }) {
  return <span aria-hidden="true">{name === "today" ? "●" : name === "week" ? "◫" : name === "history" ? "◷" : "•••"}</span>;
}

function RhythmStrip({ focus, sessions, onOpen }: { focus: Date; sessions: Session[]; onOpen?: (date: Date) => void }) {
  const map = new Map(sessions.map((item) => [item.date, item]));
  return <div className="rhythm-strip" aria-label="This week’s training rhythm">
    {weekDates(focus).map((date) => { const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); return <button key={dateKey(date)} className={`${plan.key} ${state} ${dateKey(date) === dateKey(focus) ? "current" : ""}`} onClick={() => onOpen?.(date)} aria-label={`${plan.short} ${plan.theme}: ${state}`}><span>{plan.label}</span><i>{stateSymbol(state)}</i></button>; })}
  </div>;
}

export default function Home() {
  const [today, setToday] = useState(() => new Date(2026, 7, 20, 12));
  const [activeDate, setActiveDate] = useState(() => new Date(2026, 7, 20, 12));
  const activeKey = dateKey(activeDate);
  const plan = schedule[activeDate.getDay()];
  const [tab, setTab] = useState<Tab>("today");
  const [session, setSession] = useState<Session>(() => emptySession(activeKey, plan.key === "rest"));
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("Loading your plan…");
  const [history, setHistory] = useState<Session[]>([]);
  const [showInjury, setShowInjury] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLabel, setVideoLabel] = useState("");
  const [videoMessage, setVideoMessage] = useState("");
  const [attachingVideo, setAttachingVideo] = useState(false);
  const [dailyBackupState, setDailyBackupState] = useState("Backup Data");
  const [ptExercises, setPtExercises] = useState<PtExercise[]>([
    { id: "pt-1", name: "Face pulls", prescription: "2 × 10", archived: false },
    { id: "pt-2", name: "Thoracic rotations at wall", prescription: "2 × 12 each", archived: false },
    { id: "pt-3", name: "Supination / pronation with band", prescription: "2 × 10 each", archived: false },
    { id: "pt-4", name: "KB wrist flexion / extension", prescription: "Elbow at 90° · as prescribed", archived: false },
  ]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { const realToday = easternToday(); setToday(realToday); setActiveDate(realToday); }, []);
  useEffect(() => {
    setLoaded(false);
    getSession(activeKey).then((saved) => setSession(saved ?? emptySession(activeKey, plan.key === "rest"))).catch(() => {
      const fallback = localStorage.getItem(`t4l:${activeKey}`); setSession(fallback ? JSON.parse(fallback) : emptySession(activeKey, plan.key === "rest"));
    }).finally(() => { setLoaded(true); setSaveState("Saved on this device"); });
  }, [activeKey]);
  useEffect(() => {
    const savedPt = localStorage.getItem("t4l:pt"); if (savedPt) setPtExercises(JSON.parse(savedPt));
  }, []);
  useEffect(() => { getBackupHandle().then((handle) => { cachedBackupHandle = handle; }).catch(() => undefined); }, []);
  useEffect(() => {
    if (!loaded) return;
    setSaveState("Saving…"); if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const next = { ...session, updatedAt: new Date().toISOString() };
      saveSession(next).then(() => setSaveState("Saved on this device")).catch(() => { localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(next)); setSaveState("Saved on this device"); });
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [session, loaded, activeKey]);
  useEffect(() => { getAllSessions().then((items) => setHistory(items.sort((a, b) => b.date.localeCompare(a.date)))).catch(() => setHistory([])); }, [tab, session]);
  useEffect(() => { localStorage.setItem("t4l:pt", JSON.stringify(ptExercises)); }, [ptExercises]);

  const update = (patch: Partial<Session>) => setSession((current) => ({ ...current, ...patch }));
  const dayExercises = plan.key === "strength" ? strengthExercises : plan.key === "speed" ? speedExercises : plan.key === "mobility" ? mobilityDefaults : [];
  const exerciseProgress = dayExercises.length ? Math.round(session.completedExercises.filter((name) => dayExercises.some(([item]) => item === name)).length / dayExercises.length * 100) : 0;
  const toggleExercise = (name: string) => update({ completedExercises: session.completedExercises.includes(name) ? session.completedExercises.filter((item) => item !== name) : [...session.completedExercises, name] });
  const navigate = (next: Tab) => { setTab(next); window.scrollTo(0, 0); };
  const openDate = (date: Date) => { setActiveDate(date); setTab("today"); window.scrollTo(0, 0); };
  const finishWorkout = () => { update({ status: plan.key === "rest" ? "rest" : "completed", completedAt: new Date().toISOString() }); setSaveState(plan.key === "rest" ? "Recovery day honored" : "Workout complete + saved"); };
  const backupToday = async () => {
    setDailyBackupState("Backing up…");
    const current = { ...session, updatedAt: new Date().toISOString() };
    const allSessions = [...history.filter((item) => item.id !== current.id), current].sort((a, b) => b.date.localeCompare(a.date));
    try { void saveSession(current).catch(() => undefined); const message = await saveBackup(allSessions, ptExercises); setDailyBackupState(message.startsWith("Backup updated") ? "Backup Updated ✓" : "Backup Ready ✓"); }
    catch (error) { setDailyBackupState(error instanceof DOMException && error.name === "AbortError" ? "Backup Data" : "Try Backup Again"); }
  };
  const attachVideo = async () => {
    const url = videoUrl.trim();
    const id = youtubeId(url);
    if (!id) { setVideoMessage("Paste a valid YouTube video link."); return; }
    setAttachingVideo(true); setVideoMessage("Saving video + thumbnail…");
    let thumbnailData = "";
    try { thumbnailData = await captureYoutubeThumbnail(id); } catch { setVideoMessage("Video saved. The thumbnail will load when online."); }
    update({ videos: [...session.videos, { url, label: videoLabel.trim() || "Workout video", videoId: id, thumbnailData }] });
    setVideoUrl(""); setVideoLabel(""); setAttachingVideo(false);
    if (thumbnailData) setVideoMessage("Video + thumbnail saved on this device.");
  };
  const activeIsToday = activeKey === dateKey(today);
  const weekMap = new Map(history.map((item) => [item.date, item]));
  const completedThisWeek = weekDates(today).filter((date) => ["completed", "modified", "rest", "protected"].includes(stateFor(weekMap.get(dateKey(date)), schedule[date.getDay()].key))).length;

  return <div className={`app-shell theme-${plan.key}`}>
    <header className="brand-bar">
      <button className="wordmark" onClick={() => { setActiveDate(today); navigate("today"); }} aria-label="Go to Today"><span className="brand-mark">T4L</span><span><b>Training</b> for Life</span></button>
      <span className="privacy-dot"><i/>Relentless Forward Progress</span>
    </header>
    <main>
      {tab === "today" && <div className="today-page">
        {!activeIsToday && <div className="editing-banner"><span>Viewing {activeDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span><button onClick={() => setActiveDate(today)}>Return to today</button></div>}
        <section className={`today-hero ${plan.key}`}>
          <div className="hero-topline"><span>{activeDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</span><time>{activeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div>
          <div className="hero-main"><div><span className="category-icon" aria-hidden="true">{plan.icon}</span><h1>{plan.theme}</h1><p>{plan.guidance}</p></div><div className="hero-score"><strong>{completedThisWeek}</strong><span>of 7 days<br/>on rhythm</span></div></div>
          <div className="theme-mantra"><span>→</span> Relentless Forward Progress</div>
          <RhythmStrip focus={activeDate} sessions={history} onOpen={openDate}/>
        </section>

        <details className="surface-card compact-panel activity-card">
          <summary><span className="panel-icon">{plan.icon}</span><span><b>Choose today’s workout</b><small>{session.activity || "Pick the activity that fits today"}</small></span><i>＋</i></summary>
          <div className="panel-body"><div className="activity-grid">{plan.activities.map((activity) => <button key={activity} className={session.activity === activity ? "selected" : ""} onClick={() => update({ activity: session.activity === activity ? "" : activity })}><span>{session.activity === activity ? "✓" : plan.icon}</span>{activity}</button>)}</div></div>
        </details>

        {dayExercises.length > 0 && <details className="surface-card compact-panel workout-card">
          <summary><span className="panel-icon progress-icon">{exerciseProgress}%</span><span><b>Today’s work</b><small>{session.completedExercises.filter((name) => dayExercises.some(([item]) => item === name)).length} of {dayExercises.length} movements complete</small></span><i>＋</i></summary>
          <div className="panel-body"><div className="progress-track"><i style={{ width: `${exerciseProgress}%` }}/></div><div className="checklist">{dayExercises.map(([name, detail], index) => { const checked = session.completedExercises.includes(name); return <button key={name} className={checked ? "checked" : ""} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark type={index}/></span><span className="exercise-copy"><strong>{name}</strong><small>{detail}</small></span><span className="check-target" aria-label={checked ? `Mark ${name} incomplete` : `Mark ${name} complete`}>{checked ? "✓" : ""}</span></button>; })}</div>{exerciseProgress === 100 && <p className="complete-message">Relentless forward progress. Today’s planned movements are complete.</p>}</div>
        </details>}

        <details className="surface-card compact-panel note-card">
          <summary><span className="panel-icon">✎</span><span><b>Workout note</b><small>{session.notes || "Add what matters"}</small></span><i>＋</i></summary>
          <div className="panel-body"><div className="note-meta"><span className={`save-pill ${saveState === "Saving…" ? "saving" : ""}`}>● {saveState}</span></div><textarea value={session.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Add workout note…" rows={4} aria-label="Workout note"/><p>Tap and use the iPhone keyboard microphone to dictate. No Save button needed.</p></div>
        </details>

        <details className="surface-card details-card">
          <summary><span><b>Workout details</b><small>Duration, distance, effort, video, or modification</small></span><i>＋</i></summary>
          <div className="details-body">
            <div className="field-grid"><label><span>Duration</span><div><input inputMode="numeric" value={session.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="—"/><em>min</em></div></label><label><span>Distance</span><div><input inputMode="decimal" value={session.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="—"/><em>mi</em></div></label></div>
            <div className="effort-row"><span>Perceived effort</span><div>{(["easy", "moderate", "hard"] as Effort[]).map((effort) => <button key={effort} className={session.effort === effort ? "selected" : ""} onClick={() => update({ effort: session.effort === effort ? "" : effort })}>{effort}</button>)}</div></div>
            <div className="secondary-actions"><button className={session.injury.impact ? "has-state" : ""} onClick={() => setShowInjury(!showInjury)}>⚑ {session.injury.impact ? `Modified · ${session.injury.impact}` : "Workout modified?"}</button><button onClick={() => setShowVideo(!showVideo)}>▶ Add YouTube reference</button></div>
            {showInjury && <div className="inline-sheet"><p className="sheet-title">How was the workout affected?</p><div className="sheet-options">{[["modified", "Modified"], ["stopped", "Stopped early"], ["prevented", "Unable to train"]].map(([value, label]) => <button key={value} className={session.injury.impact === value ? "selected" : ""} onClick={() => update({ injury: { ...session.injury, impact: value as Injury["impact"] } })}>{label}</button>)}</div><input value={session.injury.bodyArea} onChange={(e) => update({ injury: { ...session.injury, bodyArea: e.target.value } })} placeholder="Body area (optional)"/><textarea value={session.injury.note} onChange={(e) => update({ injury: { ...session.injury, note: e.target.value } })} placeholder="Add a dictated note…" rows={3}/>{session.injury.impact && <button className="text-button" onClick={() => update({ injury: { impact: "", bodyArea: "", note: "" } })}>Clear modification</button>}</div>}
            {showVideo && <div className="inline-sheet"><p className="sheet-title">Add a YouTube workout</p><input type="url" value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setVideoMessage(""); }} placeholder="Paste YouTube URL"/><input value={videoLabel} onChange={(e) => setVideoLabel(e.target.value)} placeholder="Your label (optional)"/><button className="compact-primary" onClick={attachVideo} disabled={attachingVideo}>{attachingVideo ? "Saving…" : "Save video + thumbnail"}</button>{videoMessage && <p className="video-message" role="status">{videoMessage}</p>}</div>}
            <div className="video-grid">{session.videos.map((video, i) => <VideoCard video={video} key={`${video.url}-${i}`}/>)}</div>
          </div>
        </details>

        <div className="finish-zone"><div className="save-status"><span>→</span><div><strong>Relentless Forward Progress</strong><small>{saveState} · local + private</small></div></div><div className="finish-actions"><button className="backup-button" onClick={backupToday}><span>↓</span>{dailyBackupState}</button><button onClick={finishWorkout} className={`finish-button ${session.status === "completed" || session.status === "rest" ? "done" : ""}`}>{session.status === "completed" || session.status === "rest" ? "✓ Day recorded" : plan.key === "rest" ? "Honor recovery" : "Finish workout"}<span>→</span></button></div></div>
      </div>}

      {tab === "week" && <WeekView today={today} sessions={history} currentSession={session} toggleExercise={toggleExercise} onOpenDate={openDate}/>}
      {tab === "history" && <HistoryView now={today} sessions={history} onOpenDate={openDate}/>}
      {tab === "more" && <MoreView ptExercises={ptExercises} setPtExercises={setPtExercises} sessions={history} setHistory={setHistory} onOpenLibrary={() => navigate("week")}/>}
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">{(["today", "week", "history", "more"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { if (item === "today") setActiveDate(today); navigate(item); }}><NavIcon name={item}/><small>{item[0].toUpperCase() + item.slice(1)}</small></button>)}</nav>
  </div>;
}

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const id = video.videoId || youtubeId(video.url);
  const thumbnail = video.thumbnailData || (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "");
  return <article className={`video-card ${playing ? "playing" : ""}`}>{playing && id ? <div className="inline-player"><iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={`${video.label} YouTube video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><button onClick={() => setPlaying(false)}>Close player</button></div> : <button className="video-launch" onClick={() => setPlaying(true)} aria-label={`Play ${video.label} inside Training for Life`}><span className="video-thumb">{thumbnail ? <img src={thumbnail} alt=""/> : null}<i>▶</i></span><span><strong>{video.label}</strong><small>{video.thumbnailData ? "Thumbnail saved · play here" : "YouTube · play here"}</small></span><b aria-hidden="true">›</b></button>}</article>;
}

function WeekView({ today, sessions, currentSession, toggleExercise, onOpenDate }: { today: Date; sessions: Session[]; currentSession: Session; toggleExercise: (name: string) => void; onOpenDate: (date: Date) => void }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const days = weekDates(today);
  return <div className="subpage week-page">
    <section className="page-intro colorful"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>One day.<br/>Then the next.</h1><p>The objective stays steady even when the activity changes. Tap any day to review or record it.</p></section>
    <section className="week-rhythm-card"><RhythmStrip focus={today} sessions={sessions} onOpen={onOpenDate}/><div className="rhythm-legend"><span><i className="completed"/>Complete</span><span><i className="modified"/>Modified</span><span><i className="protected"/>Protected</span><span><i className="rest"/>Rest</span></div></section>
    <section className="week-list">{days.map((date) => { const plan = schedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key); return <button key={dateKey(date)} className={`week-day-card ${plan.key}`} onClick={() => onOpenDate(date)}><span className="day-icon">{plan.icon}</span><span><small>{plan.short.toUpperCase()} · {date.getDate()}</small><strong>{plan.theme}</strong><em>{saved?.activity || plan.guidance}</em></span><i className={`week-status ${state}`}>{stateSymbol(state)}</i></button>; })}</section>
    <button className="library-toggle" onClick={() => setLibraryOpen(!libraryOpen)}><span><b>Mobility + exercise library</b><small>20 movement options for any day</small></span><i>{libraryOpen ? "−" : "+"}</i></button>
    {libraryOpen && <ExerciseLibrary session={currentSession} toggleExercise={toggleExercise}/>}
  </div>;
}

function ExerciseLibrary({ session, toggleExercise }: { session: Session; toggleExercise: (name: string) => void }) {
  return <div className="exercise-library"><div className="library-intro"><div><span className="kicker">MOVE WELL</span><h2>Exercise library</h2></div><p>Use a comfortable range, controlled movement, and an appropriate load.</p></div>{exerciseGroups.map((group, groupIndex) => <section className="library-group" key={group.title}><div className="group-title"><span>{String(groupIndex + 1).padStart(2, "0")}</span><div><h3>{group.title}</h3><p>{group.subtitle}</p></div></div><div className="library-list">{group.exercises.map(([name, equipment], index) => { const added = session.completedExercises.includes(name); return <button key={name} className={added ? "added" : ""} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark type={index + groupIndex}/></span><span><strong>{name}</strong><small>{equipment}</small></span><em>{added ? "✓ Added" : "+ Add"}</em></button>; })}</div></section>)}</div>;
}

function HistoryView({ now, sessions, onOpenDate }: { now: Date; sessions: Session[]; onOpenDate: (date: Date) => void }) {
  const [view, setView] = useState<"weeks" | "month">("weeks");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const adherent = sessions.filter((item) => ["completed", "rest"].includes(item.status) || item.injury.impact === "modified" || item.injury.impact === "prevented");
  const last30 = sessions.filter((item) => (now.getTime() - dateFromKey(item.date).getTime()) / 86400000 <= 30);
  const adherence = last30.length ? Math.round(last30.filter((item) => item.status !== "partial" || item.injury.impact === "prevented").length / last30.length * 100) : 0;
  const currentStreak = calculateStreak(sessions, now);
  const consistentWeeks = Array.from({ length: 8 }, (_, w) => { const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7); return Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return map.get(dateKey(d)); }).filter((s) => s?.status === "completed" || s?.injury.impact === "modified").length >= 5; }).filter(Boolean).length;
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const weekBlocks = Array.from({ length: 4 }, (_, w) => { const date = new Date(now); date.setDate(now.getDate() - w * 7); return weekDates(date); });
  return <div className="subpage history-page">
    <section className="page-intro"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>Your rhythm,<br/>over time.</h1><p>Progress is the pattern you return to—not a perfect streak.</p></section>
    <section className="insight-card"><span className="insight-icon">↗</span><div><span>LAST 30 DAYS</span><strong>{adherence}% on rhythm</strong><p>{adherent.length ? `${adherent.length} recorded days. Every return strengthens the pattern.` : "Record your first day to begin seeing the pattern."}</p></div></section>
    <section className="stat-row"><div><span>CURRENT RHYTHM</span><strong>{currentStreak}<small> days</small></strong></div><div><span>CONSISTENT WEEKS</span><strong>{consistentWeeks}<small> of 8</small></strong></div><div><span>RECORDED</span><strong>{sessions.length}<small> days</small></strong></div></section>
    <div className="history-controls"><div className="segmented"><button className={view === "weeks" ? "active" : ""} onClick={() => setView("weeks")}>Weeks</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button></div><button className={flaggedOnly ? "filter active" : "filter"} onClick={() => setFlaggedOnly(!flaggedOnly)}>⚑ Modified</button></div>
    {flaggedOnly ? <section className="flagged-list"><h2>Modified + protected workouts</h2>{sessions.filter((s) => s.injury.impact).length ? sessions.filter((s) => s.injury.impact).map((saved) => <button key={saved.id} onClick={() => onOpenDate(dateFromKey(saved.date))}><span className="status-mark modified">⚑</span><span><strong>{dateFromKey(saved.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {schedule[dateFromKey(saved.date).getDay()].theme}</strong><small>{saved.injury.bodyArea || saved.injury.impact} {saved.injury.note ? `· ${saved.injury.note}` : ""}</small></span><i>›</i></button>) : <p className="empty-state">No modified or injury-protected workouts yet.</p>}</section> : view === "weeks" ? <section className="multi-week">{weekBlocks.map((days, index) => <div className="week-scan" key={dateKey(days[0])}><div className="scan-heading"><span>{index === 0 ? "THIS WEEK" : `WEEK OF ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`}</span><b>{days.slice(0,6).filter((d) => ["completed", "modified"].includes(stateFor(map.get(dateKey(d)), schedule[d.getDay()].key))).length} / 6</b></div><div className="scan-days">{days.map((date) => { const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); return <button key={dateKey(date)} className={`${state} ${plan.key}`} onClick={() => onOpenDate(date)}><span>{plan.label}</span><strong>{date.getDate()}</strong><i>{stateSymbol(state)}</i></button>; })}</div></div>)}</section> : <section className="month-card"><div className="month-title"><div><span className="kicker">MONTH VIEW</span><h2>{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2></div><div className="legend"><span>● Complete</span><span>↗ Modified</span><span>R Rest</span></div></div><div className="calendar-grid">{["M","T","W","T","F","S","S"].map((day,index) => <b key={`${day}-${index}`}>{day}</b>)}{Array.from({ length: monthOffset }, (_, i) => <i key={`empty-${i}`}/>)}{Array.from({ length: monthDays }, (_, i) => { const date = new Date(now.getFullYear(), now.getMonth(), i + 1); const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); return <button className={`${state} ${plan.key} ${i + 1 === now.getDate() ? "today" : ""}`} key={i + 1} onClick={() => onOpenDate(date)}><em>{i + 1}</em><small>{stateSymbol(state)}</small></button>; })}</div></section>}
  </div>;
}

function calculateStreak(sessions: Session[], now: Date) {
  const map = new Map(sessions.map((item) => [item.date, item])); let streak = 0;
  for (let offset = 0; offset < 730; offset++) { const date = new Date(now); date.setDate(now.getDate() - offset); const plan = schedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key); if (["completed", "modified", "protected", "rest"].includes(state)) streak++; else if (offset === 0 && state === "missed") continue; else break; }
  return streak;
}

function MoreView({ ptExercises, setPtExercises, sessions, setHistory, onOpenLibrary }: { ptExercises: PtExercise[]; setPtExercises: React.Dispatch<React.SetStateAction<PtExercise[]>>; sessions: Session[]; setHistory: (sessions: Session[]) => void; onOpenLibrary: () => void }) {
  const [newPt, setNewPt] = useState(""); const [notice, setNotice] = useState("");
  const recentVideos = sessions.flatMap((s) => s.videos.map((video) => ({ ...video, date: s.date }))).slice(0, 6);
  async function exportData() { try { setNotice(await saveBackup(sessions, ptExercises)); } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setNotice("Backup could not be created. Please try again."); } }
  async function restoreData(file: File) { try { const payload = JSON.parse(await file.text()); if (payload.schemaVersion !== 1 || !Array.isArray(payload.sessions)) throw new Error(); await Promise.all(payload.sessions.map((item: Session) => saveSession(item))); if (Array.isArray(payload.ptExercises)) setPtExercises(payload.ptExercises); setHistory(payload.sessions); setNotice(`Restored ${payload.sessions.length} sessions from a validated backup.`); } catch { setNotice("That file is not a valid Training for Life backup."); } }
  return <div className="subpage more-page">
    <section className="page-intro"><span className="kicker">YOUR APP</span><h1>More</h1><p>Your movements, references, data, and privacy settings.</p></section>
    <section className="settings-card action-list"><button onClick={onOpenLibrary}><span className="setting-icon mobility">↗</span><span><strong>Exercise library</strong><small>20 mobility and strength movements</small></span><i>›</i></button><div><span className="setting-icon speed">5/6</span><span><strong>Weekly goal</strong><small>5 of 6 training days · rest protected</small></span><i>›</i></div></section>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon strength">PT</span><div><h2>My PT exercises</h2><p>Saved only on this device</p></div></div>{ptExercises.filter((item) => !item.archived).map((item) => <div className="pt-row" key={item.id}><div><input aria-label="Exercise name" value={item.name} onChange={(e) => setPtExercises((all) => all.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))}/><input aria-label="Prescription" value={item.prescription} onChange={(e) => setPtExercises((all) => all.map((x) => x.id === item.id ? { ...x, prescription: e.target.value } : x))}/></div><button onClick={() => setPtExercises((all) => all.map((x) => x.id === item.id ? { ...x, archived: true } : x))}>Archive</button></div>)}<div className="add-pt"><input value={newPt} onChange={(e) => setNewPt(e.target.value)} placeholder="Add a PT exercise"/><button onClick={() => { if (newPt.trim()) { setPtExercises((all) => [...all, { id: crypto.randomUUID(), name: newPt.trim(), prescription: "", archived: false }]); setNewPt(""); } }}>Add</button></div></section>
    {recentVideos.length > 0 && <section className="settings-card"><div className="settings-title"><span className="setting-icon video">▶</span><div><h2>Recent videos</h2><p>Quickly reopen past workout references</p></div></div><div className="video-grid">{recentVideos.map((video, i) => <VideoCard video={video} key={`${video.url}-${i}`}/>)}</div></section>}
    <section className="settings-card"><div className="settings-title"><span className="setting-icon data">↓</span><div><h2>Backup + restore</h2><p>Keep an external copy in Files or iCloud Drive</p></div></div><button className="wide-action primary" onClick={exportData}>Back up my data <span>↓</span></button><label className="wide-action file-action">Restore from backup <span>↑</span><input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && restoreData(e.target.files[0])}/></label>{notice && <p className="notice">✓ {notice}</p>}<p className="backup-note">The backup uses the same filename each time. iPhone Safari opens Save to Files so you can replace the previous copy; browsers with folder permission support remember the chosen file.</p></section>
    <section className="privacy-card"><span>LOCAL + PRIVATE</span><h2>Your history stays yours.</h2><p>No account. No analytics. No workout history uploaded to GitHub or a Training for Life server. Saving a YouTube thumbnail or playing an embedded video contacts YouTube/Google.</p><p className="disclaimer">This is a tracking tool, not medical advice. Use controlled movement and an appropriate load; stop for sharp pain and seek qualified care when needed.</p></section>
  </div>;
}

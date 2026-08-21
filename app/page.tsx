"use client";

import { useEffect, useRef, useState } from "react";

type Tab = "today" | "week" | "history" | "more";
type Effort = "" | "easy" | "moderate" | "hard";
type Status = "partial" | "completed" | "rest";
type Injury = { reported?: boolean; impact: "" | "modified" | "stopped" | "prevented"; bodyArea: string; note: string };
type GuideExercise = { name: string; displayName: string; timestamp: number; sets?: string; reps?: string; duration?: string; transcriptText: string; graphicUrl?: string; equipment?: string; instructions: string[] };
type WorkoutGuide = { generatedAt: string; transcriptSegments: number; exercises: GuideExercise[]; summary?: { rounds?: string; rest?: string; equipment?: string; position?: string }; notice: string };
type Video = { url: string; label: string; videoId?: string; thumbnailData?: string; guideStatus?: "analyzing" | "ready" | "failed"; guideError?: string; workoutGuide?: WorkoutGuide };
type Session = {
  id: string; date: string; activity: string; activities?: string[]; duration: string; distance: string; effort: Effort;
  notes: string; mobilityExercises: string[]; completedExercises: string[]; status: Status; injury: Injury; videos: Video[];
  updatedAt: string; completedAt?: string;
};
type LibraryExercise = { id: string; name: string; equipment: string };
type SavePickerWindow = Window & { showSaveFilePicker?: (options: { suggestedName: string; id: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> };

const schedule = [
  { short: "Sun", label: "S", theme: "Rest / Recovery", key: "rest", icon: "☾", guidance: "Rest is training, too. Easy walking and gentle recovery are welcome.", activities: ["Rest", "Easy walk", "Gentle mobility"] },
  { short: "Mon", label: "M", theme: "Mobility + Ride", key: "mobility", icon: "↗", guidance: "Move well, address what needs attention, and ride only if it serves you.", activities: ["Mobility", "Peloton HIIT", "Easy ride", "Other"] },
  { short: "Tue", label: "T", theme: "Easy Aerobic", key: "aerobic", icon: "≈", guidance: "30–45 minutes at a conversational, Zone 2 effort.", activities: ["Walk", "Easy run", "Peloton", "Bike", "Other"] },
  { short: "Wed", label: "W", theme: "Full-Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
  { short: "Thu", label: "T", theme: "Speed / Intensity", key: "speed", icon: "⚡", guidance: "Intervals, tempo, hills, Peloton HIIT or other speed work.", activities: ["Track intervals", "Tempo run", "Hill repeats", "Peloton HIIT", "Other"] },
  { short: "Fri", label: "F", theme: "Upper Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled upper-body strength work after Thursday’s leg-heavy effort.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Other"] },
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
    ["Walking", "Outside or treadmill"],
  ] },
] as const;
const defaultExerciseLibrary: LibraryExercise[] = exerciseGroups.flatMap((group) => group.exercises).map(([name, equipment], index) => ({ id: `exercise-${index + 1}`, name, equipment }));

function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateFromKey(key: string) { return new Date(`${key}T12:00:00`); }
function easternToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
}
function emptySession(date: string, rest = false): Session {
  return { id: date, date, activity: "", activities: [], duration: "", distance: "", effort: "", notes: "", mobilityExercises: [], completedExercises: [], status: rest ? "rest" : "partial", injury: { reported: false, impact: "", bodyArea: "", note: "" }, videos: [], updatedAt: new Date().toISOString() };
}
function normalizeSession(saved: Session): Session {
  const injury = saved.injury ?? { impact: "", bodyArea: "", note: "" };
  const reported = typeof injury.reported === "boolean" ? injury.reported : injury.impact === "stopped" || injury.impact === "prevented";
  const activities = saved.activities ?? (saved.activity ? [saved.activity] : []);
  const completedExercises = saved.completedExercises ?? [];
  const mobilityExercises = saved.mobilityExercises ?? completedExercises;
  return { ...saved, activity: activities.join(" + "), activities, mobilityExercises, completedExercises, videos: saved.videos ?? [], injury: { impact: injury.impact ?? "", bodyArea: injury.bodyArea ?? "", note: injury.note ?? "", reported } };
}
function weekDates(date: Date) {
  const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day; });
}
function youtubeId(url: string) { return url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/)?.[1] ?? ""; }
function blobAsDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
async function fetchYoutubeTitle(id: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;
  const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
  if (!response.ok) throw new Error("Video title unavailable");
  const metadata = await response.json() as { title?: string };
  if (!metadata.title?.trim()) throw new Error("Video title unavailable");
  return metadata.title.trim();
}
async function captureYoutubeThumbnail(id: string) {
  const response = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`);
  if (!response.ok) throw new Error("Thumbnail unavailable");
  return blobAsDataUrl(await response.blob());
}
async function fetchWorkoutGuide(videoUrl: string) {
  const localService = typeof window !== "undefined" && (window.location.hostname.endsWith("chatgpt.site") || ["localhost", "127.0.0.1"].includes(window.location.hostname));
  const service = localService ? "" : "https://training-4-life.tommy-tritone.chatgpt.site";
  const response = await fetch(`${service}/api/workout-guide`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ url: videoUrl }) });
  const payload = await response.json() as WorkoutGuide | { error?: string };
  if (!response.ok || !("exercises" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "Workout guide unavailable.");
  return payload;
}

const DB_NAME = "training-for-life";
const STORE = "sessions";
const APP_VERSION = "v1.4";
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
function backupFilename(now = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `training-for-life-backup-${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}_${part(now.getHours())}-${part(now.getMinutes())}-${part(now.getSeconds())}.json`;
}
function makeBackupFile(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[]) {
  const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), sessions, libraryExercises, futureVideos, settings: { weekStartsOn: "monday", adherenceThreshold: 5 } };
  return new File([JSON.stringify(payload, null, 2)], backupFilename(), { type: "application/json" });
}
async function saveBackup(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[]) {
  const file = makeBackupFile(sessions, libraryExercises, futureVideos);
  const pickerWindow = window as SavePickerWindow;
  if (pickerWindow.showSaveFilePicker) {
    const handle = await pickerWindow.showSaveFilePicker({ suggestedName: file.name, id: "training-for-life-daily-backup", types: [{ description: "Training for Life backup", accept: { "application/json": [".json"] } }] });
    const writable = await handle.createWritable(); await writable.write(file); await writable.close();
    return "Dated backup saved in your chosen location.";
  }
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Training for Life Backup" });
    return "Dated backup ready in Files.";
  }
  const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url);
  return "Dated backup downloaded.";
}

function stateFor(session: Session | undefined, planKey: string) {
  if (hasReportedInjury(session)) return "protected";
  if (session?.injury?.impact === "modified") return "modified";
  if (session?.status === "completed") return "completed";
  if (planKey === "rest" || session?.status === "rest") return "rest";
  if (session && (session.activity || session.notes || session.mobilityExercises.length || session.completedExercises.length)) return "partial";
  return "missed";
}
function hasReportedInjury(session: Session | undefined) { return session?.injury?.reported === true; }
function stateSymbol(state: string) { return state === "completed" ? "✓" : state === "modified" ? "↗" : state === "protected" ? "⚑" : state === "rest" ? "R" : state === "partial" ? "◐" : "·"; }
function stateLabel(state: string) { return state === "completed" ? "Complete" : state === "modified" ? "Adapted" : state === "protected" ? "Injury" : state === "rest" ? "Rest" : state === "partial" ? "In progress" : "Not logged"; }

function MovementMark({ type = 0 }: { type?: number }) {
  return <span className={`movement-mark pose-${type % 3}`} aria-hidden="true"><i className="head"/><i className="body"/><i className="arm a"/><i className="arm b"/><i className="leg a"/><i className="leg b"/></span>;
}
function NavIcon({ name }: { name: Tab }) {
  return <span aria-hidden="true">{name === "today" ? "●" : name === "week" ? "◫" : name === "history" ? "◷" : "•••"}</span>;
}

function RhythmStrip({ focus, today, sessions, onOpen }: { focus: Date; today: Date; sessions: Session[]; onOpen?: (date: Date) => void }) {
  const map = new Map(sessions.map((item) => [item.date, item]));
  return <div className="rhythm-strip" aria-label="This week’s training rhythm">
    {weekDates(focus).map((date) => { const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); const selected = dateKey(date) === dateKey(focus); const isToday = dateKey(date) === dateKey(today); return <button key={dateKey(date)} className={`${plan.key} ${state} ${selected ? "selected" : ""} ${isToday ? "actual-today" : ""}`} onClick={() => onOpen?.(date)} aria-current={isToday ? "date" : undefined} aria-label={`${plan.short} ${date.getDate()}, ${plan.theme}: ${stateLabel(state)}${isToday ? ", today" : ""}${selected ? ", selected" : ""}`}><span>{plan.label}<b>{date.getDate()}</b></span>{isToday && <em>TODAY</em>}</button>; })}
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
  const [showMobilityPicker, setShowMobilityPicker] = useState(false);
  const [mobilityDraft, setMobilityDraft] = useState<string[]>([]);
  const [openPanel, setOpenPanel] = useState<"workout" | "note" | "details" | "youtube" | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLabel, setVideoLabel] = useState("");
  const [videoMessage, setVideoMessage] = useState("");
  const [attachingVideo, setAttachingVideo] = useState(false);
  const [finishBackupState, setFinishBackupState] = useState("");
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>(defaultExerciseLibrary);
  const [futureVideos, setFutureVideos] = useState<Video[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoLabelEdited = useRef(false);

  useEffect(() => { const realToday = easternToday(); setToday(realToday); setActiveDate(realToday); }, []);
  useEffect(() => {
    setLoaded(false); setFinishBackupState(""); setShowMobilityPicker(false); setOpenPanel(null);
    getSession(activeKey).then((saved) => setSession(saved ? normalizeSession(saved) : emptySession(activeKey, plan.key === "rest"))).catch(() => {
      const fallback = localStorage.getItem(`t4l:${activeKey}`); setSession(fallback ? normalizeSession(JSON.parse(fallback)) : emptySession(activeKey, plan.key === "rest"));
    }).finally(() => { setLoaded(true); setSaveState("Saved on this device"); });
  }, [activeKey]);
  useEffect(() => {
    const savedLibrary = localStorage.getItem("t4l:library");
    if (savedLibrary) {
      const savedExercises = JSON.parse(savedLibrary) as LibraryExercise[];
      const newDefaults = defaultExerciseLibrary.filter((exercise) => !savedExercises.some((saved) => saved.id === exercise.id || saved.name.toLowerCase() === exercise.name.toLowerCase()));
      setLibraryExercises([...savedExercises, ...newDefaults]);
    }
    const savedFutureVideos = localStorage.getItem("t4l:future-videos"); if (savedFutureVideos) setFutureVideos(JSON.parse(savedFutureVideos));
  }, []);
  useEffect(() => {
    if (!loaded) return;
    setSaveState("Saving…"); if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const next = { ...session, updatedAt: new Date().toISOString() };
      saveSession(next).then(() => setSaveState("Saved on this device")).catch(() => { localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(next)); setSaveState("Saved on this device"); });
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [session, loaded, activeKey]);
  useEffect(() => { getAllSessions().then((items) => setHistory(items.map(normalizeSession).sort((a, b) => b.date.localeCompare(a.date)))).catch(() => setHistory([])); }, [tab, session]);
  useEffect(() => { localStorage.setItem("t4l:library", JSON.stringify(libraryExercises)); }, [libraryExercises]);
  useEffect(() => { localStorage.setItem("t4l:future-videos", JSON.stringify(futureVideos)); }, [futureVideos]);
  useEffect(() => {
    const id = youtubeId(videoUrl.trim());
    if (!id) return;
    let cancelled = false;
    setVideoMessage("Finding video title…");
    const timer = window.setTimeout(() => {
      fetchYoutubeTitle(id).then((title) => {
        if (cancelled || videoLabelEdited.current) return;
        setVideoLabel(title); setVideoMessage("Video title added automatically.");
      }).catch(() => { if (!cancelled) setVideoMessage("Title unavailable. You can add a label manually."); });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [videoUrl]);

  const update = (patch: Partial<Session>) => { setFinishBackupState(""); setSession((current) => ({ ...current, ...patch })); };
  const toggleActivity = (activity: string) => {
    const selected = session.activities ?? (session.activity ? [session.activity] : []);
    const activities = selected.includes(activity) ? selected.filter((item) => item !== activity) : [...selected, activity];
    update({ activities, activity: activities.join(" + ") });
  };
  const toggleMobilitySelection = (name: string) => {
    const selected = session.mobilityExercises.includes(name);
    update({
      mobilityExercises: selected ? session.mobilityExercises.filter((item) => item !== name) : [...session.mobilityExercises, name],
      completedExercises: selected ? session.completedExercises.filter((item) => item !== name) : session.completedExercises,
    });
  };
  const openMobilityPicker = () => { setMobilityDraft([...session.mobilityExercises]); setShowMobilityPicker(true); };
  const toggleMobilityDraft = (name: string) => setMobilityDraft((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  const applyMobilityDraft = () => {
    update({ mobilityExercises: mobilityDraft, completedExercises: session.completedExercises.filter((name) => mobilityDraft.includes(name)) });
    setShowMobilityPicker(false);
  };
  const toggleExercise = (name: string) => update({ completedExercises: session.completedExercises.includes(name) ? session.completedExercises.filter((item) => item !== name) : [...session.completedExercises, name] });
  const navigate = (next: Tab) => { setTab(next); window.scrollTo(0, 0); };
  const openDate = (date: Date) => { setActiveDate(date); setTab("today"); window.scrollTo(0, 0); };
  const finishAndBackup = async () => {
    setFinishBackupState("Choose backup location…");
    const now = new Date().toISOString();
    const current = { ...session, status: plan.key === "rest" ? "rest" as const : "completed" as const, completedAt: now, updatedAt: now };
    const allSessions = [...history.filter((item) => item.id !== current.id), current].sort((a, b) => b.date.localeCompare(a.date));
    try {
      await saveBackup(allSessions, libraryExercises, futureVideos);
      try { await saveSession(current); } catch { localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(current)); }
      setSession(current); setHistory(allSessions);
      setSaveState(plan.key === "rest" ? "Recovery day honored" : "Workout complete + saved");
      setFinishBackupState("✓ Day recorded + backup saved");
    } catch (error) { setFinishBackupState(error instanceof DOMException && error.name === "AbortError" ? "" : "Try Finish + Backup Again"); }
  };
  const attachVideo = async () => {
    const url = videoUrl.trim();
    const id = youtubeId(url);
    if (!id) { setVideoMessage("Paste a valid YouTube video link."); return; }
    setAttachingVideo(true); setVideoMessage("Saving video and starting workout guide…");
    let title = videoLabel.trim();
    if (!title) { try { title = await fetchYoutubeTitle(id); } catch { title = "Workout video"; } }
    let thumbnailData = "";
    try { thumbnailData = await captureYoutubeThumbnail(id); } catch { setVideoMessage("Video saved. The thumbnail will load when online."); }
    const videoIndex = session.videos.length;
    const video: Video = { url, label: title, videoId: id, thumbnailData, guideStatus: "analyzing" };
    update({ videos: [...session.videos, video] });
    videoLabelEdited.current = false; setVideoUrl(""); setVideoLabel(""); setAttachingVideo(false);
    setVideoMessage("Video saved. Reading the transcript and building your exercise list…");
    void analyzeVideo(videoIndex, video);
  };
  const analyzeVideo = async (videoIndex: number, video: Video) => {
    setSession((current) => ({ ...current, videos: current.videos.map((item, index) => index === videoIndex ? { ...item, guideStatus: "analyzing", guideError: undefined } : item) }));
    try {
      const workoutGuide = await fetchWorkoutGuide(video.url);
      setSession((current) => ({ ...current, videos: current.videos.map((item, index) => index === videoIndex ? { ...item, guideStatus: "ready", guideError: undefined, workoutGuide } : item) }));
      setVideoMessage(workoutGuide.exercises.length ? `Workout guide created with ${workoutGuide.exercises.length} exercises.` : "Transcript loaded, but no supported exercises were identified.");
    } catch (error) {
      const guideError = error instanceof Error ? error.message : "Workout guide unavailable. Try again later.";
      setSession((current) => ({ ...current, videos: current.videos.map((item, index) => index === videoIndex ? { ...item, guideStatus: "failed", guideError } : item) }));
      setVideoMessage(guideError);
    }
  };
  const deleteVideo = (sessionId: string, videoIndex: number) => {
    if (session.id === sessionId) {
      const next = { ...session, videos: session.videos.filter((_, index) => index !== videoIndex), updatedAt: new Date().toISOString() };
      void saveSession(next).catch(() => localStorage.setItem(`t4l:${next.date}`, JSON.stringify(next)));
      setSession(next);
      setHistory((items) => items.map((item) => item.id === sessionId ? next : item));
      setSaveState("Saved on this device");
      setVideoMessage("Video deleted.");
      return;
    }
    const saved = history.find((item) => item.id === sessionId);
    if (!saved) return;
    const next = { ...saved, videos: saved.videos.filter((_, index) => index !== videoIndex), updatedAt: new Date().toISOString() };
    setHistory((items) => items.map((item) => item.id === sessionId ? next : item));
    void saveSession(next).catch(() => localStorage.setItem(`t4l:${next.date}`, JSON.stringify(next)));
  };
  const addFutureVideoToToday = async (video: Video) => {
    const todayKey = dateKey(today);
    const todayPlan = schedule[today.getDay()];
    let saved: Session | undefined;
    try { saved = await getSession(todayKey); } catch { const fallback = localStorage.getItem(`t4l:${todayKey}`); saved = fallback ? JSON.parse(fallback) : undefined; }
    const current = session.id === todayKey ? session : saved ? normalizeSession(saved) : emptySession(todayKey, todayPlan.key === "rest");
    const videoId = video.videoId || youtubeId(video.url);
    if (current.videos.some((item) => (item.videoId || youtubeId(item.url)) === videoId)) return "That video is already in today’s workout.";
    const next = { ...current, videos: [...current.videos, { ...video }], updatedAt: new Date().toISOString() };
    try { await saveSession(next); } catch { localStorage.setItem(`t4l:${todayKey}`, JSON.stringify(next)); }
    if (session.id === todayKey) setSession(next);
    setHistory((items) => [next, ...items.filter((item) => item.id !== todayKey)].sort((a, b) => b.date.localeCompare(a.date)));
    return `Added “${video.label}” to today’s workout.`;
  };
  const activeIsToday = activeKey === dateKey(today);
  const weekMap = new Map(history.map((item) => [item.date, item]));
  const completedThisWeek = weekDates(today).filter((date) => { const saved = weekMap.get(dateKey(date)); return Boolean(saved && ["completed", "modified", "rest", "protected"].includes(stateFor(saved, schedule[date.getDay()].key))); }).length;
  const injuryReported = hasReportedInjury(session);
  const handleInjuryControl = () => {
    const next = { ...session, injury: { ...session.injury, reported: !injuryReported }, updatedAt: new Date().toISOString() };
    setFinishBackupState(""); setSession(next); void saveSession(next).catch(() => localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(next)));
    setShowInjury(!injuryReported);
  };
  const updateInjury = (injury: Injury) => {
    const next = { ...session, injury, updatedAt: new Date().toISOString() };
    setFinishBackupState(""); setSession(next); void saveSession(next).catch(() => localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(next)));
  };
  const clearInjury = () => {
    updateInjury({ reported: false, impact: "", bodyArea: "", note: "" });
    setShowInjury(false);
  };
  const togglePanel = (panel: "workout" | "note" | "details" | "youtube", open: boolean) => setOpenPanel((current) => open ? panel : current === panel ? null : current);

  return <div className={`app-shell theme-${plan.key}`}>
    <header className="brand-bar">
      <button className="wordmark" onClick={() => { setActiveDate(today); navigate("today"); }} aria-label={`Training for Life ${APP_VERSION} — go to Today`}><span className="brand-mark">T4L</span><span><b>Training</b> for Life <small className="app-version">{APP_VERSION}</small></span></button>
      <span className="privacy-dot"><i/>Relentless Forward Progress</span>
    </header>
    <main>
      {tab === "today" && <div className="today-page">
        {!activeIsToday && <div className="editing-banner"><span>Viewing {activeDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span><button onClick={() => setActiveDate(today)}>Return to today</button></div>}
        <section className={`today-hero ${plan.key}`}>
          <div className="hero-topline"><div><span>{activeDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</span><time>{activeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</time></div><div className="rhythm-score"><span><strong>{completedThisWeek} / 7</strong> DAYS ON RHYTHM</span><i><b style={{ width: `${Math.round(completedThisWeek / 7 * 100)}%` }}/></i></div></div>
          <div className="hero-main"><div><span className="category-icon" aria-hidden="true">{plan.icon}</span><h1>{plan.theme}</h1><p>{plan.guidance}</p></div></div>
          <div className="theme-mantra"><span>→</span> Relentless Forward Progress</div>
          <RhythmStrip focus={activeDate} today={today} sessions={history} onOpen={openDate}/>
        </section>

        <div className="control-row workout-mobility-row">
          <details className="surface-card compact-panel activity-card" open={openPanel === "workout"} onToggle={(e) => togglePanel("workout", e.currentTarget.open)}>
            <summary><span className="panel-icon">{plan.icon}</span><span><b>Choose Workout</b><small>{session.activity || "Select one or more"}</small></span><i>＋</i></summary>
            <div className="panel-body"><div className="activity-grid">{plan.activities.map((activity) => { const selected = (session.activities ?? (session.activity ? [session.activity] : [])).includes(activity); return <button key={activity} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleActivity(activity)}><span>{selected ? "✓" : plan.icon}</span>{activity}</button>; })}</div></div>
          </details>
          <button className={`mobility-loader ${showMobilityPicker ? "active" : ""}`} onClick={openMobilityPicker} aria-expanded={showMobilityPicker}><span>↗</span><b>Load Mobility</b><small>{session.mobilityExercises.length ? `${session.mobilityExercises.length} loaded` : "Choose exercises"}</small></button>
        </div>

        {session.mobilityExercises.length > 0 && <DailyMobility session={session} exercises={libraryExercises} toggleExercise={toggleExercise} onEdit={openMobilityPicker}/>}

        <div className="control-row note-details-row">
          <details className="surface-card compact-panel note-card" open={openPanel === "note"} onToggle={(e) => togglePanel("note", e.currentTarget.open)}>
            <summary><span className="panel-icon">✎</span><span><b>Add note</b><small>{session.notes || "Add what matters"}</small></span><i>＋</i></summary>
            <div className="panel-body"><div className="note-meta"><span className={`save-pill ${saveState === "Saving…" ? "saving" : ""}`}>● {saveState}</span></div><textarea value={session.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Add workout note…" rows={4} aria-label="Workout note"/><p>Tap and use the iPhone keyboard microphone to dictate. No Save button needed.</p></div>
          </details>

          <details className="surface-card details-card" open={openPanel === "details"} onToggle={(e) => togglePanel("details", e.currentTarget.open)}>
            <summary><span><b>Add details</b><small>Time, distance, effort</small></span><i>＋</i></summary>
            <div className="details-body">
              <div className="field-grid"><label><span>Duration</span><div><input inputMode="numeric" value={session.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="—"/><em>min</em></div></label><label><span>Distance</span><div><input inputMode="decimal" value={session.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="—"/><em>mi</em></div></label></div>
              <div className="effort-row"><span>Perceived effort</span><div>{(["easy", "moderate", "hard"] as Effort[]).map((effort) => <button key={effort} className={session.effort === effort ? "selected" : ""} onClick={() => update({ effort: session.effort === effort ? "" : effort })}>{effort}</button>)}</div></div>
            </div>
          </details>
        </div>

        <div className="control-row youtube-injury-row">
          <details className="surface-card details-card youtube-card" open={openPanel === "youtube"} onToggle={(e) => togglePanel("youtube", e.currentTarget.open)}>
            <summary><span><b>YouTube</b><small>{session.videos.length ? `${session.videos.length} saved` : "Add a video"}</small></span><i>＋</i></summary>
            <div className="details-body"><div className="inline-sheet"><p className="sheet-title">Add a YouTube workout</p><input type="url" value={videoUrl} onChange={(e) => { videoLabelEdited.current = false; setVideoUrl(e.target.value); setVideoLabel(""); setVideoMessage(""); }} placeholder="Paste YouTube URL"/><input aria-label="YouTube video label" value={videoLabel} onChange={(e) => { videoLabelEdited.current = true; setVideoLabel(e.target.value); }} placeholder="Video title loads automatically"/><button className="compact-primary" onClick={attachVideo} disabled={attachingVideo}>{attachingVideo ? "Saving…" : "Save video + build guide"}</button>{videoMessage && <p className="video-message" role="status">{videoMessage}</p>}</div><div className="video-grid">{session.videos.map((video, i) => <VideoCard video={video} onDelete={() => deleteVideo(session.id, i)} onRetry={() => analyzeVideo(i, video)} key={`${video.url}-${i}`}/>)}</div></div>
          </details>
          <div className={`injury-control ${injuryReported ? "active" : ""}`}><button className="injury-toggle" onClick={handleInjuryControl} aria-pressed={injuryReported}><span>⚑</span><span><b>Injury</b><small>{injuryReported ? "Reported" : "No injury"}</small></span><i/></button>{injuryReported && <button className="injury-expand" onClick={() => setShowInjury(!showInjury)}>{showInjury ? "Hide" : "Details"}</button>}</div>
        </div>
        {injuryReported && showInjury && <section className="surface-card injury-details-card"><div className="injury-heading"><div><span className="kicker">INJURY DETAILS</span><h2>What happened?</h2></div><button onClick={() => setShowInjury(false)} aria-label="Hide injury details">×</button></div><p>Did the injury stop today’s workout?</p><div className="sheet-options injury-options">{[["stopped", "Stopped early"], ["prevented", "Couldn’t start"]].map(([value, label]) => <button key={value} className={session.injury.impact === value ? "selected" : ""} onClick={() => updateInjury({ ...session.injury, reported: true, impact: session.injury.impact === value ? "" : value as Injury["impact"] })}>{label}</button>)}</div><input aria-label="Injured body area" value={session.injury.bodyArea} onChange={(e) => updateInjury({ ...session.injury, reported: true, bodyArea: e.target.value })} placeholder="Body area (optional)"/><textarea aria-label="Injury note" value={session.injury.note} onChange={(e) => updateInjury({ ...session.injury, reported: true, note: e.target.value })} placeholder="Add an injury note…" rows={3}/><button className="text-button" onClick={clearInjury}>Clear injury data</button></section>}

        <div className="finish-zone primary-finish"><div className="finish-actions"><button onClick={finishAndBackup} className={`finish-button ${session.status === "completed" || session.status === "rest" ? "done" : ""}`}><span>↓</span>{finishBackupState || (session.status === "completed" || session.status === "rest" ? "Finish + Backup Again" : plan.key === "rest" ? "Honor Recovery + Backup" : "Finish Workout + Backup")}<span>→</span></button></div></div>
      </div>}

      {showMobilityPicker && <MobilityPicker exercises={libraryExercises} selected={mobilityDraft} toggleExercise={toggleMobilityDraft} onDone={applyMobilityDraft} onCancel={() => setShowMobilityPicker(false)}/>}

      {tab === "week" && <WeekView today={today} sessions={history} currentSession={session} exercises={libraryExercises} toggleExercise={toggleMobilitySelection} onOpenDate={openDate}/>}
      {tab === "history" && <HistoryView now={today} sessions={history} onOpenDate={openDate}/>}
      {tab === "more" && <MoreView libraryExercises={libraryExercises} setLibraryExercises={setLibraryExercises} futureVideos={futureVideos} setFutureVideos={setFutureVideos} sessions={history} setHistory={setHistory} onDeleteVideo={deleteVideo} onAddToToday={addFutureVideoToToday}/>}
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">{(["today", "week", "history", "more"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { if (item === "today") setActiveDate(today); navigate(item); }}><NavIcon name={item}/><small>{item[0].toUpperCase() + item.slice(1)}</small></button>)}</nav>
  </div>;
}

function formatTimestamp(seconds: number) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, "0")}`; }

function VideoCard({ video, onDelete, onRetry, onAddToday }: { video: Video; onDelete?: () => void; onRetry?: () => void; onAddToday?: () => void }) {
  const cardRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const id = video.videoId || youtubeId(video.url);
  const thumbnail = video.thumbnailData || (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "");
  const playFrom = (seconds = 0) => {
    setStartAt(seconds);
    setPlaying(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };
  return <article ref={cardRef} className={`video-card ${playing ? "playing" : ""} ${video.workoutGuide ? "has-guide" : ""}`}>
    {playing && id ? <div className="inline-player"><iframe key={`${id}-${startAt}`} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&start=${startAt}`} title={`${video.label} — starting at ${formatTimestamp(startAt)}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><button onClick={() => setPlaying(false)}>Close player</button></div> : <button className="video-launch" onClick={() => playFrom()} aria-label={`Play ${video.label} inside Training for Life`}><span className="video-thumb">{thumbnail ? <img src={thumbnail} alt=""/> : null}<i>▶</i></span><span><strong>{video.label}</strong><small>{video.workoutGuide?.exercises.length ? `${video.workoutGuide.exercises.length} exercise guide · play here` : video.thumbnailData ? "Thumbnail saved · play here" : "YouTube · play here"}</small></span><b aria-hidden="true">›</b></button>}
    {video.guideStatus === "analyzing" && <div className="guide-status analyzing" role="status"><span>↻</span><div><strong>Building workout guide</strong><small>Reading the transcript and identifying exercises…</small></div></div>}
    {video.guideStatus === "failed" && <div className="guide-status failed" role="alert"><div><strong>Workout guide unavailable</strong><small>{video.guideError || "The transcript could not be read."}</small></div>{onRetry && <button onClick={onRetry}>Retry</button>}</div>}
    {video.workoutGuide && <details className="workout-guide" open><summary><span><strong>Workout guide</strong><small>{video.workoutGuide.exercises.length} exercises identified</small></span><i>⌄</i></summary><div className="workout-guide-body">{video.workoutGuide.summary && Object.values(video.workoutGuide.summary).some(Boolean) && <ul className="guide-structure">{video.workoutGuide.summary.equipment && <li><b>Equipment</b><span>{video.workoutGuide.summary.equipment}</span></li>}{video.workoutGuide.summary.position && <li><b>Position</b><span>{video.workoutGuide.summary.position}</span></li>}{video.workoutGuide.summary.rounds && <li><b>Rounds</b><span>{video.workoutGuide.summary.rounds}</span></li>}{video.workoutGuide.summary.rest && <li><b>Rest</b><span>{video.workoutGuide.summary.rest}</span></li>}</ul>}{video.workoutGuide.exercises.length ? <ol className="guide-exercise-list">{video.workoutGuide.exercises.map((exercise, index) => <li className={`guide-exercise ${exercise.graphicUrl ? "" : "text-only"}`} key={`${exercise.name}-${exercise.timestamp}`}>{exercise.graphicUrl ? <span className="guide-graphic"><img src={exercise.graphicUrl} alt={`${exercise.displayName} demonstration`}/></span> : <span className="guide-bullet" aria-hidden="true">•</span>}<div><small>EXERCISE {index + 1} · {formatTimestamp(exercise.timestamp)}</small><strong>{exercise.displayName}</strong><p>{[exercise.sets && `${exercise.sets} sets`, exercise.reps && `${exercise.reps} reps`, exercise.duration].filter(Boolean).join(" · ") || "Sets and reps were not clearly stated"}</p>{exercise.equipment && <em>{exercise.equipment}</em>}{exercise.instructions[0] && <span>{exercise.instructions[0].replace(/^Step:\s*\d+\s*/i, "")}</span>}<button onClick={() => playFrom(exercise.timestamp)}>Watch from {formatTimestamp(exercise.timestamp)}</button></div></li>)}</ol> : <p className="empty-state">The transcript loaded, but no exercise sequence could be identified.</p>}<p className="guide-disclaimer">{video.workoutGuide.notice}</p></div></details>}
    {onAddToday && <button className="video-add-today" onClick={onAddToday}>＋ Add to today’s workout</button>}
    {onDelete && (confirmingDelete ? <div className="video-delete-confirm"><span>Delete this video?</span><button onClick={() => setConfirmingDelete(false)}>Cancel</button><button className="danger" onClick={onDelete}>Delete</button></div> : <button className="video-delete" onClick={() => setConfirmingDelete(true)} aria-label={`Delete ${video.label}`}>Delete video</button>)}
  </article>;
}

function MobilityPicker({ exercises, selected, toggleExercise, onDone, onCancel }: { exercises: LibraryExercise[]; selected: string[]; toggleExercise: (name: string) => void; onDone: () => void; onCancel: () => void }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const previous = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [onCancel]);
  const filtered = exercises.filter(({ name, equipment }) => `${name} ${equipment}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mobility-sheet-backdrop" onClick={onCancel}><section className="mobility-sheet" role="dialog" aria-modal="true" aria-labelledby="mobility-sheet-title" onClick={(e) => e.stopPropagation()}><div className="mobility-sheet-header"><div><span className="kicker">MOBILITY LIBRARY</span><h2 id="mobility-sheet-title">Choose your exercises</h2><p>Select as many as you want for this day.</p></div><button onClick={onCancel} aria-label="Close mobility library">×</button></div><div className="mobility-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" aria-label="Search mobility exercises"/></div><div className="library-list mobility-sheet-list">{filtered.map(({ id, name, equipment }, index) => { const added = selected.includes(name); return <button key={id} className={added ? "added" : ""} aria-pressed={added} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark type={index}/></span><span><strong>{name}</strong><small>{equipment}</small></span><em>{added ? "✓ Added" : "+ Add"}</em></button>; })}{filtered.length === 0 && <p className="empty-state">No exercises match that search.</p>}</div><div className="mobility-sheet-footer"><span>{selected.length} selected</span><button onClick={onDone}>Add selected exercises</button></div></section></div>;
}

function DailyMobility({ session, exercises, toggleExercise, onEdit }: { session: Session; exercises: LibraryExercise[]; toggleExercise: (name: string) => void; onEdit: () => void }) {
  const complete = session.mobilityExercises.filter((name) => session.completedExercises.includes(name)).length;
  const equipment = new Map(exercises.map((exercise) => [exercise.name, exercise.equipment]));
  return <details className="surface-card daily-mobility" open><summary><span><b>Mobility exercises</b><small>{complete} of {session.mobilityExercises.length} completed</small></span><i>⌄</i></summary><div className="daily-mobility-body"><div className="checklist">{session.mobilityExercises.map((name, index) => { const checked = session.completedExercises.includes(name); return <button key={name} className={checked ? "checked" : ""} aria-pressed={checked} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark type={index}/></span><span className="exercise-copy"><strong>{name}</strong><small>{equipment.get(name) || "Mobility exercise"}</small></span><span className="check-target">{checked ? "✓" : ""}</span></button>; })}</div><button className="edit-mobility" onClick={onEdit}>Edit loaded exercises</button></div></details>;
}

function WeekView({ today, sessions, currentSession, exercises, toggleExercise, onOpenDate }: { today: Date; sessions: Session[]; currentSession: Session; exercises: LibraryExercise[]; toggleExercise: (name: string) => void; onOpenDate: (date: Date) => void }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const days = weekDates(today);
  return <div className="subpage week-page">
    <section className="page-intro colorful"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>One day.<br/>Then the next.</h1><p>The objective stays steady even when the activity changes. Tap any day to review or record it.</p></section>
    <section className="week-rhythm-card"><RhythmStrip focus={today} today={today} sessions={sessions} onOpen={onOpenDate}/></section>
    <section className="week-list">{days.map((date) => { const plan = schedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key); return <button key={dateKey(date)} className={`week-day-card ${plan.key}`} onClick={() => onOpenDate(date)}><span className="day-icon">{plan.icon}</span><span><small>{plan.short.toUpperCase()} · {date.getDate()}</small><strong>{plan.theme}</strong><em>{saved?.activity || plan.guidance}</em></span><i className={`week-status ${state}`}>{stateLabel(state)}</i></button>; })}</section>
    <button className="library-toggle" onClick={() => setLibraryOpen(!libraryOpen)}><span><b>Mobility + exercise library</b><small>{exercises.length} movement options for any day</small></span><i>{libraryOpen ? "−" : "+"}</i></button>
    {libraryOpen && <ExerciseLibrary session={currentSession} exercises={exercises} toggleExercise={toggleExercise}/>}
  </div>;
}

function ExerciseLibrary({ session, exercises, toggleExercise }: { session: Session; exercises: LibraryExercise[]; toggleExercise: (name: string) => void }) {
  return <div className="exercise-library"><div className="library-intro"><div><span className="kicker">MOVE WELL</span><h2>Exercise library</h2></div><p>One library for any day. Use a comfortable range, controlled movement, and an appropriate load.</p></div><div className="library-list unified-library">{exercises.map(({ id, name, equipment }, index) => { const added = session.mobilityExercises.includes(name); return <button key={id} className={added ? "added" : ""} aria-pressed={added} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark type={index}/></span><span><strong>{name}</strong><small>{equipment}</small></span><em>{added ? "✓ Added" : "+ Add"}</em></button>; })}</div></div>;
}

function HistoryView({ now, sessions, onOpenDate }: { now: Date; sessions: Session[]; onOpenDate: (date: Date) => void }) {
  const [view, setView] = useState<"weeks" | "month">("weeks");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const adherent = sessions.filter((item) => ["completed", "rest"].includes(item.status) || hasReportedInjury(item) || item.injury.impact === "modified");
  const last30 = sessions.filter((item) => (now.getTime() - dateFromKey(item.date).getTime()) / 86400000 <= 30);
  const adherence = last30.length ? Math.round(last30.filter((item) => item.status !== "partial" || hasReportedInjury(item)).length / last30.length * 100) : 0;
  const currentStreak = calculateStreak(sessions, now);
  const consistentWeeks = Array.from({ length: 8 }, (_, w) => { const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7); return Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return map.get(dateKey(d)); }).filter((s) => s?.status === "completed" || hasReportedInjury(s) || s?.injury.impact === "modified").length >= 5; }).filter(Boolean).length;
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const weekBlocks = Array.from({ length: 4 }, (_, w) => { const date = new Date(now); date.setDate(now.getDate() - w * 7); return weekDates(date); });
  return <div className="subpage history-page">
    <section className="page-intro"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>Your rhythm,<br/>over time.</h1><p>Progress is the pattern you return to—not a perfect streak.</p></section>
    <section className="insight-card"><span className="insight-icon">↗</span><div><span>LAST 30 DAYS</span><strong>{adherence}% on rhythm</strong><p>{adherent.length ? `${adherent.length} recorded days. Every return strengthens the pattern.` : "Record your first day to begin seeing the pattern."}</p></div></section>
    <section className="stat-row"><div><span>CURRENT RHYTHM</span><strong>{currentStreak}<small> {currentStreak === 1 ? "day" : "days"}</small></strong></div><div><span>CONSISTENT WEEKS</span><strong>{consistentWeeks}<small> of 8</small></strong></div><div><span>RECORDED</span><strong>{sessions.length}<small> {sessions.length === 1 ? "day" : "days"}</small></strong></div></section>
    <div className="history-controls"><div className="segmented"><button className={view === "weeks" ? "active" : ""} onClick={() => setView("weeks")}>Weeks</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button></div><button className={flaggedOnly ? "filter active" : "filter"} onClick={() => setFlaggedOnly(!flaggedOnly)}>⚑ Injuries</button></div>
    {flaggedOnly ? <section className="flagged-list"><h2>Injury-affected workouts</h2>{sessions.filter(hasReportedInjury).length ? sessions.filter(hasReportedInjury).map((saved) => <button key={saved.id} onClick={() => onOpenDate(dateFromKey(saved.date))}><span className="status-mark modified">⚑</span><span><strong>{dateFromKey(saved.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {schedule[dateFromKey(saved.date).getDay()].theme}</strong><small>{saved.injury.bodyArea || (saved.injury.impact === "prevented" ? "Couldn’t start" : saved.injury.impact === "stopped" ? "Stopped early" : "Injury reported")} {saved.injury.note ? `· ${saved.injury.note}` : ""}</small></span><i>›</i></button>) : <p className="empty-state">No injury-affected workouts yet.</p>}</section> : view === "weeks" ? <section className="multi-week">{weekBlocks.map((days, index) => <div className="week-scan" key={dateKey(days[0])}><div className="scan-heading"><span>{index === 0 ? "THIS WEEK" : `WEEK OF ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`}</span><b>{days.slice(0,6).filter((d) => ["completed", "modified", "protected"].includes(stateFor(map.get(dateKey(d)), schedule[d.getDay()].key))).length} / 6</b></div><div className="scan-days">{days.map((date) => { const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); return <button key={dateKey(date)} className={`${state} ${plan.key}`} onClick={() => onOpenDate(date)}><span>{plan.label}</span><strong>{date.getDate()}</strong><i>{stateSymbol(state)}</i></button>; })}</div></div>)}</section> : <section className="month-card"><div className="month-title"><div><span className="kicker">MONTH VIEW</span><h2>{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2></div><div className="legend"><span>● Complete</span><span>⚑ Injury</span><span>R Rest</span></div></div><div className="calendar-grid">{["M","T","W","T","F","S","S"].map((day,index) => <b key={`${day}-${index}`}>{day}</b>)}{Array.from({ length: monthOffset }, (_, i) => <i key={`empty-${i}`}/>)}{Array.from({ length: monthDays }, (_, i) => { const date = new Date(now.getFullYear(), now.getMonth(), i + 1); const plan = schedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key); return <button className={`${state} ${plan.key} ${i + 1 === now.getDate() ? "today" : ""}`} key={i + 1} onClick={() => onOpenDate(date)}><em>{i + 1}</em><small>{stateSymbol(state)}</small></button>; })}</div></section>}
  </div>;
}

function calculateStreak(sessions: Session[], now: Date) {
  const map = new Map(sessions.map((item) => [item.date, item])); let streak = 0;
  for (let offset = 0; offset < 730; offset++) { const date = new Date(now); date.setDate(now.getDate() - offset); const plan = schedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key); if (["completed", "modified", "protected", "rest"].includes(state)) streak++; else if (offset === 0 && state === "missed") continue; else break; }
  return streak;
}

function MoreView({ libraryExercises, setLibraryExercises, futureVideos, setFutureVideos, sessions, setHistory, onDeleteVideo, onAddToToday }: { libraryExercises: LibraryExercise[]; setLibraryExercises: React.Dispatch<React.SetStateAction<LibraryExercise[]>>; futureVideos: Video[]; setFutureVideos: React.Dispatch<React.SetStateAction<Video[]>>; sessions: Session[]; setHistory: React.Dispatch<React.SetStateAction<Session[]>>; onDeleteVideo: (sessionId: string, videoIndex: number) => void; onAddToToday: (video: Video) => Promise<string> }) {
  const [newExercise, setNewExercise] = useState(""); const [newEquipment, setNewEquipment] = useState(""); const [notice, setNotice] = useState("");
  const [futureUrl, setFutureUrl] = useState(""); const [futureNotice, setFutureNotice] = useState(""); const [savingFutureVideo, setSavingFutureVideo] = useState(false);
  const recentVideos = sessions.flatMap((s) => s.videos.map((video, videoIndex) => ({ ...video, sessionId: s.id, videoIndex }))).slice(0, 6);
  const updateExercise = (id: string, patch: Partial<LibraryExercise>) => setLibraryExercises((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addExercise = () => { if (!newExercise.trim()) return; setLibraryExercises((items) => [...items, { id: crypto.randomUUID(), name: newExercise.trim(), equipment: newEquipment.trim() || "No equipment listed" }]); setNewExercise(""); setNewEquipment(""); };
  const updateFutureVideo = (url: string, patch: Partial<Video>) => setFutureVideos((items) => items.map((item) => item.url === url ? { ...item, ...patch } : item));
  async function saveFutureVideo() {
    const url = futureUrl.trim(); const videoId = youtubeId(url);
    if (!videoId) { setFutureNotice("Paste a valid YouTube video link."); return; }
    if (futureVideos.some((video) => (video.videoId || youtubeId(video.url)) === videoId)) { setFutureNotice("That video is already saved for later."); return; }
    setSavingFutureVideo(true); setFutureNotice("Saving video…");
    let label = "Workout video"; let thumbnailData = "";
    try { label = await fetchYoutubeTitle(videoId); } catch { /* Keep a useful fallback label. */ }
    try { thumbnailData = await captureYoutubeThumbnail(videoId); } catch { /* YouTube's live thumbnail remains available. */ }
    const video: Video = { url, label, videoId, thumbnailData, guideStatus: "analyzing" };
    setFutureVideos((items) => [video, ...items]); setFutureUrl(""); setSavingFutureVideo(false); setFutureNotice("Saved for later. Building its workout guide…");
    try {
      const workoutGuide = await fetchWorkoutGuide(url);
      updateFutureVideo(url, { guideStatus: "ready", guideError: undefined, workoutGuide });
      setFutureNotice(`Saved for later with ${workoutGuide.exercises.length} exercises.`);
    } catch (error) {
      const guideError = error instanceof Error ? error.message : "Workout guide unavailable.";
      updateFutureVideo(url, { guideStatus: "failed", guideError });
      setFutureNotice("Video saved for later. Its workout guide can be retried.");
    }
  }
  async function retryFutureVideo(video: Video) {
    updateFutureVideo(video.url, { guideStatus: "analyzing", guideError: undefined }); setFutureNotice("Rebuilding workout guide…");
    try {
      const workoutGuide = await fetchWorkoutGuide(video.url);
      updateFutureVideo(video.url, { guideStatus: "ready", workoutGuide }); setFutureNotice("Workout guide is ready.");
    } catch (error) {
      const guideError = error instanceof Error ? error.message : "Workout guide unavailable.";
      updateFutureVideo(video.url, { guideStatus: "failed", guideError }); setFutureNotice("The workout guide could not be built. The video is still saved.");
    }
  }
  async function addFutureToToday(video: Video) {
    if (video.guideStatus === "analyzing") { setFutureNotice("The workout guide is still building. Add it when the guide is ready."); return; }
    setFutureNotice(await onAddToToday(video));
  }
  async function restoreData(file: File) { try { const payload = JSON.parse(await file.text()); if (payload.schemaVersion !== 1 || !Array.isArray(payload.sessions)) throw new Error(); const restored = payload.sessions.map((item: Session) => normalizeSession(item)); await Promise.all(restored.map(saveSession)); if (Array.isArray(payload.libraryExercises)) { const restoredLibrary = payload.libraryExercises.filter((item: LibraryExercise) => item?.id && item?.name).map((item: LibraryExercise) => ({ id: item.id, name: item.name, equipment: item.equipment || "No equipment listed" })); localStorage.setItem("t4l:library", JSON.stringify(restoredLibrary)); setLibraryExercises(restoredLibrary); } if (Array.isArray(payload.futureVideos)) { const restoredVideos = payload.futureVideos.filter((item: Video) => item?.url && item?.label); localStorage.setItem("t4l:future-videos", JSON.stringify(restoredVideos)); setFutureVideos(restoredVideos); } setHistory(restored); setNotice(`Restored ${restored.length} sessions. Reloading your plan…`); window.setTimeout(() => window.location.reload(), 700); } catch { setNotice("That file is not a valid Training for Life backup."); } }
  return <div className="subpage more-page">
    <section className="page-intro"><span className="kicker">YOUR APP</span><h1>More</h1><p>Manage your mobility library, saved videos, and restored data.</p></section>
    <details className="settings-card library-manager"><summary><span className="setting-icon mobility">↗</span><span><strong>Mobility library</strong><small>{libraryExercises.length} exercises · add or edit</small></span><i>＋</i></summary><p className="library-editor-help">Add a new mobility exercise here, or tap any existing name or equipment line to edit it.</p><div className="add-library-exercise"><input value={newExercise} onChange={(e) => setNewExercise(e.target.value)} placeholder="New mobility exercise" aria-label="New mobility exercise"/><input value={newEquipment} onChange={(e) => setNewEquipment(e.target.value)} placeholder="Equipment or instructions" aria-label="New mobility exercise equipment or instructions"/><button onClick={addExercise}>Add mobility exercise</button></div><div className="library-editor-list">{libraryExercises.map((exercise) => <div className="library-editor-row" key={exercise.id}><span className="exercise-visual"><MovementMark type={libraryExercises.indexOf(exercise)}/></span><div><input aria-label="Mobility exercise name" value={exercise.name} onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}/><input aria-label="Equipment or instructions" value={exercise.equipment} onChange={(e) => updateExercise(exercise.id, { equipment: e.target.value })}/></div></div>)}</div></details>
    <section className="settings-card future-video-card"><div className="settings-title"><span className="setting-icon video">▶</span><div><h2>Future workout videos</h2><p>Save a YouTube link now and add it to today when you’re ready</p></div></div><div className="future-video-form"><input type="url" value={futureUrl} onChange={(e) => setFutureUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void saveFutureVideo(); }} placeholder="Paste YouTube URL" aria-label="YouTube URL for a future workout"/><button onClick={() => void saveFutureVideo()} disabled={savingFutureVideo}>{savingFutureVideo ? "Saving…" : "Save for later"}</button></div>{futureNotice && <p className="notice" role="status">{futureNotice}</p>}{futureVideos.length ? <div className="video-grid future-video-grid">{futureVideos.map((video, index) => <VideoCard video={video} onAddToday={() => void addFutureToToday(video)} onDelete={() => setFutureVideos((items) => items.filter((_, itemIndex) => itemIndex !== index))} onRetry={() => void retryFutureVideo(video)} key={`${video.url}-${index}`}/>)}</div> : <p className="empty-state">No future workout videos saved yet.</p>}</section>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon video">▶</span><div><h2>Recent videos</h2><p>Quickly reopen past workout references</p></div></div>{recentVideos.length ? <div className="video-grid">{recentVideos.map((video) => <VideoCard video={video} onDelete={() => onDeleteVideo(video.sessionId, video.videoIndex)} key={`${video.sessionId}-${video.videoIndex}`}/>)}</div> : <p className="empty-state">Videos added to a workout will appear here.</p>}</section>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon data">↑</span><div><h2>Restore from backup</h2><p>Reload workouts, mobility exercises, and future videos from a saved file</p></div></div><label className="wide-action file-action">Choose backup file <span>↑</span><input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && restoreData(e.target.files[0])}/></label>{notice && <p className="notice">✓ {notice}</p>}<p className="backup-note">Choose your newest dated Training for Life backup. Restoring replaces the app’s saved workout history, mobility library, and future video library with the file’s contents.</p></section>
    <section className="privacy-card"><span>LOCAL + PRIVATE</span><h2>Your history stays yours.</h2><p>No account. No analytics. No workout history is uploaded. To build a workout guide, the video link is sent to the Training for Life transcript helper and exercise names are matched with ExerciseDB. The finished guide is saved only on this device and in your backup.</p><p className="disclaimer">This is a tracking tool, not medical advice. Use controlled movement and an appropriate load; stop for sharp pain and seek qualified care when needed.</p></section>
  </div>;
}

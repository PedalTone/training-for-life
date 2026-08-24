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
  plannedKey?: string; plannedTheme?: string;
  pace?: string; calories?: string; startTime?: string; detailSource?: string;
  notes: string; mobilityExercises: string[]; completedExercises: string[]; status: Status; injury: Injury; videos: Video[];
  updatedAt: string; completedAt?: string;
};
type LibraryExercise = { id: string; name: string; equipment: string; referencePhotoData?: string; graphicDescription?: string; graphicData?: string; graphicReviewStatus?: "pending" | "reviewed" };
type InsightRecommendation = { title: string; reason: string; action: string };
type TrainingInsightReport = {
  id: string; generatedAt: string; periodDays: 0 | 30 | 90; sessionsAnalyzed: number;
  headline: string; summary: string; wins: string[]; patterns: string[];
  recommendations: InsightRecommendation[]; cautions: string[]; dataQuality: string;
};
type FitnessGoals = { primaryGoal: string; priorities: string; constraints: string; updatedAt: string };
type ScreenshotWorkout = {
  activity: string; date: string; startTime: string; distance: string; duration: string; pace: string; calories: string;
  source: string; confidence: "high" | "medium" | "low"; warnings: string[];
};
type SavePickerWindow = Window & { showSaveFilePicker?: (options: { suggestedName: string; id: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> };

const schedule = [
  { short: "Sun", label: "S", theme: "Rest / Recovery", key: "rest", icon: "☾", guidance: "Rest is training, too. Easy walking and gentle recovery are welcome.", activities: ["Rest", "Easy walk", "Gentle mobility", "Bike"] },
  { short: "Mon", label: "M", theme: "Mobility + Ride", key: "mobility", icon: "↗", guidance: "Move well, address what needs attention, and ride only if it serves you.", activities: ["Mobility", "Peloton HIIT", "Easy ride", "Bike", "Other"] },
  { short: "Tue", label: "T", theme: "Easy Aerobic", key: "aerobic", icon: "≈", guidance: "30–45 minutes at a conversational, Zone 2 effort.", activities: ["Walk", "Easy run", "Peloton", "Bike", "Other"] },
  { short: "Wed", label: "W", theme: "Full-Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Bike", "Other"] },
  { short: "Thu", label: "T", theme: "Speed / Intensity", key: "speed", icon: "⚡", guidance: "Intervals, tempo, hills, Peloton HIIT or other speed work.", activities: ["Track intervals", "Tempo run", "Hill repeats", "Peloton HIIT", "Bike", "Other"] },
  { short: "Fri", label: "F", theme: "Upper Body Strength", key: "strength", icon: "◆", guidance: "20–30 minutes of controlled upper-body strength work after Thursday’s leg-heavy effort.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Bike", "Other"] },
  { short: "Sat", label: "S", theme: "Endurance", key: "endurance", icon: "∞", guidance: "60+ minutes of steady aerobic work. Choose the activity that fits today.", activities: ["Run", "Bike", "Peloton", "Hike / hike-run", "Swim", "Other"] },
] as const;
type Schedule = typeof schedule;
type ScheduleSnapshot = { effectiveDate: string; keys: string[] };
const defaultScheduleKeys = schedule.map((plan) => plan.key);
const scheduleTypeOptions = [
  { key: "rest", label: "Rest / Recovery" }, { key: "mobility", label: "Mobility + Ride" },
  { key: "aerobic", label: "Easy Aerobic" }, { key: "strength", label: "Strength" },
  { key: "speed", label: "Speed / Intensity" }, { key: "endurance", label: "Endurance" },
];
function scheduleForKeys(keys: string[]): Schedule {
  return schedule.map((fallback, index) => {
    // Keep the calendar day identity (Sun…Sat) tied to its column even when
    // the user remaps that day to another workout type. This avoids Friday
    // being rendered with Wednesday's label when both use Strength.
    if (!keys[index] || keys[index] === fallback.key) return fallback;
    const match = schedule.find((candidate) => candidate.key === keys[index]);
    return match ? { ...match, short: fallback.short, label: fallback.label } : fallback;
  }) as Schedule;
}
function scheduleForDate(date: Date, current: Schedule, history: ScheduleSnapshot[]) {
  if (dateKey(date) >= dateKey(easternToday())) return current;
  const snapshot = [...history].filter((item) => item.effectiveDate <= dateKey(date)).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
  return snapshot ? scheduleForKeys(snapshot.keys) : current;
}
function historicalPlan(saved: Session | undefined, activeSchedule: Schedule, date?: Date) {
  const fallback = saved?.plannedKey ? schedule.find((plan) => plan.key === saved.plannedKey) : undefined;
  const current = activeSchedule[saved ? dateFromKey(saved.date).getDay() : date?.getDay() ?? 0];
  return saved?.plannedTheme || fallback ? { ...current, key: saved?.plannedKey || fallback?.key || current.key, theme: saved?.plannedTheme || fallback?.theme || current.theme } : current;
}

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
    ["Walking", "Outside or treadmill"], ["Deep Squat", "Bodyweight"],
  ] },
] as const;
const defaultExerciseLibrary: LibraryExercise[] = exerciseGroups.flatMap((group) => group.exercises).map(([name, equipment], index) => ({ id: `exercise-${index + 1}`, name, equipment }));
const exerciseIconFiles: Record<string, string> = {
  "exercise-1": "block-up-overs.png", "exercise-2": "plank-to-rotation.png", "exercise-3": "scapular-push-up.png",
  "exercise-4": "overhead-press.png", "exercise-5": "i-t-y.png", "exercise-6": "face-pulls.png", "exercise-7": "swimmers.png",
  "exercise-8": "open-book.png", "exercise-9": "banded-7s.png", "exercise-10": "windmill.png", "exercise-11": "kb-waiter.png",
  "exercise-12": "crossovers.png", "exercise-13": "push-ups.png", "exercise-14": "bench-press.png", "exercise-15": "hollow-body-hold.png",
  "exercise-16": "wall-slide.png", "exercise-17": "dead-hang.png", "exercise-18": "balance.png", "exercise-19": "farmers-carry.png",
  "exercise-20": "side-plank.png", "exercise-21": "walking.png",
  "exercise-22": "deep-squat.png",
};
const defaultExerciseIdByName = new Map(defaultExerciseLibrary.map((exercise) => [exercise.name, exercise.id]));

function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateFromKey(key: string) { return new Date(`${key}T12:00:00`); }
function easternToday() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12);
}
function emptySession(date: string, rest = false, plan = scheduleForKeys(defaultScheduleKeys)[dateFromKey(date).getDay()]): Session {
  return { id: date, date, plannedKey: plan.key, plannedTheme: plan.theme, activity: "", activities: [], duration: "", distance: "", effort: "", notes: "", mobilityExercises: [], completedExercises: [], status: rest ? "rest" : "partial", injury: { reported: false, impact: "", bodyArea: "", note: "" }, videos: [], updatedAt: new Date().toISOString() };
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
async function fetchWorkoutGuide(videoUrl: string, videoTitle = "") {
  const localService = typeof window !== "undefined" && (window.location.hostname.endsWith("chatgpt.site") || ["localhost", "127.0.0.1"].includes(window.location.hostname));
  const service = localService ? "" : "https://training-4-life.tommy-tritone.chatgpt.site";
  const response = await fetch(`${service}/api/workout-guide`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ url: videoUrl, title: videoTitle }) });
  const payload = await response.json() as WorkoutGuide | { error?: string };
  if (!response.ok || !("exercises" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "Workout guide unavailable.");
  return payload;
}
async function fetchTrainingInsights(sessions: Session[], periodDays: 0 | 30 | 90, accessCode: string, goals: FitnessGoals, activeSchedule: Schedule) {
  const localService = typeof window !== "undefined" && (window.location.hostname.endsWith("chatgpt.site") || ["localhost", "127.0.0.1"].includes(window.location.hostname));
  const service = localService ? "" : "https://training-4-life.tommy-tritone.chatgpt.site";
  const compactSessions = sessions.map((saved) => ({
    date: saved.date, plannedTheme: saved.plannedTheme || historicalPlan(saved, activeSchedule, dateFromKey(saved.date)).theme, status: saved.status,
    activities: saved.activities ?? (saved.activity ? [saved.activity] : []), duration: saved.duration, distance: saved.distance, pace: saved.pace, calories: saved.calories, startTime: saved.startTime, effort: saved.effort,
    notes: saved.notes, mobilityExercises: saved.mobilityExercises, completedExercises: saved.completedExercises,
    injury: { reported: hasReportedInjury(saved), impact: saved.injury.impact, bodyArea: saved.injury.bodyArea, note: saved.injury.note },
  }));
  const response = await fetch(`${service}/api/training-insights`, { method: "POST", headers: { "Content-Type": "application/json", "X-Training-Insights-Key": accessCode }, body: JSON.stringify({ sessions: compactSessions, periodDays, goals: { primaryGoal: goals.primaryGoal.slice(0, 500), priorities: goals.priorities.slice(0, 1000), constraints: goals.constraints.slice(0, 1000) } }) });
  const payload = await response.json() as Omit<TrainingInsightReport, "id"> | { error?: string };
  if (!response.ok || !("headline" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "AI insights are temporarily unavailable.");
  return { ...payload, id: `${periodDays}-${Date.now()}` } as TrainingInsightReport;
}
async function fetchScreenshotWorkout(imageData: string, accessCode: string) {
  const localService = typeof window !== "undefined" && (window.location.hostname.endsWith("chatgpt.site") || ["localhost", "127.0.0.1"].includes(window.location.hostname));
  const service = localService ? "" : "https://training-4-life.tommy-tritone.chatgpt.site";
  const response = await fetch(`${service}/api/workout-screenshot`, { method: "POST", headers: { "Content-Type": "application/json", "X-Training-Insights-Key": accessCode }, body: JSON.stringify({ imageData }) });
  const payload = await response.json() as ScreenshotWorkout | { error?: string };
  if (!response.ok || !("confidence" in payload)) throw new Error("error" in payload && payload.error ? payload.error : "The screenshot could not be read.");
  return payload;
}
async function prepareScreenshot(file: Blob) {
  if (!file.type.startsWith("image/")) throw new Error("Choose or paste an image.");
  if (file.size > 20_000_000) throw new Error("That image is too large. Try a regular screenshot.");
  const source = await blobAsDataUrl(file);
  const image = new Image(); image.src = source; await image.decode();
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .84);
}
async function prepareExerciseReference(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 20_000_000) throw new Error("That image is too large. Try a regular photo.");
  const source = await blobAsDataUrl(file);
  const image = new Image(); image.src = source; await image.decode();
  const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .78);
}

const DB_NAME = "training-for-life";
const STORE = "sessions";
const APP_VERSION = "v1.32";
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
async function loadAllSessions() {
  const indexed = await getAllSessions().catch(() => [] as Session[]);
  const legacy = Object.keys(localStorage).filter((key) => /^t4l:\d{4}-\d{2}-\d{2}$/.test(key)).flatMap((key) => {
    try { const parsed = JSON.parse(localStorage.getItem(key) || "null"); return parsed?.date ? [normalizeSession(parsed as Session)] : []; } catch { return []; }
  });
  // A session can exist in both stores after an older browser/app version or
  // a failed IndexedDB write. Prefer the record with the most recent update,
  // and use the richer record when timestamps are missing or identical. This
  // prevents an empty/rest placeholder in IndexedDB from masking a populated
  // workout saved in the legacy localStorage fallback.
  const richness = (item: Session) => [item.activity, item.duration, item.distance, item.notes, item.pace, item.calories, ...(item.activities || []), ...(item.mobilityExercises || []), ...(item.completedExercises || []), ...(item.videos || [])].filter(Boolean).length + (item.status === "completed" ? 10 : 0) + (hasReportedInjury(item) ? 5 : 0);
  const merged = new Map<string, Session>();
  for (const item of [...indexed, ...legacy].map(normalizeSession)) {
    const existing = merged.get(item.id);
    if (!existing) { merged.set(item.id, item); continue; }
    const itemTime = Date.parse(item.updatedAt || "") || 0;
    const existingTime = Date.parse(existing.updatedAt || "") || 0;
    if (itemTime > existingTime || (itemTime === existingTime && richness(item) > richness(existing))) merged.set(item.id, item);
  }
  return [...merged.values()].sort((a, b) => b.date.localeCompare(a.date));
}
function backupFilename(now = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `training-for-life-backup-${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}_${part(now.getHours())}-${part(now.getMinutes())}-${part(now.getSeconds())}.json`;
}
function makeBackupFile(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[], insightReports: TrainingInsightReport[], goals: FitnessGoals, scheduleKeys: string[]) {
  const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), sessions, libraryExercises, futureVideos, insightReports, goals, scheduleKeys, settings: { weekStartsOn: "monday", adherenceThreshold: 5 } };
  return new File([JSON.stringify(payload, null, 2)], backupFilename(), { type: "application/json" });
}
async function saveBackup(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[], insightReports: TrainingInsightReport[], goals: FitnessGoals, scheduleKeys: string[]) {
  const file = makeBackupFile(sessions, libraryExercises, futureVideos, insightReports, goals, scheduleKeys);
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

function stateFor(session: Session | undefined, planKey: string, date?: Date, today?: Date) {
  if (hasReportedInjury(session)) return "protected";
  if (session?.injury?.impact === "modified") return "modified";
  if (session?.status === "completed") return "completed";
  const hasRecordedWork = Boolean(session && (session.activity || session.duration || session.distance || session.notes || session.mobilityExercises.length || session.completedExercises.length || session.videos.length));
  // Older records could carry a rest placeholder status even after workout
  // details were added. Let the recorded data win over that placeholder.
  if (hasRecordedWork) return "partial";
  // A scheduled future recovery day is meaningful before it is logged. For a
  // past day with no saved session, show it as unlogged instead of implying
  // that a rest day was recorded.
  if (session?.status === "rest" || (planKey === "rest" && (!date || !today || dateKey(date) >= dateKey(today)))) return "rest";
  return "missed";
}
function hasReportedInjury(session: Session | undefined) { return session?.injury?.reported === true; }
function stateSymbol(state: string) { return state === "completed" ? "✓" : state === "modified" ? "↗" : state === "protected" ? "⚑" : state === "rest" ? "R" : state === "partial" ? "◐" : "·"; }
function stateLabel(state: string) { return state === "completed" ? "Complete" : state === "modified" ? "Adapted" : state === "protected" ? "Injury" : state === "rest" ? "Rest" : state === "partial" ? "In progress" : "Not logged"; }

function MovementMark({ exerciseId, name, graphicData }: { exerciseId?: string; name: string; graphicData?: string }) {
  if (graphicData) return <img className="exercise-icon" src={graphicData} alt="" aria-hidden="true"/>;
  const iconFile = exerciseIconFiles[exerciseId || ""] || exerciseIconFiles[defaultExerciseIdByName.get(name) || ""] || "custom-mobility.png";
  if (iconFile) return <img className="exercise-icon" src={`./exercise-icons/${iconFile}`} alt="" aria-hidden="true"/>;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "MOVE";
  return <span className="movement-fallback" aria-hidden="true"><b>{initials}</b><i>↗</i></span>;
}
function NavIcon({ name }: { name: Tab }) {
  return <span aria-hidden="true">{name === "today" ? "●" : name === "week" ? "◫" : name === "history" ? "◷" : "•••"}</span>;
}

function RhythmStrip({ focus, today, sessions, activeSchedule, onOpen }: { focus: Date; today: Date; sessions: Session[]; activeSchedule: Schedule; onOpen?: (date: Date) => void }) {
  const map = new Map(sessions.map((item) => [item.date, item]));
  return <div className="rhythm-strip" aria-label="This week’s training rhythm">
    {weekDates(focus).map((date) => { const plan = activeSchedule[date.getDay()]; const state = stateFor(map.get(dateKey(date)), plan.key, date, today); const selected = dateKey(date) === dateKey(focus); const isToday = dateKey(date) === dateKey(today); return <button key={dateKey(date)} className={`${plan.key} ${state} ${selected ? "selected" : ""} ${isToday ? "actual-today" : ""}`} onClick={() => onOpen?.(date)} aria-current={isToday ? "date" : undefined} aria-label={`${plan.short} ${date.getDate()}, ${plan.theme}: ${stateLabel(state)}${isToday ? ", today" : ""}${selected ? ", selected" : ""}`}><span>{plan.label}<b>{date.getDate()}</b></span>{isToday && <em>TODAY</em>}</button>; })}
  </div>;
}

export default function Home() {
  const [today, setToday] = useState(() => new Date(2026, 7, 20, 12));
  const [activeDate, setActiveDate] = useState(() => new Date(2026, 7, 20, 12));
  const activeKey = dateKey(activeDate);
  const [scheduleKeys, setScheduleKeys] = useState<string[]>(defaultScheduleKeys);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduleSnapshot[]>([]);
  const activeSchedule = scheduleForKeys(scheduleKeys);
  const setScheduleKeysWithHistory: React.Dispatch<React.SetStateAction<string[]>> = (update) => {
    setScheduleKeys((current) => {
      const next = typeof update === "function" ? update(current) : update;
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        const effectiveDate = dateKey(easternToday());
        setScheduleHistory((items) => [...items.filter((item) => item.effectiveDate !== effectiveDate), { effectiveDate, keys: next }].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate)));
      }
      return next;
    });
  };
  const plan = activeSchedule[activeDate.getDay()];
  const [tab, setTab] = useState<Tab>("today");
  const [session, setSession] = useState<Session>(() => emptySession(activeKey, plan.key === "rest", plan));
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
  const [insightReports, setInsightReports] = useState<TrainingInsightReport[]>([]);
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoals>({ primaryGoal: "", priorities: "", constraints: "", updatedAt: "" });
  const [screenshotState, setScreenshotState] = useState<"idle" | "reading" | "review">("idle");
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotWorkout, setScreenshotWorkout] = useState<ScreenshotWorkout | null>(null);
  const [screenshotError, setScreenshotError] = useState("");
  const [screenshotAccessCode, setScreenshotAccessCode] = useState("");
  const [hasScreenshotAccess, setHasScreenshotAccess] = useState(false);
  const screenshotInput = useRef<HTMLInputElement>(null);
  const pasteTarget = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoLabelEdited = useRef(false);

  useEffect(() => { const realToday = easternToday(); setToday(realToday); setActiveDate(realToday); const savedCode = localStorage.getItem("t4l:insights-access") || ""; setScreenshotAccessCode(savedCode); setHasScreenshotAccess(Boolean(savedCode)); }, []);
  useEffect(() => {
    setLoaded(false); setFinishBackupState(""); setShowMobilityPicker(false); setOpenPanel(null);
    getSession(activeKey).then((saved) => setSession(saved ? normalizeSession(saved) : emptySession(activeKey, plan.key === "rest", plan))).catch(() => {
      const fallback = localStorage.getItem(`t4l:${activeKey}`); setSession(fallback ? normalizeSession(JSON.parse(fallback)) : emptySession(activeKey, plan.key === "rest", plan));
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
    const savedInsightReports = localStorage.getItem("t4l:insight-reports"); if (savedInsightReports) setInsightReports(JSON.parse(savedInsightReports));
    const savedGoals = localStorage.getItem("t4l:fitness-goals"); if (savedGoals) setFitnessGoals({ primaryGoal: "", priorities: "", constraints: "", updatedAt: "", ...JSON.parse(savedGoals) });
    let loadedScheduleKeys = defaultScheduleKeys;
    const savedSchedule = localStorage.getItem("t4l:schedule"); if (savedSchedule) { try { const parsed = JSON.parse(savedSchedule); if (Array.isArray(parsed) && parsed.length === 7) { loadedScheduleKeys = parsed.map(String); setScheduleKeys(loadedScheduleKeys); } } catch { /* Use the default schedule. */ } }
    const savedScheduleHistory = localStorage.getItem("t4l:schedule-history");
    if (savedScheduleHistory) { try { const parsed = JSON.parse(savedScheduleHistory); if (Array.isArray(parsed)) setScheduleHistory(parsed.filter((item) => item?.effectiveDate && Array.isArray(item.keys) && item.keys.length === 7).map((item) => ({ effectiveDate: String(item.effectiveDate), keys: item.keys.map(String) }))); } catch { /* Use the current schedule. */ } }
    else setScheduleHistory([{ effectiveDate: dateKey(easternToday()), keys: loadedScheduleKeys }]);
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
  useEffect(() => { loadAllSessions().then(setHistory).catch(() => setHistory([])); }, [tab, session]);
  useEffect(() => { localStorage.setItem("t4l:library", JSON.stringify(libraryExercises)); }, [libraryExercises]);
  useEffect(() => { localStorage.setItem("t4l:future-videos", JSON.stringify(futureVideos)); }, [futureVideos]);
  useEffect(() => { localStorage.setItem("t4l:insight-reports", JSON.stringify(insightReports)); }, [insightReports]);
  useEffect(() => { localStorage.setItem("t4l:fitness-goals", JSON.stringify(fitnessGoals)); }, [fitnessGoals]);
  useEffect(() => { localStorage.setItem("t4l:schedule", JSON.stringify(scheduleKeys)); }, [scheduleKeys]);
  useEffect(() => { if (scheduleHistory.length) localStorage.setItem("t4l:schedule-history", JSON.stringify(scheduleHistory)); }, [scheduleHistory]);
  useEffect(() => {
    const effectiveDate = dateKey(easternToday());
    setScheduleHistory((items) => {
      const currentSnapshot = items.find((item) => item.effectiveDate === effectiveDate);
      if (currentSnapshot && JSON.stringify(currentSnapshot.keys) === JSON.stringify(scheduleKeys)) return items;
      return [...items.filter((item) => item.effectiveDate !== effectiveDate), { effectiveDate, keys: [...scheduleKeys] }].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
    });
  }, [scheduleKeys]);
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
      await saveBackup(allSessions, libraryExercises, futureVideos, insightReports, fitnessGoals, scheduleKeys);
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
    const todayPlan = activeSchedule[today.getDay()];
    let saved: Session | undefined;
    try { saved = await getSession(todayKey); } catch { const fallback = localStorage.getItem(`t4l:${todayKey}`); saved = fallback ? JSON.parse(fallback) : undefined; }
    const current = session.id === todayKey ? session : saved ? normalizeSession(saved) : emptySession(todayKey, todayPlan.key === "rest", todayPlan);
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
  const completedThisWeek = weekDates(today).filter((date) => { const saved = weekMap.get(dateKey(date)); return Boolean(saved && ["completed", "modified", "rest", "protected"].includes(stateFor(saved, activeSchedule[date.getDay()].key))); }).length;
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
  const readScreenshot = async (file: Blob) => {
    setOpenPanel("details"); setScreenshotState("reading"); setScreenshotError("");
    try {
      const imageData = await prepareScreenshot(file); setScreenshotPreview(imageData);
      const accessCode = screenshotAccessCode.trim();
      if (!accessCode) throw new Error("Enter your personal AI access code below, then try again.");
      localStorage.setItem("t4l:insights-access", accessCode);
      const extracted = await fetchScreenshotWorkout(imageData, accessCode);
      setHasScreenshotAccess(true); setScreenshotWorkout(extracted); setScreenshotState("review");
    } catch (error) { setScreenshotState("idle"); setScreenshotPreview(""); setScreenshotError(error instanceof Error ? error.message : "The screenshot could not be read."); }
  };
  const pasteScreenshot = async () => {
    setScreenshotError("");
    try {
      if (!navigator.clipboard?.read) throw new Error();
      const items = await navigator.clipboard.read();
      const item = items.find((entry) => entry.types.some((type) => type.startsWith("image/")));
      const type = item?.types.find((value) => value.startsWith("image/"));
      if (!item || !type) throw new Error();
      await readScreenshot(await item.getType(type));
    } catch { pasteTarget.current?.focus(); setScreenshotError("Tap the box below, then choose Paste."); }
  };
  const applyScreenshot = () => {
    if (!screenshotWorkout) return;
    const extractedActivity = screenshotWorkout.activity.trim();
    const activities = session.activities?.length ? session.activities : extractedActivity ? [extractedActivity] : [];
    update({ activities, activity: activities.join(" + "), duration: screenshotWorkout.duration || session.duration, distance: screenshotWorkout.distance || session.distance, pace: screenshotWorkout.pace || session.pace, calories: screenshotWorkout.calories || session.calories, startTime: screenshotWorkout.startTime || session.startTime, detailSource: screenshotWorkout.source || session.detailSource });
    setScreenshotWorkout(null); setScreenshotPreview(""); setScreenshotState("idle"); setScreenshotError(""); setOpenPanel("details");
  };
  const closeScreenshot = () => { setScreenshotWorkout(null); setScreenshotPreview(""); setScreenshotState("idle"); };
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
          <RhythmStrip focus={activeDate} today={today} sessions={history} activeSchedule={activeSchedule} onOpen={openDate}/>
        </section>

        <div className="control-row workout-mobility-row">
          <details className="surface-card compact-panel activity-card" open={openPanel === "workout"} onToggle={(e) => togglePanel("workout", e.currentTarget.open)}>
            <summary><span className="panel-icon">{plan.icon}</span><span><b>Choose</b><small>{session.activity || "Select one or more"}</small></span><i>＋</i></summary>
            <div className="panel-body"><div className="activity-grid">{plan.activities.map((activity) => { const selected = (session.activities ?? (session.activity ? [session.activity] : [])).includes(activity); return <button key={activity} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleActivity(activity)}><span>{selected ? "✓" : plan.icon}</span>{activity}</button>; })}</div></div>
          </details>
          <button className={`mobility-loader ${showMobilityPicker ? "active" : ""}`} onClick={openMobilityPicker} aria-expanded={showMobilityPicker}><span>↗</span><b>Load Mobility</b><small>{session.mobilityExercises.length ? `${session.mobilityExercises.length} loaded` : "Choose exercises"}</small></button>
        </div>

        {session.mobilityExercises.length > 0 && <DailyMobility session={session} exercises={libraryExercises} toggleExercise={toggleExercise} onEdit={openMobilityPicker}/>}

        <div className="control-row note-details-row">
          <details className="surface-card compact-panel note-card" open={openPanel === "note"} onToggle={(e) => togglePanel("note", e.currentTarget.open)}>
            <summary><span className="panel-icon">✎</span><span><b>Note</b><small>{session.notes || "Add what matters"}</small></span><i>＋</i></summary>
            <div className="panel-body"><div className="note-meta"><span className={`save-pill ${saveState === "Saving…" ? "saving" : ""}`}>● {saveState}</span></div><textarea value={session.notes} onChange={(e) => update({ notes: e.target.value })} placeholder="Add workout note…" rows={4} aria-label="Workout note"/><p>Tap and use the iPhone keyboard microphone to dictate. No Save button needed.</p></div>
          </details>

          <details className="surface-card details-card" open={openPanel === "details"} onToggle={(e) => togglePanel("details", e.currentTarget.open)}>
            <summary><span><b>Details</b><small>{session.duration || session.distance || session.pace ? "Workout data added" : "Type or import a screenshot"}</small></span><i>＋</i></summary>
            <div className="details-body">
              <section className="screenshot-import"><div><strong>Import workout screenshot</strong><small>Paste one you copied, or choose one from Photos.</small></div>{!hasScreenshotAccess && <label className="screenshot-access"><span>Personal AI access code · once per device</span><input type="password" value={screenshotAccessCode} onChange={(event) => setScreenshotAccessCode(event.target.value)} placeholder="Enter access code" autoComplete="off"/></label>}<div className="screenshot-actions"><button onClick={() => void pasteScreenshot()} disabled={screenshotState === "reading"}>Paste screenshot</button><button onClick={() => screenshotInput.current?.click()} disabled={screenshotState === "reading"}>Choose from Photos</button></div><input ref={screenshotInput} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readScreenshot(file); event.currentTarget.value = ""; }}/><div ref={pasteTarget} className="paste-target" contentEditable suppressContentEditableWarning onPaste={(event) => { event.preventDefault(); const file = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"))?.getAsFile(); if (file) void readScreenshot(file); else setScreenshotError("The clipboard does not contain an image."); }} aria-label="Paste a workout screenshot here">Tap here, then Paste</div>{screenshotState === "reading" && <p className="screenshot-status" role="status"><span/>Reading workout details…</p>}{screenshotError && <p className="screenshot-error" role="alert">{screenshotError}</p>}</section>
              <div className="field-grid"><label><span>Duration</span><div><input value={session.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="—"/></div></label><label><span>Distance</span><div><input value={session.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="—"/></div></label><label><span>Pace</span><div><input value={session.pace ?? ""} onChange={(e) => update({ pace: e.target.value })} placeholder="—"/></div></label><label><span>Calories</span><div><input inputMode="numeric" value={session.calories ?? ""} onChange={(e) => update({ calories: e.target.value })} placeholder="—"/></div></label><label><span>Start time</span><div><input value={session.startTime ?? ""} onChange={(e) => update({ startTime: e.target.value })} placeholder="—"/></div></label></div>
              <div className="effort-row"><span>Perceived effort</span><div>{(["easy", "moderate", "hard"] as Effort[]).map((effort) => <button key={effort} className={session.effort === effort ? "selected" : ""} onClick={() => update({ effort: session.effort === effort ? "" : effort })}>{effort}</button>)}</div></div>
              {session.detailSource && <p className="detail-source">Imported from {session.detailSource} · You can edit any value.</p>}
            </div>
          </details>
        </div>

        <div className="control-row youtube-injury-row">
          <details className="surface-card details-card youtube-card" open={openPanel === "youtube"} onToggle={(e) => togglePanel("youtube", e.currentTarget.open)}>
            <summary><span><b>Links</b><small>{session.videos.length ? `${session.videos.length} saved` : "Add a video"}</small></span><i>＋</i></summary>
            <div className="details-body"><div className="inline-sheet"><p className="sheet-title">Add a YouTube workout</p><input type="url" value={videoUrl} onChange={(e) => { videoLabelEdited.current = false; setVideoUrl(e.target.value); setVideoLabel(""); setVideoMessage(""); }} placeholder="Paste YouTube URL"/><input aria-label="YouTube video label" value={videoLabel} onChange={(e) => { videoLabelEdited.current = true; setVideoLabel(e.target.value); }} placeholder="Video title loads automatically"/><button className="compact-primary" onClick={attachVideo} disabled={attachingVideo}>{attachingVideo ? "Saving…" : "Save video + build guide"}</button>{videoMessage && <p className="video-message" role="status">{videoMessage}</p>}</div><div className="video-grid">{session.videos.map((video, i) => <VideoCard video={video} onDelete={() => deleteVideo(session.id, i)} onRetry={() => analyzeVideo(i, video)} key={`${video.url}-${i}`}/>)}</div></div>
          </details>
          <div className={`injury-control ${injuryReported ? "active" : ""}`}><button className="injury-toggle" onClick={handleInjuryControl} aria-pressed={injuryReported}><span>⚑</span><span><b>Injury</b><small>{injuryReported ? "Reported" : "No injury"}</small></span><i/></button>{injuryReported && <button className="injury-expand" onClick={() => setShowInjury(!showInjury)}>{showInjury ? "Hide" : "Details"}</button>}</div>
        </div>
        {injuryReported && showInjury && <section className="surface-card injury-details-card"><div className="injury-heading"><div><span className="kicker">INJURY DETAILS</span><h2>What happened?</h2></div><button onClick={() => setShowInjury(false)} aria-label="Hide injury details">×</button></div><p>Did the injury stop today’s workout?</p><div className="sheet-options injury-options">{[["stopped", "Stopped early"], ["prevented", "Couldn’t start"]].map(([value, label]) => <button key={value} className={session.injury.impact === value ? "selected" : ""} onClick={() => updateInjury({ ...session.injury, reported: true, impact: session.injury.impact === value ? "" : value as Injury["impact"] })}>{label}</button>)}</div><input aria-label="Injured body area" value={session.injury.bodyArea} onChange={(e) => updateInjury({ ...session.injury, reported: true, bodyArea: e.target.value })} placeholder="Body area (optional)"/><textarea aria-label="Injury note" value={session.injury.note} onChange={(e) => updateInjury({ ...session.injury, reported: true, note: e.target.value })} placeholder="Add an injury note…" rows={3}/><button className="text-button" onClick={clearInjury}>Clear injury data</button></section>}

        <div className="finish-zone primary-finish"><div className="finish-actions"><button onClick={finishAndBackup} className={`finish-button ${session.status === "completed" || session.status === "rest" ? "done" : ""}`}><span>↓</span>{finishBackupState || (session.status === "completed" || session.status === "rest" ? "Finish + Backup Again" : plan.key === "rest" ? "Honor Recovery + Backup" : "Finish Workout + Backup")}<span>→</span></button></div></div>
      </div>}

      {showMobilityPicker && <MobilityPicker exercises={libraryExercises} selected={mobilityDraft} sessions={history} currentDate={activeKey} toggleExercise={toggleMobilityDraft} onDone={applyMobilityDraft} onCancel={() => setShowMobilityPicker(false)}/>}
      {screenshotState === "review" && screenshotWorkout && <ScreenshotReview workout={screenshotWorkout} setWorkout={setScreenshotWorkout} preview={screenshotPreview} activeDate={activeKey} hasExisting={Boolean(session.duration || session.distance || session.pace || session.calories || session.startTime)} onApply={applyScreenshot} onClose={closeScreenshot}/>}

      {tab === "week" && <WeekView today={today} sessions={history} activeSchedule={activeSchedule} onOpenDate={openDate}/>}
      {tab === "history" && <HistoryView now={today} sessions={history} activeSchedule={activeSchedule} scheduleHistory={scheduleHistory} insightReports={insightReports} setInsightReports={setInsightReports} fitnessGoals={fitnessGoals} onOpenDate={openDate}/>}
      {tab === "more" && <MoreView libraryExercises={libraryExercises} setLibraryExercises={setLibraryExercises} futureVideos={futureVideos} setFutureVideos={setFutureVideos} insightReports={insightReports} setInsightReports={setInsightReports} fitnessGoals={fitnessGoals} setFitnessGoals={setFitnessGoals} scheduleKeys={scheduleKeys} setScheduleKeys={setScheduleKeysWithHistory} sessions={history} setHistory={setHistory} onDeleteVideo={deleteVideo} onAddToToday={addFutureVideoToToday}/>}
    </main>
    <nav className="bottom-nav" aria-label="Primary navigation">{(["today", "week", "history", "more"] as Tab[]).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { if (item === "today") setActiveDate(today); navigate(item); }}><NavIcon name={item}/><small>{item === "more" ? "Config" : item[0].toUpperCase() + item.slice(1)}</small></button>)}</nav>
  </div>;
}

function ScreenshotReview({ workout, setWorkout, preview, activeDate, hasExisting, onApply, onClose }: { workout: ScreenshotWorkout; setWorkout: React.Dispatch<React.SetStateAction<ScreenshotWorkout | null>>; preview: string; activeDate: string; hasExisting: boolean; onApply: () => void; onClose: () => void }) {
  const updateField = (field: keyof ScreenshotWorkout, value: string) => setWorkout((current) => current ? { ...current, [field]: value } : current);
  const dateMismatch = Boolean(workout.date && workout.date !== activeDate);
  const fields: Array<[keyof ScreenshotWorkout, string, string]> = [["activity", "Activity", "Run"], ["date", "Workout date", "YYYY-MM-DD"], ["startTime", "Start time", "8:42 AM"], ["distance", "Distance", "6.89 mi"], ["duration", "Duration", "1:50:52"], ["pace", "Pace", "16:05 min/mi"], ["calories", "Calories", "745"]];
  return <div className="screenshot-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="screenshot-review" role="dialog" aria-modal="true" aria-labelledby="screenshot-review-title"><header><div><span>AI SCREENSHOT IMPORT</span><h2 id="screenshot-review-title">Review workout details</h2><p>Correct anything that looks wrong, then apply it.</p></div><button onClick={onClose} aria-label="Close screenshot review">×</button></header><div className="screenshot-review-content">{preview && <figure><img src={preview} alt="Workout screenshot being reviewed"/><figcaption>The image is discarded after this review.</figcaption></figure>}<div className="review-fields">{fields.map(([field, label, placeholder]) => <label key={field}><span>{label}</span><input value={String(workout[field] ?? "")} onChange={(event) => updateField(field, event.target.value)} placeholder={placeholder}/></label>)}</div></div>{workout.warnings.length > 0 && <div className="review-warning"><strong>Check these details</strong><ul>{workout.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}{dateMismatch && <p className="review-caution">This screenshot says {workout.date}, but you’re editing {activeDate}. Applying keeps the workout on the day you’re currently viewing.</p>}{hasExisting && <p className="review-caution">Applying will replace existing duration, distance, pace, calories, and start time on this day.</p>}<footer><button onClick={onClose}>Cancel</button><button className="apply-import" onClick={onApply}>Apply to Details</button></footer></section></div>;
}

function formatTimestamp(seconds: number) { const minutes = Math.floor(seconds / 60); return `${minutes}:${String(seconds % 60).padStart(2, "0")}`; }

function VideoCard({ video, onDelete, onRetry, onRefresh, onAddToday }: { video: Video; onDelete?: () => void; onRetry?: () => void; onRefresh?: () => void; onAddToday?: () => void }) {
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
    {onRefresh && video.workoutGuide && <button className="guide-refresh" onClick={onRefresh} disabled={video.guideStatus === "analyzing"}>{video.guideStatus === "analyzing" ? "Refreshing workout guide…" : "↻ Refresh workout guide"}</button>}
    {onAddToday && <button className="video-add-today" onClick={onAddToday}>＋ Add to today’s workout</button>}
    {onDelete && (confirmingDelete ? <div className="video-delete-confirm"><span>Delete this video?</span><button onClick={() => setConfirmingDelete(false)}>Cancel</button><button className="danger" onClick={onDelete}>Delete</button></div> : <button className="video-delete" onClick={() => setConfirmingDelete(true)} aria-label={`Delete ${video.label}`}>Delete video</button>)}
  </article>;
}

function MobilityPicker({ exercises, selected, sessions, currentDate, toggleExercise, onDone, onCancel }: { exercises: LibraryExercise[]; selected: string[]; sessions: Session[]; currentDate: string; toggleExercise: (name: string) => void; onDone: () => void; onCancel: () => void }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const previous = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [onCancel]);
  const lastCompleted = new Map<string, string>();
  sessions.filter((saved) => saved.date < currentDate).forEach((saved) => saved.completedExercises.forEach((name) => { if (!lastCompleted.get(name) || saved.date > lastCompleted.get(name)!) lastCompleted.set(name, saved.date); }));
  const ordered = exercises.map((exercise) => ({ ...exercise, lastDone: lastCompleted.get(exercise.name) || "" })).sort((a, b) => {
    if (!a.lastDone && b.lastDone) return -1;
    if (a.lastDone && !b.lastDone) return 1;
    return a.lastDone.localeCompare(b.lastDone) || a.name.localeCompare(b.name);
  });
  const filtered = ordered.filter(({ name, equipment }) => `${name} ${equipment}`.toLowerCase().includes(query.trim().toLowerCase()));
  const neverDone = ordered.filter((exercise) => !exercise.lastDone).length;
  return <div className="mobility-sheet-backdrop" onClick={onCancel}><section className="mobility-sheet" role="dialog" aria-modal="true" aria-labelledby="mobility-sheet-title" onClick={(e) => e.stopPropagation()}><div className="mobility-sheet-header"><div><span className="kicker">MOBILITY LIBRARY · {neverDone} NOT DONE YET</span><h2 id="mobility-sheet-title">Choose your exercises</h2><p>New and least-recently completed exercises appear first.</p></div><button onClick={onCancel} aria-label="Close mobility library">×</button></div><div className="mobility-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" aria-label="Search mobility exercises"/></div><div className="library-list mobility-sheet-list">{filtered.map(({ id, name, equipment, lastDone, graphicData }) => { const added = selected.includes(name); const historyLabel = lastDone ? `Last done ${dateFromKey(lastDone).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not done yet"; return <button key={id} className={`${added ? "added" : ""} ${lastDone ? "done-before" : "not-done-yet"}`} aria-pressed={added} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark exerciseId={id} name={name} graphicData={graphicData}/></span><span><strong>{name}</strong><small>{equipment}</small><small className="mobility-history">{historyLabel}</small></span><em>{added ? "✓ Added" : "+ Add"}</em></button>; })}{filtered.length === 0 && <p className="empty-state">No exercises match that search.</p>}</div><div className="mobility-sheet-footer"><span>{selected.length} selected</span><button onClick={onDone}>Add selected exercises</button></div></section></div>;
}

function DailyMobility({ session, exercises, toggleExercise, onEdit }: { session: Session; exercises: LibraryExercise[]; toggleExercise: (name: string) => void; onEdit: () => void }) {
  const complete = session.mobilityExercises.filter((name) => session.completedExercises.includes(name)).length;
  const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  return <details className="surface-card daily-mobility" open><summary><span><b>Mobility exercises</b><small>{complete} of {session.mobilityExercises.length} completed</small></span><i>⌄</i></summary><div className="daily-mobility-body"><div className="checklist">{session.mobilityExercises.map((name) => { const checked = session.completedExercises.includes(name); const exercise = exerciseByName.get(name); return <button key={name} className={checked ? "checked" : ""} aria-pressed={checked} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark exerciseId={exercise?.id} name={name} graphicData={exercise?.graphicData}/></span><span className="exercise-copy"><strong>{name}</strong><small>{exercise?.equipment || "Mobility exercise"}</small></span><span className="check-target">{checked ? "✓" : ""}</span></button>; })}</div><button className="edit-mobility" onClick={onEdit}>Edit loaded exercises</button></div></details>;
}

function WeekView({ today, sessions, activeSchedule, onOpenDate }: { today: Date; sessions: Session[]; activeSchedule: Schedule; onOpenDate: (date: Date) => void }) {
  const map = new Map(sessions.map((item) => [item.date, item]));
  const days = weekDates(today);
  return <div className="subpage week-page">
    <section className="page-intro colorful"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>One day.<br/>Then the next.</h1><p>The objective stays steady even when the activity changes. Tap any day to review or record it.</p></section>
    <section className="week-rhythm-card"><RhythmStrip focus={today} today={today} sessions={sessions} activeSchedule={activeSchedule} onOpen={onOpenDate}/></section>
    <section className="week-list">{days.map((date) => { const plan = activeSchedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key, date, today); return <button key={dateKey(date)} className={`week-day-card ${plan.key}`} onClick={() => onOpenDate(date)}><span className="day-icon">{plan.icon}</span><span><small>{plan.short.toUpperCase()} · {date.getDate()}</small><strong>{plan.theme}</strong><em>{saved?.activity || plan.guidance}</em></span><i className={`week-status ${state}`}>{stateLabel(state)}</i></button>; })}</section>
  </div>;
}

function HistoryView({ now, sessions, activeSchedule, scheduleHistory, insightReports, setInsightReports, fitnessGoals, onOpenDate }: { now: Date; sessions: Session[]; activeSchedule: Schedule; scheduleHistory: ScheduleSnapshot[]; insightReports: TrainingInsightReport[]; setInsightReports: React.Dispatch<React.SetStateAction<TrainingInsightReport[]>>; fitnessGoals: FitnessGoals; onOpenDate: (date: Date) => void }) {
  const [view, setView] = useState<"weeks" | "month">("weeks");
  const [historyCursor, setHistoryCursor] = useState(() => new Date(now));
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [insightPeriod, setInsightPeriod] = useState<0 | 30 | 90>(30);
  const [insightState, setInsightState] = useState<"idle" | "analyzing">("idle");
  const [insightError, setInsightError] = useState("");
  const [insightAccessCode, setInsightAccessCode] = useState("");
  const [editingInsightAccess, setEditingInsightAccess] = useState(false);
  useEffect(() => { const savedCode = localStorage.getItem("t4l:insights-access"); if (savedCode) setInsightAccessCode(savedCode); }, []);
  useEffect(() => { setHistoryCursor(new Date(now)); }, [now]);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const adherent = sessions.filter((item) => ["completed", "rest"].includes(item.status) || hasReportedInjury(item) || item.injury.impact === "modified");
  const last30 = sessions.filter((item) => (now.getTime() - dateFromKey(item.date).getTime()) / 86400000 <= 30);
  const adherence = last30.length ? Math.round(last30.filter((item) => item.status !== "partial" || hasReportedInjury(item)).length / last30.length * 100) : 0;
  const currentStreak = calculateStreak(sessions, now, activeSchedule);
  const consistentWeeks = Array.from({ length: 8 }, (_, w) => { const start = new Date(now); start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - w * 7); return Array.from({ length: 6 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return map.get(dateKey(d)); }).filter((s) => s?.status === "completed" || hasReportedInjury(s) || s?.injury.impact === "modified").length >= 5; }).filter(Boolean).length;
  const monthDays = new Date(historyCursor.getFullYear(), historyCursor.getMonth() + 1, 0).getDate();
  const monthOffset = (new Date(historyCursor.getFullYear(), historyCursor.getMonth(), 1).getDay() + 6) % 7;
  const weekBlocks = Array.from({ length: 2 }, (_, w) => { const date = new Date(historyCursor); date.setDate(historyCursor.getDate() - w * 7); return weekDates(date); });
  const currentPeriod = view === "month" ? historyCursor.getFullYear() === now.getFullYear() && historyCursor.getMonth() === now.getMonth() : dateKey(weekDates(historyCursor)[0]) === dateKey(weekDates(now)[0]);
  const shiftHistory = (direction: number) => setHistoryCursor((current) => { const next = new Date(current); if (view === "month") next.setMonth(next.getMonth() + direction); else next.setDate(next.getDate() + direction * 14); return next; });
  const insightSessions = sessions.filter((saved) => {
    const age = (now.getTime() - dateFromKey(saved.date).getTime()) / 86400000;
    const hasData = saved.status === "completed" || saved.status === "rest" || Boolean(saved.activity || saved.notes || saved.duration || saved.distance || saved.completedExercises.length || hasReportedInjury(saved));
    return hasData && age >= 0 && (insightPeriod === 0 || age <= insightPeriod);
  }).sort((a, b) => a.date.localeCompare(b.date));
  const currentReport = insightReports.find((report) => report.periodDays === insightPeriod);
  async function generateInsights() {
    if (!insightSessions.length) { setInsightError("Record at least one workout before generating insights."); return; }
    if (!insightAccessCode.trim()) { setEditingInsightAccess(true); setInsightError("Enter your personal AI access code first."); return; }
    setInsightState("analyzing"); setInsightError("");
    try {
      localStorage.setItem("t4l:insights-access", insightAccessCode.trim());
      const report = await fetchTrainingInsights(insightSessions, insightPeriod, insightAccessCode.trim(), fitnessGoals, activeSchedule);
      setInsightReports((items) => [report, ...items.filter((item) => item.periodDays !== insightPeriod)]);
    } catch (error) { setInsightError(error instanceof Error ? error.message : "AI insights are temporarily unavailable."); }
    finally { setInsightState("idle"); }
  }
  return <div className="subpage history-page">
    <section className="page-intro"><span className="kicker">RELENTLESS FORWARD PROGRESS</span><h1>Your rhythm,<br/>over time.</h1><p>Progress is the pattern you return to—not a perfect streak.</p></section>
    <section className="insight-card"><span className="insight-icon">↗</span><div><span>LAST 30 DAYS</span><strong>{adherence}% on rhythm</strong><p>{adherent.length ? `${adherent.length} recorded days. Every return strengthens the pattern.` : "Record your first day to begin seeing the pattern."}</p></div></section>
    <section className="stat-row"><div><span>CURRENT RHYTHM</span><strong>{currentStreak}<small> {currentStreak === 1 ? "day" : "days"}</small></strong></div><div><span>CONSISTENT WEEKS</span><strong>{consistentWeeks}<small> of 8</small></strong></div><div><span>RECORDED</span><strong>{sessions.length}<small> {sessions.length === 1 ? "day" : "days"}</small></strong></div></section>
    <details className="ai-insights-card"><summary className="ai-insights-heading"><span className="ai-orb" aria-hidden="true">✦</span><div><span className="kicker">TRAINING INSIGHTS</span><h2>Your history, interpreted</h2><p>AI reviews completed workouts, details, notes, mobility work, effort, and injury reports to find useful patterns.</p></div><i aria-hidden="true">＋</i></summary>
      <div className="insight-period" aria-label="Insight review period">{([[30, "30 days"], [90, "90 days"], [0, "All history"]] as const).map(([period, label]) => <button key={period} className={insightPeriod === period ? "active" : ""} aria-pressed={insightPeriod === period} onClick={() => { setInsightPeriod(period); setInsightError(""); }}>{label}</button>)}</div>
      {(!insightAccessCode || editingInsightAccess) && <div className="insight-access"><div><strong>Personal AI access</strong><small>Enter this once per device. It is not included in backups or sent to the AI model.</small></div><input type="password" value={insightAccessCode} onChange={(event) => setInsightAccessCode(event.target.value)} placeholder="Personal access code" aria-label="Personal AI access code" autoComplete="off"/><button onClick={() => { if (insightAccessCode.trim()) { localStorage.setItem("t4l:insights-access", insightAccessCode.trim()); setEditingInsightAccess(false); setInsightError(""); } }}>Save code</button></div>}
      {insightAccessCode && !editingInsightAccess && <div className="insight-access-ready"><span>✓ Personal AI access enabled on this device</span><button onClick={() => setEditingInsightAccess(true)}>Change</button></div>}
      <div className="insight-action"><div><strong>{insightSessions.length} recorded {insightSessions.length === 1 ? "day" : "days"}</strong><small>Only this period’s compact workout data is sent when you generate.</small></div><button onClick={() => void generateInsights()} disabled={insightState === "analyzing" || !insightSessions.length}>{insightState === "analyzing" ? "Reviewing your history…" : currentReport ? "Refresh insights" : "Generate AI insights"}</button></div>
      {insightError && <p className="insight-error" role="alert">{insightError}</p>}
      {currentReport && <article className="insight-report">
        <header><div><span>AI REVIEW · {currentReport.sessionsAnalyzed} DAYS</span><h3>{currentReport.headline}</h3></div><time>{new Date(currentReport.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></header>
        <p className="insight-summary">{currentReport.summary}</p>
        <div className="insight-report-grid"><section><h4>What’s working</h4><ul>{currentReport.wins.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h4>Patterns to notice</h4><ul>{currentReport.patterns.map((item) => <li key={item}>{item}</li>)}</ul></section></div>
        <section className="next-focus"><h4>Recommended next steps</h4>{currentReport.recommendations.map((item) => <div key={item.title}><span>→</span><p><strong>{item.title}</strong>{item.reason}<b>{item.action}</b></p></div>)}</section>
        {currentReport.cautions.length > 0 && <section className="insight-cautions"><h4>Use extra care</h4><ul>{currentReport.cautions.map((item) => <li key={item}>{item}</li>)}</ul></section>}
        <footer><span>{currentReport.dataQuality}</span><small>Training guidance only—not medical diagnosis or treatment.</small></footer>
      </article>}
    </details>
    <div className="history-controls"><div className="segmented"><button className={view === "weeks" ? "active" : ""} onClick={() => setView("weeks")}>2 weeks</button><button className={view === "month" ? "active" : ""} onClick={() => setView("month")}>Month</button></div><div className="history-period-nav"><button onClick={() => shiftHistory(-1)} aria-label={view === "month" ? "View previous month" : "View previous two weeks"}>‹</button><span>{view === "month" ? historyCursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : `2 weeks from ${weekDates(historyCursor)[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</span><button onClick={() => shiftHistory(1)} disabled={currentPeriod} aria-label={view === "month" ? "View next month" : "View next two weeks"}>›</button></div><button className={flaggedOnly ? "filter active" : "filter"} onClick={() => setFlaggedOnly(!flaggedOnly)}>⚑ Injuries</button></div>
    {flaggedOnly ? <section className="flagged-list"><h2>Injury-affected workouts</h2>{sessions.filter(hasReportedInjury).length ? sessions.filter(hasReportedInjury).map((saved) => <button key={saved.id} onClick={() => onOpenDate(dateFromKey(saved.date))}><span className="status-mark modified">⚑</span><span><strong>{dateFromKey(saved.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {historicalPlan(saved, activeSchedule, dateFromKey(saved.date)).theme}</strong><small>{saved.injury.bodyArea || (saved.injury.impact === "prevented" ? "Couldn’t start" : saved.injury.impact === "stopped" ? "Stopped early" : "Injury reported")} {saved.injury.note ? `· ${saved.injury.note}` : ""}</small></span><i>›</i></button>) : <p className="empty-state">No injury-affected workouts yet.</p>}</section> : view === "weeks" ? <><div className="history-scan-legend">{activeSchedule.filter((plan, index, items) => items.findIndex((candidate) => candidate.key === plan.key) === index).map((plan) => <span key={plan.key}><b>{plan.icon}</b>{plan.theme}</span>)}</div><section className="multi-week">{weekBlocks.map((days, index) => <div className="week-scan" key={dateKey(days[0])}><div className="scan-heading"><span>{index === 0 ? "THIS WEEK" : `WEEK OF ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`}</span><b>{days.slice(0,6).filter((d) => ["completed", "modified", "protected"].includes(stateFor(map.get(dateKey(d)), scheduleForDate(d, activeSchedule, scheduleHistory)[d.getDay()].key, d, now))).length} / 6 complete</b></div><div className="scan-days">{days.map((date) => { const plan = historicalPlan(map.get(dateKey(date)), scheduleForDate(date, activeSchedule, scheduleHistory), date); const state = stateFor(map.get(dateKey(date)), plan.key, date, now); return <button key={dateKey(date)} className={`${state} ${plan.key}`} title={`${plan.theme} · ${stateLabel(state)}`} onClick={() => onOpenDate(date)}><span className="history-day-icon" aria-hidden="true">{plan.icon}</span><strong>{date.getDate()}</strong><small>{plan.short}</small><i>{stateSymbol(state)}</i></button>; })}</div></div>)}</section></> : <section className="month-card"><div className="month-title"><div><span className="kicker">MONTH VIEW</span><h2>{historyCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2></div><div className="legend"><span>● Complete</span><span>⚑ Injury</span><span>R Rest</span></div></div><div className="calendar-grid">{["M","T","W","T","F","S","S"].map((day,index) => <b key={`${day}-${index}`}>{day}</b>)}{Array.from({ length: monthOffset }, (_, i) => <i key={`empty-${i}`}/>)}{Array.from({ length: monthDays }, (_, i) => { const date = new Date(historyCursor.getFullYear(), historyCursor.getMonth(), i + 1); const plan = historicalPlan(map.get(dateKey(date)), scheduleForDate(date, activeSchedule, scheduleHistory), date); const state = stateFor(map.get(dateKey(date)), plan.key, date, now); return <button className={`${state} ${plan.key} ${i + 1 === now.getDate() ? "today" : ""}`} key={i + 1} onClick={() => onOpenDate(date)}><em>{i + 1}</em><small>{stateSymbol(state)}</small></button>; })}</div></section>}
  </div>;
}

function calculateStreak(sessions: Session[], now: Date, activeSchedule: Schedule) {
  const map = new Map(sessions.map((item) => [item.date, item])); let streak = 0;
  for (let offset = 0; offset < 730; offset++) { const date = new Date(now); date.setDate(now.getDate() - offset); const plan = activeSchedule[date.getDay()]; const saved = map.get(dateKey(date)); const state = stateFor(saved, plan.key, date, now); if (["completed", "modified", "protected", "rest"].includes(state)) streak++; else if (offset === 0 && state === "missed") continue; else break; }
  return streak;
}

function MoreView({ libraryExercises, setLibraryExercises, futureVideos, setFutureVideos, insightReports, setInsightReports, fitnessGoals, setFitnessGoals, scheduleKeys, setScheduleKeys, sessions, setHistory, onDeleteVideo, onAddToToday }: { libraryExercises: LibraryExercise[]; setLibraryExercises: React.Dispatch<React.SetStateAction<LibraryExercise[]>>; futureVideos: Video[]; setFutureVideos: React.Dispatch<React.SetStateAction<Video[]>>; insightReports: TrainingInsightReport[]; setInsightReports: React.Dispatch<React.SetStateAction<TrainingInsightReport[]>>; fitnessGoals: FitnessGoals; setFitnessGoals: React.Dispatch<React.SetStateAction<FitnessGoals>>; scheduleKeys: string[]; setScheduleKeys: React.Dispatch<React.SetStateAction<string[]>>; sessions: Session[]; setHistory: React.Dispatch<React.SetStateAction<Session[]>>; onDeleteVideo: (sessionId: string, videoIndex: number) => void; onAddToToday: (video: Video) => Promise<string> }) {
  const [newExercise, setNewExercise] = useState(""); const [newEquipment, setNewEquipment] = useState(""); const [newGraphicDescription, setNewGraphicDescription] = useState(""); const [newReferencePhoto, setNewReferencePhoto] = useState(""); const [notice, setNotice] = useState("");
  const [futureUrl, setFutureUrl] = useState(""); const [futureNotice, setFutureNotice] = useState(""); const [savingFutureVideo, setSavingFutureVideo] = useState(false);
  const recentVideos = sessions.flatMap((s) => s.videos.map((video, videoIndex) => ({ ...video, sessionId: s.id, videoIndex }))).slice(0, 6);
  const updateExercise = (id: string, patch: Partial<LibraryExercise>) => setLibraryExercises((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addExercise = () => { if (!newExercise.trim()) return; const hasReference = Boolean(newReferencePhoto || newGraphicDescription.trim()); setLibraryExercises((items) => [...items, { id: crypto.randomUUID(), name: newExercise.trim(), equipment: newEquipment.trim() || "No equipment listed", graphicDescription: newGraphicDescription.trim() || undefined, referencePhotoData: newReferencePhoto || undefined, graphicReviewStatus: hasReference ? "pending" : undefined }]); setNewExercise(""); setNewEquipment(""); setNewGraphicDescription(""); setNewReferencePhoto(""); setNotice(hasReference ? "Exercise added with graphic reference. Graphic review requested." : "Exercise added."); };
  async function saveReferencePhoto(id: string, file: File) { try { const referencePhotoData = await prepareExerciseReference(file); updateExercise(id, { referencePhotoData, graphicReviewStatus: "pending" }); setNotice("Reference photo saved. Graphic review requested for this exercise."); } catch (error) { setNotice(error instanceof Error ? error.message : "That reference photo could not be saved."); } }
  const updateGoal = (field: keyof FitnessGoals, value: string) => setFitnessGoals((current) => ({ ...current, [field]: value, updatedAt: new Date().toISOString() }));
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
      const workoutGuide = await fetchWorkoutGuide(url, label);
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
      const workoutGuide = await fetchWorkoutGuide(video.url, video.label);
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
  async function restoreData(file: File) { try { const payload = JSON.parse(await file.text()); if (payload.schemaVersion !== 1 || !Array.isArray(payload.sessions)) throw new Error(); const restored = payload.sessions.map((item: Session) => normalizeSession(item)); await Promise.all(restored.map(saveSession)); if (Array.isArray(payload.scheduleKeys) && payload.scheduleKeys.length === 7) { localStorage.setItem("t4l:schedule", JSON.stringify(payload.scheduleKeys)); setScheduleKeys(payload.scheduleKeys.map(String)); } if (payload.goals && typeof payload.goals === "object") { const restoredGoals = { primaryGoal: String(payload.goals.primaryGoal || ""), priorities: String(payload.goals.priorities || ""), constraints: String(payload.goals.constraints || ""), updatedAt: String(payload.goals.updatedAt || "") }; localStorage.setItem("t4l:fitness-goals", JSON.stringify(restoredGoals)); setFitnessGoals(restoredGoals); } if (Array.isArray(payload.libraryExercises)) { const restoredLibrary = payload.libraryExercises.filter((item: LibraryExercise) => item?.id && item?.name).map((item: LibraryExercise) => ({ id: item.id, name: item.name, equipment: item.equipment || "No equipment listed", referencePhotoData: item.referencePhotoData, graphicDescription: item.graphicDescription, graphicData: item.graphicData, graphicReviewStatus: item.graphicReviewStatus })); localStorage.setItem("t4l:library", JSON.stringify(restoredLibrary)); setLibraryExercises(restoredLibrary); } if (Array.isArray(payload.futureVideos)) { const restoredVideos = payload.futureVideos.filter((item: Video) => item?.url && item?.label); localStorage.setItem("t4l:future-videos", JSON.stringify(restoredVideos)); setFutureVideos(restoredVideos); } if (Array.isArray(payload.insightReports)) { const restoredReports = payload.insightReports.filter((item: TrainingInsightReport) => item?.id && item?.headline); localStorage.setItem("t4l:insight-reports", JSON.stringify(restoredReports)); setInsightReports(restoredReports); } setHistory(restored); setNotice(`Restored ${restored.length} sessions, your goals, and saved libraries. Reloading…`); window.setTimeout(() => window.location.reload(), 700); } catch { setNotice("That file is not a valid Training for Life backup."); } }
  return <div className="subpage more-page">
    <section className="page-intro"><span className="kicker">YOUR APP</span><h1>Config</h1><p>Set your goals, manage your mobility library, saved videos, and restored data.</p></section>
    <details className="settings-card goals-card"><summary><span className="setting-icon data">◎</span><span><strong>Fitness goals & priorities</strong><small>{fitnessGoals.primaryGoal.trim() ? "Used as the AI Insights baseline" : "Add context for AI Insights"}</small></span><i>＋</i></summary><p className="library-editor-help">Tell the app what you are working toward so AI Insights can compare your training with what matters most to you.</p><label>Primary goal<input value={fitnessGoals.primaryGoal} onChange={(event) => updateGoal("primaryGoal", event.target.value)} placeholder="e.g., Run a comfortable half marathon"/></label><label>Priorities<textarea value={fitnessGoals.priorities} onChange={(event) => updateGoal("priorities", event.target.value)} placeholder="e.g., consistency, aerobic fitness, strength, mobility" rows={3}/></label><label>Constraints or considerations<textarea value={fitnessGoals.constraints} onChange={(event) => updateGoal("constraints", event.target.value)} placeholder="e.g., protect my right knee; two short sessions on weekdays" rows={3}/></label><p className="backup-note">Saved on this device and included in your backups. Sent to AI only when you generate insights.</p></details>
    <details className="settings-card schedule-card"><summary><span className="setting-icon data">↔</span><span><strong>Weekly workout mapping</strong><small>Choose the workout type for each day</small></span><i>＋</i></summary><p className="library-editor-help">Changing this affects future planning only. Completed and prior workouts keep their original day type.</p><div className="schedule-editor">{schedule.map((day, index) => <label key={day.short}><span>{day.short}</span><select value={scheduleKeys[index] || day.key} onChange={(event) => setScheduleKeys((current) => current.map((key, itemIndex) => itemIndex === index ? event.target.value : key))}>{scheduleTypeOptions.map((option) => <option value={option.key} key={option.key}>{option.label}</option>)}</select></label>)}</div><p className="backup-note">Saved on this device and included in backups.</p></details>
    <details className="settings-card library-manager"><summary><span className="setting-icon mobility">↗</span><span><strong>Edit Mobility Library</strong><small>{libraryExercises.length} exercises · add or edit</small></span><i>＋</i></summary><p className="library-editor-help">Add a new mobility exercise here, or tap any existing name or equipment line to edit it.</p><div className="add-library-exercise"><input value={newExercise} onChange={(e) => setNewExercise(e.target.value)} placeholder="New mobility exercise" aria-label="New mobility exercise"/><input value={newEquipment} onChange={(e) => setNewEquipment(e.target.value)} placeholder="Equipment or instructions" aria-label="New mobility exercise equipment or instructions"/><textarea value={newGraphicDescription} onChange={(e) => setNewGraphicDescription(e.target.value)} placeholder="Describe the movement" aria-label="Describe the movement for the graphic" rows={2}/><label className="new-reference-photo">{newReferencePhoto ? "Reference selected" : "Add reference photo"}<input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; e.currentTarget.value = ""; if (!file) return; try { setNewReferencePhoto(await prepareExerciseReference(file)); setNotice("Reference photo ready to save with the new exercise."); } catch (error) { setNotice(error instanceof Error ? error.message : "That reference photo could not be prepared."); } }}/></label><button onClick={addExercise}>Add mobility exercise</button></div><div className="library-editor-list">{libraryExercises.map((exercise) => <div className="library-editor-row" key={exercise.id}><span className="exercise-visual"><MovementMark exerciseId={exercise.id} name={exercise.name} graphicData={exercise.graphicData}/></span><div><input aria-label="Mobility exercise name" value={exercise.name} onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}/><input aria-label="Equipment or instructions" value={exercise.equipment} onChange={(e) => updateExercise(exercise.id, { equipment: e.target.value })}/></div><div className="exercise-reference-controls">{exercise.referencePhotoData && <img src={exercise.referencePhotoData} alt="" aria-hidden="true"/>}<label>{exercise.referencePhotoData ? "Replace reference" : "Add reference photo"}<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void saveReferencePhoto(exercise.id, file); e.currentTarget.value = ""; }}/></label><textarea value={exercise.graphicDescription || ""} onChange={(e) => updateExercise(exercise.id, { graphicDescription: e.target.value, graphicReviewStatus: e.target.value.trim() ? "pending" : exercise.graphicReviewStatus })} placeholder="Describe the movement for the graphic" aria-label={`Graphic description for ${exercise.name}`} rows={2}/>{exercise.graphicReviewStatus === "pending" && <small>Graphic review requested</small>}</div></div>)}</div></details>
    <section className="settings-card future-video-card"><div className="settings-title"><span className="setting-icon video">▶</span><div><h2>Future workout videos</h2><p>Save a YouTube link now and add it to today when you’re ready</p></div></div><div className="future-video-form"><input type="url" value={futureUrl} onChange={(e) => setFutureUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void saveFutureVideo(); }} placeholder="Paste YouTube URL" aria-label="YouTube URL for a future workout"/><button onClick={() => void saveFutureVideo()} disabled={savingFutureVideo}>{savingFutureVideo ? "Saving…" : "Save for later"}</button></div>{futureNotice && <p className="notice" role="status">{futureNotice}</p>}{futureVideos.length ? <div className="video-grid future-video-grid">{futureVideos.map((video, index) => <VideoCard video={video} onAddToday={() => void addFutureToToday(video)} onDelete={() => setFutureVideos((items) => items.filter((_, itemIndex) => itemIndex !== index))} onRetry={() => void retryFutureVideo(video)} onRefresh={() => void retryFutureVideo(video)} key={`${video.url}-${index}`}/>)}</div> : <p className="empty-state">No future workout videos saved yet.</p>}</section>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon video">▶</span><div><h2>Recent videos</h2><p>Quickly reopen past workout references</p></div></div>{recentVideos.length ? <div className="video-grid">{recentVideos.map((video) => <VideoCard video={video} onDelete={() => onDeleteVideo(video.sessionId, video.videoIndex)} key={`${video.sessionId}-${video.videoIndex}`}/>)}</div> : <p className="empty-state">Videos added to a workout will appear here.</p>}</section>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon data">↑</span><div><h2>Restore from backup</h2><p>Reload workouts, mobility exercises, and future videos from a saved file</p></div></div><label className="wide-action file-action">Choose backup file <span>↑</span><input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && restoreData(e.target.files[0])}/></label>{notice && <p className="notice">✓ {notice}</p>}<p className="backup-note">Choose your newest dated Training for Life backup. Restoring replaces the app’s saved workout history, mobility library, and future video library with the file’s contents.</p></section>
    <section className="privacy-card"><span>PRIVATE BY DEFAULT</span><h2>Your history stays under your control.</h2><p>No analytics and no automatic workout uploads. Workout history stays on this device unless you request an AI feature. A screenshot is sent only when you choose Paste or Photos, and the image is discarded after the review; only values you apply are saved and backed up. Compact history fields are sent when you generate AI insights. Video links are sent only when you request a workout guide.</p><p className="disclaimer">This is a tracking tool, not medical advice. Use controlled movement and an appropriate load; stop for sharp pain and seek qualified care when needed.</p></section>
  </div>;
}

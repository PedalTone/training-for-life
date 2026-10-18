"use client";
import {ShareWorkoutButton} from "./share-workout-button";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { historyWeeks, shiftHistoryWeeks, historyWorkoutColor, historyWorkoutColors } from "./history-timeline";
import { workoutIsLocked } from "./workout-lock";
import {VideoPlanView} from "./video-plan-view";
import {sanitizeVideoTraining,videoForNextWorkout,validateVideoPlan,type VideoTrainingPlan,type VideoSetResult} from "./video-training-plan";
import { filterFutureVideos, videoIdentity } from "./future-video-list";
import {openVideoTranscript,readVideoPlanFlow,writeVideoPlanFlow} from "./video-plan-workflow";
import { AssessmentCard } from "./assessment-card";
import { nextMonday, scheduleKeysOn, planNextWeek } from "./weekly-planning";
import { HistoryWorkoutIcon } from "./history-workout-icon";
import { workoutPhotos } from "./workout-photos";
import { stripVideoGuide, stripSessionGuides } from "./video-cleanup";
import { findPriorWorkoutNotes, appendPriorWorkoutNotes, findRepeatWorkout, repeatWorkoutSetup } from "./prior-workout-notes";
import { addonChoices, toggleAddonSelection } from "./addon-selection";
import { GpsTracker, useGpsTracker } from "./gps-tracker";
import { correctedGpsActivities } from "./gps-edit";
import { gpsTime, type GpsWorkout } from "./gps-math";
import { LocalProgressView } from "./local-progress-view";
import { HistorySearchPanel } from "./history-search-panel";
import { emptyHistoryFilters, type HistoryFilters } from "./history-search";
import { ShareComposer } from "./share-composer";
import { toShareCardData, type ShareCardData } from "./share-card-data";
import { DailyJournal } from "./daily-journal";
import { adventureSceneFor, adventureBackgroundFor } from "./adventure-scenes";
import { ScreenshotAttachments, type WorkoutScreenshot } from "./screenshot-attachments";

import { swipeStep, adjacentSwipeTab } from "./swipe-navigation";
import { NutritionCard, NutritionHistory } from "./nutrition-card";
import { readNutrition, restoreNutrition, validateNutrition } from "./nutrition";
import { useLocalWeather, WeatherGraphic } from "./local-weather";

type Tab = "today" | "week" | "history" | "performance" | "more";
type Effort = "" | "easy" | "moderate" | "hard";
type Status = "partial" | "completed" | "rest";
type Injury = { reported?: boolean; impact: "" | "modified" | "stopped" | "prevented"; bodyArea: string; note: string };
const videoCategories = [
  { key: "mobility", label: "Mobility", icon: "↗" },
  { key: "aerobic", label: "Easy aerobic", icon: "≈" },
  { key: "strength", label: "Full-body strength", icon: "🏋️" },
  { key: "speed", label: "Speed / intensity", icon: "⚡" },
  { key: "endurance", label: "Endurance", icon: "∞" },
] as const;
type VideoCategory = (typeof videoCategories)[number]["key"];
export type Video = { url: string; label: string; videoId?: string; thumbnailData?: string; category?: VideoCategory; trainingPlan?:VideoTrainingPlan; trainingResults?:Record<string,VideoSetResult> };
function isVideoCategory(value: unknown): value is VideoCategory { return videoCategories.some((category) => category.key === value); }
function videoCategoryLabel(category?: VideoCategory) { return videoCategories.find((item) => item.key === category)?.label || "Uncategorized"; }
export type Session = {
  id: string; date: string; activity: string; activities?: string[]; duration: string; distance: string; effort: Effort;
  plannedKey?: string; plannedTheme?: string; planOverride?: boolean;
  pace?: string; calories?: string; startTime?: string; detailSource?: string;
  notes: string; mobilityExercises: string[]; completedExercises: string[]; status: Status; injury: Injury; videos: Video[]; workoutPhoto?: string; workoutPhotos?: string[]; workoutScreenshots?: WorkoutScreenshot[];
  importedWorkouts?: ScreenshotWorkout[];
  gpsWorkouts?: GpsWorkout[];
  updatedAt: string; completedAt?: string;
};
type LibraryExercise = { id: string; name: string; equipment: string; referencePhotoData?: string; graphicDescription?: string; graphicData?: string; graphicReviewStatus?: "pending" | "reviewed" };
type InsightRecommendation = { title: string; reason: string; action: string };
type InsightDirection = "keep" | "increase" | "decrease" | "no_signal";
type InsightAreaRecommendation = { direction: InsightDirection; recommendation: string };
type InsightAreaRecommendations = Record<"mobility" | "aerobic" | "strength" | "speed" | "endurance" | "recovery", InsightAreaRecommendation>;
type TrainingInsightReport = {
  id: string; generatedAt: string; periodDays: 0 | 30 | 90; sessionsAnalyzed: number;
  headline: string; executiveSummary?: string; areaRecommendations?: InsightAreaRecommendations; dataQuality: string;
  summary?: string; wins?: string[]; patterns?: string[]; recommendations?: InsightRecommendation[]; cautions?: string[];
};
type FitnessGoals = { primaryGoal: string; priorities: string; constraints: string; updatedAt: string };
type ScreenshotWorkout = {
  activity: string; date: string; startTime: string; distance: string; duration: string; pace: string; calories: string;
  source: string; confidence: "high" | "medium" | "low"; warnings: string[];
};
type SavePickerWindow = Window & { showSaveFilePicker?: (options: { suggestedName: string; id: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> };

type WorkoutPlan = { short: string; label: string; theme: string; key: string; icon: string; guidance: string; activities: string[] };
type CustomWorkout = { key: string; label: string };
const schedule: WorkoutPlan[] = [
  { short: "Sun", label: "S", theme: "Recovery", key: "rest", icon: "☾", guidance: "Recovery is training, too. Easy walking and gentle mobility are welcome.", activities: ["Recovery", "Easy walk", "Gentle mobility", "Bike"] },
  { short: "Mon", label: "M", theme: "Mobility", key: "mobility", icon: "↗", guidance: "Move well and address what needs attention. Add a ride only if it serves you.", activities: ["Mobility", "Peloton HIIT", "Easy ride", "Bike", "Other"] },
  { short: "Tue", label: "T", theme: "Easy Aerobic", key: "aerobic", icon: "≈", guidance: "30–45 minutes at a conversational, Zone 2 effort.", activities: ["Walk", "Easy run", "Peloton", "Bike", "Other"] },
  { short: "Wed", label: "W", theme: "Full-body strength", key: "strength", icon: "🏋️", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Bike", "Other"] },
  { short: "Thu", label: "T", theme: "Speed / Intensity", key: "speed", icon: "⚡", guidance: "Intervals, tempo, hills, Peloton HIIT or other speed work.", activities: ["Track intervals", "Tempo run", "Hill repeats", "Peloton HIIT", "Bike", "Other"] },
  { short: "Fri", label: "F", theme: "Full-body strength", key: "strength", icon: "🏋️", guidance: "20–30 minutes of controlled, full-body strength work.", activities: ["Kettlebell", "Dumbbells", "Bodyweight", "Gym", "Bike", "Other"] },
  { short: "Sat", label: "S", theme: "Endurance", key: "endurance", icon: "∞", guidance: "60+ minutes of steady aerobic work. Choose the activity that fits today.", activities: ["Run", "Bike", "Peloton", "Hike / hike-run", "Swim", "Other"] },
] ;
type Schedule = WorkoutPlan[];
type ScheduleSnapshot = { effectiveDate: string; keys: string[] };
const defaultScheduleKeys = schedule.map((plan) => plan.key);
function resizeNoteField(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${Math.max(element.scrollHeight, 86)}px`;
}
const scheduleTypeOptions = [
  { key: "rest", label: "Recovery" }, { key: "mobility", label: "Mobility" },
  { key: "aerobic", label: "Easy Aerobic" }, { key: "strength", label: "Full-body strength" },
  { key: "speed", label: "Speed / Intensity" }, { key: "endurance", label: "Endurance" },
];
const additionalWorkoutPlans: WorkoutPlan[] = [
  { key: "yoga", theme: "Yoga", icon: "↗", guidance: "A yoga practice at your own pace.", activities: ["Yoga", "Other"] },
  { key: "pilates", theme: "Pilates", icon: "↗", guidance: "Controlled movement and core work.", activities: ["Mat Pilates", "Reformer Pilates", "Other"] },
  { key: "swimming", theme: "Swimming", icon: "≈", guidance: "Choose the swim that fits today.", activities: ["Pool swim", "Open-water swim", "Other"] },
  { key: "pickleball", theme: "Pickleball", icon: "✦", guidance: "Court time, practice or a game.", activities: ["Singles", "Doubles", "Practice", "Other"] },
  { key: "tennis", theme: "Tennis", icon: "✦", guidance: "Court time, practice or a match.", activities: ["Singles", "Doubles", "Practice", "Other"] },
  { key: "basketball", theme: "Basketball", icon: "✦", guidance: "Practice, shooting or a game.", activities: ["Game", "Shooting", "Practice", "Other"] },
].map(plan => ({ ...plan, short: "", label: "" }));
function customWorkoutPlan(key: string): WorkoutPlan | undefined {
  if (!key.startsWith("custom:")) return undefined;
  try {
    const theme = decodeURIComponent(key.slice("custom:".length)).trim();
    if (!theme) return undefined;
    return { short: "", label: "", theme, key, icon: "✦", guidance: "A custom workout in your weekly plan.", activities: ["Other"] };
  } catch { return undefined; }
}
function planForKey(key: string): WorkoutPlan | undefined { return schedule.find((plan) => plan.key === key) || additionalWorkoutPlans.find((plan) => plan.key === key) || customWorkoutPlan(key); }
function workoutTypeOptions(customWorkouts: CustomWorkout[]) {
  return [...scheduleTypeOptions, ...additionalWorkoutPlans.map(({ key, theme }) => ({ key, label: theme })), ...customWorkouts.map(({ key, label }) => ({ key, label }))];
}
function scheduleForKeys(keys: string[]): Schedule {
  return schedule.map((fallback, index) => {
    // Keep the calendar day identity (Sun…Sat) tied to its column even when
    // the user remaps that day to another workout type. This avoids Friday
    // being rendered with Wednesday's label when both use Strength.
    if (!keys[index] || keys[index] === fallback.key) return fallback;
    const match = planForKey(keys[index]);
    return match ? { ...match, short: fallback.short, label: fallback.label } : fallback;
  }) as Schedule;
}
function scheduleForDate(date: Date, current: Schedule, history: ScheduleSnapshot[]) {
  return scheduleForKeys(scheduleKeysOn(dateKey(date), current.map(plan => plan.key), history, dateKey(easternToday()), defaultScheduleKeys));
}
function historicalPlan(saved: Session | undefined, activeSchedule: Schedule, date?: Date) {
  const current = activeSchedule[saved ? dateFromKey(saved.date).getDay() : date?.getDay() ?? 0];
  if (saved?.planOverride === false) return current;
  const savedType = saved?.plannedKey ? planForKey(saved.plannedKey) : undefined;
  if (!saved?.plannedKey && !saved?.plannedTheme) return current;
  const resolved = savedType ? { ...savedType, short: current.short, label: current.label } : current;
  return { ...resolved, key: saved?.plannedKey || resolved.key, theme: resolved.key === "strength" && (saved?.date || dateKey(date || easternToday())) >= dateKey(easternToday()) ? "Full-body strength" : saved?.plannedTheme || resolved.theme };
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
  return { ...saved, workoutPhotos: workoutPhotos(saved), workoutPhoto: workoutPhotos(saved)[0], workoutScreenshots: Array.isArray(saved.workoutScreenshots)?saved.workoutScreenshots.filter(item=>item?.id&&typeof item.imageData==='string'&&item.imageData.startsWith('data:image/')).slice(0,6):undefined, activity: activities.join(" + "), activities, mobilityExercises, completedExercises, videos: (saved.videos ?? []).map(video=>sanitizeVideoTraining(stripVideoGuide(video))), planOverride: typeof saved.planOverride === "boolean" ? saved.planOverride : undefined, injury: { impact: injury.impact ?? "", bodyArea: injury.bodyArea ?? "", note: injury.note ?? "", reported } };
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
async function prepareWorkoutPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo.");
  if (file.size > 20_000_000) throw new Error("That photo is too large. Try a regular photo.");
  const source = await blobAsDataUrl(file);
  const image = new Image(); image.src = source; await image.decode();
  const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .62);
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
const APP_VERSION = "2026.10.18 1541";
const RECENT_RELEASES = [
  { version: APP_VERSION, category: "Minor fix", changes: ["Share workout now uses original Instagram and TikTok icons instead of the subtitle on Today and the journal."] },
  { version: "2026.10.18 1535", category: "Minor fix", changes: ["Share workout now stands out with a navy button, share icon and an Instagram/TikTok image cue, consistently on Today and the journal."] },
  { version: "2026.10.18 1316", category: "Minor fix", changes: ["Stop & save now shows saved tracking summaries with Edit, distance, duration and average pace or speed. Live metrics and setup controls return only when preparing another recording."] },
  { version: "2026.10.18 1054", category: "Minor fix", changes: ["Recording deletion now asks “Yes, delete” or “Keep recording” so the confirmation is clear."] },
  { version: "2026.10.18 0852", category: "Minor fix", changes: ["Delete an individual saved run or bike recording from its Edit panel. Confirm removal, with tracked totals updated and other recordings and workout notes preserved."] },
  { version: "2026.10.18 0806", category: "Major fix", changes: ["GPS tracking auto-pauses after four seconds near a standstill and resumes with movement; manual Pause remains manual, and missing GPS alone never triggers auto-pause. Pause is now a lighter orange. City/state boxes appear only after Stop & save, and explanatory tracking notes have moved to Settings → About."] },
  { version: "2026.10.18 0728", category: "Minor fix", changes: ["Track my run / bike now has a distinct feature card with recognizable runner, bicycle and route graphics. Clear iPhone GPS capabilities, recording/paused/saved status and an Open tracker action make it easier to find. Opening setup does not start recording."] },
  { version: "2026.10.17 1625", category: "Major fix", changes: ["Saved run/bike recordings now have Edit controls for activity, distance and duration, with pace/speed and automatic totals updated. Start/Resume uses a green play icon, Pause is orange, and Stop & save is red. Change activity while paused too. Routes and completed-workout edit locks stay protected."] },
  { version: "2026.10.17 0554", category: "Minor fix", changes: ["Removed the obsolete Saved training reports section from Progress. The current Training Assessment link on Google Drive remains available."] },
  { version: "2026.10.17 0528", category: "Major fix", changes: ["Plan has This week and Next week tabs. Weekly workout mapping is now in Next week, saved from Monday onward without changing this week or logged workouts. Training Assessment lives in Progress, with a shortcut from Next week. Dated mappings are included in backups."] },
];
function withStore<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" }); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(STORE, mode);
      const operation = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => { database.close(); resolve(operation.result); };
      transaction.onabort = () => { database.close(); reject(transaction.error || new Error("Workout storage transaction failed.")); };
      transaction.onerror = () => { /* onabort reports failed writes without claiming they were saved. */ };
    };
  });
}
const saveSession = (session: Session) => withStore("readwrite", (store) => store.put(session));
const getSession = async (id: string) => {
  const saved = await withStore<Session | undefined>("readonly", (store) => store.get(id));
  let fallback: Session | undefined;
  try { const raw = localStorage.getItem(`t4l:${id}`); if (raw) fallback = JSON.parse(raw); } catch { /* Keep the indexed record if fallback storage cannot be read. */ }
  if (!fallback?.date || fallback.date !== id) return saved;
  if (!saved) return fallback;
  const indexedTime = Date.parse(saved.updatedAt || "") || 0;
  const fallbackTime = Date.parse(fallback.updatedAt || "") || 0;
  const richness = (item: Session) => [item.activity, item.duration, item.distance, item.notes, item.pace, item.calories, ...(item.activities || []), ...(item.mobilityExercises || []), ...(item.completedExercises || []), ...(item.videos || []), ...(item.gpsWorkouts || [])].filter(Boolean).length + (item.status === "completed" ? 10 : 0) + (hasReportedInjury(item) ? 5 : 0);
  return fallbackTime > indexedTime || (fallbackTime === indexedTime && richness(fallback) > richness(saved)) ? fallback : saved;
};
const getAllSessions = () => withStore<Session[]>("readwrite", (store) => {
  const cursor = store.openCursor();
  cursor.onsuccess = () => {
    const current = cursor.result;
    if (!current) return;
    const saved = current.value as Session;
    const clean = stripSessionGuides(saved);
    if (clean !== saved) current.update(clean);
    current.continue();
  };
  return store.getAll();
});
async function loadAllSessions() {
  const indexed = await getAllSessions().catch(() => withStore<Session[]>("readonly", (store) => store.getAll())).catch(() => [] as Session[]);
  const legacy = Object.keys(localStorage).filter((key) => /^t4l:\d{4}-\d{2}-\d{2}$/.test(key)).flatMap((key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      if (!parsed?.date) return [];
      const clean = stripSessionGuides(parsed as Session);
      if (clean !== parsed) { try { localStorage.setItem(key, JSON.stringify(clean)); } catch { /* Keep the workout visible even if cleanup cannot be persisted. */ } }
      return [normalizeSession(clean)];
    } catch { return []; }
  });
  // A session can exist in both stores after an older browser/app version or
  // a failed IndexedDB write. Prefer the record with the most recent update,
  // and use the richer record when timestamps are missing or identical. This
  // prevents an empty/rest placeholder in IndexedDB from masking a populated
  // workout saved in the legacy localStorage fallback.
  const richness = (item: Session) => [item.activity, item.duration, item.distance, item.notes, item.pace, item.calories, ...(item.activities || []), ...(item.mobilityExercises || []), ...(item.completedExercises || []), ...(item.videos || []), ...(item.gpsWorkouts || [])].filter(Boolean).length + (item.status === "completed" ? 10 : 0) + (hasReportedInjury(item) ? 5 : 0);
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
function makeBackupFile(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[], insightReports: TrainingInsightReport[], goals: FitnessGoals, scheduleKeys: string[], customWorkouts: CustomWorkout[], scheduleHistory: ScheduleSnapshot[]) {
  const payload = { nutrition: readNutrition(), schemaVersion: 1, exportedAt: new Date().toISOString(), sessions, libraryExercises, futureVideos, insightReports, goals, scheduleKeys, customWorkouts, scheduleHistory, settings: { weekStartsOn: "monday", adherenceThreshold: 5 } };
  return new File([JSON.stringify(payload, null, 2)], backupFilename(), { type: "application/json" });
}
async function saveBackup(sessions: Session[], libraryExercises: LibraryExercise[], futureVideos: Video[], insightReports: TrainingInsightReport[], goals: FitnessGoals, scheduleKeys: string[], customWorkouts: CustomWorkout[], scheduleHistory: ScheduleSnapshot[]) {
  const file = makeBackupFile(sessions, libraryExercises, futureVideos, insightReports, goals, scheduleKeys, customWorkouts, scheduleHistory);
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

type ResolvedStatus = "unassigned" | "planned" | "in-progress" | "complete";
function resolveSessionStatus(session: Session | undefined, planKey: string, date?: Date, today?: Date): ResolvedStatus {
  if (session?.status === "completed" || session?.completedAt) return "complete";
  const hasRecordedWork = Boolean(session && (session.activity || session.duration || session.distance || session.notes || session.workoutPhoto || session.workoutScreenshots?.length || session.mobilityExercises.length || session.completedExercises.length || session.videos.length));
  if (hasRecordedWork) return "in-progress";
  if (session || planKey) return date && today && dateKey(date) < dateKey(today) && !session ? "unassigned" : "planned";
  return "unassigned";
}
function stateFor(session: Session | undefined, planKey: string, date?: Date, today?: Date) {
  if (hasReportedInjury(session)) return "protected";
  if (session?.injury?.impact === "modified") return "modified";
  const resolved = resolveSessionStatus(session, planKey, date, today);
  if (resolved === "complete") return "completed";
  if (resolved === "in-progress") return "partial";
  if (resolved === "planned") return "planned";
  return "skipped";
}
function hasReportedInjury(session: Session | undefined) { return session?.injury?.reported === true; }
function stateSymbol(state: string) { return state === "completed" ? "✓" : state === "modified" ? "↗" : state === "protected" ? "⚑" : state === "partial" ? "◐" : state === "planned" ? "•" : state === "skipped" ? "—" : "·"; }
function displayStateSymbol(session: Session | undefined, planKey: string, date?: Date, today?: Date) {
  const state = stateFor(session, planKey, date, today);
  if (!hasReportedInjury(session)) return stateSymbol(state);
  const withoutInjury = session ? { ...session, injury: { ...session.injury, reported: false, impact: "" as const } } : session;
  return `${stateSymbol(stateFor(withoutInjury, planKey, date, today))}⚑`;
}
function MonthStatusMark({ symbol }: { symbol: string }) {
  return <>{Array.from(symbol).map((mark, index) => <span key={index} className={mark === "✓" ? "month-complete-mark" : mark === "⚑" ? "month-body-mark" : undefined}>{mark}</span>)}</>;
}

function stateLabel(state: string) { return state === "completed" ? "Complete" : state === "modified" ? "Adapted" : state === "protected" ? "Body consideration" : state === "partial" ? "In progress" : state === "planned" ? "Planned" : state === "skipped" ? "Skipped" : "Unassigned"; }

function MovementMark({ exerciseId, name, graphicData }: { exerciseId?: string; name: string; graphicData?: string }) {
  if (graphicData) return <img className="exercise-icon" src={graphicData} alt="" aria-hidden="true"/>;
  const iconFile = exerciseIconFiles[exerciseId || ""] || exerciseIconFiles[defaultExerciseIdByName.get(name) || ""] || "custom-mobility.png";
  if (iconFile) return <img className="exercise-icon" src={`./exercise-icons/${iconFile}`} alt="" aria-hidden="true"/>;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "MOVE";
  return <span className="movement-fallback" aria-hidden="true"><b>{initials}</b><i>↗</i></span>;
}
function NavIcon({ name }: { name: Tab | "home" }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "home" ? <><path d="m3 10 9-7 9 7v10H15v-6H9v6H3Z" fill="currentColor" strokeWidth="1"/></>
    : name === "today" ? <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/><rect x="8" y="13" width="3" height="3" rx=".5" fill="currentColor" stroke="none"/></>
    : name === "week" ? <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" fill="currentColor" fillOpacity=".15"/><path d="M9 3v16m6-14v16"/></>
    : name === "history" ? <><path d="M3 10a9 9 0 1 1 2.5 8M3 4v6h6"/><path d="M12 7v5l3 2"/></>
    : name === "performance" ? <><rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" stroke="none"/><rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" stroke="none"/><rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" stroke="none"/></>
    : <><path d="m9 3-.6 2.3-2 .9-2.2-.7-2 3.5 1.7 1.6v2.4L2.2 15l2 3.5 2.2-.7 2 .9L9 21h6l.6-2.3 2-.9 2.2.7 2-3.5-1.7-1.7v-2.2l1.7-1.6-2-3.5-2.2.7-2-.9L15 3Z" fill="currentColor" fillOpacity=".15"/><circle cx="12" cy="12" r="3"/></>}
  </svg>;
}

function SplashIcon({ name }: { name: Tab }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "today" ? <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>
    : name === "week" ? <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 4h2"/></>
    : name === "history" ? <><path d="M3 11a9 9 0 1 1 2.6 7.4M3 5v6h6"/><path d="M12 7v5l3 2"/></>
    : name === "performance" ? <><path d="M4 3v17h17M7 14l4-4 4 2 6-7m-5 0h5v5"/></>
    : <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/></>}
  </svg>;
}

function SettingsIcon({ name }: { name: "about" | "ai" | "goals" | "schedule" | "library" | "videos" | "restore" }) {
  if (name === "schedule") return <SplashIcon name="week"/>;
  if (name === "library") return <SplashIcon name="performance"/>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "about" ? <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>
    : name === "ai" ? <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></>
    : name === "goals" ? <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>
    : name === "videos" ? <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/></>
    : <><path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/></>}
  </svg>;
}

function SplashScreen({ version, todayPlan, todayActivity, onEnter }: { version: string; todayPlan: WorkoutPlan; todayActivity: string; onEnter: (tab: Tab) => void }) {
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const releaseButtonRef = useRef<HTMLButtonElement>(null);
  const closeReleaseNotes = () => { setShowReleaseNotes(false); releaseButtonRef.current?.focus(); };
  const todayCue = todayActivity || todayPlan.guidance;
  const weather = useLocalWeather();
  const destinations: Array<[Tab, string, string]> = [["week", "Plan", "Preview your week’s workouts"], ["history", "History", "Revisit your workouts and notes"], ["performance", "Progress", "See your consistency and balance"], ["more", "Settings", "Make it your own"]];
  return <main className="splash-screen approved-splash">
    <div className="home-brand splash-letterbox"><img src="./t4l-monochrome.png" alt="T4L"/><div><h1>Training for Life</h1><p><span>Move well, daily.</span><span>Relentless forward progress.</span></p></div></div>
    <div className="home-section-heading"><span>TODAY’S WORKOUT</span><time>{new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric" })}</time></div>
    <button className="home-today splash-today-button" onClick={() => onEnter("today")} aria-label={`Today’s workout: ${todayPlan.theme}. ${todayCue} Open Today`}>
      <span className="home-today-top"><strong>Today</strong><span className="home-weather" aria-label={weather.enabled ? weather.status : "Local weather is off"}>{weather.kind ? <WeatherGraphic kind={weather.kind}/> : <SplashIcon name="today"/>}<span>{weather.kind ? weather.status : weather.enabled ? "Weather unavailable" : "Weather off"}</span></span></span>
      <span className="home-today-body"><span><b>{todayPlan.theme}</b><small>{todayCue}</small></span><span className="home-terrain" aria-hidden="true" data-workout-type={todayPlan.key} style={adventureBackgroundFor(todayPlan.key)}/></span>
      <span className="home-today-footer"><span>Open today’s workout</span><span aria-hidden="true">→</span></span>
    </button>
    <div className="home-section-heading"><span>YOUR TRAINING</span></div>
    <nav className="home-destinations" aria-label="App sections">{destinations.map(([tab,label,description]) => <button key={tab} className={`home-destination splash-destination-${tab}`} onClick={()=>onEnter(tab)}><span><strong>{label}</strong><small>{description}</small></span><span className="home-nav-art" aria-hidden="true"><SplashIcon name={tab}/></span><span className="home-arrow" aria-hidden="true">›</span></button>)}</nav>
    <details className="home-weather-settings"><summary>Local weather settings</summary><div className="splash-weather"><button type="button" onClick={weather.toggle}>{weather.enabled ? "Turn off local weather" : "Enable local weather"}</button>{weather.enabled ? <span role="status">{weather.status} · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather by Open-Meteo</a></span> : <span>Uses your location with permission; shares an approximate area with Open-Meteo.</span>}</div></details>
    <div className="splash-release"><button ref={releaseButtonRef} className="splash-version splash-version-bottom" type="button" aria-expanded={showReleaseNotes} aria-controls="splash-release-notes" onClick={() => setShowReleaseNotes((shown) => !shown)}><span>{version}</span><small>What’s new?</small></button>{showReleaseNotes && <section id="splash-release-notes" className="splash-release-notes" aria-label="What’s new in the last ten releases"><div className="splash-release-header"><strong>What’s new</strong><button type="button" onClick={closeReleaseNotes} aria-label="Close What’s new"><span aria-hidden="true">×</span></button></div>{RECENT_RELEASES.map((release) => <div className="splash-release-group" key={release.version}><h3>{release.version}</h3><h4 className="splash-change-category">{release.category}</h4><ul>{release.changes.map((change) => <li key={change}><span aria-hidden="true">✓</span><span>{change}</span></li>)}</ul></div>)}</section>}</div>
  </main>;
}

function RhythmStrip({ focus, today, sessions, activeSchedule, scheduleHistory, onOpen, showIcons = false }: { focus: Date; today: Date; sessions: Session[]; activeSchedule: Schedule; scheduleHistory?: ScheduleSnapshot[]; onOpen?: (date: Date) => void; showIcons?: boolean }) {
  const map = new Map(sessions.map((item) => [item.date, item]));
  return <div className="rhythm-strip" aria-label="This week’s training rhythm">
    {weekDates(focus).map((date) => { const daySchedule = scheduleHistory ? scheduleForDate(date, activeSchedule, scheduleHistory) : activeSchedule; const plan = historicalPlan(map.get(dateKey(date)), daySchedule, date); const state = stateFor(map.get(dateKey(date)), plan.key, date, today); const selected = dateKey(date) === dateKey(focus); const isToday = dateKey(date) === dateKey(today); return <button key={dateKey(date)} className={`${plan.key} ${state} ${selected ? "selected" : ""} ${isToday ? "actual-today" : ""}`} onClick={() => onOpen?.(date)} aria-current={isToday ? "date" : undefined} aria-label={`${plan.short} ${date.getDate()}, ${plan.theme}: ${stateLabel(state)}${isToday ? ", today" : ""}${selected ? ", selected" : ""}`}>{showIcons && <strong className="rhythm-day-icon" aria-hidden="true">{plan.icon}</strong>}<span>{plan.label}<b>{date.getDate()}</b></span>{isToday && <em>TODAY</em>}</button>; })}
  </div>;
}

export default function Home() {
  const [today, setToday] = useState(() => new Date(2026, 7, 20, 12));
  const [activeDate, setActiveDate] = useState(() => new Date(2026, 7, 20, 12));
  const activeKey = dateKey(activeDate);
  const [scheduleKeys, setScheduleKeys] = useState<string[]>(defaultScheduleKeys);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduleSnapshot[]>([]);
  const activeSchedule = scheduleForKeys(scheduleKeys);
  const workoutOptions = workoutTypeOptions(customWorkouts);
  const basePlan = scheduleForDate(activeDate, activeSchedule, scheduleHistory)[activeDate.getDay()];
  const [progressWeeks, setProgressWeeks] = useState(4);
  const historyTimelineMemory=useRef<{today:string;cursor:string;scroll:number}|null>(null);
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(emptyHistoryFilters);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const closeShare = useCallback(() => setShareData(null), []);
  const [journalDate, setJournalDate] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [planWeek, setPlanWeek] = useState<"this" | "next">("this");
  const [focusAssessment, setFocusAssessment] = useState(false);
  const [enteredApp, setEnteredApp] = useState(() => { try { return sessionStorage.getItem("t4l:entered-app") === "1"; } catch { return false; } });
  const [session, setSession] = useState<Session>(() => emptySession(activeKey, basePlan.key === "rest", basePlan));
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const [loaded, setLoaded] = useState(false);
  const [editingDate,setEditingDate]=useState<string|null>(null);
  const editingDateRef=useRef<string|null>(null);editingDateRef.current=editingDate;
  const [finishing,setFinishing]=useState(false);const finishingRef=useRef(false);
  const [attachingScreenshot,setAttachingScreenshot]=useState(false);
  const workoutReadOnly=!loaded||finishing||workoutIsLocked(session,editingDate);
  const canEditSession=()=>loaded&&sessionRef.current.date===activeKey&&!finishingRef.current&&!workoutIsLocked(sessionRef.current,editingDateRef.current);
  // Ephemeral feedback: never replay celebrations for restored workout records.
  const [celebratingDate, setCelebratingDate] = useState<string | null>(null);
  useEffect(() => { setCelebratingDate(null); }, [activeKey, tab, enteredApp]);
  const [saveState, setSaveState] = useState("Loading your plan…");
  const [history, setHistory] = useState<Session[]>([]);
  const [showMobilityPicker, setShowMobilityPicker] = useState(false);
  const [mobilityDraft, setMobilityDraft] = useState<string[]>([]);
  const [todaySection, setTodaySection] = useState<"workout" | "log" | "check-ins">("workout");
  const [openPanel, setOpenPanel] = useState<"workout" | "log" | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLabel, setVideoLabel] = useState("");
  const [videoMessage, setVideoMessage] = useState("");
  const [attachingVideo, setAttachingVideo] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [finishBackupState, setFinishBackupState] = useState("");
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>(defaultExerciseLibrary);
  const [futureVideos, setFutureVideos] = useState<Video[]>([]);
  const [insightReports, setInsightReports] = useState<TrainingInsightReport[]>([]);
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoals>({ primaryGoal: "", priorities: "", constraints: "", updatedAt: "" });
  const [repeatNotice, setRepeatNotice] = useState("");
  useEffect(() => setRepeatNotice(""), [activeKey, session.plannedKey, session.plannedTheme]);
  const [noteCopyNotice, setNoteCopyNotice] = useState("");
  useEffect(() => setNoteCopyNotice(""), [activeKey, session.plannedKey, session.plannedTheme]);
  const [photoNotice, setPhotoNotice] = useState("");
  const [addingPhotos, setAddingPhotos] = useState(false);
  const workoutPhotoInput = useRef<HTMLInputElement>(null);
  const noteTextarea = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoLabelEdited = useRef(false);
  const currentDayPlan = scheduleForDate(activeDate, activeSchedule, scheduleHistory)[activeDate.getDay()];
  const sessionIsBlank = !session.planOverride && !session.activity && !session.duration && !session.distance && !session.notes && !session.mobilityExercises.length && !session.completedExercises.length && !session.videos.length && !session.workoutPhoto && !session.workoutScreenshots?.length && !session.detailSource;
  // A blank current-day session follows the current Settings mapping. This
  // also prevents the initial default schedule from winning a race with the
  // user's saved mapping during startup; recorded history remains anchored to
  // its saved plannedKey/plannedTheme.
  const plan = session.date === activeKey && sessionIsBlank ? currentDayPlan : historicalPlan(session.date === activeKey ? session : undefined, scheduleForDate(activeDate, activeSchedule, scheduleHistory), activeDate);
  const typedHistory = history.map((item) => {
    const date = dateFromKey(item.date);
    return { ...item, workoutType: historicalPlan(item, scheduleForDate(date, activeSchedule, scheduleHistory), date) };
  });
  const priorWorkoutNotes = findPriorWorkoutNotes(typedHistory, activeKey, plan);
  const repeatSource = findRepeatWorkout(typedHistory, activeKey, plan);

  useEffect(() => { const realToday = easternToday(); setToday(realToday); setActiveDate(realToday);  }, []);
  useEffect(() => {
    setLoaded(false); setFinishBackupState(""); setShowMobilityPicker(false); setOpenPanel(null);
    getSession(activeKey).then((saved) => setSession(saved ? normalizeSession(saved) : emptySession(activeKey, plan.key === "rest", plan))).catch(() => {
      const fallback = localStorage.getItem(`t4l:${activeKey}`); setSession(fallback ? normalizeSession(JSON.parse(fallback)) : emptySession(activeKey, plan.key === "rest", plan));
    }).finally(() => { setLoaded(true); setSaveState("Saved on this device"); });
  }, [activeKey]);
  useEffect(() => {
    if (!loaded || session.id !== activeKey || !sessionIsBlank || workoutIsLocked(session,editingDate)) return;
    if (session.plannedKey === currentDayPlan.key && session.plannedTheme === currentDayPlan.theme && session.status === (currentDayPlan.key === "rest" ? "rest" : "partial")) return;
    setSession((current) => ({ ...current, plannedKey: currentDayPlan.key, plannedTheme: currentDayPlan.theme, status: currentDayPlan.key === "rest" ? "rest" : "partial" }));
  }, [loaded, activeKey, currentDayPlan.key, currentDayPlan.theme, session.id, sessionIsBlank, session.plannedKey, session.plannedTheme, session.status]);
  useEffect(() => {
    const savedLibrary = localStorage.getItem("t4l:library");
    if (savedLibrary) {
      const savedExercises = JSON.parse(savedLibrary) as LibraryExercise[];
      const newDefaults = defaultExerciseLibrary.filter((exercise) => !savedExercises.some((saved) => saved.id === exercise.id || saved.name.toLowerCase() === exercise.name.toLowerCase()));
      setLibraryExercises([...savedExercises, ...newDefaults]);
    }
    const savedFutureVideos = localStorage.getItem("t4l:future-videos"); if (savedFutureVideos) setFutureVideos(JSON.parse(savedFutureVideos).map((video:Video)=>videoForNextWorkout(stripVideoGuide(video))));
    const savedInsightReports = localStorage.getItem("t4l:insight-reports"); if (savedInsightReports) setInsightReports(JSON.parse(savedInsightReports));
    const savedGoals = localStorage.getItem("t4l:fitness-goals"); if (savedGoals) setFitnessGoals({ primaryGoal: "", priorities: "", constraints: "", updatedAt: "", ...JSON.parse(savedGoals) });
    const savedCustomWorkouts = localStorage.getItem("t4l:custom-workouts");
    if (savedCustomWorkouts) { try { const parsed = JSON.parse(savedCustomWorkouts); if (Array.isArray(parsed)) setCustomWorkouts(parsed.filter((item) => item?.key?.startsWith("custom:") && item?.label?.trim()).map((item) => ({ key: String(item.key), label: String(item.label).trim() }))); } catch { /* Use built-in options only. */ } }
    let loadedScheduleKeys = defaultScheduleKeys;
    const savedSchedule = localStorage.getItem("t4l:schedule"); if (savedSchedule) { try { const parsed = JSON.parse(savedSchedule); if (Array.isArray(parsed) && parsed.length === 7) { loadedScheduleKeys = parsed.map(String); setScheduleKeys(loadedScheduleKeys); } } catch { /* Use the default schedule. */ } }
    const savedScheduleHistory = localStorage.getItem("t4l:schedule-history");
    if (savedScheduleHistory) { try { const parsed = JSON.parse(savedScheduleHistory); if (Array.isArray(parsed)) setScheduleHistory(parsed.filter((item) => item?.effectiveDate && Array.isArray(item.keys) && item.keys.length === 7).map((item) => ({ effectiveDate: String(item.effectiveDate), keys: item.keys.map(String) }))); } catch { /* Use the current schedule. */ } }
    else setScheduleHistory([{ effectiveDate: dateKey(easternToday()), keys: loadedScheduleKeys }]);
    setScheduleLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || finishingRef.current || workoutIsLocked(session,editingDate)) return;
    setSaveState("Saving…"); if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if(finishingRef.current||sessionRef.current!==session||workoutIsLocked(sessionRef.current,editingDateRef.current))return;
      const next = { ...session, updatedAt: new Date().toISOString() };
      saveSession(next).then(() => setSaveState("Saved on this device")).catch(() => { localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(next)); setSaveState("Saved on this device"); });
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [session, loaded, activeKey, editingDate]);
  // Refresh the shared history for dated views, including Today’s repeat setup. Keeping the
  // session object out of this dependency list avoids an older IndexedDB
  // snapshot racing a just-finished Today save and briefly masking completion.
  useEffect(() => {
    if (!loaded || !["today", "week", "history", "performance", "more"].includes(tab)) return;
    let cancelled = false;
    loadAllSessions().then((items) => { if (!cancelled) setHistory(items); }).catch(() => { if (!cancelled) setHistory([]); });
    return () => { cancelled = true; };
  }, [tab, loaded]);
  useLayoutEffect(() => {
    if (tab !== "today" || todaySection !== "log") return;
    const frame = window.requestAnimationFrame(() => resizeNoteField(noteTextarea.current));
    return () => window.cancelAnimationFrame(frame);
  }, [session.notes, tab, todaySection]);
  useEffect(() => {
    if (!loaded || session.importedWorkouts?.length || !(session.detailSource || (session.duration && session.distance && session.pace))) return;
    const legacy = { activity: session.activity, date: session.date, startTime: session.startTime || "", distance: session.distance, duration: session.duration, pace: session.pace || "", calories: session.calories || "", source: session.detailSource || "Existing screenshot", confidence: "medium" as const, warnings: [] as string[] };
    setSession((current) => current.importedWorkouts?.length ? current : { ...current, importedWorkouts: [legacy] });
  }, [loaded, session.id, session.importedWorkouts?.length]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:library", JSON.stringify(libraryExercises)); }, [libraryExercises, scheduleLoaded]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:future-videos", JSON.stringify(futureVideos)); }, [futureVideos, scheduleLoaded]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:insight-reports", JSON.stringify(insightReports)); }, [insightReports, scheduleLoaded]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:fitness-goals", JSON.stringify(fitnessGoals)); }, [fitnessGoals, scheduleLoaded]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:custom-workouts", JSON.stringify(customWorkouts)); }, [customWorkouts, scheduleLoaded]);
  useEffect(() => { if (scheduleLoaded) localStorage.setItem("t4l:schedule", JSON.stringify(scheduleKeys)); }, [scheduleKeys, scheduleLoaded]);
  useEffect(() => { if (scheduleHistory.length) localStorage.setItem("t4l:schedule-history", JSON.stringify(scheduleHistory)); }, [scheduleHistory]);
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

  const update = (patch: Partial<Session>, persistNow = false) => {
    if (!canEditSession()) return;
    setFinishBackupState("");
    const next = { ...sessionRef.current, ...patch, updatedAt: new Date().toISOString() };
    sessionRef.current = next;
    setSession(next);
    // The open session is the authoritative record for its date. Mirror every
    // edit into the shared collection immediately so Plan and History never
    // wait for the debounced device save before showing a one-day override.
    setHistory((items) => [next, ...items.filter((item) => item.id !== next.id)].sort((a, b) => b.date.localeCompare(a.date)));
    if (persistNow) void saveSession(next).catch(() => localStorage.setItem(`t4l:${next.date}`, JSON.stringify(next)));
  };
  const setDayWorkoutType = (key: string) => {
    const choice = workoutOptions.find((option) => option.key === key);
    if (!choice) return;
    update({ planOverride: true, plannedKey: choice.key, plannedTheme: choice.label, status: session.status === "completed" ? "completed" : choice.key === "rest" ? "rest" : "partial" }, true);
  };
  const repeatPriorWorkout = () => {
    if (!loaded || sessionRef.current.date !== activeKey || !repeatSource) return;
    update(repeatWorkoutSetup(sessionRef.current, repeatSource), true);
    setRepeatNotice("Workout setup added. Check your exercises and notes, then log today’s results.");
  };
  const copyPriorNotes = () => {
    if (!loaded || sessionRef.current.date !== activeKey || !priorWorkoutNotes) return;
    const current = sessionRef.current.notes;
    const next = appendPriorWorkoutNotes(current, priorWorkoutNotes.notes);
    if (next === current) { setNoteCopyNotice("Those notes are already included."); return; }
    update({ notes: next }, true);
    setNoteCopyNotice(`${current.trim() ? "Appended" : "Copied"} notes from ${dateFromKey(priorWorkoutNotes.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. You can edit them below.`);
  };
  const restoreWeeklyWorkoutType = () => update({ planOverride: false, plannedKey: undefined, plannedTheme: undefined, status: session.status === "completed" ? "completed" : currentDayPlan.key === "rest" ? "rest" : "partial" }, true);
  const toggleActivity = (activity: string) => {
    const selected = session.activities ?? (session.activity ? [session.activity] : []);
    const activities = selected.includes(activity) ? selected.filter((item) => item !== activity) : [...selected, activity];
    update({ activities, activity: activities.join(" + ") });
  };
  const openMobilityPicker = () => { if (!canEditSession()) return; setMobilityDraft([...session.mobilityExercises]); setShowMobilityPicker(true); loadAllSessions().then(setHistory).catch(() => { /* Keep the cached history if refresh is unavailable. */ }); };
  const toggleMobilityDraft = (name: string) => setMobilityDraft((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  const applyMobilityDraft = () => {
    const libraryOrder = libraryExercises.map((exercise) => exercise.name);
    const ordered = [...mobilityDraft].sort((a, b) => libraryOrder.indexOf(a) - libraryOrder.indexOf(b));
    update({ mobilityExercises: ordered, completedExercises: session.completedExercises.filter((name) => ordered.includes(name)) });
    setShowMobilityPicker(false);
  };
  const selectAddon = (name: string) => update(toggleAddonSelection(sessionRef.current, name));
  const toggleExercise = (name: string) => update({ completedExercises: session.completedExercises.includes(name) ? session.completedExercises.filter((item) => item !== name) : [...session.completedExercises, name] });
  const renameLibraryExercise = (id: string, previousName: string, requestedName: string) => {
    const name = requestedName.trim().replace(/\s+/g, " ");
    if (!name) return { saved: false, message: "Enter an exercise title." };
    if (libraryExercises.some((exercise) => exercise.id !== id && exercise.name.toLowerCase() === name.toLowerCase())) return { saved: false, message: "That exercise title is already in your library." };
    if (name === previousName) return { saved: true, message: "Title is already up to date." };
    const renameList = (items: string[]) => items.map((item) => item === previousName ? name : item);
    const renameSession = (item: Session) => {
      if (workoutIsLocked(item,editingDateRef.current)) return item;
      const mobilityExercises = renameList(item.mobilityExercises);
      const completedExercises = renameList(item.completedExercises);
      if (mobilityExercises.every((value, index) => value === item.mobilityExercises[index]) && completedExercises.every((value, index) => value === item.completedExercises[index])) return item;
      return { ...item, mobilityExercises, completedExercises, updatedAt: new Date().toISOString() };
    };
    setLibraryExercises((items) => items.map((exercise) => exercise.id === id ? { ...exercise, name } : exercise));
    const current = renameSession(sessionRef.current);
    const currentChanged = current !== sessionRef.current;
    if (currentChanged) { sessionRef.current = current; setSession(current); }
    setHistory((items) => {
      const renamed = items.map((item) => item.id === current.id ? current : renameSession(item));
      const currentWasMissing = currentChanged && !renamed.some((item) => item.id === current.id);
      const next = currentWasMissing ? [current, ...renamed] : renamed;
      const changed = renamed.filter((item, index) => item !== items[index]);
      if (currentWasMissing || (currentChanged && !changed.some((item) => item.id === current.id))) changed.push(current);
      void Promise.all(changed.map((item) => saveSession(item).catch(() => localStorage.setItem(`t4l:${item.date}`, JSON.stringify(item)))));
      return next;
    });
    return { saved: true, message: `Renamed to ${name}. Existing workout selections were updated.` };
  };
  const contentRef = useRef<HTMLElement>(null);
  const scrollToTop = () => contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  const navigate = (next: Tab) => { setJournalDate(null); setTab(next); scrollToTop(); };
  const makePlanForNextWeek = () => { setPlanWeek("next"); scrollToTop(); };
  const openTrainingAssessment = () => { setFocusAssessment(true); navigate("performance"); };
  useEffect(() => {
    if (tab !== "performance" || !focusAssessment) return;
    const card = document.querySelector<HTMLElement>(".performance-page .assessment-card");
    card?.scrollIntoView({ block: "center", behavior: "smooth" });
    card?.focus({ preventScroll: true });
    setFocusAssessment(false);
  }, [tab, focusAssessment]);
  const saveNextWeekMapping = (next: string[]) => {
    const nextHistory = planNextWeek(scheduleHistory, scheduleKeys, next, today);
    let previousSchedule: string|null = null; let previousHistory: string|null = null;
    try {
      previousSchedule = localStorage.getItem("t4l:schedule");
      previousHistory = localStorage.getItem("t4l:schedule-history");
    } catch { return false; }
    try {
      localStorage.setItem("t4l:schedule-history", JSON.stringify(nextHistory));
      localStorage.setItem("t4l:schedule", JSON.stringify(next));
    } catch {
      for (const [key, value] of [["t4l:schedule-history", previousHistory], ["t4l:schedule", previousSchedule]]) { try { if (value === null) localStorage.removeItem(key!); else localStorage.setItem(key!, value!); } catch { /* Attempt both rollbacks independently. */ } }
      return false;
    }
    setScheduleHistory(nextHistory); setScheduleKeys(next); return true;
  };
  const enterApp = (next: Tab) => { try { sessionStorage.setItem("t4l:entered-app", "1"); } catch { /* Continue without a session preference. */ } setTab(next); setEnteredApp(true); scrollToTop(); };
  useEffect(() => {
    let start: { x: number; y: number; time: number; scroll: number } | null = null;
    const begin = (event: TouchEvent) => {
      if(finishingRef.current)return;
      start = null;
      const target = event.target instanceof Element ? event.target : null;
      if (event.touches.length !== 1 || journalDate || showMobilityPicker ||
          !target?.closest(".app-shell") || target.closest('button, input, textarea, select, a, iframe, video, [contenteditable], [role="dialog"], .bottom-nav, .splash-release-notes, .gps-route-map')) return;
      const touch = event.touches[0];
      if (touch.clientX < 24 || touch.clientX > window.innerWidth - 24) return;
      for (let node: Element | null = target; node; node = node.parentElement) {
        if (node.scrollWidth > node.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(node).overflowX)) return;
      }
      start = { x: touch.clientX, y: touch.clientY, time: Date.now(), scroll: contentRef.current?.scrollTop || 0 };
    };
    const move = (event: TouchEvent) => { if (event.touches.length !== 1) start = null; };
    const end = (event: TouchEvent) => {
      const origin = start; start = null;
      if (!origin || event.changedTouches.length !== 1 || Math.abs((contentRef.current?.scrollTop || 0) - origin.scroll) > 20) return;
      const touch = event.changedTouches[0];
      const step = swipeStep(touch.clientX - origin.x, touch.clientY - origin.y, Date.now() - origin.time);
      if (!step) return;
      const next = adjacentSwipeTab(enteredApp ? tab : "home", step);
      if (!next) return;
      if (event.cancelable) event.preventDefault();
      setJournalDate(null);
      if (next === "home") {
        try { sessionStorage.removeItem("t4l:entered-app"); } catch { /* Navigation still works. */ }
        setEnteredApp(false); setActiveDate(today); scrollToTop();
      } else {
        if (next === "today") setActiveDate(today);
        enterApp(next);
      }
    };
    const cancel = () => { start = null; };
    document.addEventListener("touchstart", begin, { passive: true });
    document.addEventListener("touchmove", move, { passive: true });
    document.addEventListener("touchend", end, { passive: false });
    document.addEventListener("touchcancel", cancel);
    return () => {
      document.removeEventListener("touchstart", begin); document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end); document.removeEventListener("touchcancel", cancel);
    };
  }, [enteredApp, tab, journalDate, showMobilityPicker]);
  const openJournal = (date: Date) => { if(finishingRef.current)return; setJournalDate(dateKey(date)); scrollToTop(); };
  const openPlanDate = (date: Date) => { if (dateKey(date) <= dateKey(today)) openJournal(date); else openDate(date); };
  const openDate = (date: Date) => { if(finishingRef.current)return;setJournalDate(null); setActiveDate(date); setTab("today"); scrollToTop(); };
  const beginWorkoutEdit=(date:Date)=>{
    if(finishingRef.current)return;
    const key=dateKey(date);editingDateRef.current=key;setEditingDate(key);
    setFinishBackupState("");setCelebratingDate(null);openDate(date);
  };
  const finishAndBackup = async () => {
    if(!canEditSession()||addingPhotos||attachingVideo||attachingScreenshot)return;
    finishingRef.current=true;setFinishing(true);
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setFinishBackupState("Choose backup location…");
    const now = new Date().toISOString();
    const hasWorkoutData = Boolean(session.activity || session.duration || session.distance || session.notes || session.mobilityExercises.length || session.completedExercises.length || session.videos.length || session.workoutPhoto);
    // A completed recovery day is still a completed record. Keep the plan
    // type as Recovery while using the same completion state everywhere.
    const current = { ...sessionRef.current, status: "completed" as const, completedAt: now, updatedAt: now };
    const allSessions = [...history.filter((item) => item.id !== current.id), current].sort((a, b) => b.date.localeCompare(a.date));
    try {
      await saveBackup(allSessions, libraryExercises, futureVideos, insightReports, fitnessGoals, scheduleKeys, customWorkouts, scheduleHistory);
      try { await saveSession(current); } catch { localStorage.setItem(`t4l:${activeKey}`, JSON.stringify(current)); }
      sessionRef.current=current;setSession(current); setHistory(allSessions);
      editingDateRef.current=null;setEditingDate(null);
      setCelebratingDate(current.date);
      setSaveState(plan.key === "rest" ? "Recovery day honored" : "Workout complete + saved");
      setFinishBackupState("✓ Day recorded + backup saved");
    } catch (error) { setFinishBackupState(error instanceof DOMException && error.name === "AbortError" ? "" : "Try Finish + Backup Again"); }
    finally { finishingRef.current=false;setFinishing(false); }
  };
  const attachVideo = async () => {
    if(!canEditSession())return;
    const url = videoUrl.trim();
    const id = youtubeId(url);
    if (!id) { setVideoMessage("Paste a valid YouTube video link."); return; }
    setAttachingVideo(true); setVideoMessage("Saving video…");
    let title = videoLabel.trim();
    if (!title) { try { title = await fetchYoutubeTitle(id); } catch { title = "Workout video"; } }
    let thumbnailData = "";
    try { thumbnailData = await captureYoutubeThumbnail(id); } catch { setVideoMessage("Video saved. The thumbnail will load when online."); }
    const reusable=futureVideos.find(item=>(item.videoId||youtubeId(item.url))===id)||history.flatMap(item=>item.videos).find(item=>(item.videoId||youtubeId(item.url))===id&&item.trainingPlan);
    const video: Video = { url, label: title, videoId: id, thumbnailData,trainingPlan:reusable?.trainingPlan };
    update({ videos: [...session.videos, video] });
    videoLabelEdited.current = false; setVideoUrl(""); setVideoLabel(""); setShowVideoForm(false); setAttachingVideo(false);
    setVideoMessage("Video saved.");
  };
  const deleteVideo = (sessionId: string, videoIndex: number) => {
    const target=sessionRef.current.id===sessionId?sessionRef.current:history.find(item=>item.id===sessionId);
    if(workoutIsLocked(target,editingDateRef.current)||finishingRef.current)return;
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
  const changeSessionVideo=(index:number,original:Video,patch:Partial<Video>)=>{if(!canEditSession())return false;const videos=sessionRef.current.videos;if(!videos[index]||videoIdentity(videos[index])!==videoIdentity(original))return false;update({videos:videos.map((item,i)=>i===index?sanitizeVideoTraining({...item,...patch}):item)},true);return true;};
  const saveSessionVideoPlan=(index:number,video:Video,trainingPlan:VideoTrainingPlan)=>{if(!canEditSession())return false;const current=sessionRef.current.videos[index];if(!current||videoIdentity(current)!==videoIdentity(video))return false;const ids=new Set(trainingPlan.exercises.flatMap(exercise=>exercise.sets.map(set=>set.id)));if(Object.entries(current.trainingResults||{}).some(([id,result])=>!ids.has(id)&&(result.done||result.weight||result.reps||result.work)))return false;if(!changeSessionVideo(index,video,{trainingPlan}))return false;const reusable=videoForNextWorkout({...video,trainingPlan});setFutureVideos(items=>items.some(item=>videoIdentity(item)===videoIdentity(video))?items.map(item=>videoIdentity(item)===videoIdentity(video)?{...item,trainingPlan}:item):[...items,reusable]);return true;};
  const addVideoToToday = async (video: Video) => {
    const todayKey = dateKey(today);
    const todayPlan = activeSchedule[today.getDay()];
    let saved: Session | undefined;
    try { saved = await getSession(todayKey); } catch { const fallback = localStorage.getItem(`t4l:${todayKey}`); saved = fallback ? JSON.parse(fallback) : undefined; }
    const current = sessionRef.current.id === todayKey ? sessionRef.current : saved ? normalizeSession(saved) : emptySession(todayKey, todayPlan.key === "rest", todayPlan);
    if(workoutIsLocked(current,editingDateRef.current)||finishingRef.current)return "Today’s workout is locked. Tap Edit on Today before adding a video.";
    const videoId = video.videoId || youtubeId(video.url);
    if (current.videos.some((item) => (item.videoId || youtubeId(item.url)) === videoId)) return "That video is already in today’s workout.";
    const next = { ...current, videos: [...current.videos, videoForNextWorkout(video)], updatedAt: new Date().toISOString() };
    try { await saveSession(next); } catch { localStorage.setItem(`t4l:${todayKey}`, JSON.stringify(next)); }
    if (sessionRef.current.id === todayKey) { sessionRef.current=next;setSession(next); }
    setHistory((items) => [next, ...items.filter((item) => item.id !== todayKey)].sort((a, b) => b.date.localeCompare(a.date)));
    return `Added “${video.label}” to today’s workout.`;
  };
  const addExerciseToToday = async (name: string) => {
    const todayKey = dateKey(today);
    let saved: Session | undefined;
    try { saved = await getSession(todayKey); } catch { const fallback = localStorage.getItem(`t4l:${todayKey}`); saved = fallback ? JSON.parse(fallback) : undefined; }
    const current = sessionRef.current.id === todayKey ? sessionRef.current : saved ? normalizeSession(saved) : emptySession(todayKey, activeSchedule[today.getDay()].key === "rest", activeSchedule[today.getDay()]);
    if(workoutIsLocked(current,editingDateRef.current)||finishingRef.current)return "Today’s workout is locked. Tap Edit on Today before adding exercises.";
    if (current.mobilityExercises.includes(name)) return `${name} is already in today’s add-ons.`;
    const next = { ...current, mobilityExercises: [...current.mobilityExercises, name], updatedAt: new Date().toISOString() };
    try { await saveSession(next); } catch { localStorage.setItem(`t4l:${todayKey}`, JSON.stringify(next)); }
    if (sessionRef.current.id === todayKey) { sessionRef.current = next; setSession(next); }
    setHistory(items => [next, ...items.filter(item => item.id !== todayKey)].sort((a,b) => b.date.localeCompare(a.date)));
    return `Added ${name} to today’s add-ons.`;
  };
  const gps = useGpsTracker(async (date, workout, change) => {
    if(saveTimer.current)clearTimeout(saveTimer.current);
    let saved: Session | undefined;
    try { saved = await getSession(date); } catch { const raw = localStorage.getItem(`t4l:${date}`); saved = raw ? JSON.parse(raw) : undefined; }
    const dayPlan = scheduleForDate(dateFromKey(date), activeSchedule, scheduleHistory)[dateFromKey(date).getDay()];
    const current = sessionRef.current.id === date ? sessionRef.current : saved ? normalizeSession(saved) : emptySession(date, dayPlan.key === "rest", dayPlan);
    const existing = current.gpsWorkouts || [];
    if(workoutIsLocked(current,editingDateRef.current)&&!existing.some(item=>item.id===workout.id))throw new Error("Tap Edit before recording another workout.");
    if((change === 'edit'||change === 'delete') && (workoutIsLocked(current,editingDateRef.current)||!existing.some(item=>item.id===workout.id)))throw new Error("Tap Edit workout before changing a saved recording.");
    const previous = existing.find(item=>item.id===workout.id);
    // A delayed place lookup must never recreate a deleted recording.
    if(change === 'route' && !previous)return workout;
    const updatedWorkout = change === 'route' && previous ? {...previous,route:workout.route} : change === 'edit' && previous ? {...previous,activity:workout.activity,seconds:workout.seconds,meters:workout.meters} : workout;
    const workouts = change === 'delete' ? existing.filter(item=>item.id!==workout.id) : existing.some(item => item.id === workout.id) ? existing.map(item => item.id === workout.id ? updatedWorkout : item) : [...existing, updatedWorkout];
    const meters = workouts.reduce((sum,item)=>sum+item.meters,0);
    const seconds = workouts.reduce((sum,item)=>sum+item.seconds,0);
    const next = { ...current, gpsWorkouts:workouts, activity:current.activity || workout.activity, activities:current.activities?.length ? current.activities : [workout.activity], duration:!current.duration || ((current.gpsWorkouts?.length || 0)>0 && current.duration===gpsTime((current.gpsWorkouts || []).reduce((sum,item)=>sum+item.seconds,0))) ? (workouts.length?gpsTime(seconds):'') : current.duration, distance:!current.distance || ((current.gpsWorkouts?.length || 0)>0 && current.distance===`${((current.gpsWorkouts || []).reduce((sum,item)=>sum+item.meters,0)/1609.344).toFixed(2)} mi`) ? (workouts.length?`${(meters/1609.344).toFixed(2)} mi`:'') : current.distance, startTime:current.startTime || new Date(workout.startedAt).toLocaleTimeString("en-US", {hour:"2-digit",minute:"2-digit",hour12:false}), updatedAt:new Date().toISOString() };
    if(change === 'delete' && existing[0] && current.startTime===new Date(existing[0].startedAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}))next.startTime=workouts[0]?new Date(workouts[0].startedAt).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:false}):'';
    if(change === 'edit'||change === 'delete')Object.assign(next,correctedGpsActivities(current.activity,current.activities,existing,workouts));
    try { await saveSession(next); } catch { localStorage.setItem(`t4l:${date}`,JSON.stringify(next)); }
    if(sessionRef.current.id===date){ sessionRef.current=next;setSession(next); }
    setHistory(items=>[next,...items.filter(item=>item.id!==date)].sort((a,b)=>b.date.localeCompare(a.date)));
    return updatedWorkout;
  });
  const activeIsToday = activeKey === dateKey(today);
  const weekMap = new Map(history.map((item) => [item.date, item]));
  // The open Today session is the freshest source for its date. Include it in
  // calendar views immediately after Finish so Plan cannot lag behind History
  // while the background store refresh completes.
  const viewHistory = (() => {
    const existing = history.find((item) => item.id === session.id);
    // Once the active date has loaded, its open editor state is newer than any
    // storage snapshot—even before the background save finishes.
    const chosen = loaded ? session : existing || session;
    return [chosen, ...history.filter((item) => item.id !== session.id)].sort((a, b) => b.date.localeCompare(a.date));
  })();
  const injuryReported = hasReportedInjury(session);
  const handleInjuryControl = () => update({injury:{...sessionRef.current.injury,reported:!injuryReported}},true);
  const updateInjury = (injury: Injury) => update({injury},true);
  const clearInjury = () => {
    updateInjury({ reported: false, impact: "", bodyArea: "", note: "" });
  };
  const removeImportedWorkout = (index: number) => update({ importedWorkouts: (session.importedWorkouts ?? []).filter((_, itemIndex) => itemIndex !== index) });
  const addWorkoutPhotos = async (files: File[]) => {
    if (addingPhotos||!canEditSession()) return;
    const date = sessionRef.current.date;
    const capacity = 6 - workoutPhotos(sessionRef.current).length;
    if (capacity <= 0) { setPhotoNotice("Up to six photos per workout. Remove one to add another."); return; }
    setAddingPhotos(true);
    try {
      setPhotoNotice("Preparing photos…");
      const additions = await Promise.all(files.slice(0, capacity).map(prepareWorkoutPhoto));
      if (sessionRef.current.date !== date) { setPhotoNotice("The day changed. Please add the photos again on the intended day."); return; }
      const photos = [...workoutPhotos(sessionRef.current), ...additions].slice(0,6);
      update({ workoutPhotos: photos, workoutPhoto: photos[0] }, true);
      setPhotoNotice(`${additions.length} photo${additions.length===1?"":"s"} added. Photos are included in backups.${files.length>capacity?" Only the first six fit this workout.":""}`);
    } catch (error) { setPhotoNotice(error instanceof Error ? error.message : "Photos could not be added."); }
    finally { setAddingPhotos(false); }
  };
  const togglePanel = (panel: "workout", open: boolean) => setOpenPanel(open ? panel : null);

  // Completion and body concerns are independent: a flag must not hide the
  // finished state or invite another backup of an already completed workout.
  const activeFinished = workoutIsLocked(session,editingDate);
  // Older screenshot imports stored the extracted metrics directly on the day
  // without an import list. Recognize that shape so it is not shown as 0/6.
  const legacyScreenshotOffset = !(session.importedWorkouts?.length) && Boolean(session.detailSource || (session.duration && session.distance && session.pace)) ? 1 : 0;
  const displayedImportedWorkouts = session.importedWorkouts?.length ? session.importedWorkouts : legacyScreenshotOffset ? [{ activity: session.activity, date: session.date, startTime: session.startTime || "", distance: session.distance, duration: session.duration, pace: session.pace || "", calories: session.calories || "", source: session.detailSource || "Existing screenshot", confidence: "medium" as const, warnings: [] as string[] }] : [];

  const splashPlan = activeKey === dateKey(today) ? plan : historicalPlan(undefined, scheduleForDate(today, activeSchedule, scheduleHistory), today);
  if (!enteredApp) return <div className={`app-shell theme-${splashPlan.key} splash-shell`}><SplashScreen version={APP_VERSION} todayPlan={splashPlan} todayActivity={activeKey === dateKey(today) && session.date === activeKey ? session.activity : ""} onEnter={enterApp}/></div>;
  return <div className={`app-shell textured-shell theme-${plan.key}${tab === "performance" ? " progress-shell" : ""}`}>
    <main ref={contentRef} className={tab === "week" && !journalDate ? "plan-content" : undefined} style={showMobilityPicker ? { overflow: "hidden" } : undefined}>
      {journalDate ? <DailyJournal key={journalDate} date={journalDate} today={dateKey(today)} session={viewHistory.find(item => item.date === journalDate)} plan={historicalPlan(viewHistory.find(item => item.date === journalDate), scheduleForDate(dateFromKey(journalDate), activeSchedule, scheduleHistory), dateFromKey(journalDate))} onDate={date => { setJournalDate(date); scrollToTop(); }} onBack={() => { setJournalDate(null); scrollToTop(); }} onEdit={() => beginWorkoutEdit(dateFromKey(journalDate))} onAddVideo={addVideoToToday} onShare={() => { const record = viewHistory.find(item => item.date === journalDate); if (record) setShareData(toShareCardData(record, historicalPlan(record, scheduleForDate(dateFromKey(journalDate), activeSchedule, scheduleHistory), dateFromKey(journalDate)))); }} onRouteLabel={workoutIsLocked(viewHistory.find(item=>item.date===journalDate),editingDate)?undefined:(id,label)=>{const current=viewHistory.find(item=>item.date===journalDate);const workout=current?.gpsWorkouts?.find(item=>item.id===id);if(workout?.route)void gps.updateSavedLabel(journalDate,workout,label);}}/> : <>
      {tab === "today" && <div className="today-page today-tabs-page"><header className="training-page-heading"><h1>Today’s workout</h1></header>
        {!activeIsToday && <div className="editing-banner"><span>Viewing {activeDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span><button disabled={finishing} onClick={() => setActiveDate(today)}>Return to today</button></div>}
        <section className={`today-hero ${plan.key}`}>
          <div className="hero-topline"><span>{activeDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span></div>
          <h2>{plan.theme}</h2><div className="today-terrain" aria-hidden="true" data-workout-type={plan.key} style={adventureBackgroundFor(plan.key)}/>
        </section>
        {activeFinished&&<div className="workout-lock-banner"><div><strong>Saved workout · Locked</strong><small>Tap Edit to make changes.</small></div><button type="button" onClick={()=>beginWorkoutEdit(activeDate)}>Edit</button></div>}
        {!activeFinished&&session.completedAt&&<p className="workout-editing-note">Editing saved workout · Save changes to lock it again.</p>}
        <div className="today-section-tabs" role="tablist" aria-label="Today sections">{([['workout','Workout'],['log','Log'],['check-ins','Check-ins']] as const).map(([key,label],index) => <button key={key} id={`today-tab-${key}`} role="tab" aria-controls={`today-panel-${key}`} aria-selected={todaySection === key} onClick={() => setTodaySection(key)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const keys = ['workout','log','check-ins'] as const; const next = keys[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3]; setTodaySection(next); document.getElementById(`today-tab-${next}`)?.focus(); } }}>{label}</button>)}</div>
        {gps.draft && todaySection !== "workout" && <button className="today-tracking-status" onClick={() => setTodaySection("workout")}>{gps.draft.activity} · {gps.autoPaused ? "Auto-paused" : gps.running ? "Recording" : gps.pending ? "Connecting" : "Paused"} · Open tracker</button>}
        <section id="today-panel-workout" role="tabpanel" aria-labelledby="today-tab-workout" hidden={todaySection !== "workout"} className="today-section-panel">
{repeatSource ? <details className="repeat-workout" key={`${activeKey}-${plan.key}-${plan.theme}`}><summary><span aria-hidden="true">↻</span><b>Repeat prior workout</b><span aria-hidden="true">＋</span></summary><div><p>{plan.theme} · {dateFromKey(repeatSource.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p><p>Reuse the format, add-ons, videos and notes. Your current entries stay; past results and checkmarks stay in history.</p><button type="button" onClick={repeatPriorWorkout} disabled={!loaded||workoutReadOnly}>Use this workout setup</button>{repeatNotice && <p role="status">{repeatNotice}</p>}</div></details> : <details className="repeat-workout"><summary><span aria-hidden="true">↻</span><b>Repeat prior workout</b></summary><p>No earlier {plan.theme} workout setup yet.</p></details>}
<details className="surface-card compact-panel activity-card" open={openPanel === "workout"} onToggle={(e) => togglePanel("workout", e.currentTarget.open)}>
            <summary><span className="panel-icon">{plan.icon}</span><span><b>Main workout</b><small>{session.activity || "Choose format or equipment"}</small></span><i>＋</i></summary>
            <div className="panel-body"><fieldset className="workout-edit-fields" disabled={workoutReadOnly}><div className="day-workout-override"><label><span>Workout for this day</span><select value={plan.key} onChange={(event) => setDayWorkoutType(event.target.value)}>{workoutOptions.map((option) => <option value={option.key} key={option.key}>{option.label}</option>)}</select></label><div><small>{session.planOverride ? "One-day change · weekly plan stays the same" : "Following your weekly plan"}</small>{session.planOverride && <button onClick={restoreWeeklyWorkoutType}>Use weekly plan</button>}</div></div><div className="activity-grid">{plan.activities.map((activity) => { const selected = (session.activities ?? (session.activity ? [session.activity] : [])).includes(activity); return <button key={activity} className={selected ? "selected" : ""} aria-pressed={selected} onClick={() => toggleActivity(activity)}><span>{selected ? "✓" : plan.icon}</span>{activity}</button>; })}</div></fieldset></div>
          </details>
        <GpsTracker tracker={gps} onEditWorkout={()=>beginWorkoutEdit(activeDate)} readOnly={workoutReadOnly} date={activeKey} savedWorkouts={session.gpsWorkouts}/>
        <section className="today-addons"><div className="today-section-title"><h3>Add-ons</h3><button onClick={openMobilityPicker} disabled={workoutReadOnly}>＋ Add / edit</button></div>
        <p className="today-addon-count">{session.mobilityExercises.length} selected · {session.completedExercises.filter(name => session.mobilityExercises.includes(name)).length} completed</p>
        {addonChoices(session.mobilityExercises, libraryExercises.map(item => item.name)).map(name => {
          const exercise = libraryExercises.find(item => item.name === name);
          const selected = session.mobilityExercises.includes(name);
          const done = session.completedExercises.includes(name);
          return <div className={`today-addon-row${selected ? " selected" : " suggested"}`} key={name}>
            <label><input type="checkbox" aria-label={`Select ${name}`} disabled={!loaded||workoutReadOnly} checked={selected} onChange={() => selectAddon(name)}/><span>{name}{!selected && <small>Example · select to add</small>}</span></label>
            {selected && <button className="today-addon-done" disabled={!loaded||workoutReadOnly} aria-label={`${done ? "Unmark" : "Mark"} ${name} completed`} aria-pressed={done} onClick={() => toggleExercise(name)}>{done ? "✓ Done" : "Mark done"}</button>}
            <details><summary>Details</summary><div className="today-addon-detail"><MovementMark exerciseId={exercise?.id} name={name} graphicData={exercise?.graphicData}/><p>{exercise?.equipment || "Supporting exercise"}</p><a href={`https://pedaltone.github.io/speaking-timer/?work=60&duration=60&rest=0&rounds=1&autostart=1&exercise=${encodeURIComponent(name)}`} target="_blank" rel="noreferrer">Start timer</a></div></details>
          </div>;
        })}

        </section>
            <section className="today-videos"><h3>Workout videos</h3>{session.videos.length > 0 && <div className="video-grid">{session.videos.map((video, i) => <VideoCard video={video} planMode={workoutReadOnly?"read":"session"} onPlan={workoutReadOnly?undefined:plan=>saveSessionVideoPlan(i,video,plan)} onResults={workoutReadOnly?undefined:results=>changeSessionVideo(i,video,{trainingResults:results})} onDelete={workoutReadOnly?undefined:() => deleteVideo(session.id, i)} key={`${video.url}-${i}`}/>)}</div>}{!showVideoForm ? <button disabled={workoutReadOnly} className="add-video-toggle" onClick={() => setShowVideoForm(true)}>＋ Add Video</button> : <fieldset className="inline-sheet workout-edit-fields" disabled={workoutReadOnly}><input type="url" value={videoUrl} onChange={(e) => { videoLabelEdited.current = false; setVideoUrl(e.target.value); setVideoLabel(""); setVideoMessage(""); }} placeholder="Paste YouTube URL"/><input aria-label="YouTube video label" value={videoLabel} onChange={(e) => { videoLabelEdited.current = true; setVideoLabel(e.target.value); }} placeholder="Video title loads automatically"/><button className="compact-primary" onClick={attachVideo} disabled={attachingVideo}>{attachingVideo ? "Saving…" : "Save video"}</button>{videoMessage && <p className="video-message" role="status">{videoMessage}</p>}</fieldset>}</section>

        </section>
        <section id="today-panel-log" role="tabpanel" aria-labelledby="today-tab-log" hidden={todaySection !== "log"} className="today-section-panel today-log-panel"><fieldset className="workout-edit-fields" disabled={workoutReadOnly}>
<div className="field-grid"><label><span>Duration</span><div><input value={session.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="—"/></div></label><label><span>Distance</span><div><input value={session.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="—"/></div></label></div>
<div className="effort-row"><span>How hard did it feel?</span><div>{(["easy", "moderate", "hard"] as Effort[]).map((effort) => <button key={effort} aria-pressed={session.effort === effort} className={session.effort === effort ? "selected" : ""} onClick={() => update({ effort: session.effort === effort ? "" : effort })}>{effort}</button>)}</div></div>
        <label className="today-note-label">Workout note<textarea ref={noteTextarea} value={session.notes} onChange={(e) => update({ notes: e.target.value })} onInput={(e) => resizeNoteField(e.currentTarget)} placeholder="What went well? Anything to remember?" rows={3} aria-label="Workout note"/></label>
        <div className="prior-note-copy">{priorWorkoutNotes ? <><button type="button" onClick={copyPriorNotes} disabled={!loaded||workoutReadOnly}>{session.notes.trim() ? "Append prior workout notes" : "Copy prior workout notes"}</button><small>Last {plan.theme} · {dateFromKey(priorWorkoutNotes.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></> : null}{noteCopyNotice && <p role="status">{noteCopyNotice}</p>}</div>
        <div className="today-attachments">
<details className="today-photo"><summary>{workoutPhotos(session).length ? `Workout photos (${workoutPhotos(session).length})` : "Add photos"}</summary><div className="workout-photo-body"><div className="workout-photo-grid">{workoutPhotos(session).map((photo,index)=><figure key={`${index}-${photo.slice(-24)}`}><img src={photo} alt={`Workout photo ${index+1}`}/><button disabled={addingPhotos} className="quiet-photo" onClick={()=>{const photos=workoutPhotos(sessionRef.current).filter((_,i)=>i!==index);update({workoutPhotos:photos,workoutPhoto:photos[0]},true);setPhotoNotice("Photo removed from this workout.");}}>Remove photo {index+1}</button></figure>)}</div><button disabled={addingPhotos||workoutPhotos(session).length>=6} className="workout-photo-add" onClick={()=>workoutPhotoInput.current?.click()}>{addingPhotos?"Adding photos…":"＋ Add workout photos"}</button><input ref={workoutPhotoInput} type="file" accept="image/*" multiple onChange={event=>{const files=Array.from(event.target.files||[]);if(files.length)void addWorkoutPhotos(files);event.currentTarget.value="";}}/>{photoNotice&&<p className="photo-notice" role="status">{photoNotice}</p>}<small className="workout-photo-help">Up to six photos. Compressed and included in your backups.</small></div></details>
<ScreenshotAttachments onBusyChange={setAttachingScreenshot} key={activeKey} screenshots={session.workoutScreenshots} onChange={workoutReadOnly?undefined:items=>update({workoutScreenshots:items})}/>{Boolean(session.importedWorkouts?.length) && <details className="screenshot-import"><summary>Previously saved workout details</summary><div className="imported-workout-list" aria-label="Added workout screenshots">{session.importedWorkouts?.map((workout, index) => <div className="imported-workout-row" key={`${workout.date}-${workout.startTime}-${index}`}><div><b>Screenshot {index + 1}</b><span>{[workout.date, workout.startTime].filter(Boolean).join(" · ") || "Workout details added"}</span><div className="imported-workout-metrics">{[["Duration", workout.duration], ["Distance", workout.distance], ["Pace", workout.pace], ["Calories", workout.calories], ["Activity", workout.activity]].filter(([, value]) => value).map(([label, value]) => <span key={label}><b>{label}</b>{value}</span>)}</div></div><button className="text-button" onClick={() => removeImportedWorkout(index)}>Remove</button></div>)}</div></details>}
        </div>
<details className="today-more-metrics"><summary>More metrics</summary><div className="field-grid"><label><span>Pace</span><div><input value={session.pace ?? ""} onChange={(e) => update({ pace: e.target.value })} placeholder="—"/></div></label><label><span>Calories</span><div><input inputMode="numeric" value={session.calories ?? ""} onChange={(e) => update({ calories: e.target.value })} placeholder="—"/></div></label><label><span>Start time</span><div><input value={session.startTime ?? ""} onChange={(e) => update({ startTime: e.target.value })} placeholder="—"/></div></label></div></details>
        {session.detailSource && <p className="detail-source">Imported from {session.detailSource} · You can edit any value.</p>}
        </fieldset></section>
        <section id="today-panel-check-ins" role="tabpanel" aria-labelledby="today-tab-check-ins" hidden={todaySection !== "check-ins"} className="today-section-panel"><fieldset className="workout-edit-fields" disabled={workoutReadOnly}>
            <section className={`today-body-check ${injuryReported ? "active" : ""}`}><h3>Body check-in</h3><p>How did your body feel today?</p><div className="today-body-options"><button onClick={clearInjury} aria-pressed={!injuryReported}>✓ No concerns</button><button onClick={() => { if (!injuryReported) handleInjuryControl(); }} aria-pressed={injuryReported}>⚑ Add a concern</button></div>{injuryReported && <><div className="sheet-options injury-options">{[["stopped", "Stopped early"], ["prevented", "Couldn’t start"]].map(([value, label]) => <button key={value} className={session.injury.impact === value ? "selected" : ""} onClick={() => updateInjury({ ...session.injury, reported: true, impact: session.injury.impact === value ? "" : value as Injury["impact"] })}>{label}</button>)}</div><input aria-label="Body area to be mindful of" value={session.injury.bodyArea} onChange={(e) => updateInjury({ ...session.injury, reported: true, bodyArea: e.target.value })} placeholder="Area to be mindful of (optional)"/><textarea aria-label="Body check-in note" value={session.injury.note} onChange={(e) => updateInjury({ ...session.injury, reported: true, note: e.target.value })} placeholder="Add a note about what you noticed…" rows={3}/><button className="text-button" onClick={clearInjury}>Clear body check-in</button></>}</section>

        <NutritionCard key={activeKey} date={activeKey} expanded readOnly={workoutReadOnly}/>
        </fieldset></section>
<div className={`finish-zone primary-finish today-finish ${activeFinished ? "finished" : ""}`}><p className="today-save-state" role="status">{activeFinished?"Saved on this device · Locked":saveState}</p>{activeFinished ? <div className="finish-complete" role="status"><span className={`completion-mark ${celebratingDate === activeKey ? "just-completed" : ""}`} aria-hidden="true" onAnimationEnd={() => setCelebratingDate(null)}><svg viewBox="0 0 24 24" fill="none"><path d="m5 12 4 4L19 6" pathLength="1"/></svg></span><div><strong>Workout finished</strong><small>{finishBackupState || "Logged on this device · backup saved"}</small></div><button onClick={()=>beginWorkoutEdit(activeDate)}>Edit</button></div> : <div className="finish-actions"><button disabled={finishing||addingPhotos||attachingVideo||attachingScreenshot||Boolean(gps.draft && gps.draft.date===activeKey) || gps.saving} title={gps.draft && gps.draft.date===activeKey ? "Stop and save GPS totals before finishing the workout" : undefined} onClick={finishAndBackup} className={`finish-button ${finishBackupState.startsWith("Try") ? "error" : ""}`}><span>↓</span>{finishBackupState || (session.completedAt?"Save changes + Backup":"Finish Workout + Backup")}<span>→</span></button></div>}{activeFinished && <ShareWorkoutButton onClick={() => setShareData(toShareCardData(session, plan))}/>}</div>
      </div>}

      {showMobilityPicker && <MobilityPicker exercises={libraryExercises} selected={mobilityDraft} completed={session.completedExercises} sessions={history} currentDate={activeKey} toggleExercise={toggleMobilityDraft} toggleCompleted={toggleExercise} onDone={applyMobilityDraft} onCancel={() => setShowMobilityPicker(false)}/>}

      {tab === "week" && <WeekView today={today} sessions={viewHistory} activeSchedule={activeSchedule} scheduleHistory={scheduleHistory} onOpenDate={openPlanDate} onMakeNextWeekPlan={makePlanForNextWeek} selectedWeek={planWeek} onWeek={setPlanWeek} scheduleKeys={scheduleKeys} onMapping={saveNextWeekMapping} customWorkouts={customWorkouts} setCustomWorkouts={setCustomWorkouts} onAssessment={openTrainingAssessment}/>}
      {tab === "history" && <HistoryView memory={historyTimelineMemory} filters={historyFilters} onFilters={setHistoryFilters} now={today} sessions={viewHistory} activeSchedule={activeSchedule} scheduleHistory={scheduleHistory} onOpenDate={openJournal}/>}
      {tab === "performance" && <PerformanceView weeks={progressWeeks} setWeeks={setProgressWeeks} library={libraryExercises.map(e => e.name)} onAddExercise={addExerciseToToday} onOpenJournal={openJournal} now={today} sessions={viewHistory} activeSchedule={activeSchedule} scheduleHistory={scheduleHistory}/>}
      {tab === "more" && <MoreView editingDate={editingDate} todayLocked={workoutIsLocked(viewHistory.find(item=>item.date===dateKey(today)),editingDate)} onEditToday={()=>beginWorkoutEdit(today)} todayVideos={viewHistory.find(item=>item.date===dateKey(today))?.videos||[]} libraryExercises={libraryExercises} setLibraryExercises={setLibraryExercises} onRenameExercise={renameLibraryExercise} futureVideos={futureVideos} setFutureVideos={setFutureVideos} insightReports={insightReports} setInsightReports={setInsightReports} fitnessGoals={fitnessGoals} setFitnessGoals={setFitnessGoals} scheduleKeys={scheduleKeys} setScheduleKeys={setScheduleKeys} setScheduleHistory={setScheduleHistory} scheduleHistory={scheduleHistory} customWorkouts={customWorkouts} setCustomWorkouts={setCustomWorkouts} sessions={history} setHistory={setHistory} onDeleteVideo={deleteVideo} onAddToToday={addVideoToToday}/>}
      </>}
    </main>
    {shareData && <ShareComposer data={shareData} onClose={closeShare}/>}
    <nav className="bottom-nav" aria-label="Primary navigation"><button disabled={finishing} className="home-nav" onClick={() => { try { sessionStorage.removeItem("t4l:entered-app"); } catch { /* Continue without a session preference. */ } setJournalDate(null); setActiveDate(today); setEnteredApp(false); scrollToTop(); }}><NavIcon name="home"/><small>Home</small></button>{(["today", "week", "history", "performance", "more"] as Tab[]).map((item) => <button disabled={finishing} key={item} className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => { if (item === "today") setActiveDate(today); navigate(item); }} aria-label={item === "performance" ? "Progress" : undefined}><NavIcon name={item}/><small>{item === "more" ? "Settings" : item === "week" ? "Plan" : item === "performance" ? "Progress" : item[0].toUpperCase() + item.slice(1)}</small></button>)}</nav>
  </div>;
}

function VideoCard({ video, onPlan, onResults, startPlan=false, onWorkflowDone, planMode="session", onDelete, onAddToday, categoryLabel, onCategoryChange, addedToToday=false, addingToToday=false, addDisabled=false }: { video: Video; startPlan?:boolean;onWorkflowDone?:()=>void;onPlan?:(plan:VideoTrainingPlan)=>boolean|void; onResults?:(results:Record<string,VideoSetResult>)=>void; planMode?:"template"|"session"|"read"; onDelete?: () => void; onAddToday?: () => void; addedToToday?: boolean; addingToToday?: boolean; addDisabled?: boolean; categoryLabel?: string; onCategoryChange?: (category: VideoCategory | "") => void }) {
  const cardRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [buildingPlan,setBuildingPlan]=useState(false);
  const id = video.videoId || youtubeId(video.url);
  const finishPlanWorkflow=()=>{onWorkflowDone?.();requestAnimationFrame(()=>cardRef.current?.scrollIntoView({block:"start",behavior:"smooth"}));};
  const savedPlan=validateVideoPlan(video.trainingPlan);
  const thumbnail = video.thumbnailData || (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "");
  const play = () => {
    setPlaying(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };
  return <article ref={cardRef} data-video-id={id} className={`video-card ${playing ? "playing" : ""}`}>
    <div className="video-card-status">{categoryLabel && <span className="video-category-badge">{categoryLabel}</span>}{savedPlan?<span className="video-plan-ready" role="status">✓ Plan ready · {savedPlan.exercises.length} {savedPlan.exercises.length===1?"exercise":"exercises"}</span>:planMode==="template"&&<span className="video-plan-missing">No plan yet</span>}</div>
    {onCategoryChange && <details className="video-category-edit"><summary>Change category</summary><label className="video-category-control"><span>Category</span><select value={isVideoCategory(video.category) ? video.category : ""} onChange={(event) => onCategoryChange(event.target.value as VideoCategory | "")}><option value="">Uncategorized</option>{videoCategories.map((category) => <option value={category.key} key={category.key}>{category.icon} {category.label}</option>)}</select></label></details>}
    {playing && id ? <div className="inline-player"><iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`} title={video.label} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/><button onClick={() => setPlaying(false)}>Close player</button></div> : <button className="video-launch" onClick={play} aria-label={`Play ${video.label} inside Training for Life`}><span className="video-thumb">{thumbnail ? <img src={thumbnail} alt=""/> : null}<i>▶</i></span><span><strong>{video.label}</strong><small>{video.thumbnailData ? "Thumbnail saved · play here" : "YouTube · play here"}</small></span><b aria-hidden="true">›</b></button>}
    {(video.trainingPlan||onPlan)&&<VideoPlanView video={video} onPlan={onPlan} onResults={onResults} mode={planMode} startRequested={startPlan} onWorkflowDone={finishPlanWorkflow} onEditingChange={setBuildingPlan}/>}
    {!buildingPlan&&(onAddToday || onDelete) && <div className="video-actions">
      {onDelete && !confirmingDelete && <button className="video-delete" onClick={() => setConfirmingDelete(true)} aria-label={`Delete ${video.label}`}>Delete</button>}
      {onAddToday && <button className={`video-add-today ${addedToToday?"video-added-today":""}`} disabled={addedToToday||addDisabled} onClick={onAddToday}>{addedToToday?"✓ Added to today":addingToToday?"Adding…":"Add to today"}</button>}
      {onDelete && confirmingDelete && <div className="video-delete-confirm"><span>Delete this video?</span><button onClick={() => setConfirmingDelete(false)}>Cancel</button><button className="danger" onClick={onDelete}>Delete</button></div>}
    </div>}
  </article>;
}

function ExerciseHeatMap({ days, completedDates, count }: { days: string[]; completedDates: Set<string>; count: number }) {
  return <span className={`mobility-heat heat-${Math.min(4, count)}`} aria-label={`${count} completed sessions in the past 14 days`}>{days.map((day) => <i key={day} className={completedDates.has(day) ? "completed" : ""}/>)}</span>;
}

function MobilityPicker({ exercises, selected, completed, sessions, currentDate, toggleExercise, toggleCompleted, onDone, onCancel }: { exercises: LibraryExercise[]; selected: string[]; completed: string[]; sessions: Session[]; currentDate: string; toggleExercise: (name: string) => void; toggleCompleted: (name: string) => void; onDone: () => void; onCancel: () => void }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const previous = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [onCancel]);
  const heatDays = Array.from({ length: 14 }, (_, index) => { const day = dateFromKey(currentDate); day.setDate(day.getDate() - 13 + index); return dateKey(day); });
  const heatDaySet = new Set(heatDays);
  const completedByExercise = new Map<string, Set<string>>();
  const recordCompletion = (name: string, day: string) => { if (!completedByExercise.has(name)) completedByExercise.set(name, new Set()); completedByExercise.get(name)!.add(day); };
  sessions.filter((saved) => heatDaySet.has(saved.date)).forEach((saved) => saved.completedExercises.forEach((name) => recordCompletion(name, saved.date)));
  completed.forEach((name) => recordCompletion(name, currentDate));
  const ordered = exercises.map((exercise) => { const completedDates = completedByExercise.get(exercise.name) || new Set<string>(); return { ...exercise, added: selected.includes(exercise.name), done: completed.includes(exercise.name), completedDates, heatCount: completedDates.size }; }).sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1;
    if (a.heatCount !== b.heatCount) return a.heatCount - b.heatCount;
    if (a.added !== b.added) return a.added ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const completedCount = selected.filter((name) => completed.includes(name)).length;
  const filtered = ordered.filter(({ name, equipment }) => `${name} ${equipment}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="mobility-sheet-backdrop" onClick={onCancel}><section className="mobility-sheet" role="dialog" aria-modal="true" aria-labelledby="mobility-sheet-title" onClick={(e) => e.stopPropagation()}><div className="mobility-sheet-header"><div><span className="kicker">ADD-ONS · {selected.length} SELECTED · {completedCount} COMPLETED</span><h2 id="mobility-sheet-title">Choose and check exercises</h2><p>Cooler options are least used in the past two weeks; hotter options are used more often.</p></div><button onClick={onCancel} aria-label="Close add-ons">×</button></div><div className="mobility-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" aria-label="Search mobility exercises"/></div><div className="library-list mobility-sheet-list">{filtered.map(({ id, name, equipment, added, done, completedDates, heatCount, graphicData }) => { const timerUrl = `https://pedaltone.github.io/speaking-timer/?work=60&duration=60&rest=0&rounds=1&autostart=1&exercise=${encodeURIComponent(name)}`; return <div key={id} className={`mobility-picker-row heat-${Math.min(4, heatCount)} ${added ? "added" : ""} ${done ? "checked" : ""}`}><button className="mobility-picker-select" aria-pressed={added} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark exerciseId={id} name={name} graphicData={graphicData}/></span><span><strong>{name}</strong><small>{equipment}</small><span className="mobility-heat-row"><small>{heatCount ? `${heatCount} of 14 days` : "No sessions in 14 days"}</small><ExerciseHeatMap days={heatDays} completedDates={completedDates} count={heatCount}/></span></span>{!added && <em>+ Add</em>}</button><button className="mobility-picker-check" aria-label={`${done ? "Uncheck" : "Check off"} ${name}`} aria-pressed={done} disabled={!added} onClick={() => toggleCompleted(name)}><span>{done ? "✓" : ""}</span><small>Done</small></button>{added && <button className="mobility-picker-remove" onClick={() => toggleExercise(name)}>Remove</button>}{added && <a className="picker-start-timer" href={timerUrl} target="_blank" rel="noreferrer">Start timer</a>}</div>; })}{filtered.length === 0 && <p className="empty-state">No exercises match that search.</p>}</div><div className="mobility-sheet-footer"><span>{selected.length} selected · {completedCount} completed</span><button onClick={onDone}>Done</button></div></section></div>;
}

function DailyMobility({ session, exercises, toggleExercise, onEdit }: { session: Session; exercises: LibraryExercise[]; toggleExercise: (name: string) => void; onEdit: () => void }) {
  const complete = session.mobilityExercises.filter((name) => session.completedExercises.includes(name)).length;
  const exerciseByName = new Map(exercises.map((exercise) => [exercise.name, exercise]));
  return <details className="surface-card daily-mobility"><summary><span><b>Mobility exercises</b><small>{complete} of {session.mobilityExercises.length} completed</small></span><i>⌄</i></summary><div className="daily-mobility-body"><div className="checklist">{session.mobilityExercises.map((name) => { const checked = session.completedExercises.includes(name); const exercise = exerciseByName.get(name); const timerUrl = `https://pedaltone.github.io/speaking-timer/?work=60&duration=60&rest=0&rounds=1&autostart=1&exercise=${encodeURIComponent(name)}`; return <div key={name} className={`daily-exercise-row ${checked ? "checked" : ""}`}><button className="daily-exercise-toggle" aria-pressed={checked} onClick={() => toggleExercise(name)}><span className="exercise-visual"><MovementMark exerciseId={exercise?.id} name={name} graphicData={exercise?.graphicData}/></span><span className="exercise-copy"><strong>{name}</strong><small>{exercise?.equipment || "Mobility exercise"}</small></span><span className="check-target">{checked ? "✓" : ""}</span></button><a className="start-timer" href={timerUrl} target="_blank" rel="noreferrer">Start timer</a></div>; })}</div><button className="edit-mobility" onClick={onEdit}>Edit loaded exercises</button></div></details>;
}

function WeekView({ today, sessions, activeSchedule, scheduleHistory, onOpenDate, onMakeNextWeekPlan, selectedWeek, onWeek, scheduleKeys, onMapping, customWorkouts, setCustomWorkouts, onAssessment }: { today: Date; sessions: Session[]; activeSchedule: Schedule; scheduleHistory: ScheduleSnapshot[]; onOpenDate: (date: Date) => void; onMakeNextWeekPlan: () => void; selectedWeek: "this" | "next"; onWeek: (week:"this"|"next")=>void; scheduleKeys:string[]; onMapping:(keys:string[])=>boolean; customWorkouts:CustomWorkout[]; setCustomWorkouts:React.Dispatch<React.SetStateAction<CustomWorkout[]>>; onAssessment:()=>void }) {
  const [newWorkoutType, setNewWorkoutType] = useState("");
  const [mappingNotice, setMappingNotice] = useState("");
  const todayKey = dateKey(today);
  const [selectedDate, setSelectedDate] = useState(() => todayKey);
  const featuredRef = useRef<HTMLElement>(null);
  useEffect(() => { setSelectedDate(todayKey); }, [todayKey]);
  const map = new Map(sessions.map((item) => [item.date, item]));
  const days = weekDates(selectedWeek === "next" ? nextMonday(today) : today);
  const nextKeys = scheduleKeysOn(dateKey(nextMonday(today)), scheduleKeys, scheduleHistory, todayKey, defaultScheduleKeys);
  const entries = days.map((date) => {
    const saved = map.get(dateKey(date));
    const plan = historicalPlan(saved, scheduleForDate(date, activeSchedule, scheduleHistory), date);
    return { date, saved, plan, state: stateFor(saved, plan.key, date, today), isToday: dateKey(date) === dateKey(today), scene: adventureSceneFor(plan.key) };
  });
  const featured = entries.find(entry => dateKey(entry.date) === selectedDate) || entries.find(entry => entry.isToday) || entries[0];
  return <div className="subpage week-page featured-week-page">
    <header className="plan-view-heading"><div><h1>Your week ahead</h1><p>{days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {days[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div></header>
    <div className="plan-week-tabs" role="tablist" aria-label="Plan week">{([['this','This week'],['next','Next week']] as const).map(([key,label])=><button type="button" key={key} id={`plan-tab-${key}`} role="tab" aria-selected={selectedWeek===key} aria-controls={`plan-panel-${key}`} tabIndex={selectedWeek===key?0:-1} onClick={()=>onWeek(key)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'this':event.key==='End'?'next':selectedWeek==='this'?'next':'this';onWeek(next);document.getElementById(`plan-tab-${next}`)?.focus();}}}>{label}</button>)}</div>
    <section className="plan-week-panel" role="tabpanel" id={`plan-panel-${selectedWeek}`} aria-labelledby={`plan-tab-${selectedWeek}`}>
    {selectedWeek === "next" ? <>
      <button type="button" className="plan-assessment-link" onClick={onAssessment}><span><strong>Training Assessment</strong><small>Review your report in Progress before planning.</small></span><span aria-hidden="true">→</span></button>
      <section className="next-week-mapping surface-card" aria-labelledby="next-mapping-heading"><header><h2 id="next-mapping-heading">Weekly workout mapping</h2><p>Choose your Monday–Sunday routine. Changes start {days[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} and repeat weekly.</p></header>
      <div className="schedule-editor">{[1, 2, 3, 4, 5, 6, 0].map((index) => { const date = days[index===0?6:index-1]; const day = schedule[index]; return <label key={day.short}><span>{day.short}<small>{date.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</small></span><select aria-label={`${date.toLocaleDateString("en-US", {weekday:"long"})} workout`} value={nextKeys[index] || day.key} onChange={event=>{const next=nextKeys.map((key,itemIndex)=>itemIndex===index?event.target.value:key);setMappingNotice(onMapping(next)?"Saved for next week.":"Could not save. Check device storage and try again.");}}>{workoutTypeOptions(customWorkouts).map(option=><option value={option.key} key={option.key}>{option.label}</option>)}</select></label>; })}</div>
      <p className="mapping-save-note" role="status">{mappingNotice || "Saved automatically on this device. This week and logged workouts stay as they are."}</p>
      <details className="plan-custom-types"><summary>Add a workout type</summary><div className="custom-workout-adder"><label><span>Workout name</span><input value={newWorkoutType} onChange={event=>setNewWorkoutType(event.target.value)} placeholder="e.g., Hiking"/></label><button type="button" onClick={()=>{const label=newWorkoutType.trim().replace(/\s+/g," ");if(!label)return;if(workoutTypeOptions(customWorkouts).some(item=>item.label.toLowerCase()===label.toLowerCase())){setMappingNotice("That workout type is already available.");return;}setCustomWorkouts(items=>[...items,{key:`custom:${encodeURIComponent(label)}`,label}]);setNewWorkoutType("");setMappingNotice(`${label} added to your workout options.`);}}>Add workout</button></div></details>
      </section>
    </> : <>

    <nav className="plan-day-strip" aria-label="Choose a day to preview">{entries.map(({ date, plan, state, isToday }) => <button type="button" key={dateKey(date)} aria-pressed={dateKey(date) === dateKey(featured.date)} aria-current={isToday ? "date" : undefined} aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}: ${plan.theme}. ${stateLabel(state)}${isToday ? ". Today" : ""}`} onClick={() => setSelectedDate(dateKey(date))}><span>{plan.short}</span><b>{date.getDate()}</b><i className={state} aria-hidden="true">{state === "completed" ? "✓" : state === "skipped" ? "−" : "○"}</i></button>)}</nav>
    <section ref={featuredRef} className="plan-featured surface-card" aria-label="Selected day workout">
      <div className="plan-featured-art" role="img" aria-label={featured.scene.name} data-workout-type={featured.plan.key} style={adventureBackgroundFor(featured.plan.key)}/>
      <div className="plan-featured-copy"><p className="plan-featured-date">{featured.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}{featured.isToday ? " · Today" : ""}</p><h2>{featured.plan.theme}</h2><p className="plan-featured-status">{featured.saved?.activity || featured.plan.guidance}</p><span className={`plan-state ${featured.state}`}>{featured.state === "completed" ? "✓ " : ""}{stateLabel(featured.state)}</span><button type="button" className="plan-open-workout" onClick={() => onOpenDate(featured.date)}>Open workout <span aria-hidden="true">→</span></button></div>
    </section>
    <section className="plan-week-overview" aria-labelledby="plan-overview-heading"><h2 id="plan-overview-heading">Your week</h2>{entries.map(({ date, plan, state, isToday }) => <button type="button" key={dateKey(date)} aria-pressed={dateKey(date) === dateKey(featured.date)} aria-label={`Preview ${plan.short} ${date.getDate()}: ${plan.theme}. ${stateLabel(state)}`} onClick={() => { setSelectedDate(dateKey(date)); featuredRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="plan-overview-day">{plan.short}<small>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span><strong>{plan.theme}{isToday && <small>Today</small>}</strong><span className={`plan-state ${state}`}><i aria-hidden="true">{state === "completed" ? "✓" : state === "skipped" ? "−" : "○"}</i><span>{stateLabel(state)}</span></span></button>)}</section>
    <button className="week-next-plan-button" type="button" onClick={onMakeNextWeekPlan}>Plan next week <span aria-hidden="true">›</span></button>
    </>}
    </section>
  </div>;

}

function HistoryView({ memory, filters, onFilters, now, sessions, activeSchedule, scheduleHistory, onOpenDate }: { memory:React.RefObject<{today:string;cursor:string;scroll:number}|null>;filters: HistoryFilters; onFilters: (filters: HistoryFilters) => void; now: Date; sessions: Session[]; activeSchedule: Schedule; scheduleHistory: ScheduleSnapshot[]; onOpenDate: (date: Date) => void }) {
  const remembered=memory.current?.today===dateKey(now)?memory.current:null;
  const [historyCursor,setHistoryCursor]=useState(()=>remembered?dateFromKey(remembered.cursor):new Date(now));
  const timeline=useRef<HTMLDivElement>(null);
  const destination=useRef<'recent'|'latest'|'earliest'|null>(remembered?null:'latest');
  const lastScroll=useRef(remembered?.scroll||0);
  const recentPinned=useRef(false);
  const observedToday=useRef(dateKey(now));
  const latestPinned=useRef(true);
  const [position,setPosition]=useState({atStart:false,atEnd:true});
  const searching=Boolean(filters.query.trim()||filters.type||filters.from||filters.to||filters.bodyOnly);
  const cursorKey=dateKey(weekDates(historyCursor)[0]);
  const currentPeriod=cursorKey===dateKey(weekDates(now)[0]);
  useEffect(()=>{if(observedToday.current===dateKey(now))return;observedToday.current=dateKey(now);destination.current='latest';setHistoryCursor(new Date(now));},[dateKey(now)]);
  const weekBlocks=historyWeeks(historyCursor);
  const map=new Map(sessions.map(item=>[item.date,item]));
  const syncPosition=()=>{const element=timeline.current;if(!element)return;lastScroll.current=element.scrollTop;memory.current={today:dateKey(now),cursor:cursorKey,scroll:element.scrollTop};const cards=element.querySelectorAll<HTMLElement>('.week-scan');recentPinned.current=cards.length>=3&&Math.abs(element.scrollTop-cards[cards.length-3].offsetTop)<3;const atEnd=element.scrollTop+element.clientHeight>=element.scrollHeight-2;latestPinned.current=atEnd;const next={atStart:element.scrollTop<=2,atEnd};setPosition(current=>current.atStart===next.atStart&&current.atEnd===next.atEnd?current:next);};
  useLayoutEffect(()=>{
    const element=timeline.current;if(!element)return;
    const cards=element.querySelectorAll<HTMLElement>('.week-scan');
    element.scrollTop=destination.current==='latest'?element.scrollHeight:destination.current==='earliest'?0:destination.current==='recent'&&cards.length>=3?cards[cards.length-3].offsetTop:lastScroll.current;
    destination.current=null;syncPosition();
  },[cursorKey,searching]);
  useEffect(()=>{const element=timeline.current;if(!element)return;const observer=new ResizeObserver(()=>{if(latestPinned.current)element.scrollTop=element.scrollHeight;else if(recentPinned.current){const cards=element.querySelectorAll<HTMLElement>('.week-scan');if(cards.length>=3)element.scrollTop=cards[cards.length-3].offsetTop;}syncPosition();});observer.observe(element);const content=element.querySelector('.multi-week');if(content)observer.observe(content);return()=>observer.disconnect();},[searching]);
  const browseWeeks=(direction:number)=>{
    const element=timeline.current;if(!element)return;
    const atEdge=direction<0?element.scrollTop<=2:element.scrollTop+element.clientHeight>=element.scrollHeight-2;
    if(atEdge){if(direction>0&&currentPeriod)return;destination.current=direction<0?'earliest':'latest';setHistoryCursor(current=>shiftHistoryWeeks(current,direction,now));return;}
    recentPinned.current=false;latestPinned.current=false;
    const cards=element.querySelectorAll<HTMLElement>('.week-scan');
    const distance=cards.length>3?cards[3].offsetTop-cards[0].offsetTop:element.clientHeight;
    element.scrollBy({top:direction*distance,behavior:'auto'});syncPosition();
  };
  const backToThisWeek=()=>{destination.current='latest';setHistoryCursor(new Date(now));const element=timeline.current;if(element){element.scrollTo({top:element.scrollHeight,behavior:'auto'});syncPosition();if(currentPeriod)destination.current=null;}};
  const first=weekBlocks[0][0],last=weekBlocks.at(-1)![6];
  const range=`${first.toLocaleDateString('en-US',{month:'short',day:'numeric',...(first.getFullYear()!==last.getFullYear()?{year:'numeric' as const}:{})})} – ${last.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  return <div className="subpage history-page"><header className="training-page-heading"><h1>Workout history</h1></header>
    <HistorySearchPanel entries={sessions.map(session => ({ session, theme: historicalPlan(session, scheduleForDate(dateFromKey(session.date), activeSchedule, scheduleHistory), dateFromKey(session.date)).theme }))} filters={filters} onChange={onFilters} today={dateKey(now)} onOpen={date => onOpenDate(dateFromKey(date))}/>
    {!searching && <>
    <section className="history-browse-controls" aria-label="Browse workout weeks"><strong aria-live="polite">{range}</strong><div><button type="button" onClick={()=>browseWeeks(-1)} aria-label="Earlier weeks"><span aria-hidden="true">‹</span> Earlier</button><button type="button" onClick={()=>browseWeeks(1)} disabled={currentPeriod&&position.atEnd} aria-label="Later weeks">Later <span aria-hidden="true">›</span></button><button type="button" className="history-back-current" onClick={backToThisWeek} disabled={currentPeriod&&position.atEnd}>Back to this week</button></div><small>12 weeks</small></section>
    <div className="history-timeline-window" ref={timeline} onScroll={syncPosition} tabIndex={0} role="region" aria-label="Scrollable weekly workout history" aria-description="Scroll weeks or use the Earlier and Later buttons."><section className="multi-week">{weekBlocks.map((days) => <div className="week-scan" key={dateKey(days[0])}><div className="scan-heading"><span>{dateKey(days[0]) === dateKey(weekDates(now)[0]) ? "THIS WEEK" : `WEEK OF ${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`}</span><b>{days.filter((date) => { const saved = map.get(dateKey(date)); const plan = historicalPlan(saved, scheduleForDate(date, activeSchedule, scheduleHistory), date); return resolveSessionStatus(saved,plan.key,date,now)==="complete"; }).length} / {days.length} complete</b></div><div className="scan-days">{days.map((date) => { const saved = map.get(dateKey(date)); const plan = historicalPlan(saved, scheduleForDate(date, activeSchedule, scheduleHistory), date); const state = stateFor(saved, plan.key, date, now); return <button key={dateKey(date)} className={`${state} ${plan.key} ${dateKey(date)===dateKey(now)?"history-today":""}`} title={`${plan.theme} · ${stateLabel(state)}${hasReportedInjury(saved) ? " · Body consideration" : ""}`} onClick={() => onOpenDate(date)}><span className="history-day-icon" style={{color:historyWorkoutColor(plan.key)}} aria-hidden="true"><HistoryWorkoutIcon workoutKey={plan.key}/></span><strong>{date.getDate()}</strong><small>{plan.short}</small>{dateKey(date)===dateKey(now)&&<em className="history-today-label">TODAY</em>}<span className="history-status-row"><i className={resolveSessionStatus(saved,plan.key,date,now)==="complete"?"history-complete":"history-neutral"} aria-label={resolveSessionStatus(saved,plan.key,date,now)==="complete"?"Complete":stateLabel(state)}>{resolveSessionStatus(saved,plan.key,date,now)==="complete"?"✓":stateSymbol(state).replace("⚑","•")}</i>{hasReportedInjury(saved)&&<b className="history-body-flag" aria-label="Body note">⚑</b>}</span></button>; })}</div></div>)}</section></div>
    <div className="history-status-legend"><span><b className="history-complete">✓</b> Complete</span><span><b className="history-body-flag">⚑</b> Body note</span><span><b>•</b> Planned</span></div>
    <details className="history-color-key"><summary>Workout colors</summary><div>{Object.entries(historyWorkoutColors).map(([key,color])=><span key={key}><i style={{background:color}} aria-hidden="true"/>{({strength:'Strength',mobility:'Mobility',aerobic:'Easy aerobic',speed:'Speed',endurance:'Endurance',rest:'Recovery'} as Record<string,string>)[key]}</span>)}</div></details>
    <NutritionHistory onOpenDate={onOpenDate}/>
    </>}
  </div>;
}

function PerformanceView({ weeks, setWeeks, library, onAddExercise, onOpenJournal, now, sessions, activeSchedule, scheduleHistory }: { weeks:number; setWeeks:(weeks:number)=>void; library: string[]; onAddExercise: (name:string)=>Promise<string>; onOpenJournal: (date:Date)=>void; now: Date; sessions: Session[]; activeSchedule: Schedule; scheduleHistory: ScheduleSnapshot[]; }) {
  return <div className="subpage performance-page">
    <LocalProgressView assessment={<AssessmentCard/>} weeks={weeks} setWeeks={setWeeks} entries={sessions.map(session => { const plan = historicalPlan(session, scheduleForDate(dateFromKey(session.date), activeSchedule, scheduleHistory), dateFromKey(session.date)); return {session, key:plan.key, theme:plan.theme}; })} today={dateKey(now)} library={library} onAdd={onAddExercise} onOpen={date=>onOpenJournal(dateFromKey(date))}/>

  </div>;
}

function calculateStreak(sessions: Session[], now: Date, activeSchedule: Schedule, scheduleHistory: ScheduleSnapshot[] = []) {
  const map = new Map(sessions.map((item) => [item.date, item])); let streak = 0;
  for (let offset = 0; offset < 730; offset++) { const date = new Date(now); date.setDate(now.getDate() - offset); const saved = map.get(dateKey(date)); const plan = historicalPlan(saved, scheduleForDate(date, activeSchedule, scheduleHistory), date); const state = stateFor(saved, plan.key, date, now); if (["completed", "modified", "protected", "rest"].includes(state)) streak++; else if (offset === 0 && state === "missed") continue; else break; }
  return streak;
}

function MoreView({ scheduleHistory, setScheduleHistory, editingDate, todayLocked, onEditToday, todayVideos, libraryExercises, setLibraryExercises, onRenameExercise, futureVideos, setFutureVideos, insightReports, setInsightReports, fitnessGoals, setFitnessGoals, scheduleKeys, setScheduleKeys, customWorkouts, setCustomWorkouts, sessions, setHistory, onDeleteVideo, onAddToToday }: { scheduleHistory: ScheduleSnapshot[]; setScheduleHistory: React.Dispatch<React.SetStateAction<ScheduleSnapshot[]>>; editingDate:string|null;todayLocked: boolean; onEditToday:()=>void; todayVideos: Video[]; libraryExercises: LibraryExercise[]; setLibraryExercises: React.Dispatch<React.SetStateAction<LibraryExercise[]>>; onRenameExercise: (id: string, previousName: string, requestedName: string) => { saved: boolean; message: string }; futureVideos: Video[]; setFutureVideos: React.Dispatch<React.SetStateAction<Video[]>>; insightReports: TrainingInsightReport[]; setInsightReports: React.Dispatch<React.SetStateAction<TrainingInsightReport[]>>; fitnessGoals: FitnessGoals; setFitnessGoals: React.Dispatch<React.SetStateAction<FitnessGoals>>; scheduleKeys: string[]; setScheduleKeys: React.Dispatch<React.SetStateAction<string[]>>; customWorkouts: CustomWorkout[]; setCustomWorkouts: React.Dispatch<React.SetStateAction<CustomWorkout[]>>; sessions: Session[]; setHistory: React.Dispatch<React.SetStateAction<Session[]>>; onDeleteVideo: (sessionId: string, videoIndex: number) => void; onAddToToday: (video: Video) => Promise<string> }) {
  const [newExercise, setNewExercise] = useState(""); const [newEquipment, setNewEquipment] = useState(""); const [newGraphicDescription, setNewGraphicDescription] = useState(""); const [newReferencePhoto, setNewReferencePhoto] = useState(""); const [notice, setNotice] = useState("");
  const [futureUrl, setFutureUrl] = useState(""); const [futureCategory, setFutureCategory] = useState<VideoCategory | "">(""); const [futureVideoFilter, setFutureVideoFilter] = useState<VideoCategory | "all" | "uncategorized">("all"); const [futureNotice, setFutureNotice] = useState(""); const [savingFutureVideo, setSavingFutureVideo] = useState(false);
  const [planVideoId,setPlanVideoId]=useState<string|null>(null),[futureSectionOpen,setFutureSectionOpen]=useState(false);
  const savingFuture=useRef(false);
  useEffect(()=>{const pending=readVideoPlanFlow();if(pending){setPlanVideoId(pending.videoId);setFutureSectionOpen(true);}},[]);
  const [recentNotice, setRecentNotice] = useState("");
  const addingVideo = useRef(false);
  const [addingVideoId,setAddingVideoId]=useState<string|null>(null);
  const todayVideoIds=new Set(todayVideos.map(videoIdentity));
  const filteredFutureVideos=filterFutureVideos(futureVideos,futureVideoFilter);
  const [exerciseNameDrafts, setExerciseNameDrafts] = useState<Record<string, string>>({});
  const [libraryNotice, setLibraryNotice] = useState("");
  const recentVideos = sessions.flatMap((s) => s.videos.map((video, videoIndex) => ({ ...video, sessionId: s.id, videoIndex }))).slice(0, 6);
  const updateExercise = (id: string, patch: Partial<LibraryExercise>) => setLibraryExercises((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const saveExerciseTitle = (exercise: LibraryExercise) => {
    const result = onRenameExercise(exercise.id, exercise.name, exerciseNameDrafts[exercise.id] ?? exercise.name);
    setLibraryNotice(result.message);
    if (result.saved) setExerciseNameDrafts((drafts) => { const next = { ...drafts }; delete next[exercise.id]; return next; });
  };
  const addExercise = () => { if (!newExercise.trim()) return; const hasReference = Boolean(newReferencePhoto || newGraphicDescription.trim()); setLibraryExercises((items) => [...items, { id: crypto.randomUUID(), name: newExercise.trim(), equipment: newEquipment.trim() || "No equipment listed", graphicDescription: newGraphicDescription.trim() || undefined, referencePhotoData: newReferencePhoto || undefined, graphicReviewStatus: hasReference ? "pending" : undefined }]); setNewExercise(""); setNewEquipment(""); setNewGraphicDescription(""); setNewReferencePhoto(""); setLibraryNotice(hasReference ? "Exercise added with graphic reference. Graphic review requested." : "Exercise added."); };
  async function saveReferencePhoto(id: string, file: File) { try { const referencePhotoData = await prepareExerciseReference(file); updateExercise(id, { referencePhotoData, graphicReviewStatus: "pending" }); setLibraryNotice("Reference photo saved. Graphic review requested for this exercise."); } catch (error) { setLibraryNotice(error instanceof Error ? error.message : "That reference photo could not be saved."); } }
  const updateFutureVideo=(url:string,patch:Partial<Video>)=>{const items=futureVideos.map(item=>item.url===url?{...item,...patch}:item);try{localStorage.setItem("t4l:future-videos",JSON.stringify(items));setFutureVideos(items);return true;}catch{setFutureNotice("Could not save. Check device storage and try again.");return false;}};
  function saveFutureVideo(buildPlan=false) {
    const url=futureUrl.trim(),videoId=youtubeId(url);if(!videoId){setFutureNotice("Paste a valid YouTube video link.");return;}
    if(savingFuture.current)return;savingFuture.current=true;
    const existing=futureVideos.find(video=>(video.videoId||youtubeId(video.url))===videoId);
    const video:Video=existing||{url,label:"Workout video",videoId,category:futureCategory||undefined};
    if(!existing){try{localStorage.setItem("t4l:future-videos",JSON.stringify([video,...futureVideos]));}catch{setFutureNotice("Could not save this video. Check device storage and try again.");savingFuture.current=false;return;}setFutureVideos(items=>items.some(item=>videoIdentity(item)===videoId)?items:[video,...items]);}
    setFutureVideoFilter("all");setFutureSectionOpen(true);setFutureUrl("");setFutureCategory("");setSavingFutureVideo(false);savingFuture.current=false;
    if(buildPlan&&!validateVideoPlan(video.trainingPlan)){writeVideoPlanFlow({videoId,transcript:"",draft:null,stage:"transcript"});setPlanVideoId(videoId);if(!openVideoTranscript(video))setFutureNotice("Video saved. Open its transcript website below.");else setFutureNotice("");}
    else{setPlanVideoId(null);setFutureNotice(existing?validateVideoPlan(video.trainingPlan)?"Already saved · workout plan ready.":"This video is already saved.":"Video saved.");if(existing)requestAnimationFrame(()=>document.querySelector(`[data-video-id="${videoId}"]`)?.scrollIntoView({block:"center",behavior:"smooth"}));}
    if(!existing)void (async()=>{let label="Workout video",thumbnailData="";try{label=await fetchYoutubeTitle(videoId);}catch{/* Keep the saved video usable. */}try{thumbnailData=await captureYoutubeThumbnail(videoId);}catch{/* Use YouTube's live thumbnail. */}setFutureVideos(items=>items.map(item=>videoIdentity(item)===videoId?{...item,label:item.label==="Workout video"?label:item.label,thumbnailData:item.thumbnailData||thumbnailData}:item));})();
  }
  async function addSavedVideoToToday(video: Video, setMessage: (message:string)=>void) {
    if (addingVideo.current) return;
    addingVideo.current=true;setAddingVideoId(videoIdentity(video));setMessage("Adding video…");
    try {
      const {url,label,videoId,thumbnailData,category,trainingPlan}=video;
      setMessage(await onAddToToday({url,label,videoId,thumbnailData,category,trainingPlan}));
    } catch { setMessage("That video could not be saved. Please try again."); }
    finally { addingVideo.current=false;setAddingVideoId(null); }
  }
  const addFutureToToday=(video:Video)=>addSavedVideoToToday(video,setFutureNotice);
  const addRecentToToday=(video:Video)=>addSavedVideoToToday(video,setRecentNotice);
  async function restoreData(file: File) { try { const payload = JSON.parse(await file.text()); if (payload.schemaVersion !== 1 || !Array.isArray(payload.sessions)) throw new Error(); if (payload.nutrition !== undefined) validateNutrition(payload.nutrition); const restored = payload.sessions.map((item: Session) => normalizeSession(item)); await Promise.all(restored.map(saveSession)); if (Array.isArray(payload.customWorkouts)) { const restoredCustom = payload.customWorkouts.filter((item: CustomWorkout) => item?.key?.startsWith("custom:") && item?.label?.trim()).map((item: CustomWorkout) => ({ key: String(item.key), label: String(item.label).trim() })); localStorage.setItem("t4l:custom-workouts", JSON.stringify(restoredCustom)); setCustomWorkouts(restoredCustom); } if (Array.isArray(payload.scheduleKeys) && payload.scheduleKeys.length === 7) { localStorage.setItem("t4l:schedule", JSON.stringify(payload.scheduleKeys)); setScheduleKeys(payload.scheduleKeys.map(String)); const snapshots = Array.isArray(payload.scheduleHistory) ? payload.scheduleHistory.filter((item:ScheduleSnapshot)=>/^\d{4}-\d{2}-\d{2}$/.test(item?.effectiveDate)&&Array.isArray(item.keys)&&item.keys.length===7).map((item:ScheduleSnapshot)=>({effectiveDate:item.effectiveDate,keys:item.keys.map(String)})) : []; const restoredHistory = snapshots.length ? snapshots : [...scheduleHistory.filter(item=>item.effectiveDate<dateKey(easternToday())),{effectiveDate:dateKey(easternToday()),keys:payload.scheduleKeys.map(String)}]; localStorage.setItem("t4l:schedule-history",JSON.stringify(restoredHistory));setScheduleHistory(restoredHistory); } if (payload.goals && typeof payload.goals === "object") { const restoredGoals = { primaryGoal: String(payload.goals.primaryGoal || ""), priorities: String(payload.goals.priorities || ""), constraints: String(payload.goals.constraints || ""), updatedAt: String(payload.goals.updatedAt || "") }; localStorage.setItem("t4l:fitness-goals", JSON.stringify(restoredGoals)); setFitnessGoals(restoredGoals); } if (Array.isArray(payload.libraryExercises)) { const restoredLibrary = payload.libraryExercises.filter((item: LibraryExercise) => item?.id && item?.name).map((item: LibraryExercise) => ({ id: item.id, name: item.name, equipment: item.equipment || "No equipment listed", referencePhotoData: item.referencePhotoData, graphicDescription: item.graphicDescription, graphicData: item.graphicData, graphicReviewStatus: item.graphicReviewStatus })); localStorage.setItem("t4l:library", JSON.stringify(restoredLibrary)); setLibraryExercises(restoredLibrary); } if (Array.isArray(payload.futureVideos)) { const restoredVideos = payload.futureVideos.filter((item: Video) => item?.url && item?.label).map((video:Video)=>videoForNextWorkout(stripVideoGuide(video))); localStorage.setItem("t4l:future-videos", JSON.stringify(restoredVideos)); setFutureVideos(restoredVideos); } if (Array.isArray(payload.insightReports)) { const restoredReports = payload.insightReports.filter((item: TrainingInsightReport) => item?.id && item?.headline); localStorage.setItem("t4l:insight-reports", JSON.stringify(restoredReports)); setInsightReports(restoredReports); } restoreNutrition(payload.nutrition); setHistory(restored); setNotice(`Restored ${restored.length} workouts, photos, screenshots, check-ins and saved libraries. Reloading…`); window.setTimeout(() => window.location.reload(), 700); } catch { setNotice("That file is not a valid Training for Life backup."); } }
  return <div className="subpage more-page"><header className="training-page-heading"><h1>Settings</h1></header>
    <details className="settings-card library-manager"><summary><span className="setting-icon mobility"><SettingsIcon name="library"/></span><span><strong>Add-on exercise library</strong><small>{libraryExercises.length} exercises · add or edit</small></span><i>＋</i></summary><p className="library-editor-help">Edit an add-on title or its instructions below. Saved title changes also update earlier selections in your workout history.</p>{libraryNotice && <p className="library-notice" role="status">✓ {libraryNotice}</p>}<div className="add-library-exercise"><input value={newExercise} onChange={(e) => setNewExercise(e.target.value)} placeholder="New add-on exercise" aria-label="New add-on exercise"/><input value={newEquipment} onChange={(e) => setNewEquipment(e.target.value)} placeholder="Equipment or instructions" aria-label="New add-on exercise equipment or instructions"/><textarea value={newGraphicDescription} onChange={(e) => setNewGraphicDescription(e.target.value)} placeholder="Describe the movement" aria-label="Describe the movement for the graphic" rows={2}/><label className="new-reference-photo">{newReferencePhoto ? "Reference selected" : "Add reference photo"}<input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; e.currentTarget.value = ""; if (!file) return; try { setNewReferencePhoto(await prepareExerciseReference(file)); setLibraryNotice("Reference photo ready to save with the new exercise."); } catch (error) { setLibraryNotice(error instanceof Error ? error.message : "That reference photo could not be prepared."); } }}/></label><button onClick={addExercise}>Add exercise</button></div><div className="library-editor-list">{libraryExercises.map((exercise) => <div className="library-editor-row" key={exercise.id}><span className="exercise-visual"><MovementMark exerciseId={exercise.id} name={exercise.name} graphicData={exercise.graphicData}/></span><div className="library-editor-fields"><label className="library-editor-field"><span>Exercise title</span><div className="exercise-title-row"><input aria-label={`Title for ${exercise.name}`} value={exerciseNameDrafts[exercise.id] ?? exercise.name} onChange={(e) => setExerciseNameDrafts((drafts) => ({ ...drafts, [exercise.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveExerciseTitle(exercise); } }}/><button type="button" onClick={() => saveExerciseTitle(exercise)} disabled={(exerciseNameDrafts[exercise.id] ?? exercise.name).trim() === exercise.name}>Save</button></div></label><label className="library-editor-field library-editor-equipment"><span>Equipment or instructions</span><input aria-label={`Equipment or instructions for ${exercise.name}`} value={exercise.equipment} onChange={(e) => updateExercise(exercise.id, { equipment: e.target.value })}/></label></div><div className="exercise-reference-controls">{exercise.referencePhotoData && <img src={exercise.referencePhotoData} alt="" aria-hidden="true"/>}<label>{exercise.referencePhotoData ? "Replace reference" : "Add reference photo"}<input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void saveReferencePhoto(exercise.id, file); e.currentTarget.value = ""; }}/></label><textarea value={exercise.graphicDescription || ""} onChange={(e) => updateExercise(exercise.id, { graphicDescription: e.target.value, graphicReviewStatus: e.target.value.trim() ? "pending" : exercise.graphicReviewStatus })} placeholder="Describe the movement for the graphic" aria-label={`Graphic description for ${exercise.name}`} rows={2}/>{exercise.graphicReviewStatus === "pending" && <small>Graphic review requested</small>}</div></div>)}</div></details>
    <details className="settings-card future-video-card" open={futureSectionOpen} onToggle={event=>setFutureSectionOpen(event.currentTarget.open)}><summary className="settings-title future-video-summary"><span className="setting-icon video youtube-play" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M9 6.5 18 12 9 17.5Z" fill="currentColor"/></svg></span><div><h2>Future workout videos</h2></div><i>＋</i></summary>{todayLocked&&<p className="locked-video-notice">Today’s workout is locked. <button type="button" onClick={onEditToday}>Edit today’s workout</button></p>}<form className="future-video-form" onSubmit={event=>{event.preventDefault();saveFutureVideo(true);}}><label className="future-video-url"><span>YouTube video</span><input type="url" required value={futureUrl} onChange={event=>setFutureUrl(event.target.value)} placeholder="Paste YouTube link" aria-label="YouTube URL for a future workout"/></label><label className="future-video-category"><span>Category <small>optional</small></span><select value={futureCategory} onChange={event=>setFutureCategory(event.target.value as VideoCategory|"")} aria-label="Workout category for this video"><option value="">Choose a category</option>{videoCategories.map(category=><option key={category.key} value={category.key}>{category.label}</option>)}</select></label><button type="submit" className="future-video-build" disabled={savingFutureVideo}>Add video & get transcript ↗</button><button type="button" className="future-video-save-only" onClick={()=>saveFutureVideo()} disabled={savingFutureVideo}>Save video only</button></form>{futureNotice && <p className="notice" role="status">{futureNotice}</p>}{futureVideos.length ? <><label className="future-video-library-filter"><span>Saved videos <b>{futureVideos.length}</b></span><select aria-label="Filter saved videos" value={futureVideoFilter} onChange={event=>setFutureVideoFilter(event.target.value as typeof futureVideoFilter)}><option value="all">All categories</option>{videoCategories.map(category=><option key={category.key} value={category.key}>{category.label} ({futureVideos.filter(video=>video.category===category.key).length})</option>)}{futureVideos.some(video=>!isVideoCategory(video.category))&&<option value="uncategorized">Uncategorized ({futureVideos.filter(video=>!isVideoCategory(video.category)).length})</option>}</select></label><div className="video-grid future-video-grid">{filteredFutureVideos.map((video) => <VideoCard video={video} planMode="template" startPlan={planVideoId===videoIdentity(video)} onWorkflowDone={()=>setPlanVideoId(null)} onPlan={plan=>updateFutureVideo(video.url,{trainingPlan:plan})} addedToToday={todayVideoIds.has(videoIdentity(video))} addingToToday={addingVideoId===videoIdentity(video)} addDisabled={Boolean(addingVideoId)||todayLocked} categoryLabel={videoCategoryLabel(video.category)} onCategoryChange={(category) => updateFutureVideo(video.url, { category: category || undefined })} onAddToday={() => void addFutureToToday(video)} onDelete={() => setFutureVideos((items) => items.filter((item) => item !== video))} key={video.url}/>)}</div>{filteredFutureVideos.length === 0 && <p className="empty-state">No {futureVideoFilter === "uncategorized" ? "uncategorized" : videoCategoryLabel(futureVideoFilter)} videos saved yet.</p>}</> : <p className="empty-state">No future workout videos saved yet.</p>}</details>
    <details className="settings-card recent-videos-card"><summary className="settings-title recent-videos-summary"><span className="setting-icon video"><SettingsIcon name="videos"/></span><div><h2>Recent videos</h2><p>Reopen past videos or add them to today’s workout</p></div><i>＋</i></summary>{recentNotice && <p className="notice" role="status">{recentNotice}</p>}{recentVideos.length ? <div className="video-grid">{recentVideos.map((video) => <VideoCard video={video} planMode="read" addedToToday={todayVideoIds.has(videoIdentity(video))} addingToToday={addingVideoId===videoIdentity(video)} addDisabled={Boolean(addingVideoId)||todayLocked} onAddToday={() => void addRecentToToday(video)} onDelete={workoutIsLocked(sessions.find(item=>item.id===video.sessionId),editingDate)?undefined:()=>onDeleteVideo(video.sessionId, video.videoIndex)} key={`${video.sessionId}-${video.videoIndex}`}/>)}</div> : <p className="empty-state">Videos added to a workout will appear here.</p>}</details>
    <section className="settings-card"><div className="settings-title"><span className="setting-icon data"><SettingsIcon name="restore"/></span><div><h2>Restore from backup</h2><p>Reload workouts, photos, screenshots, check-ins and saved libraries from a backup</p></div></div><label className="wide-action file-action">Choose backup file <span>↑</span><input type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && restoreData(e.target.files[0])}/></label>{notice && <p className="notice">✓ {notice}</p>}<p className="backup-note">Choose your newest dated Training for Life backup. Restoring replaces the app’s saved workout history, mobility library, and future video library with the file’s contents.</p></section>
    <details className="settings-card about-card"><summary className="about-summary"><span className="setting-icon data"><SettingsIcon name="about"/></span><span><strong>About</strong><small>Training for Life {APP_VERSION} · Privacy and important information</small></span><i>＋</i></summary><div className="about-details"><span className="kicker">ABOUT TRAINING FOR LIFE</span><ul className="about-list"><li><b>Workouts</b><span>Plan your week, log workouts and add-ons, save videos, photos and screenshots, and review History and Progress. Nutrition check-ins are separate from workout completion.</span></li><li><b>Navigation</b><span>Tap the bottom menu, or swipe left and right between tabs.</span></li><li><b>Run / bike tracking</b><span>GPS tracking needs location permission. Keep the app visible; hiding it pauses tracking. Auto-pause waits for four seconds near a standstill using reliable GPS, then resumes with movement. Missing GPS alone does not auto-pause. Paused time is excluded from elapsed time and averages. Measurements are estimates; signal gaps can leave distance or routes incomplete. City/state labels appear after Stop & save. Routes stay on this device and are included in backups.</span></li><li><b>Sharing</b><span>Create Photo, Route or Workout Card images with a custom title and recorded metrics. Formats are labeled for Instagram and TikTok. Private notes and check-ins are excluded.</span></li><li><b>Video workout plans</b><span>Fetch English video captions automatically to build a draft exercise plan, review it against the video, and log weights and results per set. Only the video link is sent to the caption service; workout results stay local. Successful captions are cached on this device. Manual paste/file import and the computer fallback remain available if retrieval fails.</span></li><li><b>Storage and backups</b><span>Workout data stays in this browser on this device. Save backups regularly and use Restore backup to recover them. Clearing browser data or switching browsers can make local history unavailable.</span></li><li><b>Maps and videos</b><span>Viewing or sharing a map requests map tiles from OpenStreetMap. Automatic place labels use sampled coordinates sent to Photon. YouTube supplies video titles, thumbnails and playback. Screenshots are saved locally without extracting their information.</span></li><li><b>Release</b><span>{APP_VERSION}</span></li><li><b>Safety</b><span>This app is a workout log, not medical advice. Stop for sharp pain and seek qualified care when needed.</span></li></ul></div></details>
  </div>;
}

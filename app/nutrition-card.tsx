"use client";
import { useEffect, useState } from "react";
import { NUTRITION_KEY, nutritionSchedule, nutritionSummary, readNutrition } from "./nutrition";
import type { NutritionDay, NutritionRecords } from "./nutrition";

export function NutritionCard({ date }: { date: string }) {
  const [day, setDay] = useState<NutritionDay>({});
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const schedule = nutritionSchedule(date);
  useEffect(() => {
    try { setDay(readNutrition()[date] || {}); setReady(true); }
    catch { setNotice("Nutrition could not load. Reopen the app to try again; existing records are unchanged."); }
  }, [date]);
  function save(patch: Partial<NutritionDay>) {
    const next = { ...day, ...patch };
    setDay(next);
    try {
      const records = readNutrition();
      localStorage.setItem(NUTRITION_KEY, JSON.stringify({ ...records, [date]: next }));
      setNotice("Saved on this device");
    } catch { setNotice("Not saved. Free some device storage, then try your check-in again."); }
  }
  function question(field: "food" | "cutoff", label: string, applies: boolean) {
    const note = field === "food" ? "foodNote" : "cutoffNote";
    return <div className="nutrition-question">
      <div className="nutrition-answer-row"><span>{label}</span>{applies ? <div role="group" aria-label={label}>{[true, false].map(value => <button type="button" key={String(value)} disabled={!ready} aria-pressed={day[field] === value} onClick={() => save({ [field]: day[field] === value ? undefined : value })}>{value ? "Yes" : "No"}</button>)}</div> : <small>Flexible{field === "cutoff" ? " tonight" : " today"}</small>}</div>
      {applies && day[field] === false && <label className="nutrition-note">What happened? <small>Optional · use your keyboard’s microphone to dictate.</small><textarea rows={2} value={day[note] || ""} onChange={event => save({ [note]: event.target.value })} placeholder="A quick note, if useful" aria-label={`${label}: optional note`}/></label>}
    </div>;
  }
  return <details className="nutrition-card nutrition-checkin" aria-label="Nutrition check-in">
    <summary><span aria-hidden="true">◒</span><span><strong>Nutrition</strong><small>{schedule.scope}</small></span><i aria-hidden="true">＋</i></summary>
    <details className="nutrition-rules"><summary>My food plan</summary><p>High protein, whole foods: meat, fruit, vegetables and nuts. Skip bread and desserts. Flexible from Friday dinner through Sunday lunch.</p></details>
    {question("food", "Followed my food plan", schedule.food)}
    {question("cutoff", "Finished eating by 7:30 p.m.", schedule.cutoff)}
    <p className="nutrition-help">Tap a selected answer to undo.</p>
    <p className="nutrition-save" role="status">{notice || "Saves automatically · no workout completion needed"}</p>
  </details>;
}

export function NutritionHistory({ onOpenDate }: { onOpenDate: (date: Date) => void }) {
  const [records, setRecords] = useState<NutritionRecords>({});
  const [error, setError] = useState(false);
  useEffect(() => { try { setRecords(readNutrition()); } catch { setError(true); } }, []);
  const dates = Object.keys(records).filter(date => [records[date].food, records[date].cutoff, records[date].foodNote, records[date].cutoffNote].some(v => v !== undefined && v !== "")).sort().reverse();
  return <details className="nutrition-card nutrition-history"><summary>Nutrition check-ins <small>{dates.length} recorded days</small></summary>
    <p className="nutrition-help">Open a day to review notes or change answers.</p>
    {error ? <p role="status">Nutrition history could not load.</p> : dates.length ? <div>{dates.map(date => <button key={date} onClick={() => onOpenDate(new Date(`${date}T12:00:00`))}><strong>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong><span>{nutritionSummary(date, records[date])}</span></button>)}</div> : <p>No check-ins yet. Start with Nutrition on Today.</p>}
  </details>;
}

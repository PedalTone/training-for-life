// Local browser fixture: synthetic data and intercepted requests only.
import React from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

const mode = new URLSearchParams(location.search).get("mode") || "success";
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(Date.now() - 86400000));
const areaRecommendations = Object.fromEntries(["mobility", "aerobic", "strength", "speed", "endurance", "recovery"].map((key) => [key, { direction: key === "strength" ? "increase" : "keep", recommendation: key === "strength" ? "Add one controlled strength session." : "Stay consistent with the current rhythm." }]));
const report = { id: "fixture", periodDays: 30, generatedAt: new Date().toISOString(), sessionsAnalyzed: 1, headline: "Previous saved review", executiveSummary: "Your recent training is consistent. Build strength gradually while maintaining the rest of your rhythm.", areaRecommendations, dataQuality: "Synthetic test data" };
localStorage.setItem("t4l:insights-access", mode === "no-key" ? "" : "fixture-not-a-real-key");
localStorage.setItem("t4l:insight-reports", JSON.stringify([report]));
localStorage.setItem(`t4l:${date}`, JSON.stringify({ id: date, date, activity: "Walk", duration: "20 min", distance: "1 mi", effort: "easy", notes: "Synthetic fixture", mobilityExercises: [], completedExercises: [], status: "completed", injury: { reported: false, impact: "", bodyArea: "", note: "" }, videos: [], updatedAt: new Date().toISOString() }));
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  if (String(input).includes("/api/training-insights")) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    if (mode === "network") throw new TypeError("Failed to fetch");
    return Response.json(mode === "invalid" ? { headline: "Incomplete review", wins: null } : { ...report, headline: "Updated review succeeded" });
  }
  if (init?.method === "POST") throw new Error("External POST blocked by test fixture");
  return originalFetch(input, init);
};
createRoot(document.getElementById("root")!).render(<Home />);

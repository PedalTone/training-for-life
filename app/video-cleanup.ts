// Old backups and saved sessions may still contain retired guide metadata.
// Copy only when needed, preserving every unrelated video/session field.
export function stripVideoGuide<T extends object>(video: T): T {
  if (!video || typeof video !== "object") return video;
  if (!["workoutGuide", "guideStatus", "guideError"].some((key) => key in video)) return video;
  const clean = { ...video } as T & { workoutGuide?: unknown; guideStatus?: unknown; guideError?: unknown };
  delete clean.workoutGuide;
  delete clean.guideStatus;
  delete clean.guideError;
  return clean;
}
export function stripSessionGuides<T extends { videos?: object[] }>(session: T): T {
  if (!Array.isArray(session.videos)) return session;
  const videos = session.videos.map(stripVideoGuide);
  return videos.some((video, index) => video !== session.videos![index]) ? { ...session, videos } : session;
}

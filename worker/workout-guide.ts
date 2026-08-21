import { fetchTranscript, type TranscriptResponse } from "youtube-transcript";

type ExercisePattern = { name: string; aliases: string[]; graphicQuery?: string };
type ExerciseGraphic = { name?: string; gifUrl?: string; equipments?: string[]; instructions?: string[] };

const exercisePatterns: ExercisePattern[] = [
  { name: "Bulgarian split squat", aliases: ["bulgarian split squat"], graphicQuery: "dumbbell bulgarian split squat" },
  { name: "Romanian deadlift", aliases: ["romanian deadlift", "r d l", "rdl"], graphicQuery: "barbell romanian deadlift" },
  { name: "Goblet squat", aliases: ["goblet squat"] },
  { name: "Split squat", aliases: ["split squat"] },
  { name: "Jump squat", aliases: ["jump squat", "squat jump"] },
  { name: "Squat", aliases: ["air squat", "bodyweight squat", "squat"], graphicQuery: "bodyweight squat" },
  { name: "Reverse lunge", aliases: ["reverse lunge", "backward lunge"] },
  { name: "Walking lunge", aliases: ["walking lunge"] },
  { name: "Lunge", aliases: ["forward lunge", "lunge"], graphicQuery: "bodyweight forward lunge" },
  { name: "Hip thrust", aliases: ["hip thrust"] },
  { name: "Glute bridge", aliases: ["glute bridge", "hip bridge"] },
  { name: "Deadlift", aliases: ["deadlift"], graphicQuery: "barbell deadlift" },
  { name: "Step-up", aliases: ["step up", "step-up"] },
  { name: "Calf raise", aliases: ["calf raise"] },
  { name: "Push-up", aliases: ["push up", "push-up", "pushup"] },
  { name: "Bench press", aliases: ["bench press", "chest press"] },
  { name: "Overhead press", aliases: ["overhead press", "shoulder press", "military press"] },
  { name: "Lateral raise", aliases: ["lateral raise", "side raise"] },
  { name: "Front raise", aliases: ["front raise"] },
  { name: "Bent-over row", aliases: ["bent over row", "bent-over row"] },
  { name: "Dumbbell row", aliases: ["dumbbell row", "single arm row", "one arm row"] },
  { name: "Lat pulldown", aliases: ["lat pull down", "lat pulldown"] },
  { name: "Pull-up", aliases: ["pull up", "pull-up", "pullup"] },
  { name: "Chin-up", aliases: ["chin up", "chin-up", "chinup"] },
  { name: "Biceps curl", aliases: ["bicep curl", "biceps curl", "hammer curl"] },
  { name: "Triceps extension", aliases: ["tricep extension", "triceps extension", "skull crusher"] },
  { name: "Triceps pushdown", aliases: ["tricep pushdown", "triceps pushdown"] },
  { name: "Dip", aliases: ["tricep dip", "bench dip", "dips"] },
  { name: "Side plank", aliases: ["side plank"] },
  { name: "Plank", aliases: ["forearm plank", "high plank", "plank"] },
  { name: "Mountain climber", aliases: ["mountain climber"] },
  { name: "Bicycle crunch", aliases: ["bicycle crunch", "bicycle"] },
  { name: "Russian twist", aliases: ["russian twist"] },
  { name: "Leg raise", aliases: ["leg raise"] },
  { name: "Crunch", aliases: ["crunch"] },
  { name: "Sit-up", aliases: ["sit up", "sit-up"] },
  { name: "Dead bug", aliases: ["dead bug"] },
  { name: "Bird dog", aliases: ["bird dog"] },
  { name: "Hollow body hold", aliases: ["hollow body hold", "hollow hold"] },
  { name: "Burpee", aliases: ["burpee"] },
  { name: "Jumping jack", aliases: ["jumping jack"] },
  { name: "High knees", aliases: ["high knees"] },
  { name: "Kettlebell swing", aliases: ["kettlebell swing", "kb swing"] },
  { name: "Thruster", aliases: ["thruster"] },
  { name: "Clean", aliases: ["power clean", "hang clean", "clean"] },
  { name: "Snatch", aliases: ["dumbbell snatch", "kettlebell snatch", "snatch"] },
  { name: "Wall sit", aliases: ["wall sit"] },
  { name: "Clamshell", aliases: ["clamshell", "clam shell"] },
  { name: "Fire hydrant", aliases: ["fire hydrant"] },
  { name: "Donkey kick", aliases: ["donkey kick"] },
  { name: "Superman", aliases: ["superman"] },
  { name: "Good morning", aliases: ["good morning"] },
  { name: "Bear crawl", aliases: ["bear crawl"] },
  { name: "Box jump", aliases: ["box jump"] },
  { name: "Farmer's carry", aliases: ["farmer's carry", "farmers carry", "farmer carry"] },
].sort((a, b) => Math.max(...b.aliases.map((item) => item.length)) - Math.max(...a.aliases.map((item) => item.length)));

const numberWords: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", fifteen: "15", twenty: "20", thirty: "30", forty: "40", sixty: "60" };

function normalized(text: string) {
  return text.toLowerCase().replace(/[’]/g, "'").replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|sixty)\b/g, (word) => numberWords[word]);
}

function volumeFrom(text: string) {
  const clean = normalized(text);
  const sets = clean.match(/\b(\d{1,2})\s*(?:sets?|rounds?)\b/)?.[1];
  const reps = clean.match(/\b(\d{1,3})\s*(?:reps?|repetitions?|times?)\b/)?.[1];
  const seconds = clean.match(/\b(\d{1,3})\s*(?:seconds?|secs?)\b/)?.[1];
  const minutes = clean.match(/\b(\d{1,2})\s*(?:minutes?|mins?)\b/)?.[1];
  return { sets, reps, duration: seconds ? `${seconds} sec` : minutes ? `${minutes} min` : undefined };
}

function secondsFor(segment: TranscriptResponse, factor: number) {
  return Math.max(0, Math.round((segment.offset * factor) / 1000));
}

async function findGraphic(name: string, query = name): Promise<ExerciseGraphic | undefined> {
  try {
    const response = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(query)}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return undefined;
    const payload = await response.json() as { data?: ExerciseGraphic[] };
    const wanted = normalized(name).split(/\s+/).filter((token) => token.length > 2);
    const ranked = (payload.data || []).map((item) => ({ item, score: wanted.filter((token) => new RegExp(`\\b${token}\\b`).test(normalized(item.name || ""))).length / Math.max(1, wanted.length) })).sort((a, b) => b.score - a.score);
    return ranked[0]?.score >= .66 ? ranked[0].item : undefined;
  } catch {
    return undefined;
  }
}

export async function createWorkoutGuide(videoUrl: string) {
  const transcript = await fetchTranscript(videoUrl);
  if (!transcript.length) throw new Error("No transcript was returned for this video.");
  const maxOffset = Math.max(...transcript.map((segment) => segment.offset));
  const offsetFactor = maxOffset < 36000 ? 1000 : 1;
  const found = new Map<string, { name: string; graphicQuery?: string; timestamp: number; sets?: string; reps?: string; duration?: string; transcriptText: string }>();

  transcript.forEach((segment, index) => {
    const text = normalized(segment.text);
    for (const pattern of exercisePatterns) {
      if (found.has(pattern.name) || !pattern.aliases.some((alias) => new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+")}s?\\b`, "i").test(text))) continue;
      const context = transcript.slice(Math.max(0, index - 2), Math.min(transcript.length, index + 3)).map((item) => item.text).join(" ");
      found.set(pattern.name, { name: pattern.name, graphicQuery: pattern.graphicQuery, timestamp: secondsFor(segment, offsetFactor), ...volumeFrom(context), transcriptText: segment.text });
      break;
    }
  });

  const exercises = await Promise.all([...found.values()].slice(0, 16).map(async (exercise) => {
    const graphic = await findGraphic(exercise.name, exercise.graphicQuery);
    return {
      ...exercise,
      displayName: exercise.name,
      graphicUrl: graphic?.gifUrl,
      equipment: graphic?.equipments?.join(", "),
      instructions: graphic?.instructions?.slice(0, 3) || [],
    };
  }));

  return {
    generatedAt: new Date().toISOString(),
    transcriptSegments: transcript.length,
    exercises,
    notice: exercises.length ? "Automatically identified from the video transcript. Verify sets, reps, and form before training." : "The transcript loaded, but no supported exercise names were identified.",
  };
}

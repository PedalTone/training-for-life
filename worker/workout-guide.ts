import { fetchTranscript, type TranscriptResponse } from "youtube-transcript";

type ExercisePattern = { name: string; aliases: string[]; graphicQuery?: string };
type ExerciseGraphic = { name?: string; gifUrl?: string; equipments?: string[]; instructions?: string[] };

const exercisePatterns: ExercisePattern[] = [
  { name: "Pullover + triceps extension", aliases: ["pull over plus tricep extension", "pull-over plus tricep extension", "pull overs plus tricep extension", "pull-overs plus tricep extension", "pullover plus triceps extension"], graphicQuery: "" },
  { name: "Curl + horizontal press", aliases: ["curl plus horizontal press", "curl plus horizontal presses"], graphicQuery: "" },
  { name: "Crush curl + press", aliases: ["crush curl plus press", "crush curls plus press"], graphicQuery: "" },
  { name: "Kettlebell halo", aliases: ["kettlebell halo", "head halo", "head halos"] },
  { name: "Upright row", aliases: ["upright row", "upright rows"] },
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

function aliasExpression(alias: string) {
  return alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+");
}

function volumeFrom(text: string, alias?: string) {
  const clean = normalized(text);
  const sets = clean.match(/\b(\d{1,2})\s*sets?\b/)?.[1];
  const namedReps = alias ? clean.match(new RegExp(`\\b(\\d{1,3})\\s+(?:${aliasExpression(alias)})s?\\b`, "i"))?.[1] : undefined;
  const reps = namedReps || clean.match(/\b(\d{1,3})\s*(?:reps?|repetitions?|times?)\b/)?.[1];
  const seconds = clean.match(/\b(\d{1,3})\s*(?:seconds?|secs?)\b/)?.[1];
  const minutes = clean.match(/\b(\d{1,2})\s*(?:minutes?|mins?)\b/)?.[1];
  return { sets, reps, duration: seconds ? `${seconds} sec` : minutes ? `${minutes} min` : undefined };
}

function titleCaseExercise(value: string) {
  return value.trim().replace(/[-]+/g, "-").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bPlus\b/g, "+");
}

function cleanDiscoveredExercise(value: string) {
  return value
    .replace(/\b(?:you(?:'ll| will)?|try|remember|during|after|move|rest|complete|for every|as you|and then)\b.*$/i, "")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

function discoveredName(value: string) {
  const key = normalized(value).replace(/[-+]/g, " ").replace(/\bplus\b/g, " ").replace(/\s+/g, " ").trim();
  const known = exercisePatterns.find((pattern) => pattern.aliases.some((alias) => normalized(alias).replace(/[-+]/g, " ").replace(/\bplus\b/g, " ").replace(/\s+/g, " ").trim() === key));
  return known?.name || titleCaseExercise(value);
}

function discoverExercises(transcript: TranscriptResponse[], factor: number) {
  const discovered: { name: string; graphicQuery: string; timestamp: number; reps?: string; transcriptText: string }[] = [];
  const seen = new Set<string>();
  const cue = /\b(?:start(?: each round)? with|move(?: directly)? into|doing next[.]?|which is|last exercise(?:\s+of\s+this\s+complex)?(?:,\s*)?(?:which is|is))\s+(\d{1,3})\s+(.+?)(?=[.!?]|\b(?:move|you(?:'ll| will)?|try|remember|during|after|rest|complete|for every|as you|and then)\b)/gi;

  transcript.forEach((segment, index) => {
    const context = normalized(transcript.slice(index, Math.min(transcript.length, index + 3)).map((item) => item.text).join(" "));
    for (const match of context.matchAll(cue)) {
      const candidate = cleanDiscoveredExercise(match[2]);
      const key = candidate.replace(/\b(?:a|an|the)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
      if (!candidate || seen.has(key) || /^(?:reps?|rounds?|minutes?|seconds?)\b/.test(candidate)) continue;
      seen.add(key);
      discovered.push({ name: discoveredName(candidate), graphicQuery: "", reps: match[1], timestamp: secondsFor(segment, factor), transcriptText: segment.text });
    }
  });
  return discovered;
}

function workoutStructure(transcript: TranscriptResponse[]) {
  const text = normalized(transcript.map((segment) => segment.text).join(" "));
  const rounds = text.match(/\b(?:complete|perform|do)\s+(\d{1,2})\s*(?:to|[-–])\s*(\d{1,2})\s+rounds?\b/);
  const fixedRounds = text.match(/\b(?:complete|perform|do)\s+(\d{1,2})\s+rounds?\b/);
  const rest = text.match(/\brest(?:\s+easy)?(?:\s+for)?\s+(\d{1,2})\s*(?:to|[-–])\s*(\d{1,2})\s+minutes?\b/);
  const fixedRest = text.match(/\brest(?:\s+easy)?(?:\s+for)?\s+(\d{1,2})\s+minutes?\b/);
  return {
    rounds: rounds ? `${rounds[1]}–${rounds[2]} rounds` : fixedRounds ? `${fixedRounds[1]} rounds` : undefined,
    rest: rest ? `${rest[1]}–${rest[2]} min between rounds` : fixedRest ? `${fixedRest[1]} min between rounds` : undefined,
    equipment: /\bkettlebell\b/.test(text) ? "Kettlebell" : /\bdumbbells?\b/.test(text) ? "Dumbbells" : undefined,
    position: /\b(?:tall upright )?kneeling\b/.test(text) ? "Kneeling" : undefined,
  };
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
      const matchedAlias = pattern.aliases.find((alias) => new RegExp(`\\b${aliasExpression(alias)}s?\\b`, "i").test(text));
      if (found.has(pattern.name) || !matchedAlias) continue;
      const context = transcript.slice(Math.max(0, index - 2), Math.min(transcript.length, index + 3)).map((item) => item.text).join(" ");
      found.set(pattern.name, { name: pattern.name, graphicQuery: pattern.graphicQuery, timestamp: secondsFor(segment, offsetFactor), ...volumeFrom(context, matchedAlias), transcriptText: segment.text });
      break;
    }
  });

  for (const exercise of discoverExercises(transcript, offsetFactor)) {
    const duplicate = [...found.values()].some((known) => normalized(known.name).replace(/[^a-z0-9]+/g, " ").trim() === normalized(exercise.name).replace(/[^a-z0-9]+/g, " ").trim());
    if (!duplicate) found.set(exercise.name, exercise);
  }

  const exercises = await Promise.all([...found.values()].sort((a, b) => a.timestamp - b.timestamp).slice(0, 16).map(async (exercise) => {
    const graphic = exercise.graphicQuery === "" ? undefined : await findGraphic(exercise.name, exercise.graphicQuery);
    const { graphicQuery: _graphicQuery, ...details } = exercise;
    return {
      ...details,
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
    summary: workoutStructure(transcript),
    notice: exercises.length ? "Automatically identified from the video transcript. Verify sets, reps, and form before training." : "The transcript loaded, but no supported exercise names were identified.",
  };
}

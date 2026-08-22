export type ScreenshotWorkout = {
  activity: string; date: string; startTime: string; distance: string; duration: string; pace: string; calories: string;
  source: string; confidence: "high" | "medium" | "low"; warnings: string[];
};

type OpenAIResponse = { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };

const screenshotSchema = {
  type: "object", additionalProperties: false,
  required: ["activity", "date", "startTime", "distance", "duration", "pace", "calories", "source", "confidence", "warnings"],
  properties: {
    activity: { type: "string" }, date: { type: "string" }, startTime: { type: "string" }, distance: { type: "string" },
    duration: { type: "string" }, pace: { type: "string" }, calories: { type: "string" }, source: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] }, warnings: { type: "array", maxItems: 5, items: { type: "string" } },
  },
} as const;

export async function extractWorkoutScreenshot(apiKey: string, imageData: string): Promise<ScreenshotWorkout> {
  if (!apiKey) throw new Error("Screenshot import is not configured yet.");
  if (!/^data:image\/(jpeg|png|webp);base64,/i.test(imageData)) throw new Error("Choose a JPEG, PNG, or WebP screenshot.");
  if (imageData.length > 7_000_000) throw new Error("That screenshot is too large. Try a regular phone screenshot.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5-mini", store: false, max_output_tokens: 900,
      instructions: "Extract workout summary values visible in the screenshot. Ignore the phone status bar, navigation directions, map labels, and route geography. Never guess a missing value: return an empty string and add a short warning. Preserve visible units. Normalize an unambiguous date as YYYY-MM-DD; otherwise leave it empty. Use a simple activity name such as Run, Walk, Bike, Hike, Strength, or Other. Confidence reflects the legibility of the extracted workout values, not general image quality.",
      input: [{ role: "user", content: [{ type: "input_text", text: "Read this workout-app screenshot and extract the workout summary for review." }, { type: "input_image", image_url: imageData, detail: "high" }] }],
      text: { format: { type: "json_schema", name: "workout_screenshot", strict: true, schema: screenshotSchema } },
    }),
  });
  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) throw new Error(payload.error?.message || "The screenshot could not be read.");
  const outputText = payload.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("The screenshot did not contain readable workout details.");
  return JSON.parse(outputText) as ScreenshotWorkout;
}

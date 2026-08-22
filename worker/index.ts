/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { createWorkoutGuide } from "./workout-guide";
import { createTrainingInsights } from "./training-insights";
import { extractWorkoutScreenshot } from "./workout-screenshot";

interface Env {
  ASSETS: Fetcher;
  OPENAI_API_KEY?: string;
  INSIGHTS_ACCESS_CODE?: string;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/workout-screenshot") {
      const origin = request.headers.get("Origin") || "";
      const allowedOrigin = origin === "https://pedaltone.github.io" || origin.endsWith(".chatgpt.site") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") ? origin : "https://pedaltone.github.io";
      const headers = { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Training-Insights-Key", "Cache-Control": "no-store", Vary: "Origin" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers });
      try {
        if (!env.INSIGHTS_ACCESS_CODE) return Response.json({ error: "Screenshot import is not configured yet." }, { status: 503, headers });
        if (request.headers.get("X-Training-Insights-Key") !== env.INSIGHTS_ACCESS_CODE) return Response.json({ error: "The AI access code is incorrect." }, { status: 401, headers });
        const body = await request.json() as { imageData?: string };
        const workout = await extractWorkoutScreenshot(env.OPENAI_API_KEY || "", body.imageData || "");
        return Response.json(workout, { headers });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "The screenshot could not be read.";
        const status = /not configured/i.test(detail) ? 503 : /large|choose/i.test(detail) ? 400 : 422;
        console.warn("workout-screenshot failure", { status, detail });
        return Response.json({ error: status === 503 ? "Screenshot import is not configured yet." : detail }, { status, headers });
      }
    }

    if (url.pathname === "/api/training-insights") {
      const origin = request.headers.get("Origin") || "";
      const allowedOrigin = origin === "https://pedaltone.github.io" || origin.endsWith(".chatgpt.site") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") ? origin : "https://pedaltone.github.io";
      const headers = { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Training-Insights-Key", "Cache-Control": "no-store", Vary: "Origin" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers });
      try {
        if (!env.INSIGHTS_ACCESS_CODE) return Response.json({ error: "AI insights are not configured yet." }, { status: 503, headers });
        if (request.headers.get("X-Training-Insights-Key") !== env.INSIGHTS_ACCESS_CODE) return Response.json({ error: "The AI access code is incorrect." }, { status: 401, headers });
        const body = await request.json() as { sessions?: Parameters<typeof createTrainingInsights>[1]; periodDays?: number; goals?: Parameters<typeof createTrainingInsights>[3] };
        const sessions = Array.isArray(body.sessions) ? body.sessions : [];
        const periodDays = [0, 30, 90].includes(Number(body.periodDays)) ? Number(body.periodDays) : 30;
        const report = await createTrainingInsights(env.OPENAI_API_KEY || "", sessions, periodDays, body.goals || {});
        return Response.json({ ...report, generatedAt: new Date().toISOString(), periodDays, sessionsAnalyzed: sessions.length }, { headers });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "AI insights are unavailable.";
        const status = /not configured/i.test(detail) ? 503 : /at least one/i.test(detail) ? 400 : 422;
        console.warn("training-insights failure", { status, detail });
        return Response.json({ error: status === 503 ? "AI insights are not configured yet." : detail }, { status, headers });
      }
    }

    if (url.pathname === "/api/workout-guide") {
      const origin = request.headers.get("Origin") || "";
      const allowedOrigin = origin === "https://pedaltone.github.io" || origin.endsWith(".chatgpt.site") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") ? origin : "https://pedaltone.github.io";
      const headers = { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store", Vary: "Origin" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers });
      let requestedUrl = "";
      try {
        const body = await request.json() as { url?: string };
        requestedUrl = body.url || "";
        if (!body.url || !/^https?:\/\//.test(body.url)) return Response.json({ error: "Paste a valid YouTube link." }, { status: 400, headers });
        const guide = await createWorkoutGuide(body.url);
        return Response.json(guide, { headers });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Transcript unavailable.";
        const videoId = requestedUrl.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/)?.[1] || "unknown";
        const category = /disabled|no transcript|not available|no longer available/i.test(detail) ? "transcript_unavailable" : /too many|captcha|rate/i.test(detail) ? "youtube_throttled" : "unexpected";
        console.warn("workout-guide failure", { category, detail, videoId });
        const message = category === "transcript_unavailable" ? "This video does not provide a usable transcript." : category === "youtube_throttled" ? "YouTube temporarily blocked transcript access. Try again later." : "The workout guide could not be created from this video. Try again later.";
        return Response.json({ error: message }, { status: 422, headers });
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

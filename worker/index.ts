/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { createWorkoutGuide } from "./workout-guide";

interface Env {
  ASSETS: Fetcher;
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

    if (url.pathname === "/api/workout-guide") {
      const origin = request.headers.get("Origin") || "";
      const allowedOrigin = origin === "https://pedaltone.github.io" || origin.endsWith(".chatgpt.site") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost") ? origin : "https://pedaltone.github.io";
      const headers = { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store", Vary: "Origin" };
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers });
      try {
        const body = await request.json() as { url?: string };
        if (!body.url || !/^https?:\/\//.test(body.url)) return Response.json({ error: "Paste a valid YouTube link." }, { status: 400, headers });
        const guide = await createWorkoutGuide(body.url);
        return Response.json(guide, { headers });
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Transcript unavailable.";
        const message = /disabled|no transcript|not available/i.test(detail) ? "This video does not provide a usable transcript." : /too many|captcha|rate/i.test(detail) ? "YouTube temporarily blocked transcript access. Try again later." : "The workout guide could not be created from this video. Try again later.";
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

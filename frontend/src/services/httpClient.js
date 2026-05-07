import { loadAuth } from "./storage";

function isPlaceholder(value) {
  return /<\s*REPLACE_/i.test(value || "");
}

function getRuntimeApiBaseUrl() {
  try {
    const globalOverride = window?.__LUXSTAY_API_BASE_URL__;
    if (typeof globalOverride === "string" && globalOverride.trim()) {
      return globalOverride.trim();
    }
  } catch (e) {}

  try {
    const localOverride = window?.localStorage?.getItem("LUXSTAY_API_BASE_URL");
    if (typeof localOverride === "string" && localOverride.trim()) {
      return localOverride.trim();
    }
  } catch (e) {}

  return "";
}

function resolveBaseUrl() {
  const runtimeBase = getRuntimeApiBaseUrl();
  const envBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  const candidate = runtimeBase || envBase || "/api";

  if (isPlaceholder(candidate)) {
    // Keep app usable when placeholder accidentally ships in production.
    return "/api";
  }

  // Accept relative API root.
  if (candidate.startsWith("/")) {
    return candidate;
  }

  // Accept already valid absolute URLs.
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  // If user provides host without protocol, normalize to HTTPS.
  return `https://${candidate}`;
}

const BASE_URL = resolveBaseUrl();
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 12000);
const RETRY_COUNT = Number(import.meta.env.VITE_API_RETRY_COUNT ?? 2);
const RETRY_BASE_DELAY_MS = Number(import.meta.env.VITE_API_RETRY_DELAY_MS ?? 400);

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = BASE_URL.replace(/\/+$/, "");

  if (!normalizedBase) {
    return normalizedPath;
  }

  // Avoid producing /api/api/... when callers already pass /api/*
  // and BASE_URL is /api or ends with /api.
  if (normalizedPath.startsWith("/api/") && /\/api$/i.test(normalizedBase)) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

export class HttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function isJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

async function parseResponse(response) {
  if (isJsonResponse(response)) {
    return response.json();
  }
  return response.text();
}

function isRetriableStatus(status) {
  return status === 408 || status === 429 || status >= 500;
}

function isRetriableMethod(method) {
  return ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes((method || "GET").toUpperCase());
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function normalizeErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function request(path, options = {}) {
  const auth = loadAuth();
  const method = (options.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const maxAttempts = isRetriableMethod(method) ? Math.max(1, RETRY_COUNT + 1) : 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(buildUrl(path), {
        ...options,
        method,
        headers,
        signal: controller.signal
      });

      const payload = response.status === 204 ? null : await parseResponse(response);
      if (!response.ok) {
        const message = normalizeErrorMessage(payload, "Unexpected server error");
        const httpError = new HttpError(message, response.status, payload);

        if (attempt < maxAttempts && isRetriableStatus(response.status)) {
          await wait(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }

        throw httpError;
      }

      if (payload && typeof payload === "object" && "data" in payload) {
        return payload.data;
      }

      return payload;
    } catch (error) {
      const timeoutMessage = `Request timeout after ${REQUEST_TIMEOUT_MS}ms`;
      const normalized = isAbortError(error)
        ? new HttpError(timeoutMessage, 408, { message: timeoutMessage })
        : error;

      lastError = normalized;
      if (attempt < maxAttempts && (isAbortError(error) || normalized instanceof TypeError)) {
        await wait(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }

      throw normalized;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError || new HttpError("Unexpected server error", 500, null);
}

export const httpClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" })
};

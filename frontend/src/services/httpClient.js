import { loadAuth } from "./storage";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Avoid producing /api/api/... when BASE_URL is /api and callers already pass /api/*.
  if (BASE_URL === "/api" && normalizedPath.startsWith("/api/")) {
    return normalizedPath;
  }

  return `${BASE_URL}${normalizedPath}`;
}

export class HttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function request(path, options = {}) {
  const auth = loadAuth();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers
  });

  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new HttpError(
      payload?.message || "Unexpected server error",
      response.status,
      payload
    );
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload;
}

export const httpClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" })
};

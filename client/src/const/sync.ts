const DEFAULT_SYNC_API_URL = import.meta.env.DEV ? "http://localhost:8080" : `${window.location.origin}/api`;

export const SYNC_API_URL = (import.meta.env.VITE_SYNC_API_URL?.trim() || DEFAULT_SYNC_API_URL).replace(/\/+$/, "");
export const SYNC_MAX_PUSH_BATCH = 500;

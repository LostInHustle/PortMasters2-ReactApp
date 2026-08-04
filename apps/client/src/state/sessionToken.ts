// One place owning the storage key for the resumable session token (see sessionTokens.ts on the
// server for why this exists), so nothing else needs to know it's localStorage specifically.
// localStorage rather than sessionStorage: surviving an actual page reload (not just a
// WebSocket-level reconnect) is part of the point -- a player shouldn't have to retype their
// password just because they refreshed the tab.
const STORAGE_KEY = 'pm2_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private-browsing/storage-disabled: degrade to "always show the login form"
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // storage unavailable -- silent resume just won't work next time, not fatal
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to do if storage is unavailable
  }
}

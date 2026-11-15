// In-memory sliding window rate limiter and deduplication engine

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 submissions per 10 minutes per IP
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds deduplication window

// Map of IP -> array of request timestamps
const ipRequests = new Map();
// Map of submission hash -> timestamp
const submissionHashes = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;

  for (const [ip, timestamps] of ipRequests.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, valid);
    }
  }

  for (const [hash, timestamp] of submissionHashes.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS) {
      submissionHashes.delete(hash);
    }
  }
}

/**
 * Check if the given client IP has exceeded the submission rate limit.
 * @param {string} ip
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(ip) {
  cleanup();
  const now = Date.now();
  const clientIp = ip || "anonymous";
  const timestamps = (ipRequests.get(clientIp) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const resetInSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  timestamps.push(now);
  ipRequests.set(clientIp, timestamps);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - timestamps.length,
    resetInSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
  };
}

/**
 * Simple fast string hash for deduplication.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Check if an identical submission was received within the deduplication window.
 * @param {string} ip
 * @param {string} email
 * @param {string} message
 * @returns {boolean} true if duplicate, false if first submission
 */
export function isDuplicateSubmission(ip, email, message) {
  cleanup();
  const now = Date.now();
  const key = hashString(`${ip || ""}:${(email || "").toLowerCase().trim()}:${(message || "").trim()}`);
  const lastTime = submissionHashes.get(key);

  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return true;
  }

  submissionHashes.set(key, now);
  return false;
}

/**
 * Debug logging service for API requests and responses
 * Set LOGGING to false to disable logging
 */

export const LOGGING = true;

interface LogData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Generate timestamp string in format YYYYMMDDHHmmss
 */
function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Remove base64 data from object for logging
 */
function sanitizeForLogging(data: LogData): LogData {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item));
  }

  if (typeof data === "object") {
    const sanitized: LogData = {};
    for (const key in data) {
      if (key === "data" && typeof data[key] === "string" && data[key].length > 1000) {
        // Likely base64 data, replace with placeholder
        sanitized[key] = `[BASE64_DATA_${data[key].length}_CHARS]`;
      } else if (key === "inlineData" && data[key]?.data) {
        sanitized[key] = {
          ...data[key],
          data: `[BASE64_DATA_${data[key].data.length}_CHARS]`,
        };
      } else {
        sanitized[key] = sanitizeForLogging(data[key]);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Log storage in browser's localStorage/IndexedDB via downloadable JSON
 * Since we're in browser, we'll create downloadable log files
 */
class DebugLogger {
  private currentSessionId: string | null = null;
  private logs: Map<string, { req: LogData | null; res: LogData | null }> = new Map();

  constructor() {
    this.currentSessionId = null;
  }

  /**
   * Start a new log session
   */
  startSession(): string {
    this.currentSessionId = getTimestamp();
    return this.currentSessionId;
  }

  /**
   * Log a request
   */
  logRequest(requestId: string, data: LogData): void {
    if (!LOGGING) return;

    const sanitizedData = sanitizeForLogging(data);
    const existing = this.logs.get(requestId) || { req: null, res: null };
    existing.req = sanitizedData;
    this.logs.set(requestId, existing);

    console.log(`[DEBUG] Request ${requestId}:`, sanitizedData);
  }

  /**
   * Log a response
   */
  logResponse(requestId: string, data: LogData): void {
    if (!LOGGING) return;

    const sanitizedData = sanitizeForLogging(data);
    const existing = this.logs.get(requestId) || { req: null, res: null };
    existing.res = sanitizedData;
    this.logs.set(requestId, existing);

    console.log(`[DEBUG] Response ${requestId}:`, sanitizedData);
  }

  /**
   * Get all logs for download
   */
  getAllLogs(): { sessionId: string | null; logs: Record<string, { req: LogData | null; res: LogData | null }> } {
    const logsObject: Record<string, { req: LogData | null; res: LogData | null }> = {};
    this.logs.forEach((value, key) => {
      logsObject[key] = value;
    });

    return {
      sessionId: this.currentSessionId,
      logs: logsObject,
    };
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs(): void {
    if (!LOGGING) return;

    const allLogs = this.getAllLogs();
    const blob = new Blob([JSON.stringify(allLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${this.currentSessionId || getTimestamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.clear();
    this.currentSessionId = null;
  }
}

export const debugLogger = new DebugLogger();

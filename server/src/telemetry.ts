/**
 * Skillouette Telemetry & Observability Engine
 * Structured, privacy-conscious operational telemetry.
 * Automatically sanitizes PII, keys, and tokens.
 */

export interface TelemetryMetrics {
  totalRequests: number;
  http2xx: number;
  http4xx: number;
  http5xx: number;
  aiCalls: {
    total: number;
    geminiSuccess: number;
    geminiFailure: number;
    openaiSuccess: number;
    openaiFailure: number;
    heuristicFallback: number;
    averageLatencyMs: number;
  };
  databaseOperations: {
    total: number;
    success: number;
    failures: number;
    mode: 'supabase' | 'local_resilient';
  };
  featuresUsed: {
    profileUpdates: number;
    brainDumpCaptures: number;
    jobAnalyses: number;
    jobMatches: number;
    skillGapReports: number;
    resumesTailored: number;
    exportsDocx: number;
  };
  uptimeSeconds: number;
  startTime: string;
}

export interface SanitizedLogEntry {
  timestamp: string;
  eventType: string;
  statusCode?: number;
  durationMs?: number;
  modelUsed?: string;
  summary: string;
}

class TelemetryService {
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private http2xx: number = 0;
  private http4xx: number = 0;
  private http5xx: number = 0;

  private aiCallCount: number = 0;
  private aiTotalLatencyMs: number = 0;
  private geminiSuccess: number = 0;
  private geminiFailure: number = 0;
  private openaiSuccess: number = 0;
  private openaiFailure: number = 0;
  private heuristicFallback: number = 0;

  private dbSuccess: number = 0;
  private dbFailures: number = 0;

  private featureCounts = {
    profileUpdates: 0,
    brainDumpCaptures: 0,
    jobAnalyses: 0,
    jobMatches: 0,
    skillGapReports: 0,
    resumesTailored: 0,
    exportsDocx: 0
  };

  private recentLogs: SanitizedLogEntry[] = [];
  private maxLogs: number = 100;

  /**
   * Record HTTP Request completion
   */
  public recordRequest(statusCode: number, durationMs: number) {
    this.totalRequests++;
    if (statusCode >= 200 && statusCode < 300) this.http2xx++;
    else if (statusCode >= 400 && statusCode < 500) this.http4xx++;
    else if (statusCode >= 500) this.http5xx++;
  }

  /**
   * Record AI call event
   */
  public recordAiCall(provider: 'gemini' | 'openai' | 'local', success: boolean, durationMs: number) {
    this.aiCallCount++;
    this.aiTotalLatencyMs += durationMs;

    if (provider === 'gemini') {
      if (success) this.geminiSuccess++;
      else this.geminiFailure++;
    } else if (provider === 'openai') {
      if (success) this.openaiSuccess++;
      else this.openaiFailure++;
    } else {
      this.heuristicFallback++;
    }
  }

  /**
   * Record database operation
   */
  public recordDbOp(success: boolean) {
    if (success) this.dbSuccess++;
    else this.dbFailures++;
  }

  /**
   * Record feature invocation
   */
  public recordFeature(feature: keyof typeof this.featureCounts) {
    if (this.featureCounts[feature] !== undefined) {
      this.featureCounts[feature]++;
    }
  }

  /**
   * Log privacy-sanitized event
   */
  public logEvent(eventType: string, summary: string, metadata?: Record<string, any>) {
    const sanitizedSummary = this.sanitizeText(summary);
    const entry: SanitizedLogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      summary: sanitizedSummary,
      durationMs: metadata?.durationMs,
      statusCode: metadata?.statusCode,
      modelUsed: metadata?.modelUsed
    };

    this.recentLogs.unshift(entry);
    if (this.recentLogs.length > this.maxLogs) {
      this.recentLogs.pop();
    }
  }

  /**
   * Strip sensitive PII, keys, tokens, emails, and passwords
   */
  public sanitizeText(text: string): string {
    if (!text) return '';
    return text
      // Redact email addresses
      .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]')
      // Redact API keys and Bearer tokens
      .replace(/(AIza[0-9A-Za-z-_]{20,}|sk-[a-zA-Z0-9]{20,}|Bearer\s+[A-Za-z0-9\-._~+/]+=*)/gi, '[REDACTED_SECRET]')
      // Redact phone numbers
      .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');
  }

  /**
   * Get current aggregate metrics
   */
  public getMetrics(): TelemetryMetrics {
    const avgLatency = this.aiCallCount > 0 ? Math.round(this.aiTotalLatencyMs / this.aiCallCount) : 0;
    return {
      totalRequests: this.totalRequests,
      http2xx: this.http2xx,
      http4xx: this.http4xx,
      http5xx: this.http5xx,
      aiCalls: {
        total: this.aiCallCount,
        geminiSuccess: this.geminiSuccess,
        geminiFailure: this.geminiFailure,
        openaiSuccess: this.openaiSuccess,
        openaiFailure: this.openaiFailure,
        heuristicFallback: this.heuristicFallback,
        averageLatencyMs: avgLatency
      },
      databaseOperations: {
        total: this.dbSuccess + this.dbFailures,
        success: this.dbSuccess,
        failures: this.dbFailures,
        mode: process.env.SUPABASE_URL ? 'supabase' : 'local_resilient'
      },
      featuresUsed: { ...this.featureCounts },
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      startTime: new Date(this.startTime).toISOString()
    };
  }

  /**
   * Get recent sanitized logs
   */
  public getRecentLogs(): SanitizedLogEntry[] {
    return [...this.recentLogs];
  }
}

export const telemetry = new TelemetryService();

/**
 * Skillouette Supabase Adapter
 * Handles server-side interaction with Supabase PostgreSQL and Auth.
 * Built using native fetch for universal compatibility with Node.js and Cloudflare Workers.
 */

export interface SupabaseConfig {
  url?: string;
  serviceRoleKey?: string;
  anonKey?: string;
}

export class SupabaseAdapter {
  private url: string;
  private key: string;
  private isConfigured: boolean;

  constructor() {
    this.url = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
    this.key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    this.isConfigured = Boolean(this.url && this.key && !this.url.includes('your-project'));
  }

  public getIsConfigured(): boolean {
    return this.isConfigured;
  }

  public getUrl(): string {
    return this.url;
  }

  /**
   * Health check for Supabase database readiness.
   * Performs a lightweight query against the REST API with a strict 3-second timeout.
   */
  public async checkHealth(): Promise<{ ok: boolean; status: string; latencyMs: number; error?: string }> {
    if (!this.isConfigured) {
      return {
        ok: true,
        status: 'standalone_local_mode',
        latencyMs: 0,
        error: 'Supabase credentials not configured. Resilient local persistence active.'
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${this.url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;

      if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
        // PostgREST responds
        return {
          ok: res.status !== 401,
          status: res.status === 401 ? 'unauthorized_key' : 'connected',
          latencyMs,
          error: res.status === 401 ? 'Invalid Supabase API key provided' : undefined
        };
      }

      return {
        ok: false,
        status: `http_${res.status}`,
        latencyMs,
        error: `Supabase returned HTTP ${res.status}`
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 'unreachable',
        latencyMs: Date.now() - start,
        error: err.name === 'AbortError' ? 'Supabase health check timed out' : (err.message || 'Connection failed')
      };
    }
  }

  /**
   * Safe helper to execute a query against Supabase REST endpoint
   */
  public async restQuery<T>(table: string, options: { method?: string; body?: any; queryParams?: string } = {}): Promise<T | null> {
    if (!this.isConfigured) return null;

    const { method = 'GET', body, queryParams = '' } = options;
    const url = `${this.url}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;

    try {
      const headers: Record<string, string> = {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal'
      };

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!res.ok) {
        console.warn(`Supabase REST query to ${table} failed with ${res.status}:`, await res.text());
        return null;
      }

      if (res.status === 204) return null;
      return (await res.json()) as T;
    } catch (err) {
      console.warn(`Supabase REST query error on ${table}:`, err);
      return null;
    }
  }
}

export const supabase = new SupabaseAdapter();

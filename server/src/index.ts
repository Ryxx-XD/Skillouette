import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api.js';
import { telemetry } from './telemetry.js';
import { supabase } from './supabase.js';
import { db } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - support local dev and Cloudflare Pages
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Telemetry request duration middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    telemetry.recordRequest(res.statusCode, duration);
  });
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// 1. Liveness check (process response)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// 2. Readiness check (database & AI dependencies)
app.get('/health/ready', async (req, res) => {
  const dbHealth = await supabase.checkHealth();
  const settings = db.getSettings();
  const hasAiKey = Boolean(settings.gemini_api_key || process.env.GEMINI_API_KEY || settings.openai_api_key || process.env.OPENAI_API_KEY);

  const isReady = dbHealth.ok;

  const responsePayload = {
    status: isReady ? 'ready' : 'degraded',
    checks: {
      liveness: 'ok',
      database: {
        mode: dbHealth.status,
        healthy: dbHealth.ok,
        latency_ms: dbHealth.latencyMs,
        notes: dbHealth.error || 'Database storage operational'
      },
      ai_provider: {
        configured: hasAiKey,
        provider: settings.llm_provider || (hasAiKey ? 'gemini' : 'local_heuristic'),
        fallback_available: true
      }
    },
    timestamp: new Date().toISOString()
  };

  if (!isReady) {
    return res.status(503).json(responsePayload);
  }

  res.json(responsePayload);
});

app.listen(PORT, () => {
  console.log(`🚀 Skillouette API server listening on http://localhost:${PORT}`);
});

export { app };

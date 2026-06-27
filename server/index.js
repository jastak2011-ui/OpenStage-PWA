import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import express from 'express';
import { randomBytes } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT) || 10000;
const defaultPrompt = 'Say hello from OpenStage';
const defaultAnthropicModel = 'claude-sonnet-4-6';
const shareTtlMs = 7 * 24 * 60 * 60 * 1000;
const openStageFrontendBaseUrl = 'https://openstage-pwa.onrender.com';

const allowedOrigins = new Set([
  'https://openstage-pwa.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

function getAnthropicErrorDetails(error, context = 'Anthropic request') {
  const status = error?.status;
  const type = error?.error?.type || error?.type;
  const message = error?.message;
  const responseBody = error?.error || error?.response?.data || error?.response?.body;

  console.error(`${context} failed:`, {
    status,
    message,
    type,
    responseBody
  });

  if (status === 401 || type === 'authentication_error') return 'authentication_error';
  if (status === 402 || type === 'billing_error' || /credit|billing|payment/i.test(message || '')) return 'billing_error';
  if (status === 400 && /model/i.test(message || '')) return 'model_error';
  if (type === 'invalid_request_error' && /model/i.test(message || '')) return 'model_error';
  return 'unknown_error';
}

function getAnthropicText(message) {
  return message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function parseClaudeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude response did not include JSON.');
    return JSON.parse(match[0]);
  }
}

function normalizeImportedSong(song, fallback) {
  return {
    title: typeof song?.title === 'string' && song.title.trim() ? song.title.trim() : fallback.title,
    artist: typeof song?.artist === 'string' && song.artist.trim() ? song.artist.trim() : fallback.artist,
    key: typeof song?.key === 'string' ? song.key.trim() : '',
    capo: Number.isFinite(Number(song?.capo)) ? Math.max(0, Math.round(Number(song.capo))) : 0,
    bpm: Number.isFinite(Number(song?.bpm)) && Number(song.bpm) > 0 ? Math.round(Number(song.bpm)) : null,
    chart: typeof song?.chart === 'string' ? song.chart : ''
  };
}

function createShareId() {
  return randomBytes(4).toString('base64url');
}

function normalizeSharedSong(song) {
  return {
    title: typeof song?.title === 'string' ? song.title.trim() : '',
    artist: typeof song?.artist === 'string' ? song.artist.trim() : '',
    key: typeof song?.key === 'string' ? song.key.trim() : '',
    capo: Number.isFinite(Number(song?.capo)) ? Math.max(0, Math.round(Number(song.capo))) : 0,
    bpm: Number.isFinite(Number(song?.bpm)) && Number(song.bpm) > 0 ? Math.round(Number(song.bpm)) : null,
    chart: typeof song?.chart === 'string' ? song.chart : '',
    notes: typeof song?.notes === 'string' ? song.notes : '',
    referenceAudioUrl: typeof song?.referenceAudioUrl === 'string' ? song.referenceAudioUrl.trim() : '',
    favorite: Boolean(song?.favorite)
  };
}

function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase is not configured.');
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function logSupabaseError(context, error, extra = {}) {
  console.error(`${context}:`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    ...extra
  });
}

async function insertSharedSong(supabase, song, expiresAt) {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareCode = createShareId();
    const { data, error } = await supabase
      .from('shared_songs')
      .insert({
        share_code: shareCode,
        song_json: song,
        expires_at: expiresAt.toISOString()
      })
      .select('share_code')
      .single();

    if (!error) return data.share_code;

    lastError = error;
    if (error.code !== '23505') break;
  }

  throw lastError || new Error('Failed to create shared song.');
}

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'openstage-api'
  });
});

app.get('/anthropic-status', (_request, response) => {
  response.json({
    configured: Boolean(process.env.ANTHROPIC_API_KEY)
  });
});

app.get('/supabase-status', (_request, response) => {
  response.json({
    configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)
  });
});

app.get('/supabase-test', async (_request, response) => {
  try {
    const supabase = createSupabaseClient();
    const { count, error } = await supabase
      .from('shared_songs')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    response.json({
      ok: true,
      count: count ?? 0
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Supabase test failed', error);
    response.status(500).json({
      ok: false,
      error: 'Supabase test failed.'
    });
  }
});

app.post('/api/test-anthropic', async (request, response) => {
  const prompt = typeof request.body?.prompt === 'string' && request.body.prompt.trim()
    ? request.body.prompt.trim()
    : defaultPrompt;

  if (!process.env.ANTHROPIC_API_KEY) {
    response.status(500).json({
      ok: false,
      error: 'Anthropic API key is not configured.'
    });
    return;
  }

  try {
    const anthropicModel = process.env.ANTHROPIC_MODEL || defaultAnthropicModel;
    console.log('Anthropic model:', anthropicModel);
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    const message = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const text = getAnthropicText(message);

    response.json({
      ok: true,
      text
    });
  } catch (error) {
    const details = getAnthropicErrorDetails(error, 'Anthropic test');
    response.status(500).json({
      ok: false,
      error: 'Anthropic request failed.',
      details
    });
  }
});

app.post('/api/ai-import-song', async (request, response) => {
  const title = typeof request.body?.title === 'string' ? request.body.title.trim() : '';
  const artist = typeof request.body?.artist === 'string' ? request.body.artist.trim() : '';
  const key = typeof request.body?.key === 'string' ? request.body.key.trim() : '';
  const capo = request.body?.capo ?? '';

  if (!title || !artist) {
    response.status(400).json({
      ok: false,
      error: 'Title and artist are required.'
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    response.status(500).json({
      ok: false,
      error: 'AI import failed.'
    });
    return;
  }

  try {
    const anthropicModel = process.env.ANTHROPIC_MODEL || defaultAnthropicModel;
    console.log('Anthropic model:', anthropicModel);
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    const prompt = [
      'Return ONLY valid JSON for an OpenStage song import. Do not include markdown, explanations, or code fences.',
      'The JSON object must use exactly these fields:',
      '{"title":"","artist":"","key":"","capo":0,"bpm":null,"chart":""}',
      'Chart requirements:',
      '- plain OpenStage-compatible chord chart',
      '- include sections like Intro:, Verse 1:, Chorus:',
      '- preserve chords-over-lyrics spacing',
      '- no markdown',
      '- no explanations',
      '- no code fences',
      '',
      `Song title: ${title}`,
      `Artist: ${artist}`,
      `Key: ${key || 'optional/unknown'}`,
      `Capo: ${capo === '' ? 'optional/unknown' : capo}`
    ].join('\n');
    const message = await anthropic.messages.create({
      model: anthropicModel,
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const text = getAnthropicText(message);
    const song = normalizeImportedSong(parseClaudeJson(text), { title, artist });

    response.json({
      ok: true,
      song
    });
  } catch (error) {
    getAnthropicErrorDetails(error, 'AI import');
    response.status(500).json({
      ok: false,
      error: 'AI import failed.'
    });
  }
});

app.post('/api/share-song', async (request, response) => {
  const song = normalizeSharedSong(request.body?.song);

  if (!song.title || !song.chart) {
    response.status(400).json({
      ok: false,
      error: 'Song title and chart are required.'
    });
    return;
  }

  try {
    const supabase = createSupabaseClient();
    const expiresAt = new Date(Date.now() + shareTtlMs);
    const shareCode = await insertSharedSong(supabase, song, expiresAt);

    console.log('Shared song created:', {
      shareCode,
      title: song.title,
      artist: song.artist,
      expiresAt: expiresAt.toISOString()
    });

    response.json({
      ok: true,
      shareId: shareCode,
      shareUrl: `${openStageFrontendBaseUrl}/import-song/${shareCode}`
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Shared song create failed', error, {
      title: song.title,
      artist: song.artist
    });
    response.status(500).json({
      ok: false,
      error: 'Shared song could not be created.'
    });
  }
});

app.get('/api/shared-song/:id', async (request, response) => {
  const id = String(request.params.id || '').trim();

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('shared_songs')
      .select('song_json')
      .eq('share_code', id)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    if (!data?.song_json) {
      response.status(404).json({
        ok: false,
        error: 'Shared song not found or expired.'
      });
      return;
    }

    console.log('Shared song retrieved:', {
      id,
      title: data.song_json.title,
      artist: data.song_json.artist
    });

    response.json({
      ok: true,
      song: data.song_json
    });
  } catch (error) {
    if (error?.message === 'Supabase is not configured.') {
      response.status(500).json({
        ok: false,
        error: 'Supabase is not configured.'
      });
      return;
    }

    logSupabaseError('Shared song retrieve failed', error, { shareCode: id });
    response.status(500).json({
      ok: false,
      error: 'Shared song could not be retrieved.'
    });
  }
});

app.listen(port, () => {
  console.log(`openstage-api listening on port ${port}`);
});

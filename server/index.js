import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 10000;
const defaultPrompt = 'Say hello from OpenStage';
const defaultAnthropicModel = 'claude-sonnet-4-6';

const allowedOrigins = new Set([
  'https://openstage-pwa.onrender.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
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

app.listen(port, () => {
  console.log(`openstage-api listening on port ${port}`);
});

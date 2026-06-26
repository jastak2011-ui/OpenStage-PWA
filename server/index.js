import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 10000;
const defaultPrompt = 'Say hello from OpenStage';

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
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const text = message.content
      .filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n')
      .trim();

    response.json({
      ok: true,
      text
    });
  } catch (error) {
    console.error('Anthropic test failed:', error);
    response.status(500).json({
      ok: false,
      error: 'Anthropic request failed.'
    });
  }
});

app.listen(port, () => {
  console.log(`openstage-api listening on port ${port}`);
});

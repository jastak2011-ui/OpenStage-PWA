import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 10000;

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

app.get('/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'openstage-api'
  });
});

app.listen(port, () => {
  console.log(`openstage-api listening on port ${port}`);
});

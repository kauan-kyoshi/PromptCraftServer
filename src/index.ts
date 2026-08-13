import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Capture the raw request body for tolerant parsing. We'll parse manually
// to accept valid JSON, malformed JSON with a recoverable `text` field,
// or plain text bodies from users who just paste text.
app.use(express.raw({ type: '*/*', limit: '2mb', verify: (req: Request, _res, buf: Buffer) => {
  (req as any).rawBody = buf.toString();
}}));

// Parse the raw body into `req.body`.
app.use((req: Request, _res: Response, next: NextFunction) => {
  const raw: string = (((req as any).rawBody as string) || '').trim();
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  // Try JSON first when content-type suggests JSON
  const tryJson = contentType.includes('application/json') || contentType.includes('+json');

  if (tryJson) {
    try {
      (req as any).body = raw ? JSON.parse(raw) : {};
      return next();
    } catch (e) {
      // fall through to tolerant extraction below
    }
  }

  // If content-type is plain text or JSON parse failed, try to recover a `text` field
  try {
    const textKeyIndex = raw.indexOf('"text"');
    if (textKeyIndex !== -1) {
      const colonIndex = raw.indexOf(':', textKeyIndex);
      if (colonIndex !== -1) {
        let value = raw.slice(colonIndex + 1).trim();
        if (value.endsWith('}')) value = value.slice(0, -1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        (req as any).body = { text: value };
        return next();
      }
    }
  } catch (e) {
    // ignore and fallback to raw
  }

  // Fallback: if it's plain text or we couldn't parse JSON, use raw body as text
  if (raw.length > 0) {
    (req as any).body = { text: raw };
    return next();
  }

  // No body provided
  (req as any).body = {};
  return next();
});

app.use('/api/ai', aiRoutes);

app.get('/', (req: Request, res: Response) => res.send('ai-document-summarizer is running'));

// Generic error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

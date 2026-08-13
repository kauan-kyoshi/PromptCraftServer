import { Request, Response } from 'express';
import { summarizeText } from '../services/aiService';

export const summarizeController = async (req: Request, res: Response): Promise<Response | void> => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Campo "text" é obrigatório e deve ser string.' });
  }

  try {
    let summary = await summarizeText(text);
    if (typeof summary === 'string') {
      // Remove code fences entirely
      summary = summary.replace(/```[\s\S]*?```/g, ' ');
      // Remove common markdown symbols that shouldn't appear in plain text
      summary = summary.replace(/[\|#`*>_=~]/g, '');
      // Replace literal escape sequences (e.g. "\\n") with spaces
      summary = summary.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\\t/g, ' ');
      // Replace escaped forward-slash sequences and remove leftover backslashes
      summary = summary.replace(/\\\//g, '/').replace(/\\+/g, '');
      // Remove any remaining single backslashes
      summary = summary.replace(/\\/g, '');
      // Normalize arrow macros and variants to '->'
      summary = summary.replace(/right\s*arrow/gi, '->').replace(/rightarrow/gi, '->');
      // Fix partial tokens like 'ightarrow' (happens after some removals)
      summary = summary.replace(/ightarrow/gi, '->');
      // Normalize common arrow notations and unicode arrows
      summary = summary.replace(/=>/g, '->').replace(/[→⇒]/g, '->');
      // Remove any remaining dollar signs used for math delimiters
      summary = summary.replace(/\$/g, '');
      // Remove any remaining forward slashes (clean stray '/')
      summary = summary.replace(/\//g, '');
      // Remove CR/LF and collapse multiple whitespace into single space, then trim
      summary = summary.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // If client requests plain text (Accept: text/plain) or ?plain=1, return raw text
    const wantsPlain = (req.headers['accept'] || '').toString().includes('text/plain') || req.query.plain === '1';
    if (wantsPlain) {
      // Ensure single trailing newline for terminal friendliness
      const out = (typeof summary === 'string' ? summary : String(summary)) + '\n';
      res.type('text/plain');
      return res.send(out);
    }

    return res.json({ summary });
  } catch (err: any) {
    console.error('AI summarize error:', err.message || err);
    return res.status(500).json({ error: 'Erro ao resumir o texto.' });
  }
};

export default { summarizeController };

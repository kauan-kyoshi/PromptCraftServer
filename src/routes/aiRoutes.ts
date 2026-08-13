import { Router, Request, Response } from 'express';
import { summarizeController } from '../controllers/aiController';

const router = Router();

router.post('/summarize', summarizeController);

// Diagnostic endpoint: returns the parsed body and rawBody for debugging
router.post('/debug-parse', (req: Request, res: Response) => {
	const raw = (req as any).rawBody || null;
	return res.json({ body: req.body || null, rawBody: raw });
});

export default router;

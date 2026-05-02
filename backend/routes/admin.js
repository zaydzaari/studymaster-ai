import { Router } from 'express';
import { getStats } from '../utils/statsStore.js';

const router = Router();

function auth(req, res, next) {
  const key = process.env.ADMIN_KEY || 'studymaster-admin';
  if (req.headers['authorization'] !== `Bearer ${key}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.get('/stats', auth, (req, res) => {
  res.json(getStats());
});

export default router;

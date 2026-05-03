import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'shieldpay',
    time: new Date().toISOString(),
  });
});

export default router;

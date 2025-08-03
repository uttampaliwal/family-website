import express, { Request as ExpressRequest, Response as ExpressResponse, Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP' });
});

router.get('/health-check', healthCheck);

export default router;
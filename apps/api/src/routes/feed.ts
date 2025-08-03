import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';

const router = express.Router();

router.get('/', (req: ExpressRequest, res: ExpressResponse) => {
  res.status(200).json({ message: 'Feed route works!' });
});

export default router;
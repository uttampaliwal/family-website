import request from 'supertest';
import express from 'express';
import healthRoutes from './health';

const app = express();
app.use('/health', healthRoutes);

describe('Health API', () => {
  it('should return 200 OK for the health check', async () => {
    const res = await request(app).get('/health/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'UP' });
  });
});

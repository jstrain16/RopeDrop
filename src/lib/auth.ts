import { NextRequest } from 'next/server';

export function assertCronSecret(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new Error('CRON_SECRET is not set');
  }
  const provided = req.headers.get('x-cron-secret');
  if (provided !== expected) {
    const err = new Error('Unauthorized');
    // @ts-expect-error attach status for route handler convenience
    err.status = 401;
    throw err;
  }
}


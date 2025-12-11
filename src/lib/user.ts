import { NextRequest } from 'next/server';

export function getUserId(req: NextRequest): string {
  const header = req.headers.get('x-user-id');
  const queryParam = req.nextUrl.searchParams.get('userId');
  const id = header || queryParam || process.env.DEMO_USER_ID;
  if (!id) {
    throw new Error('User id is required (x-user-id header or userId query)');
  }
  return id;
}


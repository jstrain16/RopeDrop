import { NextRequest, NextResponse } from 'next/server';
import { syncAlta } from '@/lib/sync';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await syncAlta();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Sync failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

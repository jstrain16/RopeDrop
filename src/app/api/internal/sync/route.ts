import { NextRequest, NextResponse } from 'next/server';
import { assertCronSecret } from '@/lib/auth';
import { syncAltaStatusAndQueueChanges } from '@/lib/alta/sync';

export async function POST(req: NextRequest) {
  try {
    assertCronSecret(req);
    await syncAltaStatusAndQueueChanges();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error ? (error as { status: number }).status : 500;
    console.error(error);
    return NextResponse.json({ error: 'Sync failed' }, { status });
  }
}


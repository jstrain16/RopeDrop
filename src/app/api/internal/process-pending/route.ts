import { NextRequest, NextResponse } from 'next/server';
import { assertCronSecret } from '@/lib/auth';
import { processPendingNotifications } from '@/lib/alta/notifications';

export async function POST(req: NextRequest) {
  try {
    assertCronSecret(req);
    const processedIds = await processPendingNotifications();
    return NextResponse.json({ processed: processedIds.length });
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error ? (error as { status: number }).status : 500;
    console.error(error);
    return NextResponse.json({ error: 'Processing failed' }, { status });
  }
}


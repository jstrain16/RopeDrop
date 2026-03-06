import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Migrations are handled via Supabase SQL Editor.' }, { status: 501 });
}

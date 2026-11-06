import { NextResponse } from 'next/server';
import { getKnowledge } from '@/lib/knowledge';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(await getKnowledge(), { headers: { 'Cache-Control': 'no-store' } });
}

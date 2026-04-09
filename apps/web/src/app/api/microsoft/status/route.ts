import { NextResponse } from 'next/server';
import { isMicrosoftGraphConfigured } from '@/lib/microsoft-graph';

export async function GET() {
  return NextResponse.json({
    configured: isMicrosoftGraphConfigured(),
  });
}

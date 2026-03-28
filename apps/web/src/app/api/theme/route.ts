import { NextResponse } from 'next/server';

/**
 * Canonical theme tokens (mirrors :root in globals.css) for clients or future white-label.
 */
export async function GET() {
  return NextResponse.json({
    theme: {
      appCanvas: 'hsl(220 30% 94%)',
      dashboardNavy: 'hsl(215 42% 17%)',
      dashboardFrame: 'hsl(186 38% 28%)',
      dashboardCoral: 'hsl(12 82% 55%)',
    },
  });
}

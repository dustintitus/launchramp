import { NextResponse } from 'next/server';
import { prisma } from '@launchramp/db';
import { getCurrentOrgId } from '@/lib/auth';

export async function GET() {
  try {
    const orgId = getCurrentOrgId();
    const templates = await prisma.template.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[GET /api/templates]', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const orgId = getCurrentOrgId();
    const body = await request.json();
    const { name, body: templateBody, variables } = body;

    if (!name || !templateBody) {
      return NextResponse.json(
        { error: 'name and body are required' },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        organizationId: orgId,
        name,
        body: templateBody,
        variables: variables ?? [],
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('[POST /api/templates]', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

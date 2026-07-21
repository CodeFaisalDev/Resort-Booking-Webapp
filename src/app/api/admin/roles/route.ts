import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Also count staff assigned to each role name
    const staffList = await prisma.staff.findMany({
      select: { role: true }
    });

    const roleCounts: Record<string, number> = {};
    staffList.forEach(s => {
      roleCounts[s.role] = (roleCounts[s.role] || 0) + 1;
    });

    return NextResponse.json({
      roles: roles.map(r => ({
        ...r,
        staffCount: roleCounts[r.name] || 0
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch roles.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    const { name, description, permissions } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role title name is required.' }, { status: 400 });
    }

    const formattedName = name.trim().toUpperCase().replace(/\s+/g, '_');

    const existing = await prisma.role.findUnique({
      where: { name: formattedName }
    });

    if (existing) {
      return NextResponse.json({ error: `Role '${formattedName}' already exists.` }, { status: 409 });
    }

    const newRole = await prisma.role.create({
      data: {
        name: formattedName,
        description: description || `Custom ${name} staff role`,
        permissions: Array.isArray(permissions) ? permissions : ['HOUSEKEEPING']
      }
    });

    return NextResponse.json({
      message: 'Dynamic role created successfully!',
      role: newRole
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create role.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin credentials required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID required.' }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
    }

    if (role.name === 'ADMIN' || role.name === 'STAFF') {
      return NextResponse.json({ error: 'System core roles (ADMIN & STAFF) cannot be deleted.' }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ message: 'Role deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete role.' }, { status: 500 });
  }
}

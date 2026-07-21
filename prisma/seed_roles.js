const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const initialRoles = [
  {
    name: 'ADMIN',
    description: 'Full system administration access with financial, staffing, and audit privileges.',
    permissions: ['ALL_ACCESS', 'MANAGE_BOOKINGS', 'HOUSEKEEPING', 'FINANCE_ACCESS', 'STAFF_MANAGEMENT', 'DEPT_MANAGEMENT', 'PROPERTIES_MANAGEMENT']
  },
  {
    name: 'STAFF',
    description: 'General staff operator responsible for room housekeeping and assigned turnover tasks.',
    permissions: ['HOUSEKEEPING', 'VIEW_BOOKINGS']
  },
  {
    name: 'HOUSEKEEPING_LEAD',
    description: 'Senior housekeeping supervisor managing room cleaning turnovers and staff task assignments.',
    permissions: ['HOUSEKEEPING', 'ASSIGN_TASKS', 'ROOM_STATUS_OVERRIDE']
  },
  {
    name: 'FRONT_DESK_MANAGER',
    description: 'Front desk supervisor handling guest check-ins, stay modifications, and booking management.',
    permissions: ['MANAGE_BOOKINGS', 'GUEST_PROFILE_VIEW', 'CHECKIN_CHECKOUT']
  },
  {
    name: 'FINANCE_OFFICER',
    description: 'Accounting specialist overseeing transaction ledgers, invoice settlements, and refund approvals.',
    permissions: ['FINANCE_ACCESS', 'VIEW_BOOKINGS', 'EXPORT_REPORTS']
  },
  {
    name: 'CONCIERGE_DIRECTOR',
    description: 'Guest relations lead managing add-on services, VIP arrangements, and experience bookings.',
    permissions: ['MANAGE_SERVICES', 'GUEST_RELATIONS', 'VIEW_BOOKINGS']
  }
];

async function seedRoles() {
  console.log('--- Seeding Dynamic Roles Registry ---');

  for (const r of initialRoles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {
        description: r.description,
        permissions: r.permissions
      },
      create: {
        name: r.name,
        description: r.description,
        permissions: r.permissions
      }
    });
  }

  console.log('--- Initial Roles Seeded Successfully ---');
}

seedRoles()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

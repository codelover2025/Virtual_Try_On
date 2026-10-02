import { PrismaClient, SettingValueType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Admin', isSystem: true },
  { code: 'ADMIN', name: 'Admin', isSystem: true },
  { code: 'EDITOR', name: 'Editor', isSystem: true },
  { code: 'CUSTOMER', name: 'Customer', isSystem: true },
] as const;

const PERMISSIONS: Array<{ code: string; module: string; description: string }> = [
  { code: 'products:read', module: 'products', description: 'Read products' },
  { code: 'products:write', module: 'products', description: 'Write products' },
  { code: 'products:publish', module: 'products', description: 'Publish products' },
  { code: 'categories:write', module: 'categories', description: 'Manage categories' },
  { code: 'assets:write', module: 'assets', description: 'Manage jewellery assets' },
  { code: 'users:read', module: 'users', description: 'Read users' },
  { code: 'users:write', module: 'users', description: 'Write users' },
  { code: 'roles:write', module: 'roles', description: 'Assign roles' },
  { code: 'settings:write', module: 'settings', description: 'Manage settings' },
  { code: 'analytics:read', module: 'analytics', description: 'View analytics' },
  { code: 'audit:read', module: 'audit', description: 'View audit logs' },
  { code: 'captures:read', module: 'captures', description: 'Read captures' },
  { code: 'captures:delete', module: 'captures', description: 'Delete captures' },
];

const STAFF_PERMS = PERMISSIONS.map((p) => p.code);
const EDITOR_PERMS = [
  'products:read',
  'products:write',
  'products:publish',
  'categories:write',
  'assets:write',
  'analytics:read',
];

const prisma = new PrismaClient();

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: perm,
      update: { module: perm.module, description: perm.description },
    });
  }

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: { ...role, description: role.name },
      update: { name: role.name, isSystem: true },
    });
  }

  const allRoles = await prisma.role.findMany();
  const allPerms = await prisma.permission.findMany();
  const permByCode = Object.fromEntries(allPerms.map((p) => [p.code, p.id]));
  const roleByCode = Object.fromEntries(allRoles.map((r) => [r.code, r.id]));

  async function link(roleCode: string, codes: string[]) {
    const roleId = roleByCode[roleCode]!;
    for (const code of codes) {
      const permissionId = permByCode[code]!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    }
  }

  await link('SUPER_ADMIN', STAFF_PERMS);
  await link('ADMIN', STAFF_PERMS);
  await link('EDITOR', EDITOR_PERMS);

  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vj.local' },
    create: {
      email: 'admin@vj.local',
      fullName: 'Platform Admin',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      roles: { create: [{ roleId: roleByCode['SUPER_ADMIN']! }] },
    },
    update: { passwordHash, status: 'ACTIVE' },
  });

  // ensure admin has role if user already existed without roles
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: roleByCode['SUPER_ADMIN']! },
    },
    create: { userId: admin.id, roleId: roleByCode['SUPER_ADMIN']! },
    update: {},
  });

  await prisma.category.upsert({
    where: { slug: 'earrings' },
    create: {
      name: 'Earrings',
      slug: 'earrings',
      description: 'Virtual try-on earrings',
      sortOrder: 1,
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.setting.upsert({
    where: { key: 'tryon.guestEnabled' },
    create: {
      key: 'tryon.guestEnabled',
      value: true,
      valueType: SettingValueType.BOOLEAN,
      isPublic: true,
      description: 'Allow guest try-on sessions',
    },
    update: { value: true, isPublic: true },
  });

  await prisma.setting.upsert({
    where: { key: 'tryon.maxSessionMinutes' },
    create: {
      key: 'tryon.maxSessionMinutes',
      value: 30,
      valueType: SettingValueType.NUMBER,
      isPublic: true,
      description: 'Max try-on session duration',
    },
    update: { value: 30, isPublic: true },
  });

  console.log('Seed complete. Admin:', admin.email, 'password: Admin@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

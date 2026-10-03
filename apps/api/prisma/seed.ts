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

  const earringCategory = await prisma.category.upsert({
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

  // Demo products with overlay assets for the try-on studio
  const demoProducts = [
    {
      sku: 'DEMO-EARRING-001',
      name: 'Gold Hoop Earrings',
      slug: 'gold-hoop-earrings',
      description: 'Classic 22k gold hoop earrings with a polished finish.',
      jewelleryKind: 'EARRINGS' as const,
      priceCents: 1299900,
      currency: 'INR',
      overlayUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
    },
    {
      sku: 'DEMO-EARRING-002',
      name: 'Diamond Drop Earrings',
      slug: 'diamond-drop-earrings',
      description: 'Elegant diamond-studded drop earrings in white gold.',
      jewelleryKind: 'EARRINGS' as const,
      priceCents: 2499900,
      currency: 'INR',
      overlayUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop',
    },
    {
      sku: 'DEMO-EARRING-003',
      name: 'Pearl Stud Earrings',
      slug: 'pearl-stud-earrings',
      description: 'Lustrous freshwater pearl studs set in sterling silver.',
      jewelleryKind: 'EARRINGS' as const,
      priceCents: 599900,
      currency: 'INR',
      overlayUrl: 'https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=400&h=400&fit=crop',
    },
  ];

  for (const p of demoProducts) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      create: {
        categoryId: earringCategory.id,
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        description: p.description,
        jewelleryKind: p.jewelleryKind,
        status: 'PUBLISHED',
        priceCents: p.priceCents,
        currency: p.currency,
        publishedAt: new Date(),
      },
      update: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    // Upsert a primary image
    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id, isPrimary: true },
    });
    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          storageKey: `demo/${p.sku}/primary.jpg`,
          url: p.overlayUrl,
          altText: p.name,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    // Upsert a jewellery asset (IMAGE_OVERLAY) used by the try-on engine
    const existingAsset = await prisma.jewelleryAsset.findFirst({
      where: { productId: product.id, assetType: 'IMAGE_OVERLAY' },
    });
    if (!existingAsset) {
      await prisma.jewelleryAsset.create({
        data: {
          productId: product.id,
          kind: p.jewelleryKind,
          assetType: 'IMAGE_OVERLAY',
          storageKey: `demo/${p.sku}/overlay.jpg`,
          url: p.overlayUrl,
          anchorProfile: { type: 'ear', offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
          defaultScale: 1.0,
          isActive: true,
        },
      });
    }
  }

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

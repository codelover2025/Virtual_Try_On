# 04 - Database Design

**Engine:** PostgreSQL  
**ORM:** Prisma  
**Keys:** UUID (`uuid` / `gen_random_uuid()`)  
**Delete policy:** Soft delete via `deletedAt` (nullable timestamptz)  
**Timestamps:** `createdAt`, `updatedAt` on all tables  
**Audit:** Mutating admin actions -> `AuditLog`

---

## 1. ER Overview

```
Role 1──* UserRole *──1 User
Permission *──* RolePermission *──1 Role

Category 1──* Product
Product 1──* ProductImage
Product 1──* JewelleryAsset
User 1──* TryOnSession *──1 Product
TryOnSession 1──* CapturedImage
Settings (key/value singleton rows)
AuditLog (append-only)
```

---

## 2. Enums

```text
UserStatus: ACTIVE | INVITED | SUSPENDED | DELETED
JewelleryKind: EARRINGS | NECKLACE | RINGS | BANGLES | NOSE_RING
              | BRACELET | PENDANT | MANGALSUTRA | SUNGLASSES | WATCH
ProductStatus: DRAFT | PUBLISHED | ARCHIVED
AssetType: IMAGE_OVERLAY | MODEL_GLB | MODEL_GLTF | ALPHA_MASK
TryOnSessionStatus: ACTIVE | COMPLETED | ABANDONED | ERROR
CaptureStatus: PENDING | READY | FAILED | DELETED
SettingValueType: STRING | NUMBER | BOOLEAN | JSON
```

---

## 3. Tables

### users

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | CITEXT UNIQUE | unique where deletedAt IS NULL |
| passwordHash | TEXT | nullable if future OAuth |
| fullName | TEXT | |
| avatarUrl | TEXT NULL | |
| status | UserStatus | default ACTIVE |
| emailVerifiedAt | TIMESTAMPTZ NULL | |
| lastLoginAt | TIMESTAMPTZ NULL | |
| createdAt / updatedAt | TIMESTAMPTZ | |
| deletedAt | TIMESTAMPTZ NULL | soft delete |

**Indexes:** `(email)` unique partial `WHERE deletedAt IS NULL`; `(status)`; `(deletedAt)`

---

### roles

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | TEXT UNIQUE | e.g. SUPER_ADMIN, ADMIN, EDITOR, CUSTOMER |
| name | TEXT | |
| description | TEXT NULL | |
| isSystem | BOOLEAN | prevent delete of system roles |
| createdAt / updatedAt / deletedAt | | |

---

### permissions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | TEXT UNIQUE | e.g. `products:write`, `users:read` |
| module | TEXT | products, users, settings… |
| description | TEXT NULL | |

---

### role_permissions

| Column | Type |
|--------|------|
| roleId | UUID FK -> roles |
| permissionId | UUID FK -> permissions |
| PK | (roleId, permissionId) |

---

### user_roles

| Column | Type |
|--------|------|
| userId | UUID FK -> users |
| roleId | UUID FK -> roles |
| assignedAt | TIMESTAMPTZ |
| assignedBy | UUID NULL FK -> users |
| PK | (userId, roleId) |

---

### categories

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| parentId | UUID NULL FK -> categories | tree |
| name | TEXT | |
| slug | TEXT | unique soft |
| description | TEXT NULL | |
| sortOrder | INT | default 0 |
| isActive | BOOLEAN | |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** unique `(slug)` where `deletedAt IS NULL`; `(parentId)`; `(isActive, sortOrder)`

---

### products

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| categoryId | UUID FK -> categories | |
| sku | TEXT | unique soft |
| name | TEXT | |
| slug | TEXT | unique soft |
| description | TEXT NULL | |
| jewelleryKind | JewelleryKind | drives AR anchor profile |
| status | ProductStatus | |
| priceCents | INT NULL | optional commerce later |
| currency | CHAR(3) NULL | |
| metadata | JSONB | tags, material, weight |
| publishedAt | TIMESTAMPTZ NULL | |
| createdBy / updatedBy | UUID NULL FK users | |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** unique `(slug)`, `(sku)` where not deleted; `(categoryId)`; `(jewelleryKind)`; `(status)`; GIN `(metadata)` optional

---

### product_images

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| productId | UUID FK -> products ON DELETE RESTRICT | |
| storageKey | TEXT | object key |
| url | TEXT | public or derived |
| altText | TEXT NULL | |
| sortOrder | INT | |
| isPrimary | BOOLEAN | |
| width / height | INT NULL | |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** `(productId, sortOrder)`; partial unique one primary per product if desired

---

### jewellery_assets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| productId | UUID FK -> products | |
| kind | JewelleryKind | denormalized for query |
| assetType | AssetType | |
| storageKey | TEXT | |
| url | TEXT | |
| anchorProfile | JSONB | landmark map, offsets, scale rules |
| defaultScale | FLOAT | |
| defaultRotationZ | FLOAT | degrees or radians - pick one, document |
| mirrorForOppositeEar | BOOLEAN | earrings |
| fingerIndex | INT NULL | rings 0-4 |
| version | INT | asset revisions |
| isActive | BOOLEAN | |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** `(productId, isActive)`; `(kind)`

**anchorProfile example (conceptual):**

```json
{
  "primaryAnchor": "LEFT_EAR_LOBE",
  "secondaryAnchor": "RIGHT_EAR_LOBE",
  "scaleRef": "FACE_WIDTH",
  "offset": { "x": 0, "y": 0.02, "z": 0 },
  "occlusion": { "enabled": false }
}
```

---

### try_on_sessions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID NULL FK -> users | null = anonymous |
| productId | UUID FK -> products | |
| jewelleryKind | JewelleryKind | |
| status | TryOnSessionStatus | |
| clientInfo | JSONB | UA, device class, TF backend |
| startedAt | TIMESTAMPTZ | |
| endedAt | TIMESTAMPTZ NULL | |
| metrics | JSONB | avgFps, detectionRate |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** `(userId, createdAt DESC)`; `(productId)`; `(status)`

---

### captured_images

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sessionId | UUID FK -> try_on_sessions | |
| userId | UUID NULL FK -> users | |
| productId | UUID FK -> products | |
| storageKey | TEXT | |
| url | TEXT | |
| thumbStorageKey | TEXT NULL | |
| width / height | INT NULL | |
| mimeType | TEXT | image/jpeg \| png |
| fileSizeBytes | INT NULL | |
| status | CaptureStatus | |
| expiresAt | TIMESTAMPTZ NULL | retention policy |
| createdAt / updatedAt / deletedAt | | |

**Indexes:** `(sessionId)`; `(userId, createdAt DESC)`; `(expiresAt)` for cleanup jobs

---

### settings

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| key | TEXT UNIQUE | e.g. `tryon.maxSessionMinutes` |
| value | JSONB | |
| valueType | SettingValueType | |
| description | TEXT NULL | |
| isPublic | BOOLEAN | expose to web without auth |
| updatedBy | UUID NULL | |
| createdAt / updatedAt / deletedAt | | |

---

### audit_logs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| actorUserId | UUID NULL | |
| action | TEXT | PRODUCT_UPDATE, USER_ROLE_ASSIGN… |
| entityType | TEXT | |
| entityId | UUID NULL | |
| before | JSONB NULL | |
| after | JSONB NULL | |
| ip | TEXT NULL | |
| userAgent | TEXT NULL | |
| requestId | TEXT NULL | |
| createdAt | TIMESTAMPTZ | append-only; no updatedAt/deletedAt |

**Indexes:** `(actorUserId, createdAt DESC)`; `(entityType, entityId)`; `(createdAt DESC)`

---

### refresh_tokens (optional but recommended)

| Column | Type |
|--------|------|
| id | UUID PK |
| userId | UUID FK |
| tokenHash | TEXT UNIQUE |
| expiresAt | TIMESTAMPTZ |
| revokedAt | TIMESTAMPTZ NULL |
| createdAt | TIMESTAMPTZ |

---

## 4. Relationships Summary

- User ↔ Role: many-to-many via `user_roles`
- Role ↔ Permission: many-to-many via `role_permissions`
- Category -> Product: one-to-many (optional self-parent for category tree)
- Product -> ProductImage: one-to-many
- Product -> JewelleryAsset: one-to-many (active asset selected by version/isActive)
- User -> TryOnSession: one-to-many (nullable user for guests)
- Product -> TryOnSession: one-to-many
- TryOnSession -> CapturedImage: one-to-many

---

## 5. Soft Delete Rules

- Default queries filter `deletedAt IS NULL` via Prisma middleware/extension
- Unique constraints are **partial** on live rows
- Soft-deleted products hidden from public API; admin can restore
- Audit logs never soft-deleted
- Captures: soft delete + optional hard purge after `expiresAt` by job

---

## 6. Seed Roles & Permissions (v1)

**Roles:** `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `CUSTOMER`

**Permission examples:**  
`products:read|write|publish`, `categories:write`, `assets:write`, `users:read|write`, `roles:write`, `settings:write`, `analytics:read`, `audit:read`, `captures:read|delete`

Customers get no admin permissions; try-on/capture use authenticated or guest policies separately.

---

## 7. Migration & Ownership

- Single Prisma schema owned by Engineer A
- Schema PRs serialized; never two concurrent migration edits
- Seed script for roles, permissions, demo categories/products

# 05 - Complete API Design

**Style:** REST/JSON  
**Base:** `/api/v1`  
**Auth:** `Authorization: Bearer <accessToken>`  
**Docs:** Swagger UI at `/api/docs`  
**Envelope:** See Software Architecture §6

All IDs are UUID strings. Timestamps ISO-8601 UTC.

---

## Common Conventions

| Item | Rule |
|------|------|
| Pagination | `?page=1&pageSize=20` -> `meta.pagination { page, pageSize, total, totalPages }` |
| Sorting | `?sort=createdAt:desc` |
| Filtering | `?status=PUBLISHED&jewelleryKind=EARRINGS&q=gold` |
| Idempotency | Optional header `Idempotency-Key` on POSTs that create captures/uploads |
| Errors | `success:false` + machine `error.code` |

---

## 1. Authentication

### POST `/auth/register`

**Request**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "fullName": "Asha Patel"
}
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Asha Patel",
      "roles": ["CUSTOMER"]
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    }
  }
}
```

### POST `/auth/login`

**Request:** `{ "email": "...", "password": "..." }`  
**Response 200:** same shape as register tokens + user.

### POST `/auth/refresh`

**Request:** `{ "refreshToken": "..." }`  
**Response 200:** new `tokens` (rotated).

### POST `/auth/logout`

**Auth required.** Body: `{ "refreshToken": "..." }`  
**Response 200:** `{ "success": true, "data": { "ok": true } }`  
Revokes refresh token / blacklists JTI in Redis.

### GET `/auth/me`

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Asha Patel",
    "roles": ["CUSTOMER"],
    "permissions": []
  }
}
```

---

## 2. Categories

### GET `/categories`

Public. Query: `?flat=true|false`, `?isActive=true`

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Earrings",
      "slug": "earrings",
      "parentId": null,
      "sortOrder": 1,
      "children": []
    }
  ]
}
```

### GET `/categories/:idOrSlug`

Public detail.

### POST `/categories` - Admin (`categories:write`)

```json
{
  "name": "Gold Earrings",
  "slug": "gold-earrings",
  "parentId": "uuid-or-null",
  "description": "...",
  "sortOrder": 10,
  "isActive": true
}
```

### PATCH `/categories/:id` - Admin  
### DELETE `/categories/:id` - Admin soft delete

---

## 3. Products

### GET `/products`

Public. Filters: `categoryId`, `jewelleryKind`, `status` (public forced PUBLISHED), `q`, pagination.

**Response item**

```json
{
  "id": "uuid",
  "name": "Floral Stud Earrings",
  "slug": "floral-stud-earrings",
  "sku": "ER-1001",
  "jewelleryKind": "EARRINGS",
  "status": "PUBLISHED",
  "category": { "id": "uuid", "name": "Earrings", "slug": "earrings" },
  "primaryImage": {
    "id": "uuid",
    "url": "https://cdn/.../img.jpg",
    "altText": "Floral studs"
  },
  "priceCents": 249900,
  "currency": "INR"
}
```

### GET `/products/:idOrSlug`

Public detail including images list + active jewellery asset summary (no raw storage keys to clients - signed URLs only).

```json
{
  "id": "uuid",
  "name": "...",
  "description": "...",
  "jewelleryKind": "EARRINGS",
  "images": [],
  "tryOnAsset": {
    "id": "uuid",
    "assetType": "MODEL_GLB",
    "url": "https://signed...",
    "anchorProfile": {},
    "defaultScale": 1,
    "defaultRotationZ": 0,
    "mirrorForOppositeEar": true
  }
}
```

### POST `/products` - Admin (`products:write`)

```json
{
  "categoryId": "uuid",
  "sku": "ER-1001",
  "name": "Floral Stud Earrings",
  "slug": "floral-stud-earrings",
  "description": "...",
  "jewelleryKind": "EARRINGS",
  "status": "DRAFT",
  "priceCents": 249900,
  "currency": "INR",
  "metadata": { "material": "22K Gold" }
}
```

### PATCH `/products/:id` - Admin  
### POST `/products/:id/publish` - Admin (`products:publish`)  
### DELETE `/products/:id` - Admin soft delete

---

## 4. Product Images

### POST `/products/:productId/images` - Admin

Either multipart `file` + fields, or JSON referencing completed upload:

```json
{
  "storageKey": "products/uuid/hero.jpg",
  "altText": "Front view",
  "sortOrder": 0,
  "isPrimary": true
}
```

### PATCH `/products/:productId/images/:imageId`  
### DELETE `/products/:productId/images/:imageId`

---

## 5. Jewellery Assets

### POST `/products/:productId/assets` - Admin (`assets:write`)

```json
{
  "assetType": "MODEL_GLB",
  "storageKey": "assets/uuid/earring.glb",
  "anchorProfile": {
    "primaryAnchor": "LEFT_EAR_LOBE",
    "scaleRef": "FACE_WIDTH",
    "offset": { "x": 0, "y": 0.02, "z": 0 }
  },
  "defaultScale": 1.0,
  "defaultRotationZ": 0,
  "mirrorForOppositeEar": true,
  "fingerIndex": null,
  "isActive": true
}
```

### GET `/products/:productId/assets` - Admin list  
### PATCH `/products/:productId/assets/:assetId`  
### POST `/products/:productId/assets/:assetId/activate`

---

## 6. Uploads

### POST `/uploads/presign` - Auth (admin for catalog; user for captures)

**Request**

```json
{
  "purpose": "PRODUCT_IMAGE" | "JEWELLERY_ASSET" | "CAPTURE",
  "fileName": "earring.glb",
  "mimeType": "model/gltf-binary",
  "byteSize": 1048576
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://minio-or-r2-presigned...",
    "storageKey": "assets/uuid/earring.glb",
    "headers": { "Content-Type": "model/gltf-binary" },
    "expiresIn": 600
  }
}
```

### POST `/uploads/complete`

```json
{ "storageKey": "assets/uuid/earring.glb", "purpose": "JEWELLERY_ASSET" }
```

Validates object exists; returns canonical `url` / metadata.

---

## 7. Try-On Sessions

### POST `/try-on/sessions`

Auth optional (guest allowed if setting enabled).

```json
{
  "productId": "uuid",
  "clientInfo": {
    "userAgent": "...",
    "deviceClass": "mobile",
    "tfBackend": "webgl"
  }
}
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "productId": "uuid",
    "jewelleryKind": "EARRINGS",
    "asset": { "id": "uuid", "url": "...", "anchorProfile": {}, "assetType": "MODEL_GLB" },
    "status": "ACTIVE"
  }
}
```

### PATCH `/try-on/sessions/:sessionId`

```json
{
  "status": "COMPLETED",
  "metrics": { "avgFps": 28.5, "detectionRate": 0.92 }
}
```

### GET `/try-on/sessions/:sessionId` - owner or admin

---

## 8. Image Capture

### POST `/try-on/sessions/:sessionId/captures`

Prefer: client uploads via presign (`purpose=CAPTURE`) then registers:

```json
{
  "storageKey": "captures/session/uuid.jpg",
  "width": 1080,
  "height": 1920,
  "mimeType": "image/jpeg",
  "fileSizeBytes": 345678
}
```

Alternate (small payloads only): multipart `file`.

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "READY",
    "url": "https://signed-download...",
    "thumbUrl": "https://signed-thumb...",
    "expiresAt": "2026-10-26T00:00:00.000Z"
  }
}
```

### GET `/try-on/captures/:captureId`  
### GET `/try-on/captures` - current user gallery (`?page=`)  
### DELETE `/try-on/captures/:captureId` - soft delete owner/admin

---

## 9. Download

### GET `/try-on/captures/:captureId/download`

Returns **302** to short-lived signed URL **or** JSON:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://signed...",
    "fileName": "tryon-floral-stud-earrings.jpg",
    "expiresIn": 120
  }
}
```

No long-lived public capture URLs by default.

---

## 10. Users (Admin)

### GET `/admin/users` - `users:read`  
### GET `/admin/users/:id`  
### PATCH `/admin/users/:id` - status, fullName  
### PUT `/admin/users/:id/roles` - `roles:write`

```json
{ "roleCodes": ["EDITOR"] }
```

---

## 11. Settings

### GET `/settings/public` - no auth; only `isPublic=true`  
### GET `/admin/settings` - `settings:write` or read perm  
### PUT `/admin/settings/:key`

```json
{ "value": 30, "valueType": "NUMBER", "description": "Max try-on session minutes", "isPublic": true }
```

---

## 12. Analytics (Admin)

### GET `/admin/analytics/overview`

```json
{
  "success": true,
  "data": {
    "range": { "from": "...", "to": "..." },
    "totals": {
      "tryOnSessions": 12040,
      "captures": 4521,
      "uniqueUsers": 3099,
      "publishedProducts": 180
    },
    "byJewelleryKind": [
      { "jewelleryKind": "EARRINGS", "sessions": 5200 }
    ],
    "topProducts": [
      { "productId": "uuid", "name": "...", "sessions": 800 }
    ]
  }
}
```

Query: `?from=&to=`

---

## 13. Audit Logs (Admin)

### GET `/admin/audit-logs` - `audit:read`

Filters: `actorUserId`, `entityType`, `entityId`, `action`, date range, pagination.

---

## 14. Health

### GET `/health` - liveness  
### GET `/health/ready` - DB + Redis + storage ping

---

## 15. Error Codes (selected)

| Code | HTTP |
|------|------|
| VALIDATION_ERROR | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| CONFLICT | 409 |
| RATE_LIMITED | 429 |
| PRODUCT_NOT_FOUND | 404 |
| ASSET_INACTIVE | 409 |
| CAPTURE_EXPIRED | 410 |
| STORAGE_ERROR | 502 |
| INTERNAL_ERROR | 500 |

---

## 16. Versioning & Compatibility

- Prefix `/api/v1`; breaking changes -> `/api/v2`
- OpenAPI exported in CI; `packages/api-client` regenerated on contract merge
- Engineers agree: **contract PR before** divergent frontend/backend feature PRs when shapes change

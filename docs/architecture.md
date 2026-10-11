# Architecture

Industrial ERP is a **modular monolith**: one NestJS API, one React SPA, one PostgreSQL database, Redis for cache/rate-limit/jobs, and S3-compatible storage for files.

## Why a modular monolith

The product needs strong transactional consistency (inventory ledgers, double-entry accounting, production consumption). Splitting those workflows across microservices would add distributed transactions without a measured scale need. Modules are isolated by folder, NestJS module boundaries, and Prisma model ownership. Extract a service later only when a module has an independent scaling or ownership requirement.

## System boundaries

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Web | React + Vite | Presentation, i18n, permission-aware UX |
| API | NestJS REST `/api/v1` | AuthN/Z, workflows, validation, OpenAPI |
| DB | PostgreSQL 16 | System of record |
| Cache / jobs | Redis + BullMQ | Rate limits, session denylist, async work |
| Files | MinIO / S3 | Attachments, exports, payslips |
| Proxy | Nginx | TLS termination, SPA routing, API reverse proxy |

The browser never receives database credentials or private API secrets. It talks only to the public API origin.

## Tenancy and authorization

- **Company** is the tenant. Business rows carry `companyId`.
- **Super Administrator** is platform-scoped and is created only by bootstrap or another super admin.
- Other roles are company-scoped and composed of `resource.action` permissions.
- Guards enforce authentication, then permission, then record-level company (and optional branch/warehouse) scope.
- Frontend hiding of actions is UX only.

## Authentication

- Argon2id password hashes.
- Short-lived access JWT in an HttpOnly cookie plus rotating refresh tokens stored hashed.
- Sessions can be revoked; refresh reuse detection revokes the family.
- Public registration always assigns the **Standard User** role and never Administrator.
- Bootstrap reads `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` and runs only when no Super Administrator exists.

## Ledgers and money

- Monetary values use PostgreSQL `NUMERIC` / Prisma `Decimal`. Application code must not use IEEE floats for money.
- Posted journal entries are immutable. Corrections use reversing entries.
- Inventory movements are append-only. `StockBalance` is a concurrency-controlled projection (`version` column).
- Multi-step workflows run in database transactions. Retryable writes accept idempotency keys.

## Module map

See `docs/modules.md` and the Prisma schema in `apps/api/prisma/schema.prisma`.

## Scalability posture

Stateless API instances behind a load balancer, connection pooling, indexed list queries, cursor pagination on large ledgers, background jobs for exports/reports, and Redis only for data that may be slightly stale or is ephemeral. Partitioning and read replicas are not enabled by default.

## Performance targets (to validate with load tests)

| Scenario | Target |
| --- | --- |
| Authenticated dashboard (cached 15s) | p95 < 300 ms |
| Paginated list (50 rows, indexed filters) | p95 < 200 ms |
| Stock issue / receipt transaction | p95 < 400 ms |
| Post balanced journal | p95 < 400 ms |
| Concurrent stock movements on same SKU | no negative stock unless allowed; no lost updates |

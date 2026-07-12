# Fastify Boilerplate — Architecture & Folder Structure Guide

> **Industry-standard Fastify + TypeScript boilerplate.**
> This document is the single source of truth for folder structure rules,
> naming conventions, and what belongs where.

---

## 📁 Complete Folder Structure

```
fasify_boilerplate/
│
├── prisma/
│   ├── schema.prisma          # Database schema (all models defined here)
│   ├── migrations/            # Auto-generated migration files — do NOT edit manually
│   └── generated/             # Auto-generated Prisma client — do NOT commit (in .gitignore)
│
├── src/
│   │
│   ├── app/                   # Bootstrap layer — app wiring only, no business logic
│   │   ├── app.ts             # Fastify instance creation + plugin registration
│   │   ├── server.ts          # Server startup, graceful shutdown, process signals
│   │   ├── register.ts        # Route registration (imports all module routes)
│   │   ├── env.ts             # Zod-validated environment variables (single source of truth)
│   │   └── logger.ts          # Application-wide pino logger instance
│   │
│   ├── core/                  # Framework-agnostic shared kernel — no Fastify imports here
│   │   ├── errors/
│   │   │   └── app.error.ts   # AppError base class + all HTTP error subclasses
│   │   ├── constants/
│   │   │   └── index.ts       # HTTP_STATUS, USER_TYPES, QUEUE_NAMES, CACHE_TTL, PAGINATION
│   │   ├── utils/
│   │   │   ├── response.ts    # successResponse<T>() and errorResponse() builders
│   │   │   ├── pagination.ts  # parsePagination(), getSkip(), buildPaginationMeta()
│   │   │   └── seed.ts        # Idempotent database seeding (admin user, initial data)
│   │   ├── types/
│   │   │   └── index.ts       # Shared cross-cutting TypeScript types + utility generics
│   │   └── decorators/        # Custom TypeScript/class decorators (reserved for future use)
│   │
│   ├── infrastructure/        # External service adapters — implementation details only
│   │   ├── prisma/
│   │   │   └── client.ts      # PrismaClient singleton (with PgAdapter connection pool)
│   │   ├── redis/
│   │   │   └── redis.ts       # IoRedis singleton + shared redisConnectionOptions for BullMQ
│   │   ├── auth/
│   │   │   └── better-auth.ts # Better Auth instance configuration (sessions, 2FA, OAuth)
│   │   ├── mail/
│   │   │   ├── transporter.ts # Nodemailer SMTP transporter setup
│   │   │   ├── mail.service.ts# MailService class — queues outbound emails via BullMQ
│   │   │   └── templates/     # EJS email templates (verify.ejs, reset-password.ejs)
│   │   ├── queues/
│   │   │   ├── email.queue.ts        # BullMQ Queue for outbound emails
│   │   │   ├── notification.queue.ts # BullMQ Queue for in-app notifications
│   │   │   └── payment.queue.ts      # BullMQ Queue for payment post-processing
│   │   ├── workers/
│   │   │   ├── email.worker.ts   # Processes mail-queue jobs (renders EJS, sends via SMTP)
│   │   │   └── payment.worker.ts # Processes payment-queue jobs (post-payment tasks)
│   │   ├── storage/
│   │   │   └── storage.ts     # Storage facade: Storage.disk('s3'|'local').put/get/delete/url
│   │   ├── payments/
│   │   │   └── stripe.ts      # Stripe SDK client + StripePaymentService class
│   │   └── socket/
│   │       ├── io.ts           # Socket.io server init + getIo() singleton accessor
│   │       └── redis-adapter.ts# Socket.io Redis pub/sub adapter (horizontal scaling)
│   │
│   ├── plugins/               # Fastify plugins — decorate the Fastify instance
│   │   ├── prisma.plugin.ts   # Decorates: fastify.prisma
│   │   ├── redis.plugin.ts    # Decorates: fastify.redis
│   │   ├── jwt.plugin.ts      # Decorates: fastify.authenticate (Better Auth session check)
│   │   ├── swagger.plugin.ts  # Registers Swagger UI at /api/docs
│   │   ├── socket.plugin.ts   # Decorates: fastify.io (Socket.io server)
│   │   └── stripe.plugin.ts   # Decorates: fastify.stripe, fastify.stripePaymentService
│   │
│   ├── modules/               # Feature modules — vertical slices of business logic
│   │   ├── auth/
│   │   │   ├── auth.route.ts       # Route definitions + Better Auth catch-all proxy
│   │   │   ├── auth.controller.ts  # Request/response handling only
│   │   │   ├── auth.service.ts     # Business logic (no HTTP concerns)
│   │   │   ├── auth.schema.ts      # Zod validation schemas for auth endpoints
│   │   │   └── auth.types.ts       # Module-local TypeScript interfaces
│   │   ├── users/
│   │   │   ├── user.route.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts  # Database access layer (Prisma queries)
│   │   │   └── user.schema.ts
│   │   ├── posts/             # Skeleton — follow users/ pattern to implement
│   │   ├── notifications/     # Skeleton — follow users/ pattern to implement
│   │   ├── chats/             # Skeleton — follow users/ pattern to implement
│   │   ├── payments/          # Skeleton — use fastify.stripePaymentService
│   │   └── admin/             # Skeleton — add permissionHook('admin') to all routes
│   │
│   ├── hooks/                 # Reusable Fastify preHandler functions
│   │   ├── auth.hook.ts       # Session validation — alternative to fastify.authenticate
│   │   └── permission.hook.ts # Role-based access — permissionHook('admin' | [...roles])
│   │
│   ├── middlewares/           # Fastify error handler + Express-compat middleware shims
│   │   ├── auth.middleware.ts # Express-style auth shim (prefer hooks for new code)
│   │   └── error.middleware.ts# Global error handler: AppError → ZodError → FastifyError → 500
│   │
│   ├── jobs/                  # BullMQ repeatable job schedulers (cron-like)
│   │   ├── email.job.ts       # Registers repeatable email jobs (daily digest, etc.)
│   │   └── payment.job.ts     # Registers repeatable payment jobs (renewal checks, etc.)
│   │
│   ├── docs/
│   │   └── swagger.ts         # Reusable OpenAPI schema builders + SWAGGER_TAGS constant
│   │
│   └── index.ts               # Entry point — calls startServer()
│
├── .env                       # Local secrets — never commit (in .gitignore)
├── .env.example               # Committed template — document all required vars here
├── .gitignore
├── .npmrc                     # pnpm config (allow-build for native packages)
├── .prettierrc                # Prettier formatting rules
├── docker-compose.yml         # Local dev services: Postgres, Redis, Prometheus, Grafana
├── eslint.config.js           # ESLint + TypeScript rules
├── package.json
├── prisma.config.ts           # Prisma CLI configuration
├── prometheus.yml             # Prometheus scrape config (for docker-compose)
├── tsconfig.json              # TypeScript compiler options (extends fastify-tsconfig)
└── folder_structure.txt       # Canonical folder map (do not change folder names)
```

---

## 📏 Rules & Conventions

### 1. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` | `user.service.ts` |
| Classes | `PascalCase` | `UserService` |
| Interfaces | `PascalCase` | `AuthUserPayload` |
| Functions/variables | `camelCase` | `buildPaginationMeta` |
| Constants (primitive) | `UPPER_SNAKE_CASE` | `QUEUE_NAMES.EMAIL` |
| DB table names | `snake_case` (plural) | `users`, `payment_transactions` |
| DB column names | `snake_case` | `created_at`, `user_id` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL` |

### 2. File Naming Pattern (modules)

Every module follows the same suffix pattern. Never abbreviate or rename suffixes:

```
{module}.route.ts        ← Route definitions only
{module}.controller.ts   ← Request parsing, response sending
{module}.service.ts      ← Business logic, orchestration
{module}.repository.ts   ← Database queries (Prisma)
{module}.schema.ts       ← Zod validation schemas
{module}.types.ts        ← TypeScript interfaces for this module
```

---

## 🗂️ What Goes Where — Folder Rules

### `src/app/`
**Rule:** Bootstrap and wiring only. Zero business logic here.

✅ Allowed:
- Fastify instance creation
- Plugin registration order
- Server startup/shutdown
- Environment variable loading
- Logger configuration

❌ NOT allowed:
- Database queries
- Business logic
- HTTP route handlers

---

### `src/core/`
**Rule:** Framework-agnostic shared code. Must NOT import from `fastify`, `prisma`, or any infrastructure module.

```
core/errors/     → All custom error classes (extend AppError)
core/constants/  → App-wide magic-free constants (no magic strings anywhere else)
core/utils/      → Pure utility functions (no side effects)
core/types/      → Cross-cutting TypeScript types and generics
core/decorators/ → TypeScript class decorators (future use)
```

**Why framework-agnostic?** Core logic is testable in isolation and reusable if the framework ever changes.

---

### `src/infrastructure/`
**Rule:** One file/folder per external service. Adapters only — no business logic.

```
prisma/     → PrismaClient instance (singleton)
redis/      → IoRedis instance + redisConnectionOptions export
auth/       → Better Auth configuration
mail/       → SMTP transporter + MailService (queues only, does not send directly)
queues/     → One BullMQ Queue per job type (uses shared redisConnectionOptions)
workers/    → One BullMQ Worker per queue (processes jobs)
storage/    → Storage.disk('s3'|'local') facade (S3Adapter + LocalAdapter)
payments/   → Stripe SDK client + StripePaymentService
socket/     → Socket.io server + Redis adapter
```

**Key rules:**
- Each queue uses `QUEUE_NAMES` constant — no hardcoded queue name strings
- All queues and workers import `redisConnectionOptions` from `redis/redis.ts` — never repeat the Redis config
- Workers use `process.cwd()` for file paths, not `__dirname`

---

### `src/plugins/`
**Rule:** Every Fastify plugin uses `fastify-plugin` (fp) wrapper. Each plugin decorates the instance with ONE concern.

```
prisma.plugin.ts  → fastify.prisma
redis.plugin.ts   → fastify.redis
jwt.plugin.ts     → fastify.authenticate
swagger.plugin.ts → /api/docs route
socket.plugin.ts  → fastify.io
stripe.plugin.ts  → fastify.stripe, fastify.stripePaymentService
```

**Key rules:**
- Always use `fp(async (fastify) => { ... })` wrapper
- Always declare types in `declare module 'fastify'` block inside the plugin file
- Register cleanup in `fastify.addHook('onClose', ...)` for connections (Prisma, Redis, Socket)

---

### `src/modules/`
**Rule:** One folder per feature. Each module is a vertical slice — route → controller → service → repository.

#### Data Flow (strictly one-way):
```
Route → Controller → Service → Repository → Database
```

- **Route** (`*.route.ts`): Defines HTTP method + path + preHandlers + schema. No logic.
- **Controller** (`*.controller.ts`): Parses `request`, calls service, sends response. No DB access.
- **Service** (`*.service.ts`): Business logic, orchestration, calls repository or other services. No HTTP.
- **Repository** (`*.repository.ts`): Only Prisma queries. Returns data, throws `AppError` on not found.
- **Schema** (`*.schema.ts`): Zod schemas for request body/query validation.
- **Types** (`*.types.ts`): Interfaces specific to this module.

**Key rules:**
- Controllers always use `successResponse()` from `core/utils/response.ts`
- Services throw `AppError` subclasses (not raw `Error`)
- Repositories return `null` for "not found" — services decide whether to throw
- Never import from another module's repository directly — go through its service

---

### `src/hooks/`
**Rule:** Standalone `preHandler` functions that can be attached to any route.

```
auth.hook.ts       → Validates session, sets request.user
permission.hook.ts → Checks request.user.type against required role(s)
```

Usage pattern (always chain auth before permission):
```typescript
{ preHandler: [fastify.authenticate, permissionHook('admin')] }
// OR
{ preHandler: [authHook, permissionHook(['admin', 'moderator'])] }
```

---

### `src/middlewares/`
**Rule:** Only the global error handler and Express-compatible shims live here.

```
error.middleware.ts → setErrorHandler() — handles AppError, ZodError, FastifyError
auth.middleware.ts  → Express-style shim (prefer hooks for new routes)
```

**Key rule:** The error handler is the ONLY place that calls `reply.status().send()` for errors. Everywhere else, throw an `AppError` subclass.

---

### `src/jobs/`
**Rule:** BullMQ repeatable job registrations (cron schedules). Called once at startup.

```
email.job.ts   → emailQueue.add(..., { repeat: { pattern: '...' }, jobId: 'stable-id' })
payment.job.ts → paymentQueue.add(..., { repeat: { pattern: '...' }, jobId: 'stable-id' })
```

**Key rule:** Always set a stable `jobId` in repeatable jobs — prevents duplicate job registration on server restart.

---

### `src/docs/`
**Rule:** Reusable OpenAPI/Swagger definitions only. No route logic.

```
swagger.ts → successSchema(), errorSchema(), paginatedSchema(), SWAGGER_TAGS, common responses
```

Every route `schema` block should import from here instead of repeating response shapes.

---

## 🚦 Error Handling Pattern

All errors must flow through the global error handler in `error.middleware.ts`.

```typescript
// ✅ Correct — throw AppError subclass anywhere
throw new NotFoundError('User not found');
throw new ForbiddenError('Admin access required');
throw new ValidationError('Invalid email format');

// ❌ Wrong — never do this in services or hooks
reply.status(404).send({ ... });
```

**Error class → HTTP status mapping:**

| Class | Status | Code |
|-------|--------|------|
| `BadRequestError` | 400 | `BAD_REQUEST` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `ValidationError` | 422 | `VALIDATION_ERROR` |
| `TooManyRequestsError` | 429 | `TOO_MANY_REQUESTS` |
| `InternalServerError` | 500 | `INTERNAL_SERVER_ERROR` |

---

## 📤 API Response Shape

Every endpoint must return one of these shapes (use the builders — never construct manually):

```typescript
// Success
import { successResponse } from '../core/utils/response';
reply.send(successResponse(data, 'Optional message'));
reply.send(successResponse(items, 'OK', paginationMeta));

// ─── JSON output ───────────────────────────────────────────────
{ "success": true, "data": { ... }, "message": "Optional message" }
{ "success": true, "data": [...], "meta": { "page": 1, "total": 50, ... } }

// Error (auto-generated by error.middleware.ts)
{ "success": false, "code": "NOT_FOUND", "message": "User not found" }
{ "success": false, "code": "VALIDATION_ERROR", "message": "...", "errors": [...] }
```

---

## 📦 Package Dependency Rules

| Category | Rule |
|----------|------|
| **Runtime deps** | Goes in `dependencies` — needed in production |
| **Dev-only tools** | Goes in `devDependencies` (TypeScript, ESLint, Prettier, pino-pretty, etc.) |
| **Type packages** | Always in `devDependencies` (`@types/*`) |
| **No magic packages** | Never add a package without using it in the codebase |

### Current Packages Explained

**dependencies (production):**

| Package | Purpose |
|---------|---------|
| `fastify` | Web framework |
| `fastify-plugin` | Plugin wrapper (non-encapsulated scope) |
| `@fastify/cors` | CORS headers |
| `@fastify/helmet` | Security headers |
| `@fastify/rate-limit` | Request rate limiting |
| `@fastify/multipart` | File upload / form-data parsing |
| `@fastify/sensible` | `reply.notFound()`, `reply.badRequest()` helpers |
| `@fastify/swagger` + `@fastify/swagger-ui` | OpenAPI docs at `/api/docs` |
| `better-auth` | Session-based authentication (sign-up, sign-in, 2FA, OAuth) |
| `@better-auth/prisma-adapter` | Better Auth ↔ Prisma bridge |
| `@prisma/client` + `@prisma/adapter-pg` | ORM + PostgreSQL driver adapter |
| `pg` | Native PostgreSQL driver (used by PrismaPg adapter) |
| `ioredis` | Redis client (caching, sessions, BullMQ) |
| `bullmq` | Job queues + workers (email, payments, notifications) |
| `@socket.io/redis-adapter` | Socket.io horizontal scaling adapter |
| `socket.io` | Real-time WebSocket server |
| `nodemailer` | SMTP email delivery |
| `ejs` | Email template rendering |
| `bcryptjs` | Password hashing (admin seed only — Better Auth handles user passwords) |
| `@aws-sdk/client-s3` | S3 / MinIO file storage |
| `stripe` | Payment processing |
| `pino` | Structured JSON logger |
| `dotenv` + `dotenv-expand` | `.env` file loading with variable interpolation |
| `zod` | Schema validation (env vars, request bodies) |

**devDependencies (build/dev only):**

| Package | Purpose |
|---------|---------|
| `typescript` | TypeScript compiler |
| `fastify-tsconfig` | Recommended TS config base for Fastify |
| `pino-pretty` | Pretty-print logs in development (disabled in production) |
| `concurrently` | Run `tsc -w` + `node --watch` in parallel during dev |
| `prisma` | Prisma CLI (`migrate`, `generate`, `studio`) |
| `eslint` + plugins | Code linting |
| `prettier` | Code formatting |
| `@types/*` | TypeScript type declarations |

---

## 🧪 Adding a New Module

Follow these steps exactly when creating a new feature (e.g., `products`):

```bash
# 1. Create the module folder
mkdir src/modules/products

# 2. Create all required files
touch src/modules/products/products.route.ts
touch src/modules/products/products.controller.ts
touch src/modules/products/products.service.ts
touch src/modules/products/products.repository.ts
touch src/modules/products/products.schema.ts
touch src/modules/products/products.types.ts

# 3. Register the route in src/app/register.ts
# import productsRoute from '../modules/products/products.route';
# fastify.register(productsRoute, { prefix: '/api/products' });
```

Implement each file in order: **types → schema → repository → service → controller → route**

---

## 🛠️ Development Commands

```bash
pnpm dev              # Start dev server (tsc -w + node --watch)
pnpm build            # Compile TypeScript → dist/
pnpm start            # Run production build
pnpm type-check       # TypeScript check without emitting files
pnpm lint             # ESLint with auto-fix
pnpm format           # Prettier format all src/ files

pnpm db:generate      # Generate Prisma client after schema changes
pnpm db:migrate       # Create + apply a new migration (dev)
pnpm db:migrate:deploy# Apply migrations in production (no prompts)
pnpm db:studio        # Open Prisma Studio GUI

docker compose up -d  # Start Postgres + Redis + Prometheus + Grafana
```

---

## ⚙️ Environment Variables

All env vars are validated by Zod in `src/app/env.ts`.
The app **exits immediately** on startup if any required variable is missing.

Copy `.env.example` → `.env` and fill in values before running.
Never commit `.env` — it is in `.gitignore`.
Always document new variables in `.env.example`.

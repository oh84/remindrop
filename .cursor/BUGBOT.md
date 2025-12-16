# Bugbot Rules for Remindrop

**Project Context:** Personal bookmark manager with AI summarization

**Architecture:**
- Frontend: Next.js 15 (Static Export) → CloudFront + S3
- Backend: Hono API → AWS Lambda + API Gateway
- Database: PostgreSQL (RDS)
- AI: Anthropic Claude Haiku

---

## Security-Critical Rules (Block PR)

### Authentication & Authorization

If any route handler is missing authentication checks:
- Add a blocking Bug titled "Missing authentication"
- Body: "All protected routes must verify userId from session token"
- Suggest: Add `app.use('*', authMiddleware)` before route handlers

If session cookies are missing security flags:
- Add a blocking Bug titled "Insecure session cookies"
- Body: "Session cookies must have HttpOnly, Secure, and SameSite=Lax flags"

If authorization checks are missing for resource access:
- Add a blocking Bug titled "Missing authorization check"
- Body: "Verify that `userId` matches the resource owner before allowing access"

### SQL Injection Prevention

If any database query uses string concatenation or template literals with user input:
- Add a blocking Bug titled "Potential SQL injection"
- Body: "Use Drizzle ORM parameterized queries. Never concatenate user input into SQL"
- Example: `db.select().from(table).where(eq(table.id, userId))`

### Input Validation

If API routes accept request bodies without Zod validation:
- Add a blocking Bug titled "Missing input validation"
- Body: "All API inputs must be validated with Zod schemas using @hono/zod-openapi"

If string inputs don't have max length constraints:
- Add a non-blocking Bug titled "Missing length validation"
- Body: "Add `.max()` constraints to prevent DoS attacks"

### Secrets Management

If hardcoded API keys, passwords, or tokens are found:
- Add a blocking Bug titled "Hardcoded secret detected"
- Body: "Move to environment variables immediately. This is a critical security issue"

If client-side code accesses server-only environment variables:
- Add a blocking Bug titled "Server secret exposed to client"
- Body: "Client code can only access env vars prefixed with NEXT_PUBLIC_"

If environment variables are used without validation:
- Add a non-blocking Bug titled "Unvalidated environment variable"
- Body: "Use Zod to validate env vars at startup: `envSchema.parse(process.env)`"

### XSS Prevention

If `dangerouslySetInnerHTML` is used without sanitization:
- Add a blocking Bug titled "XSS vulnerability"
- Body: "Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML"

If `eval()` or `Function()` constructor is used with user input:
- Add a blocking Bug titled "Code injection vulnerability"
- Body: "Never use eval() or Function() with untrusted data"

### Sensitive Data Exposure

If passwords, tokens, or API keys appear in logs or console statements:
- Add a blocking Bug titled "Sensitive data in logs"
- Body: "Remove passwords/tokens from logging. Only log user IDs"

If API responses include password hashes or session tokens:
- Add a blocking Bug titled "Sensitive data in API response"
- Body: "API responses must not include passwordHash, sessionToken, or other secrets"

---

## Important Issues (Request Changes)

### Rate Limiting

If `/api/summarize` or other AI endpoints lack rate limiting:
- Add a non-blocking Bug titled "Missing rate limit"
- Body: "AI endpoints should have rate limiting (e.g., 10 requests per hour per user) to prevent abuse and cost overruns"

### Error Handling

If catch blocks are empty or only log without handling:
- Add a non-blocking Bug titled "Silent error handling"
- Body: "Errors should be logged AND throw HTTPException with user-friendly messages"

### Database Performance

If a loop contains database queries (N+1 problem):
- Add a non-blocking Bug titled "N+1 query detected"
- Body: "Use joins or batch queries. Fetching records in a loop causes N+1 performance issues"

If list endpoints don't implement pagination:
- Add a non-blocking Bug titled "Missing pagination"
- Body: "Add limit/offset parameters to prevent loading too much data"

### Cryptography

If custom password hashing is implemented instead of using BetterAuth:
- Add a blocking Bug titled "Don't implement custom password hashing"
- Body: "Use BetterAuth's built-in password hashing. Never implement custom crypto"

If MD5, SHA1, or plain bcrypt is used directly:
- Add a blocking Bug titled "Weak password hashing"
- Body: "BetterAuth handles password hashing securely. Don't bypass it"

---

## Project-Specific Rules

### Static Export Constraints

If `middleware.ts` exists in the Next.js app:
- Add a blocking Bug titled "Middleware not supported"
- Body: "Next.js Static Export doesn't support middleware. Use client-side auth checks in layout components"

If API routes exist in `app/api/`:
- Add a blocking Bug titled "API routes not supported"
- Body: "Next.js Static Export doesn't support API Routes. All API calls must go to external Hono Lambda"

If dynamic routes (`[id]`) are used:
- Add a blocking Bug titled "Static Export doesn't support true dynamic routes"
- Body: "Use query params for dynamic content: `/bookmarks?id=123` instead of `/bookmarks/[id]`. Or pre-generate all possible paths with `generateStaticParams` (not practical for user-generated content)"

### Architecture (Bulletproof React)

If feature code imports directly from another feature's internals:
- Add a non-blocking Bug titled "Invalid feature import"
- Body: "Features must import from other features' index.ts only"
- Example: Use `@/features/bookmarks` not `@/features/bookmarks/components/X`

If relative imports are used instead of absolute paths:
- Add a non-blocking Bug titled "Use absolute imports"
- Body: "Use @/ alias for imports: `import { X } from '@/features/bookmarks'`"

### TypeScript

If `any` type is used:
- Add a blocking Bug titled "TypeScript 'any' type"
- Body: "Replace 'any' with proper types or 'unknown' + validation"

If function parameters lack type annotations:
- Add a non-blocking Bug titled "Missing type annotation"
- Body: "Add explicit types to function parameters for type safety"

### State Management

If Zustand is used for simple UI state:
- Add a non-blocking Bug titled "Unnecessary Zustand usage"
- Body: "Use useState for simple UI state. Reserve Zustand for complex cross-page state (not needed in MVP)"

If shareable state (filters, search) uses useState instead of URL params:
- Add a non-blocking Bug titled "Use URL params for shareable state"
- Body: "Filters and search queries should use URL params for bookmarkability and browser back/forward support"

---

## Testing Requirements

If the PR modifies files in `apps/api/**` and there are no changes in `**/*.test.*`:
- Add a non-blocking Bug titled "Missing API tests"
- Body: "Backend changes should include tests. Add unit tests for new API endpoints"
- Apply label "testing"

---

## Code Quality

If any changed file contains `/(?:^|\s)(TODO|FIXME)(?:\s*:|\s+)/`:
- Add a non-blocking Bug titled "TODO/FIXME comment found"
- Body: "Replace TODO/FIXME with a tracked issue reference (e.g., `TODO(#123): ...`) or remove it"

If components exceed 200 lines:
- Add a non-blocking Bug titled "Large component"
- Body: "Consider breaking this component into smaller, focused components"

If functions exceed 50 lines:
- Add a non-blocking Bug titled "Large function"
- Body: "Consider extracting logic into smaller, testable functions"

---

## Documentation

**This file defines security and code quality rules for automated PR reviews.**

For comprehensive development guidelines:
- **@AGENTS.md** - Development workflow, architecture patterns, coding standards
- **@docs/design.md** - System architecture, API specs, database schema
- **@docs/requirements.md** - Feature requirements and acceptance criteria
- **@docs/tasks.md** - Current work and project roadmap

---

**Last Updated:** 2024-12-16

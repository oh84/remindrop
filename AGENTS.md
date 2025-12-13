# AGENTS.md

> AI Coding Agent instructions for the Bookmark Management Application

## Project Overview

**Remindrop** is a personal bookmark management application with AI-powered summarization and daily email digests. The goal is to solve the problem of clipping articles but never reviewing them.

The name "Remindrop" combines "Remind" (daily reminders) + "drop" (like Raindrop.io, the inspiration).

**Tech Stack:**
- Frontend: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- Backend: Hono + @hono/zod-openapi (AWS Lambda), Node.js 24, Drizzle ORM
- Database: RDS PostgreSQL (db.t4g.micro)
- Browser Extension: Plasmo Framework
- Infrastructure: AWS CDK, CloudFront, S3, EventBridge, SES
- AI: Anthropic Claude Haiku (summarization & tagging)
- Monorepo: Turborepo + pnpm 10 workspaces

**Architecture Pattern:**
- Bulletproof React (feature-based architecture)
- Unidirectional data flow: shared → features → app
- Serverless backend with Lambda + API Gateway

---

## Essential Context Documents

Before starting ANY task, **ALWAYS read these documents first**:

1. **@docs/requirements.md** - Functional and non-functional requirements
2. **@docs/design.md** - System architecture, API design, database schema
3. **@docs/directory-structure.md** - Project structure and conventions
4. **@docs/tasks.md** - Development roadmap and task breakdown

These documents are the **single source of truth**. Reference them frequently.

---

## Repository Structure

```
remindrop/                    # Monorepo root
├── apps/
│   ├── web/                 # Next.js web app (main application)
│   ├── extension/           # Plasmo browser extension
│   └── api/                 # Hono API (AWS Lambda)
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── types/               # Shared TypeScript types
│   ├── db/                  # Drizzle schema & client
│   ├── config/              # ESLint, TypeScript configs
│   └── utils/               # Shared utilities
├── infra/                   # AWS CDK infrastructure code
├── docs/                    # Project documentation
└── scripts/                 # Build/deploy scripts
```

**Key Principle:** Code in `apps/` is application-specific. Code in `packages/` is shared across applications.

---

## Development Workflow

### When Starting a New Task

1. **Read Context First**
   - Check @docs/tasks.md to understand the task context
   - Review @docs/design.md for relevant architecture
   - Look at @docs/directory-structure.md for file placement

2. **Understand Before Coding**
   - List relevant files in the target directory
   - Study existing patterns and conventions
   - Identify dependencies and related code

3. **Plan Before Executing**
   - Outline the approach
   - Identify files to create/modify
   - Consider edge cases and error handling

4. **Implement Incrementally**
   - Start with types and interfaces
   - Build from bottom-up (utils → components → features → pages)
   - Test as you go

5. **Verify Quality**
   - Ensure TypeScript has no errors
   - Check ESLint and Prettier
   - Verify imports use absolute paths (@/)
   - Confirm barrel exports (index.ts) are updated

---

## Coding Standards

### TypeScript

**Rules:**
- Use TypeScript 5.x with strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and utility types
- Never use `any` - use `unknown` if type is truly unknown
- Use Zod for runtime validation at API boundaries

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

type UserRole = 'admin' | 'user';

// ❌ Bad
type User = {  // Should use interface
  id: string;
  email: string;
  name: string;
};

const data: any = await fetch();  // Never use any
```

### State Management Strategy

**Server State (API data):** React Query only
- All data from backend API
- Automatic caching, refetching, optimistic updates
- Example: bookmarks, tags, user settings

**Client State (UI):** Minimal approach
- **URL Params** for filters/pagination (preferred)
  - Shareable, bookmarkable, browser back/forward works
  - Use Next.js `useSearchParams` hook
- **useState** for local UI state
  - Modals, accordions, temporary form input
- **Zustand** (optional, use sparingly)
  - Only for complex cross-page UI state
  - Not needed in MVP

**Form State:** React Hook Form (if needed)

**Theme:** next-themes library

**Example - Search Filters:**
```typescript
// ✅ Preferred: URL Params
const searchParams = useSearchParams();
const query = searchParams.get('q') || '';

// ❌ Avoid: Zustand (unless URL params won't work)
const { query } = useSearchStore();
```

### Next.js (apps/web)

**Architecture: Bulletproof React**

**Feature Module Structure:**
```
src/features/bookmarks/
├── api/              # API client functions (React Query)
├── components/       # Feature-specific components
├── hooks/            # Feature-specific hooks
├── stores/           # State stores (optional, use sparingly)
├── types/            # Feature-specific types
├── utils/            # Feature-specific utilities
└── index.ts          # Public API (barrel export)
```

**Rules:**
- Every feature must have an `index.ts` that exports its public API
- Features cannot import from other features directly (except via their index.ts)
- Use absolute imports: `@/features/bookmarks` not `../bookmarks`
- Follow unidirectional data flow: shared → features → app
- Components should be server components by default (use "use client" only when necessary)

**Component Conventions:**
```typescript
// ✅ Good - Server Component
export function BookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  return (
    <div>
      {bookmarks.map(bookmark => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}

// ✅ Good - Client Component
'use client';

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  // ...
}
```

**Naming Conventions:**
- Components: PascalCase (e.g., `BookmarkCard.tsx`)
- Files: kebab-case for non-components (e.g., `use-bookmarks.ts`)
- Folders: kebab-case (e.g., `features/bookmarks`)

**React Query Usage:**
```typescript
// In features/bookmarks/api/get-bookmarks.ts
export const getBookmarks = async (params: GetBookmarksParams) => {
  const response = await apiClient.get('/api/bookmarks', { params });
  return response.data;
};

// In features/bookmarks/hooks/use-bookmarks.ts
export const useBookmarks = (params: GetBookmarksParams) => {
  return useQuery({
    queryKey: ['bookmarks', params],
    queryFn: () => getBookmarks(params),
  });
};
```

### Backend (apps/api)

**Hono + OpenAPI Best Practices:**
- Use `@hono/zod-openapi` for type-safe API definitions
- Define OpenAPI routes with `createRoute()`
- Use Zod schemas for request/response validation
- Keep routes thin - move logic to services
- Always use middleware for authentication
- Return consistent error responses

**OpenAPI Route Structure:**
```typescript
// routes/bookmarks.ts
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { authMiddleware } from '../middleware/auth';
import { bookmarkService } from '../services/bookmark-service';

// Define schemas
const BookmarkSchema = z.object({
  id: z.string().uuid().openapi({ example: 'uuid-v4' }),
  url: z.string().url().openapi({ example: 'https://example.com' }),
  title: z.string(),
  createdAt: z.string().datetime(),
});

const CreateBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

// Define route with OpenAPI spec
const createBookmarkRoute = createRoute({
  method: 'post',
  path: '/bookmarks',
  tags: ['Bookmarks'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBookmarkSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: BookmarkSchema,
        },
      },
      description: 'Bookmark created successfully',
    },
    400: {
      description: 'Invalid request',
    },
  },
});

// Implement route
const app = new OpenAPIHono();

app.use('*', authMiddleware);

app.openapi(createBookmarkRoute, async (c) => {
  const data = c.req.valid('json');
  const userId = c.get('userId');
  const bookmark = await bookmarkService.create(userId, data);
  return c.json(bookmark, 201);
});

export default app;
```

**Main App Setup:**
```typescript
// index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import bookmarks from './routes/bookmarks';

const app = new OpenAPIHono();

// Mount routes
app.route('/api/bookmarks', bookmarks);

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Remindrop API',
    description: 'Bookmark management API with AI features',
  },
});

// Swagger UI
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

export default app;
```

**Service Layer:**
- Services contain business logic
- Services should be pure functions when possible
- Handle errors at the service level
- Use transactions for multi-step operations

### Database (packages/db)

**Drizzle ORM Best Practices:**
- Define schema in `src/schema/`
- Use meaningful table and column names
- Always define indexes for foreign keys and frequently queried columns
- Use enums for status fields

**Example Schema:**
```typescript
// packages/db/src/schema/bookmarks.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const bookmarkStatusEnum = pgEnum('bookmark_status', [
  'processing',
  'completed',
  'failed',
]);

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  url: text('url').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  summary: text('summary'),
  status: bookmarkStatusEnum('status').notNull().default('processing'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('bookmarks_user_id_idx').on(table.userId),
  createdAtIdx: index('bookmarks_created_at_idx').on(table.createdAt),
}));
```

### Browser Extension (apps/extension)

**Plasmo Best Practices:**
- Keep the extension lightweight (minimize dependencies)
- Store auth tokens in Chrome storage
- Use message passing for background → content script communication
- Provide clear user feedback (toasts, notifications)

**Bundle Size Awareness:**
- Don't import @repo/ui (too heavy)
- Copy minimal components instead
- Use native fetch instead of heavy HTTP clients

### Styling (TailwindCSS)

**Rules:**
- Use Tailwind utility classes
- Create custom components for repeated patterns
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design

**Example:**
```typescript
import { cn } from '@/lib/utils';

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}
```

---

## Error Handling

### General Principles

1. **Fail Fast**: Validate inputs at the boundary (API, forms)
2. **Fail Gracefully**: Catch errors and provide user-friendly messages
3. **Fail Loudly**: Log all errors with context

### API Error Responses

**Standard Format:**
```typescript
{
  error: string;        // User-friendly message
  code: string;         // Error code (e.g., 'UNAUTHORIZED')
  details?: unknown;    // Optional additional context
}
```

### Frontend Error Handling

```typescript
// ✅ Good
try {
  await createBookmark(data);
  toast.success('Bookmark created');
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
    console.error(error);
  }
}
```

### Backend Error Handling

```typescript
// services/bookmark-service.ts
export const create = async (userId: string, data: CreateBookmarkInput) => {
  try {
    // Validate URL
    new URL(data.url);
  } catch {
    throw new BadRequestError('Invalid URL format');
  }

  try {
    const bookmark = await db.insert(bookmarks).values({
      userId,
      ...data,
    }).returning();
    
    return bookmark[0];
  } catch (error) {
    logger.error('Failed to create bookmark', { userId, error });
    throw new InternalServerError('Failed to create bookmark');
  }
};
```

---

## Testing

**Current Status:** MVP phase - manual testing is acceptable
**Future:** Add automated tests in Phase 5

**When tests are added:**
- Use Vitest for unit tests
- Use Playwright for E2E tests
- Test files should be colocated: `component.test.tsx`

---

## Environment Variables

**Pattern:**
- Never hardcode secrets
- Use `.env.example` as template
- Access via `process.env.VARIABLE_NAME`

**Naming Convention:**
- Backend: `DATABASE_URL`, `ANTHROPIC_API_KEY`
- Frontend (public): `NEXT_PUBLIC_API_URL`

**Example .env.local:**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/remindrop
ANTHROPIC_API_KEY=sk-...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Remindrop
```

---

## Git Workflow

### Commit Messages

Follow Conventional Commits:

```
feat: add bookmark deletion
fix: resolve search pagination bug
docs: update API documentation
refactor: extract bookmark service
chore: update dependencies
test: add bookmark creation tests
```

### Commit Granularity Rules

**CRITICAL: Keep commits small and focused**

#### The Golden Rule
**1 logical change = 1 commit**

#### Good Commit Granularity

```
✅ GOOD: Small, focused commits
1. feat(types): add Bookmark type definition
2. feat(db): add bookmarks table schema
3. feat(db): add bookmarks table indexes
4. feat(api): add POST /api/bookmarks endpoint
5. feat(api): add GET /api/bookmarks endpoint
6. test(api): add bookmark creation tests
7. docs: update design.md with bookmark API

Each commit:
- Is under 200 lines of changes
- Does ONE thing well
- Can be reviewed in < 5 minutes
- Can be reverted safely
```

```
❌ BAD: Large, unfocused commits
1. feat: implement entire bookmark feature (800 lines)

Problems:
- Hard to review
- Hard to revert
- Mixes multiple concerns
- Loses development history
```

#### Commit Size Guidelines

| Type | Max Lines | Max Files | Example |
|------|-----------|-----------|---------|
| Configuration | 50 | 3 | Add ESLint config |
| Type definition | 100 | 1-2 | Add Bookmark types |
| Database schema | 150 | 1 | Add bookmarks table |
| API endpoint | 200 | 3-4 | Add POST /api/bookmarks |
| Component | 200 | 2-3 | Add BookmarkCard component |
| Feature (complete) | N/A | N/A | Should be split into multiple commits |

#### What Goes in ONE Commit

**DO commit together:**
- ✅ File + its test
- ✅ Component + its styles (if in same file)
- ✅ Code change + related documentation update
- ✅ Schema + its migration file
- ✅ Type definition + Zod schema (if small)

**DON'T commit together:**
- ❌ Multiple API endpoints
- ❌ Multiple components
- ❌ Backend + Frontend changes (unless tiny)
- ❌ Feature + unrelated refactoring
- ❌ Multiple database tables

#### Commit Flow Examples

**Example 1: Adding a new API endpoint**
```bash
# Commit 1: Type definitions
git add packages/types/src/api/bookmarks.ts
git commit -m "feat(types): add bookmark API types"

# Commit 2: API client function
git add apps/web/src/features/bookmarks/api/get-bookmarks.ts
git commit -m "feat(api-client): add getBookmarks function"

# Commit 3: Service layer
git add apps/api/src/services/bookmark-service.ts
git commit -m "feat(api): add bookmark service layer"

# Commit 4: Route handler
git add apps/api/src/routes/bookmarks.ts
git commit -m "feat(api): add GET /api/bookmarks endpoint"

# Commit 5: Documentation
git add docs/design.md
git commit -m "docs: add bookmark API documentation"
```

**Example 2: Adding a new UI component**
```bash
# Commit 1: Component (display only)
git add apps/web/src/features/bookmarks/components/bookmark-card.tsx
git commit -m "feat(ui): add BookmarkCard component"

# Commit 2: Add interactions
git add apps/web/src/features/bookmarks/components/bookmark-card.tsx
git commit -m "feat(ui): add bookmark card click handler"

# Commit 3: Container component
git add apps/web/src/features/bookmarks/components/bookmark-list.tsx
git commit -m "feat(ui): add BookmarkList component"

# Commit 4: Integrate into page
git add apps/web/src/app/\(main\)/bookmarks/page.tsx
git commit -m "feat(page): integrate bookmark list"
```

**Example 3: Database schema**
```bash
# Commit 1: Schema definition
git add packages/db/src/schema/bookmarks.ts
git commit -m "feat(db): add bookmarks table schema"

# Commit 2: Generate migration
git add packages/db/migrations/0001_add_bookmarks.sql
git commit -m "feat(db): add bookmarks table migration"

# Commit 3: Update docs
git add docs/design.md
git commit -m "docs: update ER diagram with bookmarks table"
```

#### When to Split Commits

**If your commit:**
- Changes more than 5 files → Consider splitting
- Has more than 300 lines → Definitely split
- Mixes concerns (e.g., fix + feature) → Must split
- Can be described with "and" → Should split
  - ❌ "Add endpoint AND update UI"
  - ✅ "Add endpoint" + separate "Update UI"

#### When Commits Can Be Larger

**Acceptable exceptions (but still < 500 lines):**
- Initial project setup (package.json, configs)
- Large configuration files (tsconfig, eslint)
- Generated code (migrations, API clients)
- Bulk data imports (seed files)

Even for these, prefer splitting if possible:
```
Better:
1. chore: add base package.json
2. chore: add TypeScript config
3. chore: add ESLint config

Than:
1. chore: project setup (all configs)
```

### Branch Strategy

**Remindrop uses Git Flow with simplified branch structure**

#### Branch Types

```
main
  ├── dev (default branch for development)
  │   ├── feat/bookmark-crud
  │   ├── feat/ai-summarization
  │   ├── fix/search-pagination
  │   └── refactor/api-structure
  └── (direct hotfixes only)
```

#### Branch Naming Convention

**Format:** `<type>/<short-description>`

**Types:**
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks
- `docs/` - Documentation only
- `test/` - Test additions/fixes
- `perf/` - Performance improvements

**Examples:**
```
✅ Good:
- feat/bookmark-crud
- feat/browser-extension
- fix/search-pagination-bug
- refactor/api-error-handling
- chore/update-dependencies

❌ Bad:
- feature/bookmark (use 'feat')
- bookmark-feature (missing type)
- feat/add-bookmark-crud-api (too verbose)
- fix-bug (missing slash)
```

#### Branch Creation Rules

**ALWAYS create a feature branch for:**
- ✅ New features (any size)
- ✅ Bug fixes
- ✅ Refactoring
- ✅ Anything that takes > 1 commit

**Work directly on dev ONLY for:**
- ❌ Never! Always use branches

**Work directly on main ONLY for:**
- ❌ Never! Always PR from dev

#### Branch Workflow

**1. Starting a New Task**

```bash
# Always start from latest dev
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feat/bookmark-crud

# Make commits
git add .
git commit -m "feat(api): add POST /api/bookmarks"

# Continue working...
```

**2. During Development**

```bash
# Regular commits on feature branch
git add .
git commit -m "feat(api): add GET /api/bookmarks"

# Push to remote regularly
git push origin feat/bookmark-crud
```

**3. Keeping Branch Updated**

```bash
# Regularly sync with dev
git checkout dev
git pull origin dev
git checkout feat/bookmark-crud
git merge dev

# Or use rebase (preferred for cleaner history)
git checkout feat/bookmark-crud
git rebase dev
```

**4. Completing a Feature**

```bash
# Final push
git push origin feat/bookmark-crud

# Create PR: feat/bookmark-crud → dev
# After PR approval and merge, delete branch
git checkout dev
git pull origin dev
git branch -d feat/bookmark-crud
```

#### Branch Lifecycle Example

```
Day 1:
git checkout -b feat/bookmark-crud
→ 3 commits (types, schema, API)
→ git push

Day 2:
git pull origin dev (sync)
→ 2 commits (UI components)
→ git push

Day 3:
→ 1 commit (tests)
→ git push
→ Create PR
→ Merge to dev
→ Delete branch
```

#### Task-to-Branch Mapping

**1 Task = 1 Branch** (usually)

```
Task 3.1 "認証機能" → feat/authentication
  ├── Multiple commits
  └── Merge when complete

Task 3.2 "ブックマークCRUD" → feat/bookmark-crud
  ├── Multiple commits
  └── Merge when complete
```

**Exception: Large tasks can be split**

```
Task 5.1 "ブラウザ拡張機能"
  ├── feat/extension-setup
  ├── feat/extension-ui
  └── feat/extension-api-integration
```

#### AI Agent Branch Responsibility

**The AI agent MUST:**

1. **Prompt user to create branch before first commit**
   ```
   "Before implementing, please create a feature branch:
   
   Suggested:
   git checkout -b feat/bookmark-crud
   
   This task will require multiple commits, so a feature branch is appropriate."
   ```

2. **Suggest branch name based on task**
   ```
   User: "Implement bookmark CRUD API"
   
   Agent: "I'll help implement this. First, let's create a branch:
   git checkout -b feat/bookmark-crud
   
   Have you created the branch? Reply 'yes' to proceed."
   ```

3. **Check current branch before implementing**
   ```
   Agent: "Current branch: main
   
   ⚠️ Warning: You're on main. Should I:
   a) Stop and ask you to create a feature branch
   b) Suggest a branch name
   c) Continue anyway (not recommended)"
   ```

4. **Remind to push regularly**
   ```
   After 3-5 commits:
   "You've made 5 commits. Consider pushing to remote:
   git push origin feat/bookmark-crud"
   ```

5. **Suggest PR creation when task complete**
   ```
   "Task 3.2 is complete! Next steps:
   
   1. Push final commits:
      git push origin feat/bookmark-crud
   
   2. Create PR: feat/bookmark-crud → dev
   
   3. After merge, clean up:
      git checkout dev
      git pull
      git branch -d feat/bookmark-crud"
   ```

#### Branch Protection Rules (for GitHub/GitLab)

**Recommended settings:**

```
main branch:
- Require PR for all changes
- Require 1 approval (or 0 for solo project)
- Require status checks to pass
- No direct pushes

dev branch:
- Require PR for features
- Allow direct pushes for hotfixes (solo project)
- Require status checks to pass
```

#### Hotfix Workflow

**For urgent production fixes:**

```bash
# Create hotfix from main
git checkout main
git checkout -b fix/critical-bug

# Fix and commit
git commit -m "fix: resolve critical bug"

# Merge to main
git checkout main
git merge fix/critical-bug

# Also merge to dev
git checkout dev
git merge fix/critical-bug

# Delete branch
git branch -d fix/critical-bug
```

#### Branch Naming by Phase

**Phase 1 (Infrastructure):**
```
feat/monorepo-setup
feat/database-schema
feat/api-structure
chore/ci-cd-setup
```

**Phase 2 (Core Features):**
```
feat/authentication
feat/bookmark-crud
feat/ai-summarization
feat/search-filters
```

**Phase 3 (Extensions):**
```
feat/browser-extension
feat/daily-summary
feat/oauth-integration
```

#### Quick Reference

| Situation | Command |
|-----------|---------|
| Start new feature | `git checkout -b feat/feature-name` |
| Start bug fix | `git checkout -b fix/bug-name` |
| Sync with dev | `git checkout dev && git pull && git checkout - && git merge dev` |
| Push to remote | `git push origin branch-name` |
| Delete local branch | `git branch -d branch-name` |
| Delete remote branch | `git push origin --delete branch-name` |

---

## Git Workflow

**The AI agent MUST:**

1. **Suggest appropriate commit granularity** before implementing
   ```
   "I'll implement this in 3 commits:
   1. Type definitions
   2. API endpoint
   3. Documentation"
   ```

2. **Stop and ask** if a task requires > 5 commits
   ```
   "This feature needs 8 commits. Should I:
   a) Implement all 8 steps
   b) Implement first 3, then pause
   c) Break into smaller subtasks"
   ```

3. **Provide commit message** for each change
   ```
   Suggested commit:
   feat(api): add POST /api/bookmarks endpoint
   
   - Implement bookmark creation logic
   - Add Zod validation
   - Add error handling
   ```

4. **Never commit unrelated changes together**
   - If you fixed a bug while implementing a feature
   - Make 2 commits: bug fix first, then feature

5. **Update documentation in related commits**
   - Small doc updates → Include in code commit
   - Large doc updates → Separate commit

### Human Responsibility

**You should:**
- Review each commit before accepting
- Ask agent to split if too large
- Request commit message changes if unclear
- Verify documentation is updated

**Example interaction:**
```
You: This commit seems large (400 lines). Can you split it?

Agent: You're right! I'll split into:
1. Schema definition (100 lines)
2. Service layer (150 lines)  
3. Route handlers (150 lines)

Shall I proceed?
```

---

## Git Workflow

### Commit Messages

Follow Conventional Commits:

```
feat: add bookmark deletion
fix: resolve search pagination bug
docs: update API documentation
refactor: extract bookmark service
chore: update dependencies
test: add bookmark creation tests
```

### Branch Strategy

- `main`: Production-ready code
- `dev`: Development branch
- Feature branches: `feat/bookmark-tags`, `fix/search-bug`

---

## AWS CDK (Infrastructure)

**Location:** `infra/`

**Rules:**
- Define all infrastructure as code
- Use CDK constructs for reusability
- Separate dev and prod stacks
- Always tag resources for cost tracking

**Example:**
```typescript
const api = new lambda.Function(this, 'ApiFunction', {
  runtime: lambda.Runtime.NODEJS_24_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('apps/api/dist'),
  environment: {
    DATABASE_URL: dbSecret.secretValueFromJson('url').toString(),
  },
});
```

---

## Performance Guidelines

### Database
- Use indexes on foreign keys and frequently queried columns
- Avoid N+1 queries (use joins or batch queries)
- Limit query results (pagination)

### Frontend
- Use React Server Components for non-interactive content
- Lazy load heavy components
- Optimize images (use Next.js Image component)
- Minimize JavaScript bundle size

### API
- Keep Lambda functions small and focused
- Use CloudFront caching where appropriate
- Implement rate limiting for public endpoints

---

## Security Checklist

- ✅ All API endpoints require authentication
- ✅ User data is isolated (can only access own bookmarks)
- ✅ HTTPS everywhere (CloudFront + ACM)
- ✅ Passwords are hashed (BetterAuth handles this)
- ✅ Input validation at API boundaries (Zod)
- ✅ SQL injection protected (Drizzle ORM parameterized queries)
- ✅ XSS protection (React escapes by default)
- ✅ CORS configured correctly

---

## AI Agent Behavior Guidelines

### When Writing Code

**DO:**
- Read the documentation (@docs/*) before starting
- Follow existing patterns in the codebase
- Use absolute imports (@/)
- Update barrel exports (index.ts)
- Write TypeScript with proper types
- Handle errors gracefully
- Keep functions small and focused
- Add comments for complex logic

**DON'T:**
- Create files in random locations - follow directory-structure.md
- Use relative imports for non-adjacent files
- Ignore TypeScript errors
- Skip error handling
- Create duplicate code (DRY principle)
- Bypass authentication middleware
- Hardcode sensitive data

### When Stuck or Uncertain

1. Check the documentation first
2. Look for similar examples in the codebase
3. Ask clarifying questions before proceeding
4. Break down complex tasks into smaller steps

### When Making Architectural Decisions

1. Refer to @docs/design.md
2. Consider scalability and maintainability
3. Follow established patterns
4. Propose alternatives if the current approach seems suboptimal

---

## Common Patterns

### Creating a New Feature

1. Create feature directory in `apps/web/src/features/[feature-name]/`
2. Set up subdirectories: `api/`, `components/`, `hooks/`, `types/`
3. Define types in `types/index.ts`
4. Create API clients in `api/`
5. Build components in `components/`
6. Create custom hooks in `hooks/`
7. Export public API in `index.ts`
8. Add routes in `apps/web/src/app/`

### Adding an API Endpoint

1. Define Zod schema for request/response
2. Add route in `apps/api/src/routes/`
3. Implement business logic in `apps/api/src/services/`
4. Add authentication middleware
5. Handle errors appropriately
6. Update API documentation

### Creating a Shared Component

1. Add to `packages/ui/src/components/`
2. Use TypeScript and TailwindCSS
3. Make it reusable and configurable
4. Export from `packages/ui/src/index.ts`

---

## Troubleshooting

### TypeScript Errors
- Run `pnpm type-check` from root
- Check for missing types in `packages/types`
- Ensure dependencies are installed

### Build Errors
- Run `pnpm clean` then `pnpm install`
- Check Turborepo cache: `turbo run build --force`
- Verify environment variables

### Database Issues
- Check connection string in .env
- Run migrations: `cd packages/db && pnpm migrate`
- Verify RDS security group allows connections

### API Issues
- Check CloudWatch logs
- Verify Lambda environment variables
- Check IAM permissions

---

## Current Phase: MVP (Phase 1-2)

**Focus Areas:**
- Infrastructure setup (AWS CDK)
- Database schema (Drizzle)
- Authentication (BetterAuth)
- Core bookmark CRUD
- LLM integration (summarization & tagging)
- Basic Next.js UI

**Deferred:**
- Comprehensive testing
- Advanced UI polish
- OAuth (comes in Phase 5)
- Mobile apps
- Public collections

---

## Quick Reference

**Run Commands:**
```bash
# Development
pnpm dev                          # Start all apps
pnpm dev --filter web             # Start Next.js only
pnpm dev --filter api             # Start Hono API only

# Build
pnpm build                        # Build all apps
pnpm build --filter web           # Build Next.js only

# Lint & Format
pnpm lint                         # Lint all code
pnpm format                       # Format all code

# Database
cd packages/db
pnpm migrate                      # Run migrations
pnpm studio                       # Open Drizzle Studio

# Infrastructure
cd infra
pnpm cdk deploy                   # Deploy to AWS
pnpm cdk diff                     # Show changes
```

**Key Files to Reference:**
- Type definitions: `packages/types/src/`
- DB schema: `packages/db/src/schema/`
- API routes: `apps/api/src/routes/`
- Next.js features: `apps/web/src/features/`

---

## Documentation Maintenance

### Living Documentation Principle

**All documentation in this project is LIVING and must be kept up-to-date.**

### When to Update Documentation

**ALWAYS update documentation when:**

1. **Architecture changes**
   - Added/removed a service or component
   - Changed database schema
   - Modified API endpoints
   - → Update @docs/design.md

2. **Requirements change**
   - Feature scope changed
   - New non-functional requirements
   - → Update @docs/requirements.md

3. **Task completed or modified**
   - Mark task as done in @docs/tasks.md
   - Add new subtasks if discovered
   - Update time estimates if off
   - → Update @docs/tasks.md

4. **Directory structure changes**
   - Added new app or package
   - Changed folder organization
   - → Update @docs/directory-structure.md

5. **Development workflow changes**
   - New tools added
   - Changed coding standards
   - → Update AGENTS.md

6. **Feature completion**
   - Mark feature as complete in README.md roadmap
   - → Update README.md

### How to Update Documentation

**Step 1: Make the code change**
```bash
# Example: Add new API endpoint
```

**Step 2: Immediately update relevant docs**
```markdown
# In docs/design.md
## 3.X New Endpoint

### POST /api/bookmarks/:id/share
...
```

**Step 3: Commit both together**
```bash
git add .
git commit -m "feat: add bookmark sharing API

- Implemented POST /api/bookmarks/:id/share
- Updated docs/design.md with new endpoint"
```

### Documentation Update Checklist

Before completing ANY task, ask yourself:

- [ ] Does this change affect the architecture? → Update design.md
- [ ] Does this change requirements? → Update requirements.md
- [ ] Did I complete a task? → Update tasks.md
- [ ] Did I add/modify files? → Update directory-structure.md if significant
- [ ] Did I change workflow? → Update AGENTS.md
- [ ] Did I complete a roadmap item? → Update README.md

### AI Agent Responsibility

**When making changes, the AI agent MUST:**

1. **Proactively identify** which documentation needs updating
2. **Propose updates** to the relevant documentation
3. **Create a checklist** of documentation changes needed
4. **Update documentation** in the same response/commit as code changes

**Example Response:**
```
I've implemented the bookmark sharing feature. Here are the changes:

CODE CHANGES:
- Added POST /api/bookmarks/:id/share endpoint
- Added share button to BookmarkCard component

DOCUMENTATION UPDATES:
✅ docs/design.md - Added API endpoint documentation
✅ docs/requirements.md - Added sharing to Phase 3 features
✅ tasks.md - Marked Task 8.3 as complete

All documentation is now up-to-date.
```

### Documentation Sync Check

**Every week (or every 5-10 commits), verify documentation sync:**

```bash
# Review if docs match current state
git log --oneline -10
# Check each commit - was documentation updated?
```

**Red flags:**
- ❌ 10+ commits without any documentation updates
- ❌ New files/folders not documented
- ❌ Completed tasks not marked in tasks.md

### Documentation Quality Standards

**Good documentation:**
- ✅ Up-to-date with current code
- ✅ Includes examples and diagrams
- ✅ Explains "why" not just "what"
- ✅ Has clear action items and decisions

**Bad documentation:**
- ❌ Outdated or contradicts code
- ❌ Vague or ambiguous
- ❌ Missing important decisions
- ❌ No examples

---

## Remember

> This is a personal project with a clear goal: make it easy to review clipped articles at the end of each day.

**Core Principles:**
- **Simplicity over complexity** - Choose the straightforward solution
- **User experience first** - Everything should feel fast and effortless
- **Bulletproof architecture** - Follow proven patterns for maintainability
- **Type safety** - TypeScript everywhere, no shortcuts
- **Documentation** - Keep docs updated as the project evolves

When in doubt, refer to the documentation. Good luck! 🚀

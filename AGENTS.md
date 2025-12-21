# AGENTS.md

> AI Coding Agent instructions for Remindrop

## Project Context

**Remindrop** is a personal bookmark manager with AI-powered summarization and daily email digests.

**Tech Stack:**
- Frontend: Next.js 15 (Static Export), React 19, TypeScript, TailwindCSS
- Backend: Hono (AWS Lambda), Node.js 24, Drizzle ORM
- Database: PostgreSQL (Local dev → AWS RDS)
- AI: Anthropic Claude Haiku
- Monorepo: Turborepo + pnpm 10

**Critical Constraints:**
- Next.js uses Static Export (no SSR/ISR/Middleware/API Routes)
- Client-side authentication only (BetterAuth)
- All API calls go to external Hono Lambda
- Bulletproof React architecture (feature-based)

**Current Phase:** MVP Development (Phase 2)
- Focus: Core features (auth, bookmark CRUD, AI summarization)
- Testing: Manual testing is acceptable
- Performance: Optimize later, prioritize functionality

---

## Essential Documents

**Before starting ANY task:**
- **@docs/tasks.md** - Current work and roadmap
- **@docs/design.md** - System architecture, API specs, database schema
- **@docs/requirements.md** - Feature requirements

**For code quality and security:**
- **@.cursor/BUGBOT.md** - Security rules and code review checklist
- **This file (AGENTS.md)** - Development guidelines and patterns

---

## Priority Rules

### 1. Security (Highest Priority)

**Authentication & Authorization:**
- Always verify `userId` from session token
- Apply `authMiddleware` to all protected routes
- Check resource ownership before allowing access
- BetterAuth handles session security automatically

**Input Validation:**
- All API inputs must use Zod validation via `@hono/zod-openapi`
- Never trust user input
- Enforce max length on all string inputs

**SQL Injection Prevention:**
- Use Drizzle ORM only (parameterized queries)
- Never concatenate user input into queries

**Secrets Management:**
- Never hardcode API keys, passwords, or tokens
- Server secrets: normal env vars (validate with Zod at startup)
- Client env vars: must have `NEXT_PUBLIC_` prefix

**XSS Prevention:**
- Rely on React's automatic escaping
- If using `dangerouslySetInnerHTML`, sanitize with DOMPurify
- Never use `eval()` or `Function()` with user input

**Sensitive Data:**
- Never log passwords, tokens, or session IDs
- Never include sensitive data in API responses

> **Note:** @.cursor/BUGBOT.md contains the complete security checklist for code reviews.

---

### 2. Architecture

**Bulletproof React (apps/web):**
```
src/features/bookmarks/
├── api/          # React Query functions
├── components/   # Feature components
├── hooks/        # Feature hooks
└── index.ts      # Public API (barrel export)
```

**Rules:**
- Features export via `index.ts` only
- Import from features: `@/features/bookmarks` not `@/features/bookmarks/components/X`
- Use `@/` absolute imports, never relative paths across features
- Unidirectional flow: shared → features → app

**Static Export Constraints:**
- ❌ No middleware.ts (doesn't work)
- ❌ No API Routes in app/api/ (doesn't work)
- ❌ No SSR/getServerSideProps (doesn't work)
- ✅ Client-side auth checks in layouts
- ✅ Query params instead of dynamic routes (`/bookmarks?id=123`)

---

### 3. TypeScript

**Rules:**
- Strict mode always enabled
- `interface` for object shapes, `type` for unions
- Never use `any` - use `unknown` + validation
- Explicit function parameter types
- Zod for runtime validation

**Examples:**
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

type UserRole = 'admin' | 'user';

const data: unknown = await fetch();
const user = UserSchema.parse(data);

// ❌ Bad
type User = { id: string }; // Should use interface
const data: any = await fetch(); // Never use any
```

---

### 4. State Management

**Server State:** React Query only
- All API data (bookmarks, tags, settings)
- Automatic caching and refetching

**Client State:**
- **URL Params** for shareable state (filters, search, pagination)
- **useState** for local UI state (modals, forms)
- **Zustand** only if essential (not needed in MVP)

**Example:**
```typescript
// ✅ Good - URL params for filters
const searchParams = useSearchParams();
const query = searchParams.get('q') || '';

// ✅ Good - useState for modals
const [isOpen, setIsOpen] = useState(false);

// ❌ Avoid - Zustand for simple state
const { isOpen } = useModalStore();
```

---

### 5. API Design (Hono)

**OpenAPI with Zod:**
```typescript
import { createRoute, z } from '@hono/zod-openapi';

const CreateBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().max(200),
});

const route = createRoute({
  method: 'post',
  path: '/bookmarks',
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
    201: { /* ... */ },
    400: { description: 'Invalid input' },
    401: { description: 'Unauthorized' },
  },
});

app.openapi(route, async (c) => {
  const userId = c.get('userId'); // Required
  const data = c.req.valid('json'); // Auto-validated
  // ...
  return c.json(bookmark, 201);
});
```

**Rules:**
- Use `@hono/zod-openapi` for all routes
- Validate all inputs with Zod
- Always check authentication
- Return proper HTTP status codes
- Consistent error responses (HTTPException)

---

### 6. Database (Drizzle ORM)

**Schema Definition:**
```typescript
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  url: text('url').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('bookmarks_user_id_idx').on(table.userId),
}));
```

**Query Rules:**
- Use Drizzle ORM only (never raw SQL)
- Add indexes on frequently queried columns
- Use joins to avoid N+1 queries
- Use transactions for related operations

**Example:**
```typescript
// ✅ Good - Join to avoid N+1
const bookmarksWithTags = await db
  .select()
  .from(bookmarks)
  .leftJoin(tags, eq(bookmarks.id, tags.bookmarkId))
  .where(eq(bookmarks.userId, userId));

// ❌ Bad - N+1 query
for (const bookmark of bookmarks) {
  const tags = await db.select().from(tags).where(eq(tags.bookmarkId, bookmark.id));
}
```

---

## Development Workflow

### Starting a Task

1. **Read documentation first**
   - @docs/tasks.md for current task context
   - @docs/design.md for architecture and API specs
   - Check existing code patterns in the codebase

2. **Create feature branch**
   - Always work on a feature branch, never on `main`
   - Use naming convention: `feat/feature-name`, `fix/bug-name`

3. **Plan before coding**
   - Outline the approach
   - Identify files to create/modify
   - Consider security implications

4. **Code incrementally**
   - Make small, focused commits (~200 lines)
   - Test as you go
   - Keep TypeScript errors at zero

5. **Verify quality**
   - Run `pnpm type-check` (TypeScript)
   - Run `pnpm lint` (ESLint)
   - Check @.cursor/BUGBOT.md for common issues
   - Update documentation if needed

### Git Workflow

**Branch Strategy:**
```
main (production-ready code)
  ├── feat/bookmark-crud
  ├── feat/authentication
  ├── fix/search-bug
  └── refactor/api-structure
```

**Note:** This is a personal project using a simplified workflow. All feature branches are created from and merged back to `main`.

**Branch Naming:**
- Format: `<type>/<short-description>`
- Types: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`
- Always create feature branch for new work

**Commits:**
- Format: `<type>: <description>`
- Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- Keep commits small (1 logical change)
- Aim for ~200 lines or less per commit

**Examples:**
```bash
feat: add bookmark create API endpoint
fix: resolve pagination bug in bookmark list
refactor: extract bookmark validation logic
```

---

## Component Guidelines

**Server vs Client Components:**
```typescript
// ✅ Server Component (default)
export function BookmarkList({ bookmarks }: { bookmarks: Bookmark[] }) {
  return <div>{/* render */}</div>;
}

// ✅ Client Component (when needed)
'use client';
export function SearchBar() {
  const [query, setQuery] = useState('');
  // Uses hooks/state
}
```

**Naming:**
- Components: PascalCase (`BookmarkCard.tsx`)
- Hooks: camelCase with `use` prefix (`use-bookmarks.ts`)
- Utils: camelCase (`format-date.ts`)

**Size:**
- Components: aim for <200 lines
- Functions: aim for <50 lines
- Break down large files into smaller modules

---

## Error Handling

**Always handle errors:**
```typescript
// ✅ Good
try {
  await createBookmark(data);
} catch (error) {
  console.error('Failed to create bookmark:', error);
  throw new HTTPException(500, { 
    message: 'ブックマークの作成に失敗しました' 
  });
}

// ❌ Bad - Silent failure
try {
  await createBookmark(data);
} catch (error) {
  // Empty catch
}
```

**API Error Responses:**
- Use HTTPException with proper status codes
- Provide user-friendly error messages
- Log errors server-side
- Never expose sensitive details in error messages

---

## Performance

**React Query:**
```typescript
// Query key factory
export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...bookmarkKeys.all, 'list'] as const,
  list: (filters: BookmarkFilters) => [...bookmarkKeys.lists(), filters] as const,
};

// Mutation with invalidation
const mutation = useMutation({
  mutationFn: createBookmark,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
  },
});
```

**Optimizations:**
- Use `useMemo` for expensive computations
- Use `useCallback` for event handlers passed as props
- Use `React.memo` for pure components
- Implement pagination on list endpoints

---

## Testing

**Focus on:**
- API endpoint tests (input validation, auth, business logic)
- Utility function tests
- Complex component logic tests

**Not required for:**
- Simple presentational components
- Trivial utility functions

---

## Common Patterns

### Protected Route (Client-side)
```typescript
'use client';
export function ProtectedLayout({ children }) {
  const { data: session, isPending } = useSession();
  
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending]);
  
  if (isPending) return <LoadingSpinner />;
  if (!session) return null;
  
  return <div>{children}</div>;
}
```

### API Client with React Query
```typescript
// api/get-bookmarks.ts
export const getBookmarks = async (params: GetBookmarksParams) => {
  const res = await fetch(`${API_URL}/bookmarks?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

// hooks/use-bookmarks.ts
export const useBookmarks = (params: GetBookmarksParams) => {
  return useQuery({
    queryKey: bookmarkKeys.list(params),
    queryFn: () => getBookmarks(params),
  });
};
```

### Zod Schema with OpenAPI
```typescript
export const CreateBookmarkSchema = z.object({
  url: z.string().url().openapi({ example: 'https://example.com' }),
  title: z.string().max(200).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>;
```

---

## Quick Reference

**When to use what:**
- Server state → React Query
- Shareable state (filters) → URL params
- Local UI state → useState
- Global UI state → Zustand (only if essential)
- Form validation → Zod
- API validation → @hono/zod-openapi
- Database queries → Drizzle ORM
- Authentication → BetterAuth (client-side check)

**File imports:**
- Feature imports: `@/features/bookmarks`
- Shared imports: `@/shared/components/ui/button`
- Never use relative imports across features

**Folder structure:**
- Apps: `apps/web`, `apps/api`, `apps/extension`
- Packages: `packages/ui`, `packages/types`, `packages/db`
- Features: `apps/web/src/features/bookmarks/`

---

**Last Updated:** 2024-12-16

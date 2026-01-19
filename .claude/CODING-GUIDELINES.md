# Coding Guidelines

Standards to follow for all code changes. These prevent common issues and maintain code quality.

---

## General Rules

### File Size Limits
- **Maximum 400 lines per file**
- If approaching limit, split into multiple files by responsibility
- Each file should have a single, clear purpose

### Before Committing
- Run `npm run lint` and fix all warnings
- Run `npm run build` and ensure it passes
- Remove all unused code (imports, variables, functions)
- No `TODO` comments without a task reference
- No `console.log` statements in production code

---

## TypeScript/React Rules

### Imports
```typescript
// BAD - unused imports
import { useState, useEffect, useCallback } from 'react';
// only useState is used

// GOOD - only import what you use
import { useState } from 'react';
```

### Variables
```typescript
// BAD - declared but never used
const handleClick = () => { ... };
// handleClick never referenced

// GOOD - remove or use it
```

### Props
```typescript
// BAD - destructure unused props
const Component = ({ data, onChange, onDelete }: Props) => {
  return <div>{data}</div>; // onChange, onDelete unused
};

// GOOD - only destructure what you use
const Component = ({ data }: Props) => {
  return <div>{data}</div>;
};
```

### Pre-Commit Checklist
```bash
npm run lint          # Zero errors, zero warnings
npm run build         # Build must pass
```

---

## API Calls & TanStack Query (CRITICAL)

**These rules prevent performance issues and API errors.**

### Rule 1: NEVER Make Direct API Calls in useEffect

```typescript
// BAD - Direct API call bypasses caching
useEffect(() => {
  if (!orgId) return;
  resourcesApi.getAll(orgId).then(setData);
}, [orgId]);

// GOOD - Use TanStack Query hook for caching
const { data } = useResources(orgId);
```

### Rule 2: Always Use Query Hooks

Before making any API call, check if a hook already exists:

```typescript
// Check src/hooks/queries/ for existing hooks

// If no hook exists, CREATE ONE:
export function useMyData(id: string | undefined) {
  return useQuery({
    queryKey: ['mydata', id],
    queryFn: () => api.getData(id!),
    enabled: !!id,
  });
}
```

### Rule 3: Use Targeted Query Invalidation

```typescript
// BAD - Invalidates ALL queries
queryClient.invalidateQueries({ queryKey: ['resources'] });

// GOOD - Invalidate specific query
queryClient.invalidateQueries({
  queryKey: ['resources', specificId],
});
```

---

## Component Resilience (CRITICAL)

**These rules prevent crashes when APIs fail.**

### Rule 1: ALWAYS Handle Loading, Error, and Empty States

```typescript
// BAD - Crashes if data is undefined
function ResourceList() {
  const { data } = useResources();
  return data.map(r => <Card>{r.name}</Card>);  // TypeError!
}

// GOOD - Handle all states
function ResourceList() {
  const { data, isLoading, isError, error, refetch } = useResources();

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        {error?.message || 'Failed to load'}
        <Button onClick={() => refetch()}>Retry</Button>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return <div>No resources found</div>;
  }

  return data.map(r => <Card key={r.id}>{r.name}</Card>);
}
```

### Rule 2: Defensive Data Access

```typescript
// BAD - Crashes on undefined
return data.items.map(item => <Item {...item} />);

// GOOD - Optional chaining
return data?.items?.map(item => <Item {...item} />) ?? null;

// BETTER - Explicit guard
if (!data?.items?.length) {
  return <EmptyState />;
}
return data.items.map(item => <Item key={item.id} {...item} />);
```

### Required State Handling Pattern

Every component using `useQuery` MUST follow this:

```typescript
function MyComponent() {
  const query = useMyData(id);

  // 1. Loading state
  if (query.isLoading) {
    return <LoadingSkeleton />;
  }

  // 2. Error state
  if (query.isError) {
    return <ErrorCard error={query.error} onRetry={query.refetch} />;
  }

  // 3. Empty/null state
  if (!query.data) {
    return <EmptyState />;
  }

  // 4. Success state - safe to access data
  return <DataDisplay data={query.data} />;
}
```

---

## Authentication Rules

### Always Use Clerk Auth Hook

```typescript
// BAD - Using deprecated Supabase auth
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

// GOOD - Using Clerk auth
import { useClerkAuth } from "@/hooks/use-clerk-auth";
```

### Protect Routes

```typescript
// All authenticated routes must use ClerkProtectedRoute
<Route element={<ClerkProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

---

## shadcn/ui Component Usage

### Always Use shadcn Components

```typescript
// BAD - Custom button
<button className="bg-blue-500 px-4 py-2 rounded">Click</button>

// GOOD - shadcn button
import { Button } from "@/components/ui/button";
<Button>Click</Button>
```

### Common Components to Use

| Need | Component |
|------|-----------|
| Buttons | `Button` from `@/components/ui/button` |
| Forms | `Form`, `FormField`, `FormItem` from `@/components/ui/form` |
| Inputs | `Input` from `@/components/ui/input` |
| Cards | `Card`, `CardContent`, `CardHeader` from `@/components/ui/card` |
| Dialogs | `Dialog`, `DialogContent` from `@/components/ui/dialog` |
| Dropdowns | `DropdownMenu` from `@/components/ui/dropdown-menu` |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger` from `@/components/ui/tabs` |
| Loading | `Skeleton` from `@/components/ui/skeleton` |
| Notifications | `toast` from `sonner` |

---

## File Organization

### When to Split Files

| Lines | Action |
|-------|--------|
| < 200 | Fine as-is |
| 200-400 | Consider splitting if multiple responsibilities |
| > 400 | **Must split** |

### Split by Responsibility

```
// Instead of one large Component.tsx (500+ lines)
components/
├── Feature/
│   ├── index.tsx           # Main component, exports
│   ├── FeatureHeader.tsx
│   ├── FeatureContent.tsx
│   └── hooks/
│       └── useFeatureData.ts
```

---

## Error Handling

### Wrap Pages in Error Boundary

```typescript
// In App.tsx - already done via RouteErrorBoundary
<Route path="/resources" element={
  <RouteErrorBoundary>
    <Resources />
  </RouteErrorBoundary>
} />
```

### Use Toast for User Feedback

```typescript
import { toast } from "sonner";

// Success
toast.success("Resource created");

// Error
toast.error("Failed to create resource");

// With promise
toast.promise(createResource(data), {
  loading: "Creating...",
  success: "Created!",
  error: "Failed to create",
});
```

---

## Security Rules

### Never Expose Secrets

```typescript
// BAD - Hardcoded credentials
const API_KEY = "sk_live_xxxxx";

// GOOD - Environment variables
const API_KEY = import.meta.env.VITE_API_KEY;
```

### Validate User Input

```typescript
// Use Zod for validation
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const result = schema.safeParse(input);
if (!result.success) {
  // Handle validation error
}
```

---

## Summary Checklist

| Check | Action |
|-------|--------|
| No unused imports | `npm run lint` |
| No unused variables | `npm run lint` |
| File under 400 lines | Manual check |
| Build passes | `npm run build` |
| Loading state handled | Code review |
| Error state handled | Code review |
| Empty state handled | Code review |
| Uses Clerk auth | Code review |
| Uses shadcn components | Code review |
| No hardcoded secrets | Code review |

---

## Common Patterns That Cause Issues

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Direct API call in useEffect | Bypasses cache | Use TanStack Query |
| Missing loading state | Crashes on undefined | Add `isLoading` check |
| Missing error state | Silent failures | Add `isError` check |
| Hardcoded API URL | Breaks in production | Use env variables |
| Using Supabase auth | Deprecated | Use Clerk auth |
| Custom UI components | Inconsistent styling | Use shadcn/ui |

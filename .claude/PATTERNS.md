# Scho1ar Code Patterns

Common patterns and conventions used in this codebase.

---

## Component Structure

```tsx
// src/components/feature/FeatureName.tsx
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useClerkAuth } from "@/hooks/use-clerk-auth";

interface FeatureNameProps {
  id: string;
  onComplete?: () => void;
}

export function FeatureName({ id, onComplete }: FeatureNameProps) {
  const { user, loading } = useClerkAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>Feature Name</CardHeader>
      <CardContent>
        <Button onClick={handleAction}>Action</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Authentication Pattern

### Using Clerk Auth Hook

```tsx
import { useClerkAuth } from "@/hooks/use-clerk-auth";

export function MyComponent() {
  const { user, loading, isSignedIn, signOut } = useClerkAuth();

  if (loading) {
    return <Skeleton className="h-32" />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <p>Welcome, {user?.fullName || user?.firstName}</p>
      <Button onClick={signOut}>Sign Out</Button>
    </div>
  );
}
```

### Auth Token for API Calls

```tsx
// Token is automatically injected via authTokenManager
// Just use the apiClient - auth is handled
import { apiClient } from "@/lib/api/api-client";

const data = await apiClient.get("/endpoint");
```

---

## Data Fetching Patterns (TanStack Query)

### Query Hook

```tsx
// src/hooks/queries/useResources.ts
import { useQuery } from "@tanstack/react-query";
import { resourcesApi } from "@/lib/api/resources";

export function useResources(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["resources", organizationId],
    queryFn: () => resourcesApi.getAll(organizationId!),
    enabled: !!organizationId,
  });
}
```

### Mutation Hook

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resourcesApi } from "@/lib/api/resources";

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResourceDto) => resourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });
}
```

### Using Queries in Components

```tsx
export function ResourceList() {
  const { data, isLoading, isError, error, refetch } = useResources(orgId);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error?.message || "Failed to load resources"}
          <Button onClick={() => refetch()}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState message="No resources found" />;
  }

  return (
    <div className="grid gap-4">
      {data.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
```

---

## API Client Pattern

### API Namespace Organization

```tsx
// src/lib/api/resources.ts
import { apiClient } from "./api-client";
import { Resource, CreateResourceDto } from "./types";

export const resourcesApi = {
  getAll: async (organizationId: string): Promise<Resource[]> => {
    return apiClient.get(`/resources?organizationId=${organizationId}`);
  },

  getById: async (id: string): Promise<Resource> => {
    return apiClient.get(`/resources/${id}`);
  },

  create: async (data: CreateResourceDto): Promise<Resource> => {
    return apiClient.post("/resources", data);
  },

  update: async (id: string, data: Partial<Resource>): Promise<Resource> => {
    return apiClient.put(`/resources/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/resources/${id}`);
  },
};
```

---

## Page Structure

```tsx
// src/pages/Resources.tsx
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useClerkAuth } from "@/hooks/use-clerk-auth";
import { useResources } from "@/hooks/queries/useResources";

export default function Resources() {
  const { user } = useClerkAuth();
  const { data: resources, isLoading } = useResources(user?.organizationId);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Resources" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Page content */}
        </main>
      </div>
    </div>
  );
}
```

---

## Form Pattern (React Hook Form + Zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormData = z.infer<typeof formSchema>;

export function MyForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Toast Notifications

```tsx
import { toast } from "sonner";

// Success
toast.success("Resource created successfully");

// Error
toast.error("Failed to create resource");

// With description
toast.success("Success", {
  description: "Your changes have been saved",
});

// Loading state
const promise = createResource(data);
toast.promise(promise, {
  loading: "Creating resource...",
  success: "Resource created!",
  error: "Failed to create resource",
});
```

---

## Import Aliases

```typescript
@/components/* → src/components/*
@/lib/*        → src/lib/*
@/hooks/*      → src/hooks/*
@/pages/*      → src/pages/*
```

---

## File Naming Conventions

```
src/
├── components/
│   ├── ui/              # shadcn components (kebab-case)
│   │   └── button.tsx
│   ├── Sidebar.tsx      # App components (PascalCase)
│   └── Header.tsx
├── hooks/               # Custom hooks (kebab-case with use- prefix)
│   └── use-clerk-auth.tsx
├── lib/                 # Utilities (kebab-case)
│   ├── api/
│   │   └── api-client.ts
│   └── utils.ts
├── pages/               # Page components (PascalCase)
│   └── Resources.tsx
└── types/               # Type definitions (kebab-case)
    └── resource.ts
```

---

## Key Conventions

1. **useCallback for Stability** - Event handlers maintain referential equality
2. **useMemo for Derived State** - Computed values are memoized
3. **Error Boundaries** - Wrap pages in `ApiErrorBoundary`
4. **Loading States** - Always show loading skeleton
5. **Error States** - Show retry button on errors
6. **Empty States** - Show meaningful empty state messages
7. **Type Safety** - Use TypeScript types for all data
8. **No Props Spreading** - Props are explicit and typed
9. **Max 400 Lines** - Split components if exceeding limit

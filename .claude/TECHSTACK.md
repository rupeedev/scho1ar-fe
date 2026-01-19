# Scho1ar Frontend Tech Stack

## Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Library |
| TypeScript | 5.5.3 | Type Safety |
| Vite | 5.4.x | Build Tool & Dev Server |

## UI & Styling
| Technology | Purpose |
|------------|---------|
| Tailwind CSS 3.4.x | Utility-first CSS |
| shadcn/ui | Component Library (built on Radix UI) |
| Radix UI | Headless UI Primitives |
| Lucide React | Icons |

## State & Data Management
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 4.29.x | Server State Management |
| React Hook Form | 7.53.x | Form Handling |
| Zod | 3.23.x | Schema Validation |

## Routing & Navigation
| Technology | Version | Purpose |
|------------|---------|---------|
| React Router | 6.26.x | Client-side Routing |

## Authentication
| Technology | Purpose |
|------------|---------|
| Clerk (@clerk/clerk-react) | Authentication (JWT) |

**Auth Hook:** `useClerkAuth()` from `src/hooks/use-clerk-auth.tsx`

## Data Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| Recharts | 2.12.x | Charts & Graphs |
| ReactFlow | 11.11.x | Network Topology Diagrams |
| Dagre | 0.8.x | Graph Layout |

## Other Libraries
| Technology | Version | Purpose |
|------------|---------|---------|
| date-fns | 3.6.x | Date Utilities |
| Sonner | - | Toast Notifications |
| Stripe.js | 7.3.x | Payment Integration |

## Architecture Pattern

```
Frontend (React) → API Client → Backend API (NestJS) → Database (PostgreSQL)
                → Clerk (authentication only)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | Entry point with ClerkProvider |
| `src/App.tsx` | Routes and layout |
| `src/hooks/use-clerk-auth.tsx` | Clerk authentication hook |
| `src/lib/api/api-client.ts` | API client with Clerk JWT |
| `src/lib/auth-token.ts` | Token manager for API calls |

## Deployment

| Platform | Config |
|----------|--------|
| Railway | `railway.json` |
| Build | Nixpacks |
| Static Server | `serve` package |

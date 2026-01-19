# Scho1ar Frontend Project Context

## Project Info

| Field | Value |
|-------|-------|
| Name | Scho1ar (CostPie) |
| Type | Cloud Cost Management Application |
| Auth | Clerk (@clerk/clerk-react) |

## Paths

| Path | Purpose |
|------|---------|
| **Project Root** | `/Users/rupeshpanwar/Documents/Projects/Schol1ar.com/scho1ar-FE` |
| **Documentation** | `/Users/rupeshpanwar/Documents/docs/docs-scho1ar/` |
| **Backend** | `/Users/rupeshpanwar/Documents/Projects/Schol1ar.com/scho1ar-BE` |

## URLs

| Environment | URL |
|-------------|-----|
| Production Frontend | Railway auto-deploy from `main` branch |
| Local Frontend | http://localhost:5173 |
| Local Backend | http://localhost:3001 |
| API Docs | http://localhost:3001/api/docs (Swagger) |

## Tech Stack

### Frontend (React)
- **Build**: Vite 5.4.x
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **UI**: shadcn/ui (Radix + Tailwind CSS 3.4.x)
- **State**: TanStack Query 4.29.x
- **Auth**: Clerk (@clerk/clerk-react)
- **Routing**: React Router 6.26.x
- **Charts**: Recharts 2.12.x
- **Diagrams**: ReactFlow 11.11.x + Dagre

### Backend (NestJS)
- **Framework**: NestJS 11.x
- **ORM**: Prisma 6.x
- **Database**: PostgreSQL (Supabase)
- **Cloud SDK**: AWS SDK v3

## Quick Commands

```bash
# Frontend Development
cd /Users/rupeshpanwar/Documents/Projects/Schol1ar.com/scho1ar-FE
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run lint         # Run ESLint

# Git
git checkout -b feature/<name>
git push -u origin feature/<name>
```

## Documentation Structure

```
docs-scho1ar/
├── frontend/          # Frontend task docs
├── backend/           # Backend task docs
└── deployment/        # Deployment docs
```

## Core Rules

1. **UI**: shadcn/ui components only
2. **Auth**: Clerk only (useClerkAuth hook)
3. **State**: TanStack Query for server state
4. **API**: All calls go through src/lib/api/
5. **Deployment**: Railway auto-deploys on push to `main`

## Context Files

| File | Purpose |
|------|---------|
| `PROJECT.md` | This file - project info |
| `WORKFLOW.md` | Development workflow |
| `TECHSTACK.md` | Package versions |
| `PATTERNS.md` | Code conventions |
| `FILE-MAP.md` | Quick file lookup |
| `CODING-GUIDELINES.md` | Coding standards |
| `lessons-learned.md` | Critical incidents |

## Environment Variables

### Frontend (.env)
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

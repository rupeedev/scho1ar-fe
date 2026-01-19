# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CostPie is a cloud cost management application that helps organizations track, analyze, and optimize their cloud infrastructure spending. The project consists of a React/TypeScript frontend and a NestJS/TypeScript backend, using PostgreSQL (via Supabase) for data persistence.

## Common Development Commands

### Frontend Development

```bash
cd frontend
npm install           # Install dependencies
npm run dev          # Start development server (port 5173)
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run tests
```

### Backend Development

```bash
cd backend
npm install           # Install dependencies
npx prisma generate  # Generate Prisma client (run after schema changes)
npm run start:dev    # Start development server (port 3001)
npm run build        # Build for production
npm run start:prod   # Run production build
```

### Database Management

```bash
cd backend
npx prisma migrate dev    # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
npx prisma db push       # Push schema changes without migration (dev only)
```

## High-Level Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, built with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router v6
- **API Client**: Custom typed client with automatic auth token injection
- **Key Libraries**: Supabase client, Stripe, Recharts, date-fns

### Backend Architecture

- **Framework**: NestJS with TypeScript following modular architecture
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Authentication**: Supabase JWT tokens validated by AuthGuard
- **Cloud Integration**: AWS SDK v3 for resource discovery and cost data
- **API Documentation**: Swagger UI available at `/api/docs`

### Key Architectural Patterns

1. **Backend Module Structure**: Each feature is a self-contained NestJS module with:

   - Controller (HTTP endpoints)
   - Service (business logic)
   - DTOs (request/response validation)
   - Module definition
2. **Frontend Data Flow**:

   - Custom hooks use React Query for data fetching
   - API client handles authentication and error handling
   - Error boundaries provide graceful error recovery
   - Components receive data via props or hooks
3. **Authentication Flow**:

   - User authenticates via Supabase Auth
   - Frontend stores JWT and includes in API requests
   - Backend AuthGuard validates tokens on all protected routes
   - Organization context maintained throughout session
4. **Cloud Resource Management**:

   - Cloud accounts stored with encrypted credentials
   - Background jobs sync resources from AWS
   - Cost data aggregated and stored for analysis
   - Multi-region resource discovery supported

### Data Model Overview

The system uses a hierarchical data model:

- **Organization** → CloudAccounts, Teams, Users
- **CloudAccount** → Resources, CostEntries
- **Team** → TeamMembers, owned Resources
- **Resource** → CostEntries, OptimizationRecommendations

### Development Guidelines

1. **Type Safety**: Maintain TypeScript types across the stack
2. **Error Handling**: Use NestJS exceptions and React error boundaries
3. **API Conventions**: RESTful naming with resource-based URLs
4. **Database Operations**: Use Prisma's upsert to prevent duplicates
5. **Frontend Components**: Keep components focused and reusable
6. **Security**: Never expose credentials, use environment variables
7. 

## Code Generation Guidelines

**IMPORTANT**: When generating any code, ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation:

- /docs/ui.md
- /docs/fe-api-endpoints.md
- /docs/fe-data-mutation.md
- /docs/be-api-endpoints.md
- /docs/be-data-mutation.md
- /docs/data-fetching.md
- /docs/data-seeder.md
- /docs/security.md

### Backend Testing & Validation

The project includes comprehensive Prisma-based testing tools in the `/tools` directory:

#### Running Backend Tests

```bash
cd tools
node test-backend-validation.js    # Run all validation tests

# Or run specific TypeScript test suites:
cd backend
npx ts-node ../tools/prisma/validate-schema.ts              # Schema validation
npx ts-node ../tools/tests/db-connectivity.test.ts          # Database connectivity
npx ts-node ../tools/tests/data-integrity.test.ts           # Data integrity checks
npx ts-node ../tools/tests/optimization-recommendations.test.ts  # Optimization tests
```

#### Important Testing Commands

```bash
npx prisma validate      # Validate Prisma schema syntax
npx prisma migrate status   # Check migration status
npx prisma db pull       # Sync Prisma schema with database
npx prisma generate      # Regenerate Prisma client after schema changes
```

Always run `node tools/test-backend-validation.js` after making database changes to ensure data integrity.

### Environment Setup

Backend requires these environment variables:

```
DATABASE_URL=postgresql://...
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=development
```

Frontend uses `.env` files for configuration:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

## Git Commit Guidelines

When creating git commits, **DO NOT** include the following in commit messages:

- "🤖 Generated with Claude Code"
- "Co-Authored-By: Claude <noreply@anthropic.com>"
- Any reference to Claude or AI-generated content

Keep commit messages clean, professional, and focused on describing the changes made.

## Git Repository Structure

1. Backend: git@github.com:Rupeebw/costpie-backend.git
   - Location: /Users/rupeshpanwar/Documents/PProject/costpie/backend
2. Frontend: git@github.com:Rupeebw/costpie.git
   - Location: /Users/rupeshpanwar/Documents/PProject/costpie/frontend

## ChangeLog

location: /Users/rupeshpanwar/Documents/PProject/costpie/ChangeLog.txt

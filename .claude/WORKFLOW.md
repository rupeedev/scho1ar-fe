# Scho1ar Development Workflow

## Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT WORKFLOW (5 PHASES)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1         Phase 2          Phase 3           Phase 4                  │
│  ────────        ────────         ────────          ────────                 │
│  Context     →   Planning    →    Feature      →    Implementation           │
│  Reading         (for features)   Branch            & Validation             │
│                                                                              │
│  Phase 5                                                                     │
│  ────────                                                                    │
│  Git Merge                                                                   │
│  & Push                                                                      │
│  (Railway auto-deploys)                                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Task Classification

| Type | Keywords | Skip Planning? |
|------|----------|----------------|
| **QUICK** | fix, typo, bug, update, tweak | Yes |
| **FEATURE** | add, implement, create, build, new | No |

---

## Phase 1: Context Reading

**ALWAYS read context files first:**

```
Read(.claude/TECHSTACK.md)     ← Tech stack reference
Read(.claude/PATTERNS.md)      ← Code patterns
Read(CLAUDE.md)                ← Project guidelines
Read(src/App.tsx)              ← Routes overview
```

**Check documentation:** `/Users/rupeshpanwar/Documents/docs/docs-scho1ar`

---

## Phase 2: Planning (FEATURE only)

Skip this phase for QUICK fixes.

### Create Planning Docs

**Path:** `/Users/rupeshpanwar/Documents/docs/docs-scho1ar/frontend/<feature>-plan.md`

**Must include:**
- Files to modify/create
- Implementation steps
- Component hierarchy
- API endpoints needed

---

## Phase 3: Feature Branch

**NEVER commit directly to main!**

```bash
# For fixes
git checkout -b fix/<description>

# For features
git checkout -b feature/<description>
```

---

## Phase 4: Implementation & Validation

### 4.1 Implementation

Follow patterns from `PATTERNS.md`:
- Use shadcn/ui components from `src/components/ui/`
- Use `useClerkAuth()` for authentication
- Use TanStack Query hooks for data fetching
- Follow existing page structure in `src/pages/`

### 4.2 Validation (MANDATORY)

**Run these checks before committing:**

```bash
cd /Users/rupeshpanwar/Documents/Projects/Schol1ar.com/scho1ar-FE

# Lint check
npm run lint 2>&1 || true

# Build check (MUST pass)
npm run build

# Security scan
npm audit 2>&1 || true
```

**All validation gates must pass before Phase 5!**

---

## Phase 5: Git Merge & Push

### 5.1 Commit Changes

```bash
git add .
git commit -m "feat: <description>"
# or
git commit -m "fix: <description>"
```

### 5.2 Push and Merge

```bash
# Push feature branch
git push -u origin feature/<name>

# Merge to main
git checkout main
git pull origin main
git merge feature/<name>
git push origin main

# Cleanup
git branch -d feature/<name>
```

**Railway auto-deploys on push to `main`!**

---

## QUICK Workflow (Simple Fixes)

For simple fixes - minimal process:

```
1. Read context files (TECHSTACK.md, PATTERNS.md)
2. Create fix branch: git checkout -b fix/<description>
3. Make the fix directly
4. Validate: npm run lint && npm run build
5. Commit and merge to main
```

---

## FEATURE Workflow (Full Process)

For new features - complete workflow:

```
1. Read context files
2. Create planning doc in docs-scho1ar/frontend/
3. Create feature branch
4. Implement following PATTERNS.md
5. Validate: lint + build + security
6. Commit, push, merge to main
```

---

## Validation Checklist

**Verify BEFORE merging to main:**

| Check | Command | Status |
|-------|---------|--------|
| Lint passes | `npm run lint` | [ ] |
| Build succeeds | `npm run build` | [ ] |
| No hardcoded secrets | `grep -rn 'password=\|secret=\|apikey=' src/` | [ ] |
| No console.logs in commits | Code review | [ ] |

---

## Commit Message Format

```
<type>: <description>

- <bullet point 1>
- <bullet point 2>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `chore`

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Git
git checkout -b feature/<name>
git checkout -b fix/<name>
git push -u origin <branch>
git checkout main && git merge <branch>

# Validation
npm run lint && npm run build
npm audit
```

---

## Deployment

| Trigger | Action |
|---------|--------|
| Push to `main` | Railway auto-deploys |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Config | `railway.json` + `nixpacks.toml` |

**No manual deployment needed - Railway handles it automatically!**

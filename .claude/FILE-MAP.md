# FILE-MAP.md

**Purpose:** Eliminate exploration by providing exact file paths. Read this FIRST to find any file.

---

## Pages (src/pages/)

| Page | File Path | Purpose |
|------|-----------|---------|
| Dashboard | `src/pages/Index.tsx` | Main dashboard with cost overview |
| Landing | `src/pages/LandingPage.tsx` | Public landing page |
| Login | `src/pages/Login.tsx` | Clerk SignIn |
| Sign Up | `src/pages/SignUp.tsx` | Clerk SignUp |
| Reset Password | `src/pages/ResetPassword.tsx` | Password reset redirect |
| Pricing | `src/pages/Pricing.tsx` | Pricing plans |
| Add Account | `src/pages/AddAccount.tsx` | Add AWS cloud account |
| Profile | `src/pages/ProfileDetails.tsx` | User profile details |
| Settings | `src/pages/Settings.tsx` | App settings |
| Account | `src/pages/AccountPage.tsx` | Account management |
| Cost Management | `src/pages/CostManagement.tsx` | Cost analysis & optimization |
| Cloud Ops | `src/pages/CloudOps.tsx` | Cloud operations dashboard |
| Cloud Health | `src/pages/CloudHealth.tsx` | Cloud health monitoring |
| Resources | `src/pages/Resources.tsx` | Resource inventory |
| Resource Details | `src/pages/ResourceDetails.tsx` | Individual resource view |
| Architecture | `src/pages/Architecture.tsx` | Network topology diagram |
| Schedules | `src/pages/Schedules.tsx` | Resource schedules list |
| Schedule Detail | `src/pages/ScheduleDetail.tsx` | Individual schedule view |
| Create Schedule | `src/pages/CreateSchedule.tsx` | Create new schedule |
| Audit Logs | `src/pages/AuditLogs.tsx` | CloudTrail audit logs |
| Onboarding | `src/pages/Onboarding.tsx` | Onboarding flow |
| Billing | `src/pages/Billing.tsx` | Billing management |
| User Profile | `src/pages/UserProfile.tsx` | User profile page |
| Not Found | `src/pages/NotFound.tsx` | 404 page |

### Onboarding Pages (src/pages/onboarding/)

| Page | File Path |
|------|-----------|
| Welcome | `src/pages/onboarding/Welcome.tsx` |
| Organization Setup | `src/pages/onboarding/OrganizationSetup.tsx` |
| Subscription Setup | `src/pages/onboarding/SubscriptionSetup.tsx` |
| Setup Complete | `src/pages/onboarding/SetupComplete.tsx` |

---

## Components (src/components/)

### Core Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Sidebar | `src/components/Sidebar.tsx` | Main navigation sidebar |
| Header | `src/components/Header.tsx` | Page header |
| ClerkProtectedRoute | `src/components/ClerkProtectedRoute.tsx` | Auth route wrapper |
| ApiErrorBoundary | `src/components/ApiErrorBoundary.tsx` | Error boundary |
| SupportChat | `src/components/SupportChat.tsx` | Support chat widget |
| ChangePasswordModal | `src/components/ChangePasswordModal.tsx` | Password change modal |
| PasswordResetButton | `src/components/PasswordResetButton.tsx` | Password reset trigger |
| EditCloudAccountModal | `src/components/EditCloudAccountModal.tsx` | Edit cloud account |
| Notifications | `src/components/Notifications.tsx` | Notification display |
| TutorialDialog | `src/components/TutorialDialog.tsx` | Tutorial walkthrough |

### UI Components (src/components/ui/)

| Component | File Path |
|-----------|-----------|
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Tabs | `src/components/ui/tabs.tsx` |
| Select | `src/components/ui/select.tsx` |
| Input | `src/components/ui/input.tsx` |
| Dropdown Menu | `src/components/ui/dropdown-menu.tsx` |
| Popover | `src/components/ui/popover.tsx` |
| Tooltip | `src/components/ui/tooltip.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Switch | `src/components/ui/switch.tsx` |
| Label | `src/components/ui/label.tsx` |
| Textarea | `src/components/ui/textarea.tsx` |
| Alert | `src/components/ui/alert.tsx` |
| Skeleton | `src/components/ui/skeleton.tsx` |
| Sonner (Toast) | `src/components/ui/sonner.tsx` |
| Toaster | `src/components/ui/toaster.tsx` |
| Form | `src/components/ui/form.tsx` |

### Feature Components

| Directory | Purpose |
|-----------|---------|
| `src/components/dashboard/` | Dashboard-specific components |
| `src/components/add-account/` | Cloud account setup components |
| `src/components/cloud-ops/` | Cloud operations components |
| `src/components/cost-management/` | Cost analysis components |
| `src/components/resources/` | Resource management components |
| `src/components/network-topology/` | Architecture diagram components |
| `src/components/onboarding/` | Onboarding flow components |
| `src/components/account/` | Account management components |

---

## Hooks (src/hooks/)

| Hook | File Path | Purpose |
|------|-----------|---------|
| useClerkAuth | `src/hooks/use-clerk-auth.tsx` | Clerk authentication |
| useSupabaseAuth | `src/hooks/use-supabase-auth.tsx` | Legacy Supabase auth |
| useAuth | `src/hooks/use-auth.tsx` | Generic auth hook |
| useData | `src/hooks/use-data.tsx` | Data fetching utilities |
| useErrorHandler | `src/hooks/use-error-handler.tsx` | Error handling |
| useMobile | `src/hooks/use-mobile.tsx` | Mobile detection |
| useOnboarding | `src/hooks/use-onboarding.tsx` | Onboarding state |
| useOptimisticMutation | `src/hooks/use-optimistic-mutation.ts` | Optimistic updates |
| useStripeCheckout | `src/hooks/use-stripe-checkout.ts` | Stripe checkout |
| useTheme | `src/hooks/use-theme.tsx` | Theme management |
| useToast | `src/hooks/use-toast.ts` | Toast notifications |

### Query Hooks (src/hooks/queries/)

| Hook | File Path | Purpose |
|------|-----------|---------|
| (various) | `src/hooks/queries/` | TanStack Query hooks |

---

## API Client (src/lib/api/)

| File | File Path | Endpoints |
|------|-----------|-----------|
| API Client | `src/lib/api/api-client.ts` | Base HTTP client with auth |
| Index | `src/lib/api/index.ts` | API exports |
| Types | `src/lib/api/types.ts` | TypeScript types |
| Audit Logs | `src/lib/api/audit-logs.ts` | CloudTrail audit logs |
| AWS | `src/lib/api/aws.ts` | AWS resource discovery |
| Cloud Accounts | `src/lib/api/cloud-accounts.ts` | Cloud account CRUD |
| CloudTrail Sync | `src/lib/api/cloudtrail-sync.ts` | CloudTrail sync |
| Costs | `src/lib/api/costs.ts` | Cost data |
| Organizations | `src/lib/api/organizations.ts` | Organization management |
| Reservations | `src/lib/api/reservations.ts` | Reserved instances |
| Resources | `src/lib/api/resources.ts` | Resource management |
| Schedules | `src/lib/api/schedules.ts` | Schedule management |
| Settings | `src/lib/api/settings.ts` | App settings |
| Tags | `src/lib/api/tags.ts` | Resource tags |
| Teams | `src/lib/api/teams.ts` | Team management |
| Users | `src/lib/api/users.ts` | User management |

---

## Core Files (src/lib/)

| File | Path | Purpose |
|------|------|---------|
| API Client | `src/lib/api/api-client.ts` | HTTP client with Clerk JWT |
| Auth Token | `src/lib/auth-token.ts` | Token manager |
| Supabase | `src/lib/supabase.ts` | Supabase client |
| Error Handling | `src/lib/error-handling.ts` | Error utilities |
| Error Logging | `src/lib/error-logging.ts` | Error logging |
| Utils | `src/lib/utils.ts` | General utilities |

---

## Configuration Files

| File | Path | Purpose |
|------|------|---------|
| Main Entry | `src/main.tsx` | App bootstrap with Clerk |
| App Component | `src/App.tsx` | Routes and layout |
| Vite Config | `vite.config.ts` | Build configuration |
| Tailwind Config | `tailwind.config.ts` | Tailwind CSS config |
| TypeScript Config | `tsconfig.json` | TypeScript settings |
| Railway Config | `railway.json` | Railway deployment |
| Nixpacks Config | `nixpacks.toml` | Nixpacks build config |
| CLAUDE.md | `CLAUDE.md` | Claude guidelines |

---

## Quick Lookup by Feature

### Authentication
- Auth hook: `src/hooks/use-clerk-auth.tsx`
- Protected route: `src/components/ClerkProtectedRoute.tsx`
- Token manager: `src/lib/auth-token.ts`
- Login page: `src/pages/Login.tsx`
- SignUp page: `src/pages/SignUp.tsx`

### Cost Management
- Main page: `src/pages/CostManagement.tsx`
- Cost API: `src/lib/api/costs.ts`
- Components: `src/components/cost-management/`

### Cloud Accounts
- Add account: `src/pages/AddAccount.tsx`
- API: `src/lib/api/cloud-accounts.ts`
- Components: `src/components/add-account/`

### Resources
- List page: `src/pages/Resources.tsx`
- Details page: `src/pages/ResourceDetails.tsx`
- API: `src/lib/api/resources.ts`
- Components: `src/components/resources/`

### Architecture/Topology
- Page: `src/pages/Architecture.tsx`
- Components: `src/components/network-topology/`

### Schedules
- List: `src/pages/Schedules.tsx`
- Detail: `src/pages/ScheduleDetail.tsx`
- Create: `src/pages/CreateSchedule.tsx`
- API: `src/lib/api/schedules.ts`

### Audit Logs
- Page: `src/pages/AuditLogs.tsx`
- API: `src/lib/api/audit-logs.ts`

---

## Common Patterns by Task Type

### "Fix X not showing"
1. Find page in Pages section above
2. Check component imports
3. Check data fetching (useQuery hook)
4. Check loading/error states

### "Add new page"
1. Create page in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add sidebar link in `src/components/Sidebar.tsx`

### "Fix API endpoint"
1. Find API file in `src/lib/api/`
2. Check request URL and method
3. Check response handling

### "Fix authentication issue"
1. Check `src/hooks/use-clerk-auth.tsx`
2. Check `src/lib/auth-token.ts`
3. Check `src/lib/api/api-client.ts`

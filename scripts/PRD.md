**Overall Goal:** Build a scalable and secure backend to power your CostPie application, enabling data ingestion from cloud providers, analysis, scheduling, user management, and more.

**Core Philosophy:**

* **Leverage Supabase:** Use its PostgreSQL database, Edge Functions (for lighter backend logic/scheduled tasks), and potentially Storage.
* **Secure by Design:** Especially for cloud credentials and sensitive data.
* **Scalable Data Ingestion:** Cloud cost and resource data can be voluminous.
* **Modular Backend:** Separate concerns for clarity and maintainability.

---

**I. Recommended Tech Stack**

1. **Database:**

   * **Supabase (PostgreSQL):** As requested. It provides a managed PostgreSQL instance, which is powerful and flexible.
   * **Supabase Storage:** For any user uploads (e.g., profile pictures if Clerk doesn't handle them sufficiently, or report exports).
   * **Supabase Edge Functions (Deno/TypeScript):** For:
     * Scheduled tasks (e.g., daily data sync from cloud providers).
     * Simpler API endpoints that directly interact with the database.
     * Webhook handlers.
   * **Supabase Vault:** For securely storing secrets like cloud provider API keys/secret keys.
2. **Backend API & Core Logic:**

   * **Language/Framework:** **NestJS (Node.js + TypeScript)**
     * **Why:** Excellent TypeScript support (matches your frontend), highly structured (good for a complex app), modular, good for building robust APIs, great ecosystem, and Prisma (ORM) integrates beautifully. It's more opinionated than Express, which helps with consistency.
     * Alternative: Express.js with TypeScript if you prefer a more minimalist approach.
   * **ORM:** **Prisma**
     * **Why:** Type-safe database access, excellent auto-completion, easy migrations, works great with PostgreSQL and TypeScript.
   * **Authentication:** **Supabase**
     * **Why:** Supabase provides built-in authentication that integrates seamlessly with its PostgreSQL database. This allows for unified management of both authentication and data storage.
     * Supabase Auth offers email/password, social logins, and JWT token management out of the box.
3. **Cloud Provider Interaction:**

   * **AWS SDK for JavaScript v3:** To interact with AWS services (Cost Explorer, EC2, RDS, IAM, Compute Optimizer, etc.).
   * Similar SDKs for other cloud providers if you expand (e.g., `@google-cloud/billing`, Azure SDKs).
4. **Background Job Processing (for heavy/long-running tasks):**

   * **Option 1 (Simpler Start):** Supabase Edge Functions with `pg_cron` for scheduling. Good for tasks that complete within Edge Function limits.
   * **Option 2 (More Robust/Scalable):** A separate NestJS worker service using a queue like **BullMQ** (backed by Redis).
     * Redis: Could be a managed Redis instance (e.g., Upstash, Aiven, or even a small self-hosted Docker container initially).
     * This is for tasks like:
       * Large data ingestion from cloud providers.
       * Complex data analysis generating recommendations.
       * Executing resource schedules.
   * *Recommendation:* Start with Supabase Edge Functions for scheduling data fetches. If they become too slow or complex, introduce BullMQ.
5. **Deployment:**

   * **Frontend:** Vercel, Netlify (likely where it is now).
   * **NestJS Backend API & Worker:**
     * **Render.com / Fly.io:** Good for deploying Node.js/Dockerized applications and background workers. Offer managed PostgreSQL and Redis if you don't use Supabase's.
     * **Vercel Serverless Functions:** NestJS can be deployed as serverless functions on Vercel, which can be cost-effective.
     * **AWS (ECS/Fargate, Lambda):** More complex to set up but very scalable.
   * **Supabase:** Handles its own infrastructure.

---

**II. Supabase Database Schema Design (Initial Thoughts)**

This will evolve, but here's a starting point:

* **`organizations`**: (Assuming a multi-tenant or workspace model)

  * `id` (uuid, PK)
  * `name` (text)
  * `owner_user_id` (uuid, FK to Supabase auth.users) - The user who created the org.
  * `subscription_plan` (text, e.g., 'free_trial', 'advanced_monthly')
  * `stripe_customer_id` (text, nullable)
  * `created_at`, `updated_at`
* **`app_users`**: (Extends Supabase auth.users with app-specific data)

  * `id` (uuid, PK, FK to auth.users)
  * `organization_id` (uuid, FK to `organizations`)
  * `app_role` (text, e.g., 'admin', 'member') - Role within your application/org.
  * `display_name` (text)
  * `avatar_url` (text, nullable)
  * `created_at`, `updated_at`
* **`teams`**:

  * `id` (uuid, PK)
  * `organization_id` (uuid, FK to `organizations`)
  * `name` (text)
  * `created_at`, `updated_at`
* **`team_members`**: (Junction table for Users and Teams)

  * `team_id` (uuid, FK to `teams`)
  * `user_id` (uuid, FK to `app_users`)
  * `role_in_team` (text, e.g., 'lead', 'member')
  * PRIMARY KEY (`team_id`, `clerk_user_id`)
* **`cloud_accounts`**:

  * `id` (uuid, PK)
  * `organization_id` (uuid, FK to `organizations`)
  * `name` (text, e.g., "Production AWS", "Dev Azure")
  * `provider` (text, e.g., 'AWS', 'GCP', 'AZURE')
  * `account_id_on_provider` (text, e.g., AWS Account Number)
  * `access_type` (text, 'access_key' or 'role_arn')
  * `credentials_vault_id` (text, FK to Supabase Vault secret containing actual keys, ARN, etc.)
  * `status` (text, e.g., 'pending_verification', 'active', 'syncing', 'error')
  * `last_synced_at` (timestamp with time zone)
  * `permission_type` (text, 'default', 'read-only')
  * `created_at`, `updated_at`
* **`resources`**: (This will be a large, central table)

  * `id` (uuid, PK)
  * `cloud_account_id` (uuid, FK to `cloud_accounts`)
  * `provider_resource_id` (text, unique ID from the cloud provider, e.g., EC2 instance ID)
  * `resource_type` (text, e.g., 'AWS::EC2::Instance', 'AWS::S3::Bucket')
  * `name` (text, optional)
  * `region` (text)
  * `tags` (jsonb, storing tags as key-value pairs)
  * `team_id` (uuid, FK to `teams`, nullable) - For assigning resources to teams.
  * `metadata` (jsonb, for other specific details like instance type, size, etc.)
  * `status_on_provider` (text, e.g., 'running', 'stopped', 'available')
  * `discovered_at`, `last_seen_at`
* **`cost_entries`**: (Time-series data)

  * `id` (bigserial, PK)
  * `cloud_account_id` (uuid, FK to `cloud_accounts`)
  * `resource_id` (uuid, FK to `resources`, nullable for account-level costs)
  * `date` (date)
  * `service_name` (text, e.g., 'AmazonEC2', 'AmazonS3')
  * `usage_type` (text)
  * `cost` (numeric)
  * `currency` (text, default 'USD')
  * `granularity` (text, 'DAILY', 'MONTHLY') - Important for queries.
  * UNIQUE (`cloud_account_id`, `resource_id`, `date`, `service_name`, `usage_type`, `granularity`) - To prevent duplicates.
* **`schedules`**:

  * `id` (uuid, PK)
  * `organization_id` (uuid, FK to `organizations`)
  * `team_id` (uuid, FK to `teams`, nullable)
  * `name` (text)
  * `timezone` (text)
  * `schedule_mode` (text, 'Weekly Timesheet', etc.)
  * `definition` (jsonb, storing the actual on/off times for days/hours)
  * `is_active` (boolean, default true)
  * `estimated_savings_percentage` (numeric)
  * `created_at`, `updated_at`
* **`scheduled_resources`**: (Junction table for Schedules and Resources)

  * `schedule_id` (uuid, FK to `schedules`)
  * `resource_id` (uuid, FK to `resources`)
  * PRIMARY KEY (`schedule_id`, `resource_id`)
* **`optimization_recommendations`**:

  * `id` (uuid, PK)
  * `resource_id` (uuid, FK to `resources`)
  * `type` (text, e.g., 'RIGHTSIZE_EC2', 'DELETE_UNUSED_EBS', 'PURCHASE_RI')
  * `description` (text)
  * `potential_monthly_savings` (numeric)
  * `details` (jsonb, specific parameters for the recommendation)
  * `status` (text, 'pending', 'applied', 'ignored', 'error')
  * `generated_at`, `updated_at`
* **`app_settings`**: (For user-specific settings like notifications, timezone from settings page)

  * `user_id` (uuid, PK, FK to `app_users`)
  * `settings_data` (jsonb)
  * `updated_at`
* **`audit_logs`**:

  * `id` (bigserial, PK)
  * `timestamp` (timestamptz, default now())
  * `user_id` (uuid, nullable for system actions)
  * `organization_id` (uuid, nullable)
  * `action_type` (text, e.g., 'USER_LOGIN', 'CREATE_CLOUD_ACCOUNT', 'RESOURCE_SCHEDULED')
  * `target_resource_type` (text, nullable, e.g., 'cloud_account', 'schedule')
  * `target_resource_id` (text, nullable)
  * `details` (jsonb, e.g., parameters, old/new values)
  * `ip_address` (inet)

---

**III. Backend API Endpoints (NestJS)**

(Examples, these will be more granular)

* **Authentication:**
  * All protected routes will use a Guard that validates Supabase JWTs.
  * Supabase Auth will handle user registration, login, and session management.
* **Organizations:**
  * `POST /organizations` (Create Org)
  * `GET /organizations/mine` (Get orgs current user belongs to)
  * `PUT /organizations/:orgId` (Update Org)
* **Cloud Accounts:**
  * `POST /organizations/:orgId/cloud-accounts` (Add new cloud account)
  * `GET /organizations/:orgId/cloud-accounts` (List accounts in org)
  * `GET /cloud-accounts/:accountId` (Get details)
  * `PUT /cloud-accounts/:accountId` (Update)
  * `DELETE /cloud-accounts/:accountId`
  * `POST /cloud-accounts/:accountId/sync` (Trigger manual data sync)
* **Resources & Costs:**
  * `GET /cloud-accounts/:accountId/resources` (List resources, with filters for type, region, tags)
  * `GET /resources/:resourceId` (Get specific resource details)
  * `GET /organizations/:orgId/cost-trend` (Params: date_range, granularity, filters)
  * `GET /organizations/:orgId/cloud-health` (Metrics for health page)
  * `GET /organizations/:orgId/optimization-lab` (Data for optimization lab)
  * `GET /organizations/:orgId/reservations-status`
* **Schedules:**
  * `POST /organizations/:orgId/schedules`
  * `GET /organizations/:orgId/schedules`
  * `GET /schedules/:scheduleId`
  * `PUT /schedules/:scheduleId`
  * `DELETE /schedules/:scheduleId`
  * `POST /schedules/:scheduleId/assign-resource`
  * `DELETE /schedules/:scheduleId/unassign-resource/:resourceId`
* **Users & Teams:**
  * `GET /organizations/:orgId/users` (List users in org - from Supabase auth and your `app_users` table)
  * `POST /organizations/:orgId/teams`
  * `GET /organizations/:orgId/teams`
  * `POST /teams/:teamId/members` (Add user to team)
* **Settings:**
  * `GET /users/me/settings`
  * `PUT /users/me/settings`
* **Audit Logs:**
  * `GET /organizations/:orgId/audit-logs` (With pagination and filters)

---

**IV. Key Backend Logic Areas & Services (NestJS Modules)**

1. **`CloudProviderModule` (e.g., `AwsModule`, `AzureModule`):**

   * **Services:** `AwsSyncService`, `AwsCostExplorerService`, `AwsComputeOptimizerService`, etc.
   * **Logic:**
     * Securely retrieve credentials from Supabase Vault.
     * Use AWS SDK to fetch resource lists, configurations, cost data, recommendations.
     * Transform and store this data into your Supabase tables (`resources`, `cost_entries`, `optimization_recommendations`).
     * Handle API rate limits and pagination from cloud providers.
     * Implement methods to `start`, `stop` resources for the scheduling feature.
   * **Scheduling Data Fetch:** Use `pg_cron` via Supabase Edge Functions to trigger an API endpoint in your NestJS backend (e.g., `/internal/sync/aws/:accountId`) which then uses these services.
2. **`CostAnalysisModule`:**

   * **Services:** `CostTrendService`, `OptimizationService`, `CloudHealthService`.
   * **Logic:**
     * Query `cost_entries` and `resources` to generate data for charts and tables.
     * Implement algorithms to identify underutilized resources (based on CPU, memory thresholds from `resources.metadata`).
     * Calculate potential savings.
     * Generate health scores based on scheduling, tagging, rightsizing.
3. **`SchedulingModule`:**

   * **Services:** `ScheduleExecutionService`.
   * **Logic:**
     * Cron job (again, `pg_cron` via Edge Function calling a NestJS endpoint or BullMQ worker) that runs frequently (e.g., every 5-15 minutes).
     * Checks `schedules` table for active schedules.
     * For due schedules, iterates through `scheduled_resources`.
     * Calls the appropriate `CloudProviderModule` service to start/stop resources.
     * Logs actions to `audit_logs`.
4. **`OrganizationModule`, `TeamModule`, `UserModule`:**

   * Standard CRUD operations, managing relationships.
   * User module will interact with Supabase Auth for authentication and your `app_users` table for app-specific roles and data.
5. **`NotificationModule`:**

   * Service to send email notifications (e.g., trial ending, significant cost spike, schedule failure).
   * Integrate with an email provider (SendGrid, Resend, AWS SES).
6. **`AuditLogModule`:**

   * Service with a method like `createLog(actorId, action, target, details)`.
   * Can be used as a global interceptor/decorator in NestJS for many actions.
7. **`BillingModule` (Future):**

   * Integrate with Stripe for subscriptions.
   * Webhooks to handle subscription events (created, updated, canceled).
   * Update `organizations.subscription_plan`.

---

**V. Development Plan (Phased Approach)**

1. **Phase 0: Setup & Foundation**

   * Set up Supabase project.
   * Define initial core database schema (users, organizations, cloud_accounts, resources, cost_entries) using Prisma migrations.
   * Set up NestJS project with Prisma.
   * Implement Clerk JWT validation middleware/guard.
2. **Phase 1: Core AWS Account & Data Display**

   * **Backend:**
     * API to add/manage AWS `cloud_accounts` (Role ARN method first, using Supabase Vault for Role ARN).
     * Basic `AwsSyncService` to fetch EC2 instances and S3 buckets, store in `resources`.
     * Basic `AwsCostExplorerService` to fetch daily costs, store in `cost_entries`.
     * Scheduled Supabase Edge Function with `pg_cron` to trigger sync service.
   * **Frontend:** Connect `AddAccount`, `CloudAccounts`, `Resources` (list), `CostTrend` (simple daily total) pages to these APIs.
3. **Phase 2: Cost Analysis & Optimization Lab (Read-only)**

   * **Backend:**
     * Enhance `AwsSyncService` to fetch Compute Optimizer recommendations and more resource metadata.
     * Implement `OptimizationService` to process this data and populate `optimization_recommendations`.
     * Develop APIs for `CostTrend`, `CloudHealth`, `OptimizationLab`, `Reservations` pages to display fetched/analyzed data.
   * **Frontend:** Connect the respective pages.
4. **Phase 3: Scheduling & Actions**

   * **Backend:**
     * Implement `SchedulingModule` (schema, APIs, execution logic).
     * Enhance `AwsModule` with start/stop resource capabilities.
     * Scheduled job to run the `ScheduleExecutionService`.
   * **Frontend:** Connect `Schedules` and `CreateSchedule` pages. Allow assigning schedules to resources.
5. **Phase 4: User Management & Collaboration**

   * **Backend:** Implement `TeamModule`, enhance `UserModule` (app roles).
   * **Frontend:** Connect `Users` and `Teams` pages.
6. **Phase 5: Settings, Audit Logs & Notifications**

   * **Backend:** Implement `AuditLogModule`, `AppSettingsModule`, `NotificationModule`.
   * **Frontend:** Connect `Settings`, `AuditLogs` pages. Implement notification display (Sonner).
7. **Phase 6: Billing & Polish (if applicable)**

   * Integrate Stripe.
   * Refine UI/UX, performance optimizations, security hardening.

---

**VI. Important Considerations**

* **Security:**
  * **Cloud Credentials:** Store them in **Supabase Vault**. NEVER hardcode or store in plaintext in the database. Access them only from trusted backend environments.
  * **Principle of Least Privilege:** When creating IAM roles/users for CostPie to access cloud accounts, grant only the *absolute minimum* permissions required. The `SetupInstructions.tsx` gives a good starting point for AWS.
  * **Input Validation:** Validate all API inputs (use class-validator with NestJS).
  * **RLS (Row Level Security) in Supabase:** Use this to restrict data access at the database layer based on the authenticated user's `organization_id` or `clerk_user_id`.
* **Error Handling & Logging:** Robust error handling and logging (e.g., Sentry, Pino) in the backend.
* **Rate Limiting:** For cloud provider APIs and your own API.
* **Idempotency:** For data sync operations to avoid duplicates or issues if a sync is retried.
* **Scalability of Data Ingestion:** If you support many large accounts, the background job processing (BullMQ + Redis or similar) will become crucial.
* **Testing:** Unit, integration, and E2E tests for the backend.

---

This is a comprehensive plan. Start small with Phase 0 & 1 and iterate. Supabase will give you a great head start on the database and some backend capabilities. NestJS will provide a solid structure for your main API and business logic. Good luck!

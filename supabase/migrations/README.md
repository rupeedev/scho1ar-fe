# CostPie Database Migrations

This directory contains SQL migration files for setting up the CostPie application's database schema in Supabase.

## Migration Files

The migration files are numbered in the order they should be applied:

1. `01_organizations.sql` - Organization table for multi-tenant setup
2. `02_app_users.sql` - User profiles linked to auth.users
3. `03_teams.sql` - Teams within organizations
4. `04_team_members.sql` - Junction table for users and teams
5. `05_cloud_accounts.sql` - Cloud provider accounts
6. `06_resources.sql` - Cloud resources from providers
7. `07_cost_entries.sql` - Cost data for resources
8. `08_schedules.sql` - Resource scheduling configuration
9. `09_scheduled_resources.sql` - Resources assigned to schedules
10. `10_optimization_recommendations.sql` - Cost optimization suggestions
11. `11_app_settings.sql` - User preferences
12. `12_audit_logs.sql` - System activity logging

## Security Features

These migrations implement:

- Row Level Security (RLS) policies for multi-tenant data isolation
- Secure triggers for audit logging
- Automated timestamp management
- Proper foreign key constraints with cascading actions
- Data validation constraints

## Running Migrations

To apply these migrations to your Supabase project:

1. Set up your Supabase project URL and API key in `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

2. Install Supabase CLI:

```bash
npm install -g supabase
```

3. Login to Supabase:

```bash
supabase login
```

4. Link your project:

```bash
supabase link --project-ref your-project-id
```

5. Push the migrations:

```bash
supabase db push
```

## Notes on RLS Policies

Each table has Row Level Security (RLS) enabled with policies that:

- Restrict data access to members of the same organization
- Limit modification rights to users with appropriate roles (admin or team lead)
- Prevent users from accessing data from other organizations

## Database Triggers

Several automatic triggers are implemented:

- `update_updated_at_column()` - Updates timestamp columns
- `handle_new_user()` - Creates app_user record when a new auth user signs up
- `create_default_user_settings()` - Creates default settings for new users
- `log_user_action()` - Records changes to important tables in audit_logs

## Indexing Strategy

Indexes are created on:

- Foreign keys for quick joins
- Frequently filtered columns
- Columns used in WHERE clauses for reports
- JSONB columns use GIN indexes where appropriate
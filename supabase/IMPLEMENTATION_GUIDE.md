# CostPie Database Implementation Guide

This guide walks you through implementing the CostPie database schema in Supabase and initializing it with sample data.

## Steps for Implementation

### 1. Apply Database Schema

First, apply the complete database schema to set up all tables, relationships, and security policies:

1. Log in to your [Supabase dashboard](https://supabase.com/dashboard)
2. Select your project 'cnpgynayzzatfsxlveur'
3. Go to the 'SQL Editor' section in the left sidebar
4. Create a new query
5. Copy and paste the entire contents from `/supabase/complete_schema.sql`
6. Execute the query

This will create all the required tables with Row Level Security, indexes, triggers, and constraints.

### 2. Create a User Account

Before initializing data, you need at least one user account:

1. In the Supabase dashboard, go to 'Authentication' → 'Users'
2. Click 'Add User'
3. Enter email and password for your admin user
4. Note the user's UUID as you'll need it for the initialization script

### 3. Initialize Sample Data

After creating a user and applying the schema, populate the database with sample data:

1. Go back to the 'SQL Editor' in your Supabase dashboard
2. Create a new query
3. Open `/supabase/init_data.sql` and modify the query if needed:
   - If you want to use a specific user ID, replace the logic in the script that gets `v_admin_user_id`
4. Copy and paste the modified script content
5. Execute the query

### 4. Verify the Implementation

To confirm the database setup was successful:

1. Go to 'Table Editor' in your Supabase dashboard
2. You should see all the tables defined in the schema
3. Browse through tables to verify that sample data is present
4. Check that relationships between tables work by examining related rows

### 5. Connect Your Frontend

Update your frontend application to connect to the Supabase project:

1. Ensure your `.env` file contains the correct credentials:
   ```
   VITE_SUPABASE_URL=https://cnpgynayzzatfsxlveur.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. In your React application, initialize the Supabase client:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

### 6. Testing Row Level Security (RLS)

To verify that the Row Level Security policies are working correctly:

1. Create a second user account in Supabase Authentication
2. Sign in with this second user in your application
3. Try to access data - you should only see data for organizations this user belongs to
4. Try to modify data with different roles - users with non-admin roles should be restricted

## Schema Overview

The database schema includes:

- **organizations**: Multi-tenant parent table with owner reference
- **app_users**: User profiles linked to Supabase auth.users
- **teams**: Organizational units within companies
- **cloud_accounts**: Provider accounts (AWS, GCP, Azure)
- **resources**: Cloud resources discovered from providers
- **cost_entries**: Cost data for resources
- **schedules**: Resource scheduling for cost savings
- **optimization_recommendations**: Cost-saving suggestions

## Next Steps

After implementing the database:

1. **Implement API Layer**:
   - Set up NestJS project following the PRD specifications
   - Connect to Supabase using the service role key
   - Implement API endpoints as defined in the PRD

2. **Set Up Cloud Integration**:
   - Implement AWS SDK integration for resource discovery
   - Create scheduled jobs for data synchronization
   - Develop secure cloud credentials handling

3. **Implement Scheduling Logic**:
   - Develop the resource scheduling execution engine
   - Create cron jobs to start/stop resources based on schedules
   - Implement savings calculation logic

## Troubleshooting

If you encounter issues:

- **Schema Application Errors**: Check for syntax errors or constraints that might be failing
- **RLS Policy Issues**: Verify that the user has the correct organization_id in app_users
- **Data Insertion Failures**: Ensure all required fields are provided and foreign keys exist
- **Permission Issues**: Confirm that the user has the correct app_role for the attempted action
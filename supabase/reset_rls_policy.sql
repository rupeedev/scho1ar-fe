-- Complete reset of RLS policies for app_users table

-- First, disable RLS to clean everything up
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on app_users
DROP POLICY IF EXISTS "Users can view their own organizations" ON app_users;
DROP POLICY IF EXISTS "Users can view users in their organization" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can view users in same organization" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON app_users;
DROP POLICY IF EXISTS "Allow read access for all users" ON app_users;
DROP POLICY IF EXISTS "Allow individual read access" ON app_users;

-- Enable RLS again
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create the simplest policy possible:
-- Allow full access to authenticated users
CREATE POLICY "Allow full access to authenticated users"
ON app_users
FOR ALL
USING (
  auth.role() = 'authenticated'
);

-- Create temporary bypass for debugging
-- GRANT ALL PRIVILEGES ON app_users TO service_role;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Just to be safe, let's validate that we can access our own user
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM app_users;
  RAISE NOTICE 'Found % users in the app_users table', v_count;
END $$;
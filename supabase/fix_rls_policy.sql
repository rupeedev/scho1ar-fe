-- Fix infinite recursion in app_users RLS policy

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;

-- Create safer policies
-- 1. Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
  ON app_users FOR SELECT 
  USING (id = auth.uid());

-- 2. Allow users to view other users in their organization (with safer check)
CREATE POLICY "Users can view users in same organization" 
  ON app_users FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE id = auth.uid()
    )
  );

-- 3. Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
  ON app_users FOR UPDATE 
  USING (id = auth.uid());

-- 4. Allow admins to manage users in their organization
CREATE POLICY "Admins can manage users in their organization" 
  ON app_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM app_users 
      WHERE 
        id = auth.uid() AND 
        app_role = 'admin' AND
        organization_id = app_users.organization_id
    )
  );
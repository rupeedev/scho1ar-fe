-- Temporary fix to remove foreign key constraint from app_users table
-- This allows user creation without requiring auth.users records
-- TO BE REVERTED once proper Supabase Auth integration is configured

-- First check what data types we're working with
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'id';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'organization_id';

-- Drop the existing table and recreate without foreign key constraint
DROP TABLE IF EXISTS app_users CASCADE;

CREATE TABLE app_users (
  id UUID PRIMARY KEY, -- Removed: REFERENCES auth.users(id)
  organization_id UUID NOT NULL, -- Temporarily remove foreign key: REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE, -- Add email field for proper user identification
  app_role TEXT NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add constraint to validate app_role
  CONSTRAINT valid_app_role CHECK (app_role IN ('admin', 'member', 'viewer'))
);

-- Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create updated RLS policies (fixed versions from fix_rls_policy.sql)
CREATE POLICY "Users can view users in their organization" 
  ON app_users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() AND au.organization_id = app_users.organization_id
    )
  );

CREATE POLICY "Organization admins can manage users" 
  ON app_users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() 
      AND au.organization_id = app_users.organization_id 
      AND au.app_role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX idx_app_users_org_id ON app_users(organization_id);
CREATE INDEX idx_app_users_role ON app_users(app_role);
CREATE INDEX idx_app_users_display_name ON app_users(display_name);

-- Note: This removes the automatic trigger since we no longer have foreign key to auth.users
-- User creation will be handled manually by the backend API
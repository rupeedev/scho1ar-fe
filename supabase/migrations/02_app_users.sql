-- Migration for app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
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

-- Create policies for multi-tenant model
-- Users can view other users in their organization
CREATE POLICY "Users can view users in their organization" 
  ON app_users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() AND au.organization_id = app_users.organization_id
    )
  );

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
  ON app_users FOR UPDATE 
  USING (id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_app_users_organization_id ON app_users(organization_id);

-- Create function to handle new user signup and automatically add them to app_users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_users (id, organization_id, display_name, app_role)
  VALUES (
    NEW.id, 
    (SELECT id FROM organizations WHERE owner_user_id = NEW.id LIMIT 1),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    CASE WHEN EXISTS (SELECT 1 FROM organizations WHERE owner_user_id = NEW.id)
      THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_user();
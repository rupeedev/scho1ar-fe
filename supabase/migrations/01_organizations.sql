-- Migration for organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_plan TEXT NOT NULL DEFAULT 'free_trial',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Allow users to view organizations they are a member of
CREATE POLICY "Users can view their own organizations" 
  ON organizations FOR SELECT 
  USING (auth.uid() = owner_user_id);

-- Only organization owner can update their organization
CREATE POLICY "Organization owners can update their organizations" 
  ON organizations FOR UPDATE 
  USING (auth.uid() = owner_user_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_organizations_owner_user_id ON organizations(owner_user_id);
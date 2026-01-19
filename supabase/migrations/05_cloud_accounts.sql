-- Migration for cloud_accounts table
CREATE TABLE IF NOT EXISTS cloud_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  account_id_on_provider TEXT NOT NULL,
  access_type TEXT NOT NULL,
  credentials_vault_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification',
  last_synced_at TIMESTAMPTZ,
  permission_type TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add constraints to validate fields
  CONSTRAINT valid_provider CHECK (provider IN ('AWS', 'GCP', 'AZURE')),
  CONSTRAINT valid_access_type CHECK (access_type IN ('access_key', 'role_arn')),
  CONSTRAINT valid_status CHECK (status IN ('pending_verification', 'active', 'syncing', 'error')),
  CONSTRAINT valid_permission_type CHECK (permission_type IN ('default', 'read-only'))
);

-- Enable Row Level Security
ALTER TABLE cloud_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view cloud accounts in their organization
CREATE POLICY "Users can view cloud accounts in their organization" 
  ON cloud_accounts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() AND au.organization_id = cloud_accounts.organization_id
    )
  );

-- Only admins can manage cloud accounts
CREATE POLICY "Admins can manage cloud accounts" 
  ON cloud_accounts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() 
        AND au.organization_id = cloud_accounts.organization_id
        AND au.app_role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_cloud_accounts_updated_at
  BEFORE UPDATE ON cloud_accounts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_cloud_accounts_organization_id ON cloud_accounts(organization_id);
CREATE INDEX idx_cloud_accounts_provider ON cloud_accounts(provider);
CREATE INDEX idx_cloud_accounts_account_id_on_provider ON cloud_accounts(account_id_on_provider);
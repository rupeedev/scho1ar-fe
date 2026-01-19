-- Migration for resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
  provider_resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  name TEXT,
  region TEXT NOT NULL,
  tags JSONB DEFAULT '{}',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  status_on_provider TEXT,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add unique constraint to prevent duplicates
  UNIQUE (cloud_account_id, provider_resource_id)
);

-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view resources in their organization
CREATE POLICY "Users can view resources in their organization" 
  ON resources FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM cloud_accounts ca
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE ca.id = resources.cloud_account_id AND au.id = auth.uid()
    )
  );

-- Only admins can modify resources
CREATE POLICY "Admins can modify resources" 
  ON resources FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM cloud_accounts ca
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE ca.id = resources.cloud_account_id 
        AND au.id = auth.uid()
        AND au.app_role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_resources_cloud_account_id ON resources(cloud_account_id);
CREATE INDEX idx_resources_provider_resource_id ON resources(provider_resource_id);
CREATE INDEX idx_resources_resource_type ON resources(resource_type);
CREATE INDEX idx_resources_region ON resources(region);
CREATE INDEX idx_resources_team_id ON resources(team_id);
CREATE INDEX idx_resources_status_on_provider ON resources(status_on_provider);
CREATE INDEX idx_resources_tags ON resources USING GIN (tags);
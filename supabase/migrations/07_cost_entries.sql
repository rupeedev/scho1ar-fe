-- Migration for cost_entries table
CREATE TABLE IF NOT EXISTS cost_entries (
  id BIGSERIAL PRIMARY KEY,
  cloud_account_id UUID NOT NULL REFERENCES cloud_accounts(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service_name TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  cost NUMERIC(12, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  granularity TEXT NOT NULL,
  
  -- Add unique constraint to prevent duplicates
  UNIQUE (cloud_account_id, resource_id, date, service_name, usage_type, granularity),
  
  -- Add constraint to validate granularity
  CONSTRAINT valid_granularity CHECK (granularity IN ('DAILY', 'MONTHLY'))
);

-- Enable Row Level Security
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view cost entries in their organization
CREATE POLICY "Users can view cost entries in their organization" 
  ON cost_entries FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM cloud_accounts ca
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE ca.id = cost_entries.cloud_account_id AND au.id = auth.uid()
    )
  );

-- Only system or admins can insert/update cost entries
CREATE POLICY "Admins can modify cost entries" 
  ON cost_entries FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM cloud_accounts ca
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE ca.id = cost_entries.cloud_account_id 
        AND au.id = auth.uid()
        AND au.app_role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_cost_entries_cloud_account_id ON cost_entries(cloud_account_id);
CREATE INDEX idx_cost_entries_resource_id ON cost_entries(resource_id);
CREATE INDEX idx_cost_entries_date ON cost_entries(date);
CREATE INDEX idx_cost_entries_service_name ON cost_entries(service_name);
CREATE INDEX idx_cost_entries_granularity ON cost_entries(granularity);
CREATE INDEX idx_cost_entries_combined ON cost_entries(cloud_account_id, date, granularity);
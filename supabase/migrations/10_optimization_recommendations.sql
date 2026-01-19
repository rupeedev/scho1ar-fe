-- Migration for optimization_recommendations table
CREATE TABLE IF NOT EXISTS optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  potential_monthly_savings NUMERIC(12, 6),
  details JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Add constraint to validate status
  CONSTRAINT valid_status CHECK (status IN ('pending', 'applied', 'ignored', 'error'))
);

-- Enable Row Level Security
ALTER TABLE optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view recommendations in their organization
CREATE POLICY "Users can view recommendations in their organization" 
  ON optimization_recommendations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      JOIN cloud_accounts ca ON r.cloud_account_id = ca.id
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE r.id = optimization_recommendations.resource_id AND au.id = auth.uid()
    )
  );

-- Only admins can modify recommendations
CREATE POLICY "Admins can modify recommendations" 
  ON optimization_recommendations FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM resources r
      JOIN cloud_accounts ca ON r.cloud_account_id = ca.id
      JOIN app_users au ON ca.organization_id = au.organization_id
      WHERE r.id = optimization_recommendations.resource_id 
        AND au.id = auth.uid()
        AND au.app_role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_optimization_recommendations_updated_at
  BEFORE UPDATE ON optimization_recommendations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_optimization_recommendations_resource_id ON optimization_recommendations(resource_id);
CREATE INDEX idx_optimization_recommendations_type ON optimization_recommendations(type);
CREATE INDEX idx_optimization_recommendations_status ON optimization_recommendations(status);
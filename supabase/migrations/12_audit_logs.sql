-- Migration for audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_resource_type TEXT,
  target_resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view audit logs in their organization
CREATE POLICY "Users can view audit logs in their organization" 
  ON audit_logs FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id FROM app_users WHERE id = auth.uid()
    )
  );

-- Only system and admins can insert audit logs
CREATE POLICY "Admins can insert audit logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM app_users 
      WHERE id = auth.uid() AND app_role = 'admin'
    ) OR 
    user_id = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_resource_type ON audit_logs(target_resource_type);

-- Create function to log user actions automatically
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_details JSONB;
BEGIN
  -- Get the user's organization ID
  SELECT organization_id INTO v_org_id FROM app_users WHERE id = auth.uid();
  
  -- Create a details object based on the operation
  IF (TG_OP = 'INSERT') THEN
    v_details = jsonb_build_object('new_record', row_to_json(NEW));
  ELSIF (TG_OP = 'UPDATE') THEN
    v_details = jsonb_build_object('old_record', row_to_json(OLD), 'new_record', row_to_json(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    v_details = jsonb_build_object('old_record', row_to_json(OLD));
  END IF;
  
  -- Insert the audit log
  INSERT INTO audit_logs (
    user_id, 
    organization_id, 
    action_type, 
    target_resource_type, 
    target_resource_id, 
    details
  ) VALUES (
    auth.uid(),
    v_org_id,
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (row_to_json(OLD)->>'id')
      ELSE (row_to_json(NEW)->>'id')
    END,
    v_details
  );
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of applying the audit log trigger to important tables
-- These triggers would typically be added to each table in their respective migration files
-- but are presented here for reference
/*
CREATE TRIGGER audit_log_organizations
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE log_user_action();

CREATE TRIGGER audit_log_cloud_accounts
  AFTER INSERT OR UPDATE OR DELETE ON cloud_accounts
  FOR EACH ROW EXECUTE PROCEDURE log_user_action();

CREATE TRIGGER audit_log_resources
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH ROW EXECUTE PROCEDURE log_user_action();

CREATE TRIGGER audit_log_schedules
  AFTER INSERT OR UPDATE OR DELETE ON schedules
  FOR EACH ROW EXECUTE PROCEDURE log_user_action();
*/
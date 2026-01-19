-- Migration for schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  schedule_mode TEXT NOT NULL DEFAULT 'Weekly Timesheet',
  definition JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_savings_percentage NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view schedules in their organization
CREATE POLICY "Users can view schedules in their organization" 
  ON schedules FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() AND au.organization_id = schedules.organization_id
    )
  );

-- Only organization admins can modify schedules
CREATE POLICY "Admins can modify schedules" 
  ON schedules FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() 
        AND au.organization_id = schedules.organization_id
        AND au.app_role = 'admin'
    )
  );

-- Team leads can modify schedules for their teams
CREATE POLICY "Team leads can modify their team schedules" 
  ON schedules FOR ALL 
  USING (
    schedules.team_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = schedules.team_id 
        AND tm.user_id = auth.uid()
        AND tm.role_in_team = 'lead'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_schedules_organization_id ON schedules(organization_id);
CREATE INDEX idx_schedules_team_id ON schedules(team_id);
CREATE INDEX idx_schedules_is_active ON schedules(is_active);
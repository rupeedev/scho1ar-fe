-- Migration for scheduled_resources junction table
CREATE TABLE IF NOT EXISTS scheduled_resources (
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  
  -- Composite primary key
  PRIMARY KEY (schedule_id, resource_id)
);

-- Enable Row Level Security
ALTER TABLE scheduled_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view scheduled resources in their organization
CREATE POLICY "Users can view scheduled resources in their organization" 
  ON scheduled_resources FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN app_users au ON s.organization_id = au.organization_id
      WHERE s.id = scheduled_resources.schedule_id AND au.id = auth.uid()
    )
  );

-- Only admins can manage scheduled resources
CREATE POLICY "Admins can manage scheduled resources" 
  ON scheduled_resources FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN app_users au ON s.organization_id = au.organization_id
      WHERE s.id = scheduled_resources.schedule_id 
        AND au.id = auth.uid()
        AND au.app_role = 'admin'
    )
  );

-- Team leads can manage scheduled resources for their teams
CREATE POLICY "Team leads can manage their team scheduled resources" 
  ON scheduled_resources FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      JOIN team_members tm ON s.team_id = tm.team_id
      WHERE s.id = scheduled_resources.schedule_id 
        AND tm.user_id = auth.uid()
        AND tm.role_in_team = 'lead'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_scheduled_resources_schedule_id ON scheduled_resources(schedule_id);
CREATE INDEX idx_scheduled_resources_resource_id ON scheduled_resources(resource_id);
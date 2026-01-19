-- Migration for team_members junction table
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role_in_team TEXT NOT NULL DEFAULT 'member',
  
  -- Composite primary key
  PRIMARY KEY (team_id, user_id),
  
  -- Add constraint to validate role_in_team
  CONSTRAINT valid_role_in_team CHECK (role_in_team IN ('lead', 'member'))
);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view team members in their organization
CREATE POLICY "Users can view team members in their organization" 
  ON team_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN app_users au ON t.organization_id = au.organization_id
      WHERE t.id = team_members.team_id AND au.id = auth.uid()
    )
  );

-- Only organization admins and team leads can modify team members
CREATE POLICY "Admins and team leads can modify team members" 
  ON team_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN app_users au ON t.organization_id = au.organization_id
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = auth.uid()
      WHERE t.id = team_members.team_id 
        AND (au.app_role = 'admin' OR (tm.role_in_team = 'lead' AND tm.user_id = auth.uid()))
        AND au.id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
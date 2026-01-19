-- Complete CostPie database schema implementation
-- This file combines all migration files into one executable script

-- Migration 1: organizations
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

-- Migration 2: app_users
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

-- Migration 3: teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can view teams in their organization
CREATE POLICY "Users can view teams in their organization" 
  ON teams FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() AND au.organization_id = teams.organization_id
    )
  );

-- Only organization admins can modify teams
CREATE POLICY "Admins can modify teams" 
  ON teams FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM app_users au 
      WHERE au.id = auth.uid() 
        AND au.organization_id = teams.organization_id
        AND au.app_role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_teams_organization_id ON teams(organization_id);

-- Migration 4: team_members
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

-- Migration 5: cloud_accounts
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

-- Migration 6: resources
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

-- Migration 7: cost_entries
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

-- Migration 8: schedules
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

-- Migration 9: scheduled_resources
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

-- Migration 10: optimization_recommendations
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

-- Migration 11: app_settings
CREATE TABLE IF NOT EXISTS app_settings (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  settings_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for multi-tenant model
-- Users can only view and update their own settings
CREATE POLICY "Users can view their own settings" 
  ON app_settings FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" 
  ON app_settings FOR ALL 
  USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to automatically create settings for new users
CREATE OR REPLACE FUNCTION create_default_user_settings() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO app_settings (user_id, settings_data)
  VALUES (
    NEW.id, 
    jsonb_build_object(
      'theme', 'light',
      'notifications', jsonb_build_object(
        'email', true,
        'cost_alerts', true,
        'schedule_actions', true
      ),
      'timezone', 'UTC',
      'dashboard_preferences', jsonb_build_object(
        'default_view', 'cost_trend',
        'default_date_range', '30d'
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_app_user_created
  AFTER INSERT ON app_users
  FOR EACH ROW
  EXECUTE PROCEDURE create_default_user_settings();

-- Migration 12: audit_logs
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

-- Apply the audit log triggers to key tables
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
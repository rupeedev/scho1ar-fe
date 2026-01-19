-- Migration for app_settings table
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
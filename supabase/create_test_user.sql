-- Create a test user profile for a specific auth user

-- Step 1: Find out the auth user's ID
DO $$
DECLARE
  v_auth_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Get the ID of your existing auth user (adjust the email to match your user)
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'rupesh.panwwar@gmail.com';
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Auth user not found with that email address.';
    RETURN;
  END IF;
  
  -- Check if we already have an organization for this user
  SELECT id INTO v_org_id 
  FROM organizations 
  WHERE owner_user_id = v_auth_user_id;
  
  -- Create an organization if needed
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (
      name, 
      owner_user_id, 
      subscription_plan
    ) VALUES (
      'Rupesh Test Organization', 
      v_auth_user_id, 
      'free_trial'
    ) RETURNING id INTO v_org_id;
    
    RAISE NOTICE 'Created organization with ID: %', v_org_id;
  ELSE
    RAISE NOTICE 'Using existing organization with ID: %', v_org_id;
  END IF;
  
  -- Check if the user already has a profile
  IF EXISTS (SELECT 1 FROM app_users WHERE id = v_auth_user_id) THEN
    -- Update existing profile
    UPDATE app_users
    SET 
      organization_id = v_org_id,
      app_role = 'admin',
      display_name = 'Rupesh Panwar',
      updated_at = now()
    WHERE id = v_auth_user_id;
    
    RAISE NOTICE 'Updated existing user profile for auth ID: %', v_auth_user_id;
  ELSE
    -- Create a new app_user profile
    INSERT INTO app_users (
      id,
      organization_id,
      app_role,
      display_name
    ) VALUES (
      v_auth_user_id,
      v_org_id,
      'admin',
      'Rupesh Panwar'
    );
    
    RAISE NOTICE 'Created new user profile for auth ID: %', v_auth_user_id;
  END IF;

  -- Create a team for the organization if it doesn't exist yet
  IF NOT EXISTS (SELECT 1 FROM teams WHERE organization_id = v_org_id LIMIT 1) THEN
    -- Create Engineering team
    WITH new_team AS (
      INSERT INTO teams (organization_id, name)
      VALUES (v_org_id, 'Engineering')
      RETURNING id
    )
    -- Add user to the team
    INSERT INTO team_members (team_id, user_id, role_in_team)
    SELECT id, v_auth_user_id, 'lead'
    FROM new_team;
    
    RAISE NOTICE 'Created Engineering team and added user as team lead';
  END IF;
  
END $$;
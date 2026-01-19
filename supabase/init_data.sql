-- CostPie Initial Data Setup
-- Run this script after implementing the schema to create initial test data

-- Variables to store generated UUIDs
DO $$
DECLARE
    v_org_id UUID;
    v_admin_user_id UUID;
    v_eng_team_id UUID;
    v_finance_team_id UUID;
    v_ops_team_id UUID;
    v_aws_account_id UUID;
    v_ec2_resource_id UUID;
    v_rds_resource_id UUID;
    v_s3_resource_id UUID;
    v_schedule_id UUID;
BEGIN
    -- Get or create admin user
    -- First, check if we have an authenticated user already
    SELECT id INTO v_admin_user_id FROM auth.users LIMIT 1;
    
    -- If no user exists, we need to create one (This is a placeholder - in production
    -- you would use Supabase Auth UI or API to create users)
    IF v_admin_user_id IS NULL THEN
        -- This is a placeholder. In actual implementation, you would create a user
        -- through Supabase Auth and then get their ID
        RAISE NOTICE 'No existing user found. Please create a user through Supabase Auth first.';
        RETURN;
    END IF;
    
    -- Create a default organization
    INSERT INTO organizations (name, owner_user_id, subscription_plan)
    VALUES ('Demo Company', v_admin_user_id, 'free_trial')
    RETURNING id INTO v_org_id;
    
    -- Ensure the admin user is linked to the organization
    -- (This might be handled by the trigger, but we'll make sure)
    IF NOT EXISTS (SELECT 1 FROM app_users WHERE id = v_admin_user_id) THEN
        INSERT INTO app_users (id, organization_id, app_role, display_name)
        VALUES (v_admin_user_id, v_org_id, 'admin', 'Admin User');
    END IF;
    
    -- Create teams
    INSERT INTO teams (organization_id, name)
    VALUES (v_org_id, 'Engineering')
    RETURNING id INTO v_eng_team_id;
    
    INSERT INTO teams (organization_id, name)
    VALUES (v_org_id, 'Finance')
    RETURNING id INTO v_finance_team_id;
    
    INSERT INTO teams (organization_id, name)
    VALUES (v_org_id, 'Operations')
    RETURNING id INTO v_ops_team_id;
    
    -- Add admin user to Engineering team as lead
    INSERT INTO team_members (team_id, user_id, role_in_team)
    VALUES (v_eng_team_id, v_admin_user_id, 'lead');
    
    -- Create AWS cloud account
    INSERT INTO cloud_accounts (
        organization_id, 
        name, 
        provider, 
        account_id_on_provider, 
        access_type, 
        credentials_vault_id, 
        status, 
        permission_type
    )
    VALUES (
        v_org_id,
        'Demo AWS Account',
        'AWS',
        '123456789012',
        'role_arn',
        'demo-credential-id', -- In production, this would be a real vault ID
        'active',
        'default'
    )
    RETURNING id INTO v_aws_account_id;
    
    -- Create EC2 instance resource
    INSERT INTO resources (
        cloud_account_id,
        provider_resource_id,
        resource_type,
        name,
        region,
        tags,
        team_id,
        metadata,
        status_on_provider
    )
    VALUES (
        v_aws_account_id,
        'i-0abc123def456789',
        'AWS::EC2::Instance',
        'web-server-prod-1',
        'us-east-1',
        '{"Environment": "Production", "Project": "Website", "CostCenter": "Engineering"}',
        v_eng_team_id,
        '{"InstanceType": "t3.large", "Platform": "Linux", "VCPU": 2, "Memory": 8}',
        'running'
    )
    RETURNING id INTO v_ec2_resource_id;
    
    -- Create RDS instance resource
    INSERT INTO resources (
        cloud_account_id,
        provider_resource_id,
        resource_type,
        name,
        region,
        tags,
        team_id,
        metadata,
        status_on_provider
    )
    VALUES (
        v_aws_account_id,
        'db-prod-postgres-1',
        'AWS::RDS::DBInstance',
        'db-prod-postgres-1',
        'us-east-1',
        '{"Environment": "Production", "Database": "PostgreSQL", "CostCenter": "Engineering"}',
        v_eng_team_id,
        '{"InstanceType": "db.m5.large", "Engine": "postgres", "Storage": 100, "MultiAZ": true}',
        'available'
    )
    RETURNING id INTO v_rds_resource_id;
    
    -- Create S3 bucket resource
    INSERT INTO resources (
        cloud_account_id,
        provider_resource_id,
        resource_type,
        name,
        region,
        tags,
        team_id,
        metadata,
        status_on_provider
    )
    VALUES (
        v_aws_account_id,
        'demo-company-assets',
        'AWS::S3::Bucket',
        'demo-company-assets',
        'us-east-1',
        '{"Environment": "Production", "Purpose": "Assets", "CostCenter": "Operations"}',
        v_ops_team_id,
        '{"StorageClass": "Standard", "Versioning": true, "LastModified": "2023-01-01T00:00:00Z"}',
        'available'
    )
    RETURNING id INTO v_s3_resource_id;
    
    -- Add cost data for the last 30 days
    -- EC2 Instance costs
    FOR i IN 1..30 LOOP
        INSERT INTO cost_entries (
            cloud_account_id,
            resource_id,
            date,
            service_name,
            usage_type,
            cost,
            currency,
            granularity
        )
        VALUES (
            v_aws_account_id,
            v_ec2_resource_id,
            CURRENT_DATE - (i || ' days')::INTERVAL,
            'AmazonEC2',
            'BoxUsage:t3.large',
            5.0 + random() * 3, -- Random daily cost between $5-8
            'USD',
            'DAILY'
        );
    END LOOP;
    
    -- RDS Instance costs
    FOR i IN 1..30 LOOP
        INSERT INTO cost_entries (
            cloud_account_id,
            resource_id,
            date,
            service_name,
            usage_type,
            cost,
            currency,
            granularity
        )
        VALUES (
            v_aws_account_id,
            v_rds_resource_id,
            CURRENT_DATE - (i || ' days')::INTERVAL,
            'AmazonRDS',
            'InstanceUsage:db.m5.large',
            12.0 + random() * 4, -- Random daily cost between $12-16
            'USD',
            'DAILY'
        );
    END LOOP;
    
    -- S3 Bucket costs
    FOR i IN 1..30 LOOP
        INSERT INTO cost_entries (
            cloud_account_id,
            resource_id,
            date,
            service_name,
            usage_type,
            cost,
            currency,
            granularity
        )
        VALUES (
            v_aws_account_id,
            v_s3_resource_id,
            CURRENT_DATE - (i || ' days')::INTERVAL,
            'AmazonS3',
            'StandardStorage',
            0.5 + random() * 0.5, -- Random daily cost between $0.5-1.0
            'USD',
            'DAILY'
        );
    END LOOP;
    
    -- Create a schedule for EC2 instance
    INSERT INTO schedules (
        organization_id,
        team_id,
        name,
        timezone,
        schedule_mode,
        definition,
        is_active,
        estimated_savings_percentage
    )
    VALUES (
        v_org_id,
        v_eng_team_id,
        'Development EC2 Night Shutdown',
        'America/New_York',
        'Weekly Timesheet',
        '{
            "weekdays": {
                "monday": {"start": "09:00", "end": "18:00"},
                "tuesday": {"start": "09:00", "end": "18:00"},
                "wednesday": {"start": "09:00", "end": "18:00"},
                "thursday": {"start": "09:00", "end": "18:00"},
                "friday": {"start": "09:00", "end": "18:00"},
                "saturday": null,
                "sunday": null
            }
        }',
        TRUE,
        65.0 -- Estimated savings percentage
    )
    RETURNING id INTO v_schedule_id;
    
    -- Assign resource to schedule
    INSERT INTO scheduled_resources (schedule_id, resource_id)
    VALUES (v_schedule_id, v_ec2_resource_id);
    
    -- Create a sample optimization recommendation
    INSERT INTO optimization_recommendations (
        resource_id,
        type,
        description,
        potential_monthly_savings,
        details,
        status
    )
    VALUES (
        v_ec2_resource_id,
        'RIGHTSIZE_EC2',
        'This instance is underutilized. Consider downsizing from t3.large to t3.medium.',
        38.54,
        '{
            "current_instance_type": "t3.large",
            "recommended_instance_type": "t3.medium",
            "cpu_utilization_max": "22%",
            "memory_utilization_max": "35%",
            "current_monthly_cost": "77.08",
            "recommended_monthly_cost": "38.54"
        }',
        'pending'
    );
    
    -- Log actions in audit log
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action_type,
        target_resource_type,
        target_resource_id,
        details,
        ip_address
    )
    VALUES (
        v_admin_user_id,
        v_org_id,
        'CREATE_ORGANIZATION',
        'organizations',
        v_org_id::text,
        '{"name": "Demo Company"}',
        '127.0.0.1'
    );
    
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action_type,
        target_resource_type,
        target_resource_id,
        details,
        ip_address
    )
    VALUES (
        v_admin_user_id,
        v_org_id,
        'ADD_CLOUD_ACCOUNT',
        'cloud_accounts',
        v_aws_account_id::text,
        '{"provider": "AWS", "name": "Demo AWS Account"}',
        '127.0.0.1'
    );
    
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action_type,
        target_resource_type,
        target_resource_id,
        details,
        ip_address
    )
    VALUES (
        v_admin_user_id,
        v_org_id,
        'CREATE_SCHEDULE',
        'schedules',
        v_schedule_id::text,
        '{"name": "Development EC2 Night Shutdown"}',
        '127.0.0.1'
    );
    
    RAISE NOTICE 'Demo data setup complete! Organization ID: %', v_org_id;
END $$;
-- CostPie Database Initial Data Setup
-- Run this script after applying the main schema

-- Create default organization
INSERT INTO organizations (name, created_at, updated_at)
VALUES ('Default Organization', NOW(), NOW());

-- Get organization ID for reference
SET @org_id = LAST_INSERT_ID();

-- Create sample teams
INSERT INTO teams (organization_id, name, description, created_at, updated_at)
VALUES 
  (@org_id, 'Engineering', 'Engineering and development team', NOW(), NOW()),
  (@org_id, 'Finance', 'Finance and accounting team', NOW(), NOW()),
  (@org_id, 'Operations', 'Operations and infrastructure team', NOW(), NOW());

-- Save team IDs for reference
SET @eng_team_id = LAST_INSERT_ID();
SET @fin_team_id = @eng_team_id + 1;
SET @ops_team_id = @eng_team_id + 2;

-- Create sample users
INSERT INTO users (email, name, password_hash, role, organization_id, created_at, updated_at)
VALUES
  ('admin@costpie.com', 'Admin User', SHA2('admin123', 256), 'ADMIN', @org_id, NOW(), NOW()),
  ('user@costpie.com', 'Regular User', SHA2('user123', 256), 'USER', @org_id, NOW(), NOW());

-- Get user IDs for reference
SET @admin_id = LAST_INSERT_ID();
SET @user_id = @admin_id + 1;

-- Assign users to teams
INSERT INTO team_users (team_id, user_id, created_at, updated_at)
VALUES
  (@eng_team_id, @admin_id, NOW(), NOW()),
  (@fin_team_id, @admin_id, NOW(), NOW()),
  (@ops_team_id, @user_id, NOW(), NOW());

-- Create AWS cloud account
INSERT INTO cloud_accounts (organization_id, name, provider, account_id, status, credentials_json, created_at, updated_at)
VALUES
  (@org_id, 'Production AWS', 'AWS', '123456789012', 'ACTIVE', 
   '{"access_key_id": "AKIAIOSFODNN7EXAMPLE", "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"}',
   NOW(), NOW());

-- Get cloud account ID for reference
SET @aws_id = LAST_INSERT_ID();

-- Create sample resources
INSERT INTO resources (cloud_account_id, name, resource_type, region, instance_id, status, metadata_json, created_at, updated_at)
VALUES
  (@aws_id, 'api-server-1', 'EC2', 'us-west-2', 'i-0123456789abcdef0', 'RUNNING', 
   '{"instance_type": "t3.medium", "ami": "ami-0c55b159cbfafe1f0", "launch_time": "2023-01-01T00:00:00Z"}',
   NOW(), NOW()),
  (@aws_id, 'db-server-1', 'RDS', 'us-west-2', 'db-abc123def456', 'RUNNING', 
   '{"instance_type": "db.t3.large", "engine": "postgres", "version": "13.7"}',
   NOW(), NOW()),
  (@aws_id, 'storage-bucket', 'S3', 'us-east-1', 'costpie-storage-bucket', 'ACTIVE', 
   '{"creation_date": "2023-01-01T00:00:00Z", "versioning": "Enabled"}',
   NOW(), NOW());

-- Get resource IDs for reference
SET @ec2_id = LAST_INSERT_ID();
SET @rds_id = @ec2_id + 1;
SET @s3_id = @ec2_id + 2;

-- Create resource cost data
INSERT INTO resource_costs (resource_id, date, amount, currency, created_at, updated_at)
VALUES
  (@ec2_id, CURDATE() - INTERVAL 7 DAY, 12.50, 'USD', NOW(), NOW()),
  (@ec2_id, CURDATE() - INTERVAL 6 DAY, 12.75, 'USD', NOW(), NOW()),
  (@ec2_id, CURDATE() - INTERVAL 5 DAY, 13.00, 'USD', NOW(), NOW()),
  (@rds_id, CURDATE() - INTERVAL 7 DAY, 25.10, 'USD', NOW(), NOW()),
  (@rds_id, CURDATE() - INTERVAL 6 DAY, 25.10, 'USD', NOW(), NOW()),
  (@rds_id, CURDATE() - INTERVAL 5 DAY, 25.10, 'USD', NOW(), NOW()),
  (@s3_id, CURDATE() - INTERVAL 7 DAY, 5.25, 'USD', NOW(), NOW()),
  (@s3_id, CURDATE() - INTERVAL 6 DAY, 5.30, 'USD', NOW(), NOW()),
  (@s3_id, CURDATE() - INTERVAL 5 DAY, 5.40, 'USD', NOW(), NOW());

-- Create resource tags
INSERT INTO tags (resource_id, key, value, created_at, updated_at)
VALUES
  (@ec2_id, 'Environment', 'Production', NOW(), NOW()),
  (@ec2_id, 'Department', 'Engineering', NOW(), NOW()),
  (@rds_id, 'Environment', 'Production', NOW(), NOW()),
  (@rds_id, 'Department', 'Engineering', NOW(), NOW()),
  (@s3_id, 'Environment', 'Production', NOW(), NOW()),
  (@s3_id, 'Department', 'Operations', NOW(), NOW());

-- Create sample schedule for EC2 instance
INSERT INTO schedules (name, description, resource_id, created_by, schedule_type, cron_expression, enabled, created_at, updated_at)
VALUES
  ('Night Shutdown', 'Turn off EC2 instance during non-business hours', @ec2_id, @admin_id, 'SHUTDOWN', 
   '0 20 * * 1-5', TRUE, NOW(), NOW());

-- Get schedule ID for reference
SET @schedule_id = LAST_INSERT_ID();

-- Create schedule history
INSERT INTO schedule_executions (schedule_id, execution_time, status, details, created_at, updated_at)
VALUES
  (@schedule_id, NOW() - INTERVAL 1 DAY, 'SUCCESS', 'Instance stopped successfully', NOW(), NOW()),
  (@schedule_id, NOW() - INTERVAL 2 DAY, 'SUCCESS', 'Instance stopped successfully', NOW(), NOW()),
  (@schedule_id, NOW() - INTERVAL 3 DAY, 'FAILED', 'API timeout error', NOW(), NOW());

-- Create sample audit logs
INSERT INTO audit_logs (user_id, organization_id, action, entity_type, entity_id, details, created_at)
VALUES
  (@admin_id, @org_id, 'CREATE', 'CLOUD_ACCOUNT', @aws_id, 'Added new AWS account', NOW()),
  (@admin_id, @org_id, 'CREATE', 'SCHEDULE', @schedule_id, 'Created night shutdown schedule', NOW()),
  (@user_id, @org_id, 'VIEW', 'RESOURCE', @ec2_id, 'Viewed EC2 resource details', NOW());
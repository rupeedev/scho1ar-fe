-- Add forecast-related fields to cost_entries table
-- This migration adds support for storing both actual and forecasted cost data

ALTER TABLE cost_entries 
ADD COLUMN is_forecast BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN forecast_confidence_level INTEGER,
ADD COLUMN forecast_lower_bound DECIMAL(10,2),
ADD COLUMN forecast_upper_bound DECIMAL(10,2),
ADD COLUMN forecast_method VARCHAR(50),
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_cost_entries_date_account ON cost_entries(date, cloud_account_id);
CREATE INDEX idx_cost_entries_is_forecast ON cost_entries(is_forecast);
CREATE INDEX idx_cost_entries_forecast_method ON cost_entries(forecast_method);

-- Add comments for documentation
COMMENT ON COLUMN cost_entries.is_forecast IS 'Indicates whether this entry represents actual costs (false) or forecasted costs (true)';
COMMENT ON COLUMN cost_entries.forecast_confidence_level IS 'Confidence level percentage for forecast (e.g., 80 for 80% confidence)';
COMMENT ON COLUMN cost_entries.forecast_lower_bound IS 'Lower bound of the forecast confidence interval';
COMMENT ON COLUMN cost_entries.forecast_upper_bound IS 'Upper bound of the forecast confidence interval';
COMMENT ON COLUMN cost_entries.forecast_method IS 'Method used for forecasting: aws-api, trend-based, or resource-based';

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_cost_entries_updated_at
    BEFORE UPDATE ON cost_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add a check constraint to ensure forecast fields are consistent
ALTER TABLE cost_entries 
ADD CONSTRAINT check_forecast_consistency 
CHECK (
    (is_forecast = FALSE AND forecast_confidence_level IS NULL AND forecast_lower_bound IS NULL AND forecast_upper_bound IS NULL AND forecast_method IS NULL)
    OR 
    (is_forecast = TRUE AND forecast_method IS NOT NULL)
);

-- Add sample forecast data for testing (optional - can be removed in production)
-- This adds some sample forecast data for demonstration purposes
INSERT INTO cost_entries (
    cloud_account_id, 
    date, 
    cost, 
    currency, 
    service_name, 
    usage_type, 
    granularity,
    is_forecast,
    forecast_confidence_level,
    forecast_lower_bound,
    forecast_upper_bound,
    forecast_method
) 
SELECT 
    ca.id as cloud_account_id,
    CURRENT_DATE + (seq || ' days')::interval as date,
    ROUND((150 + (RANDOM() * 50))::numeric, 2) as cost,
    'USD' as currency,
    'EC2-Instance' as service_name,
    'BoxUsage' as usage_type,
    'DAILY' as granularity,
    TRUE as is_forecast,
    80 as forecast_confidence_level,
    ROUND((130 + (RANDOM() * 40))::numeric, 2) as forecast_lower_bound,
    ROUND((170 + (RANDOM() * 60))::numeric, 2) as forecast_upper_bound,
    'trend-based' as forecast_method
FROM 
    cloud_accounts ca
    CROSS JOIN generate_series(1, 30) as seq
WHERE ca.provider = 'aws'
LIMIT 100; -- Limit to prevent too much test data
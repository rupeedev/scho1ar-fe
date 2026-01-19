#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "Testing connection to Supabase..."
echo "URL: $VITE_SUPABASE_URL"

# Format API endpoint
API_ENDPOINT="${VITE_SUPABASE_URL}/rest/v1/"

# Test connection with anon key
echo "Testing with anon key..."
ANON_RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY")

echo "Anon key response: $ANON_RESULT"

# Test connection with service role key
echo "Testing with service role key..."
SERVICE_RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

echo "Service role key response: $SERVICE_RESULT"

# Test SQL endpoint with service role key
echo "Testing SQL endpoint with service role key..."
SQL_ENDPOINT="${VITE_SUPABASE_URL}/rest/v1/sql"

# Run a simple query
echo "Running test query..."
curl -s "$SQL_ENDPOINT" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT current_timestamp;"}' | jq

echo "Connection test complete."
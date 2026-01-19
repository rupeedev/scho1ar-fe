#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Check for required environment variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
  exit 1
fi

echo "Applying database schema to $VITE_SUPABASE_URL..."

# Extract the project reference
PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed -E 's/https:\/\/([^.]+)\.supabase\.co.*/\1/')

# Format the SQL endpoint
SQL_ENDPOINT="${VITE_SUPABASE_URL}/rest/v1/sql"

# Run the SQL script using the REST API
curl -s -X POST "${SQL_ENDPOINT}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(cat supabase/complete_schema.sql | jq -s -R .)}" \
  -o /tmp/supabase_response.json

# Check for errors
if grep -q "error" /tmp/supabase_response.json; then
  echo "Error applying schema:"
  cat /tmp/supabase_response.json
  exit 1
else
  echo "Schema applied successfully!"
fi

# Clean up
rm /tmp/supabase_response.json

echo "Database schema has been implemented successfully."
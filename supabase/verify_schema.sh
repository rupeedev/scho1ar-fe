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

echo "Verifying database schema on $VITE_SUPABASE_URL..."

# Format the SQL endpoint
SQL_ENDPOINT="${VITE_SUPABASE_URL}/rest/v1/sql"

# SQL to list all tables in the public schema
TABLES_SQL="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Run the SQL query
echo "Listing tables in public schema:"
curl -s -X POST "${SQL_ENDPOINT}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${TABLES_SQL}\"}" | jq -r '.[] | .table_name'

echo -e "\nVerification complete."
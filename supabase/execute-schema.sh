#!/bin/bash
# Script to execute SQL schema via pgcli or psql

# Prompt for database password
echo "Enter your Supabase PostgreSQL database password:"
read -s DB_PASSWORD

# Extract connection info from environment variables
if [ -f ../.env ]; then
  source ../.env
else
  echo "Error: .env file not found"
  exit 1
fi

# Get database connection info
PGHOST="db.cnpgynayzzatfsxlveur.supabase.co"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="postgres"
PGPASSWORD="$DB_PASSWORD"

# Check if pgcli is installed
if command -v pgcli &> /dev/null; then
  echo "Using pgcli to execute schema..."
  pgcli -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f complete_schema.sql
elif command -v psql &> /dev/null; then
  echo "Using psql to execute schema..."
  PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f complete_schema.sql
else
  echo "Error: Neither pgcli nor psql is installed. Please install one of these tools."
  exit 1
fi

echo "Schema execution completed."
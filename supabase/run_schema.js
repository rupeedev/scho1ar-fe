// Script to execute schema SQL via Supabase JS client
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// Initialize Supabase client with service role key (full access)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read SQL file
const schemaFilePath = path.join(__dirname, 'complete_schema.sql');
const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');

// Split the SQL into manageable chunks (PostgreSQL has limits on query size)
// This is a simple splitting that might need adjustment based on your SQL
const sqlStatements = schemaSql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0)
  .map(stmt => stmt + ';');

async function executeSchema() {
  console.log(`Applying database schema to ${supabaseUrl}...`);
  
  // Execute each SQL statement
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    const shortStmt = statement.length > 50 ? statement.substring(0, 47) + '...' : statement;
    
    try {
      console.log(`Executing statement ${i+1}/${sqlStatements.length}: ${shortStmt}`);
      
      // Execute with rpc call
      const { data, error } = await supabase.rpc('pgcli_execute', { 
        sql_string: statement
      });
      
      if (error) {
        console.error(`Error executing statement ${i+1}:`, error);
      } else {
        console.log(`Statement ${i+1} executed successfully`);
      }
    } catch (err) {
      console.error(`Exception executing statement ${i+1}:`, err);
    }
  }
  
  console.log('Schema application complete!');
}

executeSchema().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
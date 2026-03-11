const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', '003_add_premium_features.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If rpc exec_sql is not available, we might need another way or just report it
    console.error('Error applying migration via RPC:', error);
    console.log('Note: If "exec_sql" is missing, you may need to apply the SQL via Supabase Dashboard UI.');
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();

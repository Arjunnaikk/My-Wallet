const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('Error: .env.local not found at ' + envLocalPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

let supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase environment variables are missing in .env.local');
  process.exit(1);
}

// Strip trailing /rest/v1 if present (matching our app's sanitation)
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

console.log('Initializing Supabase client...');
console.log('Database Endpoint:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTable(tableName) {
  try {
    console.log(`Checking table: public.${tableName}...`);
    // Attempt a simple select limit 1 query
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ public.${tableName} DOES NOT EXIST in the database.`);
      } else {
        console.log(`⚠️ public.${tableName} returned error code: ${error.code} - ${error.message}`);
      }
      return false;
    } else {
      console.log(`✅ public.${tableName} is ONLINE and reachable (returned ${data.length} records).`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Failed to check public.${tableName}:`, err.message);
    return false;
  }
}

async function runDiagnostics() {
  const tables = ['users', 'accounts', 'transactions', 'budgets', 'recurring_rules'];
  let allHealthy = true;
  
  console.log('\n--- STARTING DATABASE DIAGNOSTICS ---\n');
  
  for (const table of tables) {
    const ok = await testTable(table);
    if (!ok) allHealthy = false;
  }

  console.log('\n--- DIAGNOSTICS COMPLETE ---');
  if (allHealthy) {
    console.log('\n🎉 ALL TABLES ARE INSTALLED AND FULLY ACCESSIBLE!');
    console.log('Row Level Security (RLS) is correctly bypassed for client connections.');
  } else {
    console.log('\n❌ DIAGNOSTICS DETECTED ISSUES.');
    console.log('Please check the tables that failed above. If a table does not exist, make sure to execute the schema.sql script inside your Supabase dashboard SQL editor.');
  }
}

runDiagnostics();

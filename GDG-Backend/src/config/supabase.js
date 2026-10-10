// Polyfill global WebSocket for Node.js runtimes (< Node 22) required by @supabase/supabase-js
if (typeof globalThis.WebSocket === 'undefined') {
  try {
    globalThis.WebSocket = require('ws');
  } catch (e) {
    // Fallback if ws is not present
  }
}

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      '⚠️ Warning: Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are not fully set.'
    );
  }
}

/**
 * Public Supabase client initialized with the Anon Key.
 * Used for standard client-side/public authentication flows like signup and login.
 */
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Privileged Supabase Admin client initialized with the Service Role Key.
 * Bypasses Row Level Security (RLS). NEVER expose this key or client to the frontend!
 * Used for privileged server-side operations such as inserting user profile rows upon signup
 * and querying profiles for authorization checks.
 */
const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Factory for creating lightweight isolated auth clients per request.
 * Prevents concurrency collisions and shared session mutation.
 */
const createIsolatedAuthClient = () => {
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
};

module.exports = {
  supabase,
  supabaseAdmin,
  createIsolatedAuthClient,
};

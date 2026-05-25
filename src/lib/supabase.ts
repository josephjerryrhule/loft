import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Use Service Role Key on the server side if available to bypass storage RLS,
// otherwise fallback to the public anon key for general or client-side operations.
const supabaseKey = (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "");

// Safely export supabase client; if keys are missing, methods will likely fail at runtime
// but it won't crash the app on import.
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : createClient("https://placeholder.supabase.co", "placeholder") as any;

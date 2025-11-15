import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bllpgaokqowdkfqkbmbw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbHBnYW9rcW93ZGtmcWtibWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMTkzMDgsImV4cCI6MjA3Mzg5NTMwOH0.B1L6ukIpPURNkTIYUF0yzZz_4fdVS6GLhvPi8uq-41s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

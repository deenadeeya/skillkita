import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'YOUR_URL';
const SUPABASE_ANON_KEY = 'YOUR_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
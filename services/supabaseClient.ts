import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ovwzemzsxzidalyimwek.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5XASelvL1KW5kK95g-nUFw_gHjhNFgJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
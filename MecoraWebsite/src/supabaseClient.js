import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://itcgezjgxgfxpslopjcl.supabase.co';
const supabaseAnonKey = 'sb_publishable_JnxUP5KHpBXkfRUCYcPnYg__8egRXsD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
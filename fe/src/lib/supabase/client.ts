import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wizxeqvstppfyixzgzah.supabase.co'!;
const supabaseKey = 'sb_publishable_eQT0T7g8ed2f_hzQb3O9cw_7FdEzXwT'!;

export const supabase = createClient(supabaseUrl, supabaseKey);   
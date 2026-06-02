import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient('https://wizxeqvstppfyixzgzah.supabase.co'!, process.env.access_key!);   
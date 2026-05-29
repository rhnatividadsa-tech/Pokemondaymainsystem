import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrmqgjkhzhxqalcviueb.supabase.co';
const supabaseAnonKey = 'sb_publishable_qpTlDnHkxNmOaHh8Uci1zQ_f2RqRfT1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwjseeztvqndakqyumjw.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3anNlZXp0dnFuZGFrcXl1bWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1ODI1MzAsImV4cCI6MjA2NjE1ODUzMH0.zcNoCXxgOzhs1o35gRQwrzw8QFT72YSVHT-fCUoeFEQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
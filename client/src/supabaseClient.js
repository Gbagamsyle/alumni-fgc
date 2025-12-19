// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://soktcfebaxubrbrufdhy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva3RjZmViYXh1YnJicnVmZGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTc4MzYsImV4cCI6MjA4MTUzMzgzNn0.oWpxD7q2MqNcpYMFSyrSoMKrzSk3JzN8wB_oWdtObT8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Get these from Supabase dashboard
const supabaseUrl = 'https://mxujxqkzqghxpiknkcso.supabase.co'; // Your project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14dWp4cWt6cWdoeHBpa25rY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDU2NzgsImV4cCI6MjA4OTIyMTY3OH0.8FAnPMsQ_8ziojxyV0fh4Oj3MzhBYaYF2lZdGb1tnFc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase to auto-refresh tokens when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

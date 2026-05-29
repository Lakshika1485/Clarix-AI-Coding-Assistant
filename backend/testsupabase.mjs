import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Test 1: Check if table exists
console.log('Testing Supabase connection...');
const { data: existing, error: fetchError } = await supabase.from('users').select('*').limit(1);
console.log('Fetch result:', existing, 'Error:', fetchError);

// Test 2: Try insert
const { data: newUser, error: insertError } = await supabase
  .from('users')
  .insert({
    oauth_id: 'test_123_' + Date.now(),
    email: 'test@test.com',
    name: 'Test User',
    avatar: null,
    provider: 'google',
    plan: 'free',
    question_count: 0,
    last_reset_date: new Date().toDateString(),
  })
  .select()
  .single();

console.log('Insert result:', newUser);
console.log('Insert error:', insertError);

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://vkhxuqpcpshcedurxoyp.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHh1cXBjcHNoY2VkdXJ4b3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMDgyNTUsImV4cCI6MjA1OTY4NDI1NX0.QN8zijONevuxtgzWMVummJ3EHDikZsFQPy9xOh7IYH8"
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpscvigghepedrzpdqfz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2N2aWdnaGVwZWRyenBkcWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjI4OTIsImV4cCI6MjA5NTI5ODg5Mn0.GGMqk7N3B38nVKtwd942QQy0Tk9gXx4WnTnc9SGigvY";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
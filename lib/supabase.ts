import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xpscvigghepedrzpdqfz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2N2aWdnaGVwZWRyenBkcWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjI4OTIsImV4cCI6MjA5NTI5ODg5Mn0.GGMqk7N3B38nVKtwd942QQy0Tk9gXx4WnTnc9SGigvY";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export async function createUserSettings(
  supabase: any,
  userId: string
) {
  console.log("🔍 userId from app:", userId);

  const { data: sessionData } = await supabase.auth.getUser();
  console.log("🔐 auth.uid from Supabase:", sessionData?.user?.id);

  const { data, error: selectError } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("❌ SELECT ERROR:", selectError);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("settings")
      .insert({
        user_id: userId,
        unsafe_word: "",
        emergency_contact: "",
      });

    if (insertError) {
      console.error("❌ INSERT ERROR:", insertError);
    }
  }
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!active) return;

      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
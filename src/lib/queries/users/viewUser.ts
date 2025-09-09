//Insert View User Code here

import { supabase } from "@/lib/supabase";

 export const getUsers = async () => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    return null;
  }
  return data;
};

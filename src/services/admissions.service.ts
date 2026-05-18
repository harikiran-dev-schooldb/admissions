import { supabase } from "../lib/supabase";


export async function fetchAdmissions() {
  const { data, error } = await supabase
    .from("admissions")
    .select("*");

  if (error) {
    throw error;
  }

  return (data || []).sort((a, b) => {
    const na = parseInt(a.enquiryNo?.split("-").pop() || "0");
    const nb = parseInt(b.enquiryNo?.split("-").pop() || "0");

    return nb - na;
  });
}
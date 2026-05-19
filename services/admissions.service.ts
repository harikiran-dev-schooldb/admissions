import { supabase } from "../lib/supabase";
import { prisma } from "@/lib/prisma";


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


export async function createAdmission(
  data: any
) {
  return prisma.admission.create({
    data,
  });
}
import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      enquiryNo,
      field,
      value,
    } = body;

    if (!enquiryNo || !field) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("admissions")
      .update({
        [field]: value,
      })
      .eq("enquiryNo", enquiryNo);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
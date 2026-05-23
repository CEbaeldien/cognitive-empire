import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { reviewId, action } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Missing reviewId or action" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      await supabase
        .from("review_queue")
        .update({
          review_status: "approved",
        })
        .eq("id", reviewId);

      await supabase
        .from("signals")
        .update({
          publication_status: "approved",
        })
        .eq("review_queue_id", reviewId);
    }

    if (action === "reject") {
      await supabase
        .from("review_queue")
        .update({
          review_status: "rejected",
        })
        .eq("id", reviewId);

      await supabase
        .from("signals")
        .update({
          publication_status: "rejected",
        })
        .eq("review_queue_id", reviewId);
    }

    if (action === "revise") {
      await supabase
        .from("review_queue")
        .update({
          review_status: "needs_revision",
        })
        .eq("id", reviewId);

      await supabase
        .from("signals")
        .update({
          publication_status: "needs_revision",
        })
        .eq("review_queue_id", reviewId);
    }

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
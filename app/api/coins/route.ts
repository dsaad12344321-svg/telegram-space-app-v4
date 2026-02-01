import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const { telegramId, action } = body;

    if (!telegramId) {
      return NextResponse.json({ error: "Missing telegramId" }, { status: 400 });
    }

    // 1️⃣ Get user
    const {
      data: user,
      error: selectError,
    } = await supabaseServer
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    console.log("SELECT:", user, selectError);

    let currentUser = user;

    // 2️⃣ Create user if not exists
    if (!currentUser) {
      const {
        data: newUser,
        error: insertError,
      } = await supabaseServer
        .from("users")
        .insert({
          telegram_id: telegramId,
          coins: 0,
        })
        .select()
        .single();

      console.log("INSERT:", newUser, insertError);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      currentUser = newUser;
    }

    // 3️⃣ Reward
    if (action === "reward") {
      const {
        data: updatedUser,
        error: updateError,
      } = await supabaseServer
        .from("users")
        .update({ coins: currentUser.coins + 1 })
        .eq("telegram_id", telegramId)
        .select()
        .single();

      console.log("UPDATE:", updatedUser, updateError);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedUser);
    }

    return NextResponse.json(currentUser);
  } catch (err) {
    console.error("API FATAL ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

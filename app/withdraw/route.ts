import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const MIN_WITHDRAW = 5000;

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.OWNER_TELEGRAM_ID!;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, coins, walletType, walletNumber } = body;

    if (!telegramId || !coins || !walletType || !walletNumber) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (coins < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: "Minimum withdraw is 5000 coins" },
        { status: 400 }
      );
    }

    // Get user
    const { data: user } = await supabaseServer
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (!user || user.coins < coins) {
      return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
    }

    // Deduct coins
    await supabaseServer
      .from("users")
      .update({ coins: user.coins - coins })
      .eq("telegram_id", telegramId);

    // Create withdraw request
    await supabaseServer.from("withdraw_requests").insert({
      telegram_id: telegramId,
      coins,
      wallet_type: walletType,
      wallet_number: walletNumber,
      status: "pending",
    });

    // Notify owner
    await sendTelegramMessage(
      `📤 طلب تحويل جديد\n\n` +
        `👤 Telegram ID: ${telegramId}\n` +
        `💰 Coins: ${coins}\n` +
        `💳 Wallet: ${walletType}\n` +
        `📱 Number: ${walletNumber}`
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

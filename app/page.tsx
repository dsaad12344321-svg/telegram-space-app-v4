"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram: any;
    show_10544894: () => Promise<void>;
  }
}

export default function Home() {
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);

  // Withdraw
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawCoins, setWithdrawCoins] = useState<number>(0);
  const [walletType, setWalletType] = useState("Vodafone Cash");
  const [walletNumber, setWalletNumber] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;
    if (user?.id) {
      setTelegramId(user.id);
      fetchCoins(user.id);
    }
  }, []);

  const fetchCoins = async (id: number) => {
    const res = await fetch("/api/coins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: id }),
    });

    const data = await res.json();
    setCoins(data.coins ?? 0);
  };

  const showRewardAd = async () => {
    if (!telegramId) return;

    try {
      setLoading(true);
      await window.show_10544894();

      const res = await fetch("/api/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          action: "reward",
        }),
      });

      const data = await res.json();
      setCoins(data.coins);
    } finally {
      setLoading(false);
    }
  };

  // 🔒 Coins input handler
  const handleWithdrawCoinsChange = (value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = clean.replace(/^0+/, "");
    setWithdrawCoins(clean ? Number(clean) : 0);
  };

  const submitWithdraw = async () => {
    console.log("CLICKED CONFIRM");
    if (!telegramId){
      console.log("NO TELEGRAM ID");
     return;
    }
      const coinsNumber = Number(withdrawCoins);
      console.log("COINS:", coinsNumber);
      console.log("WALLET:", walletNumber);
    if (!coinsNumber || coinsNumber < 10) {
      alert("Minimum withdraw is 10 coins");
      return;
  }

    if (!walletNumber) {
      alert("Please enter wallet number");
      return;
    }
    console.log("SENDING REQUEST...");
    try {
      setWithdrawLoading(true);

      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          coins: withdrawCoins,
          walletType,
          walletNumber,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Withdraw request sent ✅\nProcessing within 3 working days");
        setShowWithdraw(false);
        setWithdrawCoins(0);
        setWalletNumber("");
        fetchCoins(telegramId);
      } else {
        alert(data.error);
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-space flex items-center justify-center">
      <div className="glass-card">
        <img src="/eth.jpg" className="logo-img" />

        <div className="coins">💰 {coins} Coins</div>

        <button className="reward-btn" onClick={showRewardAd} disabled={loading}>
          {loading ? "Loading..." : "Get Reward"}
        </button>

        <button
          className="withdraw-btn"
          onClick={() => setShowWithdraw(true)}
        >
          Withdraw
        </button>

        {telegramId && <p className="user-id">ID: {telegramId}</p>}

        {/* Withdraw Box */}
        {showWithdraw && (
          <div className="withdraw-box">
            <h3>Withdraw Coins</h3>

            <label>Coins Amount</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Minimum 10"
              value={withdrawCoins === 0 ? "" : withdrawCoins}
              onChange={(e) =>
                handleWithdrawCoinsChange(e.target.value)
              }
            />

            <label>Wallet Type</label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
            >
              <option>Vodafone Cash</option>
              <option>Orange Cash</option>
              <option>Etisalat Cash</option>
              <option>Fawry</option>
            </select>

            <label>Wallet Number</label>
            <input
              type="text"
              placeholder="01XXXXXXXXX"
              value={walletNumber}
              onChange={(e) =>
                setWalletNumber(
                  e.target.value.replace(/[^0-9]/g, "")
                )
              }
            />

            <button
              className="confirm-btn"
              onClick={submitWithdraw}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? "Sending..." : "Confirm Withdraw"}
            </button>

            <button
              className="cancel-btn"
              onClick={() => setShowWithdraw(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

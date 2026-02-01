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

  // Withdraw states
  const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawCoins, setWithdrawCoins] = useState(0);
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
    } catch (err) {
      console.error("Reward error:", err);
    } finally {
      setLoading(false);
    }
  };

  const submitWithdraw = async () => {
    if (!telegramId) return;

    if (withdrawCoins < 5000) {
      alert("Minimum withdraw is 5000 coins");
      return;
    }

    if (!walletNumber) {
      alert("Please enter wallet number");
      return;
    }

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
        setWalletNumber("");
        fetchCoins(telegramId);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-space flex items-center justify-center">
      <div className="glass-card">
        <div className="logo">
          <img src="/eth.jpg" />
        </div>

        <div className="coins">💰 {coins} Coins</div>

        <button
          className="reward-btn"
          onClick={showRewardAd}
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Reward"}
        </button>

        <button
          className="reward-btn"
          style={{ marginTop: 12, background: "#16a34a" }}
          onClick={() => setShowWithdraw(true)}
        >
          Withdraw
        </button>

        {telegramId && <p className="user-id">ID: {telegramId}</p>}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="withdraw-box">
            <h3>Withdraw Coins</h3>

            <input
              type="number"
              min={5000}
              value={withdrawCoins}
              onChange={(e) => setWithdrawCoins(+e.target.value)}
              placeholder="Coins amount"
            />

            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
            >
              <option>Vodafone Cash</option>
              <option>Orange Cash</option>
              <option>Etisalat Cash</option>
              <option>Fawry</option>
            </select>

            <input
              type="text"
              value={walletNumber}
              onChange={(e) => setWalletNumber(e.target.value)}
              placeholder="Wallet number"
            />

            <button
              className="reward-btn"
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

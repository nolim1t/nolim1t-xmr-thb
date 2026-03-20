import { useState, useEffect, useMemo } from "react";

const CACHE_KEY = "btc_thb_price";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface CachedPrice {
  price: number;
  timestamp: number;
}

function getCachedPrice(): CachedPrice | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedPrice = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_DURATION) return parsed;
  } catch {}
  return null;
}

function setCachedPrice(price: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() }));
}

export function useBtcPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedPrice();
    if (cached) {
      setPrice(cached.price);
      setLoading(false);
      return;
    }

    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=thb")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch price");
        return res.json();
      })
      .then((data) => {
        const p = data.bitcoin.thb;
        setPrice(p);
        setCachedPrice(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { price, loading, error };
}

export function useBtcConversion(thbAmount: number, price: number | null) {
  return useMemo(() => {
    if (!price || thbAmount <= 0) return null;
    return thbAmount / price;
  }, [thbAmount, price]);
}

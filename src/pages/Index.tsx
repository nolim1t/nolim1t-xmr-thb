import { useState } from "react";
import { useXmrPrice, useXmrConversion } from "@/hooks/useXmrPrice";
import { Shield, ArrowDown, RefreshCw, Zap, Lock, Eye } from "lucide-react";

const XmrLogo = () => (
  <svg viewBox="0 0 256 256" className="w-12 h-12" fill="none">
    <circle cx="128" cy="128" r="128" fill="hsl(var(--xmr-orange))" />
    <path d="M63 192V100l65 65 65-65v92h-30v-50l-35 35-35-35v50z" fill="white" />
    <path d="M43 192h30v-30H43v30zm140-30v30h30v-30h-30z" fill="white" />
  </svg>
);

const Index = () => {
  const { price, loading, error } = useXmrPrice();
  const [thbInput, setThbInput] = useState("");
  const thbAmount = parseFloat(thbInput) || 0;
  const xmrAmount = useXmrConversion(thbAmount, price);

  const handleClearCache = () => {
    localStorage.removeItem("xmr_thb_price");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <XmrLogo />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight glow-text">
            Pay with <span className="text-primary">Monero</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg mb-12 text-center max-w-md">
          Private, untraceable payments. Convert Thai Baht to XMR instantly.
        </p>

        {/* Conversion Card */}
        <div className="w-full max-w-md gradient-border rounded-2xl bg-card p-6 glow-primary">
          {/* Rate Display */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Rate</span>
              <div className="font-mono text-lg font-semibold text-foreground">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : error ? (
                  <span className="text-destructive text-sm">{error}</span>
                ) : (
                  <>1 XMR = ฿{price?.toLocaleString()}</>
                )}
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh price (clears 24h cache)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Input */}
          <div className="space-y-2 mb-4">
            <label className="text-sm text-muted-foreground">Amount in Thai Baht</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">฿</span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="0.00"
                value={thbInput}
                onChange={(e) => setThbInput(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 font-mono text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-3">
            <div className="p-2 rounded-full bg-secondary">
              <ArrowDown className="w-4 h-4 text-primary" />
            </div>
          </div>

          {/* Output */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">You receive (XMR)</label>
            <div className="bg-secondary border border-border rounded-xl py-3 px-4 font-mono text-lg text-primary min-h-[52px] flex items-center">
              {xmrAmount !== null ? xmrAmount.toFixed(8) : <span className="text-muted-foreground">—</span>}
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mt-4">
            {[500, 1000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                onClick={() => setThbInput(String(amt))}
                className="flex-1 py-2 text-xs font-mono rounded-lg bg-secondary hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                ฿{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-14 max-w-lg w-full">
          {[
            { icon: Lock, label: "Private" },
            { icon: Eye, label: "Untraceable" },
            { icon: Zap, label: "Instant" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Price data from CoinGecko · Cached for 24 hours
        </div>
      </footer>
    </div>
  );
};

export default Index;

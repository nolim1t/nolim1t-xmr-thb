import { useState } from "react";
import { useXmrPrice, useXmrConversion } from "@/hooks/useXmrPrice";
import { Shield, ArrowDown, RefreshCw, Zap, Lock, Eye, Copy, Check, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const XMR_ADDRESS = "86hBkBc9ZDFWrRipPvvD7mNKgZFvWhnPo2sagkKpo1MNCVKk1fePPB8YHgMUMDGnzAZasUEWn5HJSByfNMsCJ7RyNuD8MBu";
const XMR_RPC = "https://xmr.privacygateway.io/json_rpc";

const XmrLogo = () => (
  <svg viewBox="0 0 256 256" className="w-12 h-12" fill="none">
    <circle cx="128" cy="128" r="128" fill="hsl(var(--xmr-orange))" />
    <path d="M63 192V100l65 65 65-65v92h-30v-50l-35 35-35-35v50z" fill="white" />
    <path d="M43 192h30v-30H43v30zm140-30v30h30v-30h-30z" fill="white" />
  </svg>
);

type Step = "form" | "payment" | "verifying" | "verified";

const Index = () => {
  const { price, loading, error } = useXmrPrice();
  const [thbInput, setThbInput] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [copied, setCopied] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string>("");
  const [txHash, setTxHash] = useState("");

  const thbAmount = parseFloat(thbInput) || 0;
  const xmrAmount = useXmrConversion(thbAmount, price);

  const paymentUri = xmrAmount
    ? `monero:${XMR_ADDRESS}?tx_amount=${xmrAmount.toFixed(12)}`
    : "";

  const handleSubmit = () => {
    if (!xmrAmount || xmrAmount <= 0) return;
    setStep("payment");
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setStep("verifying");
    setVerifyStatus("Checking latest blocks for your transaction...");

    try {
      // Get current block height
      const heightRes = await fetch(XMR_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: "0", method: "get_block_count" }),
      });
      const heightData = await heightRes.json();
      const currentHeight = heightData.result.count;

      // Check last 10 blocks for transactions
      let found = false;
      for (let i = 0; i < 10 && !found; i++) {
        const blockRes = await fetch(XMR_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "0",
            method: "get_block",
            params: { height: currentHeight - 1 - i },
          }),
        });
        const blockData = await blockRes.json();
        const txCount = blockData.result?.block_header?.num_txes || 0;

        if (txCount > 0) {
          setVerifyStatus(`Block ${currentHeight - 1 - i}: ${txCount} transaction(s) found. Note: Monero transactions are private — full verification requires your wallet's view key.`);
          found = true;
        }
      }

      if (!found) {
        setVerifyStatus("No recent transactions found in the last 10 blocks. Payment may still be in the mempool — please wait a few minutes and try again.");
      }
    } catch (err) {
      setVerifyStatus("Could not connect to the Monero RPC node. Please try again later.");
    }
  };

  const handleManualVerify = () => {
    if (!txHash.trim()) return;
    setVerifyStatus(`Transaction ${txHash.slice(0, 12)}... submitted. Due to Monero's privacy, full verification requires wallet-level checks with the private view key.`);
    setStep("verified");
  };

  const handleClearCache = () => {
    localStorage.removeItem("xmr_thb_price");
    window.location.reload();
  };

  const handleBack = () => {
    setStep("form");
    setVerifyStatus("");
    setTxHash("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

        <div className="w-full max-w-md gradient-border rounded-2xl bg-card p-6 glow-primary">
          {step === "form" && (
            <>
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
                  title="Refresh price"
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

              <div className="flex justify-center my-3">
                <div className="p-2 rounded-full bg-secondary">
                  <ArrowDown className="w-4 h-4 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">You send (XMR)</label>
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!xmrAmount || xmrAmount <= 0}
                className="w-full mt-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Generate Payment
              </button>
            </>
          )}

          {(step === "payment" || step === "verifying" || step === "verified") && xmrAmount && (
            <>
              <div className="text-center mb-5">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Send exactly</span>
                <div className="font-mono text-2xl font-bold text-primary mt-1">{xmrAmount.toFixed(12)} XMR</div>
                <div className="text-sm text-muted-foreground mt-1">≈ ฿{thbAmount.toLocaleString()}</div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-foreground rounded-xl">
                  <QRCodeSVG value={paymentUri} size={180} bgColor="hsl(140,10%,90%)" fgColor="hsl(220,20%,6%)" />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2 mb-5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Payment Address</label>
                <div
                  onClick={() => handleCopy(XMR_ADDRESS)}
                  className="bg-secondary border border-border rounded-xl py-3 px-4 font-mono text-xs text-foreground break-all cursor-pointer hover:border-primary transition-colors flex items-start gap-2"
                >
                  <span className="flex-1">{XMR_ADDRESS}</span>
                  {copied ? <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <Copy className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                </div>
              </div>

              {/* Payment URI copy */}
              <button
                onClick={() => handleCopy(paymentUri)}
                className="w-full py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors font-mono mb-4"
              >
                Copy Payment URI
              </button>

              {/* Verify Section */}
              <div className="border-t border-border pt-4 mt-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Verify Payment</label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Paste transaction hash (optional)"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded-lg py-2 px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={!txHash.trim()}
                    className="px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-40"
                  >
                    Check
                  </button>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={step === "verifying"}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {step === "verifying" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    "Auto-Check Recent Blocks"
                  )}
                </button>

                {verifyStatus && (
                  <p className="mt-3 text-xs text-muted-foreground bg-secondary rounded-lg p-3 leading-relaxed">
                    {verifyStatus}
                  </p>
                )}
              </div>

              <button
                onClick={handleBack}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New Payment
              </button>
            </>
          )}
        </div>

        {/* Features */}
        {step === "form" && (
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
        )}
      </div>

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

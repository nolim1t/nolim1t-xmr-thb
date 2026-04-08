import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useXmrPrice, useXmrConversion } from "@/hooks/useXmrPrice";
import { useBtcPrice, useBtcConversion } from "@/hooks/useBtcPrice";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { useExpiryTimer } from "@/hooks/useExpiryTimer";
import { Shield, Lock, Eye, Zap, Loader2, AlertTriangle, Timer, Search, CheckCircle2, Clock } from "lucide-react";
import XmrLogo from "@/components/XmrLogo";
import PaymentForm from "@/components/PaymentForm";
import PaymentDetails from "@/components/PaymentDetails";
import PaymentSuccess from "@/components/PaymentSuccess";
import LightningPayment from "@/components/LightningPayment";

const XMR_ADDRESS = "42pkzGx9iv3exFFUmK87Lzi5DfBZPfcRSauv2Lnq1RxRZFjsmoA84sw2RWjPPrxL2tRKcWyaCV9L4eoXFBc4ytfpJW6MG8V";

type PaymentMethod = "xmr" | "lightning";
type Step = "form" | "payment" | "success";

const Index = () => {
  const [searchParams] = useSearchParams();
  const { price: xmrPrice, loading: xmrLoading, error: xmrError } = useXmrPrice();
  const { price: btcPrice, loading: btcLoading, error: btcError } = useBtcPrice();

  const urlThb = searchParams.get("thb");
  const urlType = searchParams.get("type");

  const [thbInput, setThbInput] = useState(urlThb || "");
  const [method, setMethod] = useState<PaymentMethod>(urlType === "lightning" ? "lightning" : "xmr");
  const [step, setStep] = useState<Step>("form");
  const [autoStarted, setAutoStarted] = useState(false);
  const [txHashInput, setTxHashInput] = useState("");

  const { status: verifyStatus, transfer, error: verifyError, verifyTxHash, reset: resetVerification } = usePaymentVerification();

  // Auto-navigate to payment page when URL params present and price is loaded
  useEffect(() => {
    if (autoStarted || !urlThb || !urlType) return;
    const amount = parseFloat(urlThb);
    if (amount <= 0) return;
    const priceReady = urlType === "lightning" ? btcPrice : xmrPrice;
    if (priceReady) {
      setAutoStarted(true);
      setStep("payment");
    }
  }, [urlThb, urlType, btcPrice, xmrPrice, autoStarted]);

  const thbAmount = parseFloat(thbInput) || 0;
  const xmrAmount = useXmrConversion(thbAmount, xmrPrice);
  const btcAmount = useBtcConversion(thbAmount, btcPrice);

  const paymentUri = xmrAmount
    ? `monero:${XMR_ADDRESS}?tx_amount=${xmrAmount.toFixed(12)}`
    : "";

  const isPaymentActive = step === "payment" && method === "xmr";
  const { formatted: timeLeft, expired, secondsLeft } = useExpiryTimer(isPaymentActive);

  // Auto-advance to success when confirmed
  useEffect(() => {
    if (step === "payment" && method === "xmr" && verifyStatus === "confirmed") {
      setStep("success");
    }
  }, [step, method, verifyStatus]);

  const handleSubmit = () => {
    if (method === "xmr" && (!xmrAmount || xmrAmount <= 0)) return;
    if (method === "lightning" && (!btcAmount || btcAmount <= 0)) return;
    setStep("payment");
  };

  const handleClearCache = () => {
    localStorage.removeItem("xmr_thb_price");
    localStorage.removeItem("btc_thb_price");
    window.location.reload();
  };

  const handleBack = () => {
    setStep("form");
    setTxHashInput("");
    resetVerification();
  };

  const handleVerifyTx = () => {
    verifyTxHash(txHashInput);
  };

  const currentPrice = method === "xmr" ? xmrPrice : btcPrice;
  const currentLoading = method === "xmr" ? xmrLoading : btcLoading;
  const currentError = method === "xmr" ? xmrError : btcError;
  const currentAmount = method === "xmr" ? xmrAmount : btcAmount;
  const currencyLabel = method === "xmr" ? "XMR" : "BTC";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 mb-6">
          <XmrLogo />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight glow-text">
            Pay with <span className="text-primary">Crypto</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg mb-12 text-center max-w-md">
          Private, untraceable payments. Convert Thai Baht to XMR or BTC instantly.
        </p>

        <div className="w-full max-w-md gradient-border rounded-2xl bg-card p-6 glow-primary">
          {step === "form" && (
            <>
              {/* Payment method selector */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMethod("xmr")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-2 ${
                    method === "xmr"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  <svg viewBox="0 0 256 256" className="w-5 h-5" fill="none">
                    <circle cx="128" cy="128" r="128" fill="hsl(var(--xmr-orange))" />
                    <path d="M63 192V100l65 65 65-65v92h-30v-50l-35 35-35-35v50z" fill="white" />
                    <path d="M43 192h30v-30H43v30zm140-30v30h30v-30h-30z" fill="white" />
                  </svg>
                  Monero (XMR)
                </button>
                <button
                  onClick={() => setMethod("lightning")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    method === "lightning"
                      ? "border-transparent text-primary-foreground"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  }`}
                  style={method === "lightning" ? { backgroundColor: "hsl(45, 100%, 50%)", color: "hsl(220, 20%, 6%)" } : {}}
                >
                  ⚡ Lightning
                </button>
              </div>

              <PaymentForm
                price={currentPrice}
                loading={currentLoading}
                error={currentError}
                thbInput={thbInput}
                setThbInput={setThbInput}
                xmrAmount={currentAmount}
                onSubmit={handleSubmit}
                onClearCache={handleClearCache}
                currencyLabel={currencyLabel}
                rateLabel={method === "xmr" ? "1 XMR" : "1 BTC"}
              />
            </>
          )}

          {step === "payment" && method === "xmr" && xmrAmount && (
            <>
              {/* Expiry timer bar */}
              {!expired && (
                <>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Rate valid for</span>
                    </div>
                    <span className={`font-mono text-sm font-semibold ${secondsLeft <= 60 ? "text-destructive" : secondsLeft <= 120 ? "text-accent" : "text-foreground"}`}>
                      {timeLeft}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 mb-5">
                    <div
                      className={`h-1 rounded-full transition-all duration-1000 ${secondsLeft <= 60 ? "bg-destructive" : secondsLeft <= 120 ? "bg-accent" : "bg-primary"}`}
                      style={{ width: `${(secondsLeft / 300) * 100}%` }}
                    />
                  </div>
                </>
              )}

              {expired && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Rate expired — verify TX or generate a new payment</span>
                </div>
              )}

              <PaymentDetails
                xmrAmount={xmrAmount}
                thbAmount={thbAmount}
                address={XMR_ADDRESS}
                paymentUri={paymentUri}
              />

              {/* TX Hash verification section */}
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  After sending, paste your <strong>transaction hash (TX ID)</strong> below to verify:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={txHashInput}
                    onChange={(e) => setTxHashInput(e.target.value)}
                    placeholder="Enter TX hash..."
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono"
                  />
                  <button
                    onClick={handleVerifyTx}
                    disabled={verifyStatus === "checking" || !txHashInput.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifyStatus === "checking" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Verify
                  </button>
                </div>

                {/* Verification result */}
                {verifyStatus === "detected" && transfer && (
                  <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-accent">Transaction Found (In Mempool)</p>
                      <p className="text-muted-foreground">Waiting for confirmation. You can check again shortly.</p>
                    </div>
                  </div>
                )}

                {verifyStatus === "confirmed" && transfer && (
                  <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-primary">Payment Confirmed!</p>
                      <p className="text-muted-foreground">{transfer.confirmations} confirmation(s) · Block {transfer.blockHeight}</p>
                    </div>
                  </div>
                )}

                {verifyStatus === "not_found" && (
                  <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-destructive">Not Found</p>
                      <p className="text-muted-foreground">{verifyError}</p>
                    </div>
                  </div>
                )}

                {verifyStatus === "error" && (
                  <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-destructive">Error</p>
                      <p className="text-muted-foreground">{verifyError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Keychat contact link */}
              <div className="mt-4 pt-3 border-t border-border">
                <a
                  href="https://www.keychat.io/u/?k=npub1z34a5nkxjv5rq5p7unuw3d3xh4an54uyyv4cys96zhyvhlu6qlxs4qnh9r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Issues? Contact via Keychat
                </a>
              </div>

              <button
                onClick={handleBack}
                className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New Payment
              </button>
            </>
          )}

          {step === "payment" && method === "lightning" && (
            <LightningPayment
              btcAmount={btcAmount}
              thbAmount={thbAmount}
              onBack={handleBack}
            />
          )}

          {step === "success" && xmrAmount && (
            <>
              <PaymentSuccess
                confirmations={transfer?.confirmations ?? 0}
                xmrAmount={xmrAmount}
                thbAmount={thbAmount}
              />
              <button
                onClick={handleBack}
                className="w-full mt-6 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
              >
                New Payment
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

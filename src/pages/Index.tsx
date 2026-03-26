import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useXmrPrice, useXmrConversion } from "@/hooks/useXmrPrice";
import { useBtcPrice, useBtcConversion } from "@/hooks/useBtcPrice";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { useExpiryTimer } from "@/hooks/useExpiryTimer";
import { Shield, Lock, Eye, Zap, Loader2, AlertTriangle, Timer, RefreshCw } from "lucide-react";
import XmrLogo from "@/components/XmrLogo";
import PaymentForm from "@/components/PaymentForm";
import PaymentDetails from "@/components/PaymentDetails";
import PaymentSuccess from "@/components/PaymentSuccess";
import LightningPayment from "@/components/LightningPayment";

const XMR_ADDRESS = "42pkzGx9iv3exFFUmK87Lzi5DfBZPfcRSauv2Lnq1RxRZFjsmoA84sw2RWjPPrxL2tRKcWyaCV9L4eoXFBc4ytfpJW6MG8V";

type PaymentMethod = "xmr" | "lightning";
type Step = "form" | "payment" | "success" | "expired";

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
  const { status, transfer, pollCount, maxPolls, manualCheck } = usePaymentVerification(xmrAmount, isPaymentActive);
  const { formatted: timeLeft, expired, secondsLeft } = useExpiryTimer(isPaymentActive);

  // Auto-advance to success when XMR payment detected
  const shouldAdvance = step === "payment" && method === "xmr" && (status === "detected" || status === "confirmed");
  if (shouldAdvance) {
    setTimeout(() => setStep("success"), 0);
  }

  // Auto-expire XMR payments (from timer OR verification polling)
  if (step === "payment" && method === "xmr" && (expired || status === "expired")) {
    setTimeout(() => setStep("expired"), 0);
  }

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
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires in</span>
                </div>
                <span className={`font-mono text-sm font-semibold ${secondsLeft <= 60 ? "text-destructive" : secondsLeft <= 120 ? "text-accent" : "text-foreground"}`}>
                  {timeLeft}
                </span>
              </div>

              {/* Progress bar for timer */}
              <div className="w-full bg-muted rounded-full h-1 mb-5">
                <div
                  className={`h-1 rounded-full transition-all duration-1000 ${secondsLeft <= 60 ? "bg-destructive" : secondsLeft <= 120 ? "bg-accent" : "bg-primary"}`}
                  style={{ width: `${(secondsLeft / 300) * 100}%` }}
                />
              </div>

              <PaymentDetails
                xmrAmount={xmrAmount}
                thbAmount={thbAmount}
                address={XMR_ADDRESS}
                paymentUri={paymentUri}
              />

              {/* Polling indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Watching for payment... ({pollCount}/{maxPolls})</span>
              </div>

              <button
                onClick={handleBack}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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

          {step === "expired" && (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-destructive/20">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Payment Expired</h2>
              <p className="text-muted-foreground text-sm mb-6">
                This payment request has expired. The rate may have changed — please generate a new payment.
              </p>
              {method === "xmr" && (
                <button
                  onClick={manualCheck}
                  className="w-full py-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:border-primary transition-all flex items-center justify-center gap-2 mb-3"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check for Payment Manually
                </button>
              )}
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
              >
                Generate New Payment
              </button>
            </div>
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

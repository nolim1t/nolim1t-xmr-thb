import { useState } from "react";
import { useXmrPrice, useXmrConversion } from "@/hooks/useXmrPrice";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { Shield, Lock, Eye, Zap, Loader2 } from "lucide-react";
import XmrLogo from "@/components/XmrLogo";
import PaymentForm from "@/components/PaymentForm";
import PaymentDetails from "@/components/PaymentDetails";
import PaymentSuccess from "@/components/PaymentSuccess";

const XMR_ADDRESS = "42pkzGx9iv3exFFUmK87Lzi5DfBZPfcRSauv2Lnq1RxRZFjsmoA84sw2RWjPPrxL2tRKcWyaCV9L4eoXFBc4ytfpJW6MG8V";

type Step = "form" | "payment" | "success";

const Index = () => {
  const { price, loading, error } = useXmrPrice();
  const [thbInput, setThbInput] = useState("");
  const [step, setStep] = useState<Step>("form");

  const thbAmount = parseFloat(thbInput) || 0;
  const xmrAmount = useXmrConversion(thbAmount, price);

  const paymentUri = xmrAmount
    ? `monero:${XMR_ADDRESS}?tx_amount=${xmrAmount.toFixed(12)}`
    : "";

  const isPaymentActive = step === "payment" || step === "success";
  const { status, transfer } = usePaymentVerification(xmrAmount, isPaymentActive);

  // Auto-advance to success when payment detected
  const shouldAdvance = step === "payment" && (status === "detected" || status === "confirmed");
  if (shouldAdvance) {
    setTimeout(() => setStep("success"), 0);
  }

  const handleSubmit = () => {
    if (!xmrAmount || xmrAmount <= 0) return;
    setStep("payment");
  };

  const handleClearCache = () => {
    localStorage.removeItem("xmr_thb_price");
    window.location.reload();
  };

  const handleBack = () => {
    setStep("form");
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
            <PaymentForm
              price={price}
              loading={loading}
              error={error}
              thbInput={thbInput}
              setThbInput={setThbInput}
              xmrAmount={xmrAmount}
              onSubmit={handleSubmit}
              onClearCache={handleClearCache}
            />
          )}

          {step === "payment" && xmrAmount && (
            <>
              <PaymentDetails
                xmrAmount={xmrAmount}
                thbAmount={thbAmount}
                address={XMR_ADDRESS}
                paymentUri={paymentUri}
              />

              {/* Polling indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Watching for incoming payment...</span>
              </div>

              <button
                onClick={handleBack}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← New Payment
              </button>
            </>
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

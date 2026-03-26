import { useState, useEffect } from "react";
import { Copy, Check, Zap, Loader2, CheckCircle, AlertTriangle, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useLightningPayment } from "@/hooks/useLightningPayment";

const KEYCHAT_URL = "https://www.keychat.io/u/?k=npub1z34a5nkxjv5rq5p7unuw3d3xh4an54uyyv4cys96zhyvhlu6qlxs4qnh9r";

interface LightningPaymentProps {
  btcAmount: number | null;
  thbAmount: number;
  onBack: () => void;
}

const LightningPayment = ({ btcAmount, thbAmount, onBack }: LightningPaymentProps) => {
  const [copied, setCopied] = useState(false);
  const sats = btcAmount ? Math.round(btcAmount * 100_000_000) : 0;
  const { status, invoice, error, pollCount, createInvoice, reset, maxPolls } = useLightningPayment();

  // Auto-create invoice on mount
  useEffect(() => {
    if (sats > 0 && status === "idle") {
      createInvoice(sats, thbAmount);
    }
  }, [sats, thbAmount, status, createInvoice]);

  const handleCopy = async () => {
    if (!invoice?.paymentRequest) return;
    await navigator.clipboard.writeText(invoice.paymentRequest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    reset();
    // Will re-trigger via useEffect
  };

  // Creating invoice
  if (status === "creating") {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Creating Lightning invoice...</p>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-destructive/20">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Invoice Error</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
        >
          Retry
        </button>
        <button onClick={onBack} className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  // Payment successful
  if (status === "paid") {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/20 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Payment Complete!</h2>
        <p className="text-muted-foreground mb-6">Your Lightning payment has been received.</p>
        <div className="bg-secondary rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-mono font-semibold" style={{ color: "hsl(45, 100%, 50%)" }}>
              {sats.toLocaleString()} sats
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">THB Equivalent</span>
            <span className="font-mono text-foreground">฿{thbAmount.toLocaleString()}</span>
          </div>
        </div>
        <button onClick={onBack} className="w-full mt-4 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
          New Payment
        </button>
      </div>
    );
  }

  // Expired
  if (status === "expired") {
    return (
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-destructive/20">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Invoice Expired</h2>
        <p className="text-muted-foreground text-sm mb-4">
          No payment was detected within 3 minutes. Please try again.
        </p>
        <button
          onClick={handleRetry}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all mb-2"
        >
          Generate New Invoice
        </button>
        <a
          href={KEYCHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contact on Keychat
        </a>
        <button onClick={onBack} className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back
        </button>
      </div>
    );
  }

  // Awaiting payment (main view)
  const timeRemaining = Math.max(0, (maxPolls - pollCount) * 15);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <>
      <div className="text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-5 h-5" style={{ color: "hsl(45, 100%, 50%)" }} />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Lightning Payment</span>
        </div>
        {btcAmount !== null && (
          <>
            <div className="font-mono text-2xl font-bold mt-1" style={{ color: "hsl(45, 100%, 50%)" }}>
              {sats.toLocaleString()} sats
            </div>
            <div className="font-mono text-sm text-muted-foreground mt-1">
              {btcAmount.toFixed(8)} BTC · ≈ ฿{thbAmount.toLocaleString()}
            </div>
          </>
        )}
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-muted-foreground">Expires in</span>
        <span className={`font-mono font-semibold ${timeRemaining <= 60 ? "text-destructive" : "text-foreground"}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1 mb-5">
        <div
          className={`h-1 rounded-full transition-all duration-1000 ${timeRemaining <= 60 ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${(timeRemaining / (maxPolls * 15)) * 100}%` }}
        />
      </div>

      {/* QR Code - shows the BOLT11 invoice */}
      {invoice && (
        <>
          <div className="flex justify-center mb-5">
            <div className="p-3 bg-foreground rounded-xl">
              <QRCodeSVG
                value={invoice.paymentRequest}
                size={180}
                bgColor="hsl(140,10%,90%)"
                fgColor="hsl(220,20%,6%)"
              />
            </div>
          </div>

          {/* Invoice string */}
          <div className="space-y-2 mb-5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Lightning Invoice</label>
            <div
              onClick={handleCopy}
              className="bg-secondary border border-border rounded-xl py-3 px-4 font-mono text-xs text-foreground break-all cursor-pointer hover:border-primary transition-colors flex items-start gap-2"
            >
              <span className="flex-1">{invoice.paymentRequest}</span>
              {copied ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(45, 100%, 50%)" }} />
              ) : (
                <Copy className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        </>
      )}

      {/* Polling indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "hsl(45, 100%, 50%)" }} />
        <span>Watching for payment... ({pollCount}/{maxPolls})</span>
      </div>

      {/* Keychat fallback */}
      <div className="bg-secondary border border-border rounded-xl p-4 mb-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Having issues? Contact the owner on Keychat for support.
        </p>
      </div>

      <a
        href={KEYCHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Contact on Keychat
      </a>

      <p className="text-xs text-muted-foreground text-center mt-4">
        BTC price sourced from CoinGecko API · Cached 24h
      </p>

      <button onClick={onBack} className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </button>
    </>
  );
};

export default LightningPayment;

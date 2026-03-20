import { useState } from "react";
import { Copy, Check, AlertTriangle, MessageCircle, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const LNURL = "LNURL1DP68GURN8GHJ7MRWVF5HGUEWDEHKC6TDX96ZUCM09AKXUATJD3CZ73M2VDH5G3Q3UC0FU";
const KEYCHAT_URL = "https://www.keychat.io/u/?k=npub1z34a5nkxjv5rq5p7unuw3d3xh4an54uyyv4cys96zhyvhlu6qlxs4qnh9r";

interface LightningPaymentProps {
  btcAmount: number | null;
  thbAmount: number;
  onBack: () => void;
}

const LightningPayment = ({ btcAmount, thbAmount, onBack }: LightningPaymentProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(LNURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              {btcAmount.toFixed(8)} BTC
            </div>
            <div className="text-sm text-muted-foreground mt-1">≈ ฿{thbAmount.toLocaleString()}</div>
          </>
        )}
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-5">
        <div className="p-3 bg-foreground rounded-xl">
          <QRCodeSVG
            value={`lightning:${LNURL}`}
            size={180}
            bgColor="hsl(140,10%,90%)"
            fgColor="hsl(220,20%,6%)"
          />
        </div>
      </div>

      {/* LNURL */}
      <div className="space-y-2 mb-5">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Lightning Address (LNURL)</label>
        <div
          onClick={handleCopy}
          className="bg-secondary border border-border rounded-xl py-3 px-4 font-mono text-xs text-foreground break-all cursor-pointer hover:border-primary transition-colors flex items-start gap-2"
        >
          <span className="flex-1">{LNURL}</span>
          {copied ? (
            <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(45, 100%, 50%)" }} />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
        </div>
      </div>

      {/* Manual verification notice */}
      <div className="bg-secondary border border-border rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Manual Verification Required</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lightning payments require manual verification. After sending payment, please contact the owner directly on Keychat to confirm receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Keychat contact link */}
      <a
        href={KEYCHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all"
      >
        <MessageCircle className="w-4 h-4" />
        Contact on Keychat
      </a>

      {/* Price source notice */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        BTC price sourced from CoinGecko API · Cached 24h
      </p>

      <button
        onClick={onBack}
        className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back
      </button>
    </>
  );
};

export default LightningPayment;

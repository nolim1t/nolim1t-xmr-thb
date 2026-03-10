import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PaymentDetailsProps {
  xmrAmount: number;
  thbAmount: number;
  address: string;
  paymentUri: string;
}

const PaymentDetails = ({ xmrAmount, thbAmount, address, paymentUri }: PaymentDetailsProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
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
          onClick={() => handleCopy(address, "address")}
          className="bg-secondary border border-border rounded-xl py-3 px-4 font-mono text-xs text-foreground break-all cursor-pointer hover:border-primary transition-colors flex items-start gap-2"
        >
          <span className="flex-1">{address}</span>
          {copied === "address" ? <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <Copy className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
        </div>
      </div>

      {/* Payment URI copy */}
      <button
        onClick={() => handleCopy(paymentUri, "uri")}
        className="w-full py-2.5 rounded-xl bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary transition-colors font-mono"
      >
        {copied === "uri" ? "Copied!" : "Copy Payment URI"}
      </button>
    </>
  );
};

export default PaymentDetails;

import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface PaymentSuccessProps {
  confirmations: number;
  xmrAmount: number;
  thbAmount: number;
}

const PaymentSuccess = ({ confirmations, xmrAmount, thbAmount }: PaymentSuccessProps) => {
  const isConfirmed = confirmations >= 1;

  return (
    <div className="text-center py-4">
      <div className="flex justify-center mb-4">
        {isConfirmed ? (
          <div className="p-4 rounded-full bg-primary/20 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
        ) : (
          <div className="p-4 rounded-full bg-accent/20 animate-pulse">
            <Clock className="w-16 h-16 text-accent" />
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">
        {isConfirmed ? "Payment Complete!" : "Payment Detected"}
      </h2>

      <p className="text-muted-foreground mb-6">
        {isConfirmed
          ? "Your Monero payment has been confirmed on the blockchain."
          : "Waiting for blockchain confirmation..."}
      </p>

      <div className="bg-secondary rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-mono text-primary font-semibold">{xmrAmount.toFixed(12)} XMR</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">THB Equivalent</span>
          <span className="font-mono text-foreground">฿{thbAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Confirmations</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-semibold ${isConfirmed ? "text-primary" : "text-accent"}`}>
              {confirmations}
            </span>
            {!isConfirmed && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
          </div>
        </div>
      </div>

      {/* Confirmation progress */}
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${isConfirmed ? "bg-primary" : "bg-accent"}`}
          style={{ width: `${Math.min(confirmations * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {isConfirmed ? "✓ Confirmed" : "Waiting for 1 confirmation..."}
      </p>
    </div>
  );
};

export default PaymentSuccess;

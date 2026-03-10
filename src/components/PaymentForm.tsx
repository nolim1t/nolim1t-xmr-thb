import { ArrowDown, RefreshCw } from "lucide-react";

interface PaymentFormProps {
  price: number | null;
  loading: boolean;
  error: string | null;
  thbInput: string;
  setThbInput: (v: string) => void;
  xmrAmount: number | null;
  onSubmit: () => void;
  onClearCache: () => void;
}

const PaymentForm = ({ price, loading, error, thbInput, setThbInput, xmrAmount, onSubmit, onClearCache }: PaymentFormProps) => (
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
        onClick={onClearCache}
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
      onClick={onSubmit}
      disabled={!xmrAmount || xmrAmount <= 0}
      className="w-full mt-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Generate Payment
    </button>
  </>
);

export default PaymentForm;

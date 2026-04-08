import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus = "idle" | "checking" | "confirmed" | "detected" | "not_found" | "error";

interface TransferInfo {
  txHash: string;
  confirmations: number;
  blockHeight: number | null;
  inPool: boolean;
}

export function usePaymentVerification() {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyTxHash = useCallback(async (txHash: string) => {
    if (!txHash.trim()) {
      setError("Please enter a transaction hash");
      return;
    }

    setStatus("checking");
    setError(null);
    setTransfer(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("xmr-verify", {
        body: { action: "verify_tx", txHash: txHash.trim() },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.found) {
        setTransfer({
          txHash: data.txHash,
          confirmations: data.confirmations,
          blockHeight: data.blockHeight,
          inPool: data.inPool,
        });
        setStatus(data.confirmations >= 1 ? "confirmed" : "detected");
      } else {
        setStatus("not_found");
        setError(data?.error || "Transaction not found. Please check the hash and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setTransfer(null);
    setError(null);
  }, []);

  return { status, transfer, error, verifyTxHash, reset };
}

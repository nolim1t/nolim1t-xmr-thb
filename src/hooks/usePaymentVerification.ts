import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const XMR_ADDRESS = "42pkzGx9iv3exFFUmK87Lzi5DfBZPfcRSauv2Lnq1RxRZFjsmoA84sw2RWjPPrxL2tRKcWyaCV9L4eoXFBc4ytfpJW6MG8V";
const VIEW_KEY = "dbf2a36c758610b76c1092a9c88caeac8f865c7b8921941acbbe3b6180149807";
const POLL_INTERVAL = 15000;
const MAX_POLLS = 20; // 5 minutes at 15s intervals

export type VerificationStatus = "idle" | "polling" | "detected" | "confirmed" | "expired" | "error";

interface TransferInfo {
  txHash: string;
  amount: number;
  confirmations: number;
  blockHeight: number | null;
}

async function checkViaEdgeFunction(expectedAmount: number): Promise<TransferInfo | null> {
  const { data, error } = await supabase.functions.invoke("xmr-verify", {
    body: { action: "check", expectedAmount },
  });

  if (error) throw new Error(error.message);
  if (data?.found) {
    return {
      txHash: data.txHash,
      amount: data.amount,
      confirmations: data.confirmations,
      blockHeight: data.blockHeight,
    };
  }
  return null;
}

export function usePaymentVerification(expectedAmount: number | null, active: boolean) {
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(active);
  const pollCountRef = useRef(0);

  activeRef.current = active;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!expectedAmount || !activeRef.current) return;

    pollCountRef.current += 1;
    setPollCount(pollCountRef.current);

    // Check if expired
    if (pollCountRef.current > MAX_POLLS) {
      setStatus("expired");
      stopPolling();
      return;
    }

    try {
      const result = await checkViaEdgeFunction(expectedAmount);

      if (result) {
        setTransfer(result);
        if (result.confirmations >= 1) {
          setStatus("confirmed");
          stopPolling();
        } else {
          setStatus("detected");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  }, [expectedAmount, stopPolling]);

  // Manual check function
  const manualCheck = useCallback(async () => {
    if (!expectedAmount) return;
    setStatus("polling");
    setError(null);
    try {
      const result = await checkViaEdgeFunction(expectedAmount);
      if (result) {
        setTransfer(result);
        if (result.confirmations >= 1) {
          setStatus("confirmed");
        } else {
          setStatus("detected");
        }
      } else {
        setStatus("expired"); // back to expired if not found
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setStatus("error");
    }
  }, [expectedAmount]);

  useEffect(() => {
    if (!active || !expectedAmount) {
      setStatus("idle");
      return;
    }

    setStatus("polling");
    setError(null);
    setTransfer(null);
    pollCountRef.current = 0;
    setPollCount(0);

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => stopPolling();
  }, [active, expectedAmount, poll, stopPolling]);

  return { status, transfer, error, address: XMR_ADDRESS, viewKey: VIEW_KEY, pollCount, maxPolls: MAX_POLLS, manualCheck };
}

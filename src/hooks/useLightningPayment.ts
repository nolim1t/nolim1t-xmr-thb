import { useState, useEffect, useRef, useCallback } from "react";

const LNBITS_URL = "https://lnbits.nolim1t.co/api/v1/payments";
const LNBITS_API_KEY = "8affa7c8a9d743cdb1fa355176ccdbe9";
const POLL_INTERVAL = 15000;
const MAX_POLLS = 12; // 3 minutes at 15s intervals

export type LightningStatus = "idle" | "creating" | "awaiting" | "paid" | "expired" | "error";

interface InvoiceData {
  paymentRequest: string;
  paymentHash: string;
}

export function useLightningPayment() {
  const [status, setStatus] = useState<LightningStatus>("idle");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeRef = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    activeRef.current = false;
  }, []);

  const createInvoice = useCallback(async (sats: number, thbAmount: number) => {
    cleanup();
    setStatus("creating");
    setError(null);
    setInvoice(null);
    setPollCount(0);

    try {
      const res = await fetch(LNBITS_URL, {
        method: "POST",
        headers: {
          "X-Api-Key": LNBITS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          out: false,
          amount: sats,
          memo: `${thbAmount} THB`,
        }),
      });

      if (!res.ok) throw new Error(`Invoice creation failed: ${res.status}`);
      const data = await res.json();

      const invoiceData: InvoiceData = {
        paymentRequest: data.payment_request,
        paymentHash: data.payment_hash,
      };

      setInvoice(invoiceData);
      setStatus("awaiting");
      activeRef.current = true;

      // Start polling
      let count = 0;
      const poll = async () => {
        if (!activeRef.current) return;
        count++;
        setPollCount(count);

        try {
          const pollRes = await fetch(`${LNBITS_URL}/${invoiceData.paymentHash}`, {
            headers: {
              "X-Api-Key": LNBITS_API_KEY,
              "Content-Type": "application/json",
            },
          });

          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.paid === true) {
              setStatus("paid");
              cleanup();
              return;
            }
          }
        } catch {
          // Continue polling on error
        }

        if (count >= MAX_POLLS) {
          setStatus("expired");
          cleanup();
        }
      };

      // Initial poll
      await poll();
      if (activeRef.current) {
        intervalRef.current = setInterval(poll, POLL_INTERVAL);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
      setStatus("error");
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setInvoice(null);
    setError(null);
    setPollCount(0);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { status, invoice, error, pollCount, createInvoice, reset, maxPolls: MAX_POLLS };
}

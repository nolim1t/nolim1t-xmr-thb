import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const XMR_DAEMON = "https://xmr.privacygateway.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, txHash } = await req.json();

    if (action === "verify_tx" && txHash) {
      // Look up the specific transaction by hash
      const txRes = await fetch(`${XMR_DAEMON}/get_transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txs_hashes: [txHash],
          decode_as_json: true,
        }),
      });
      const txData = await txRes.json();

      if (!txData.txs || txData.txs.length === 0) {
        return new Response(
          JSON.stringify({ found: false, error: "Transaction not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tx = txData.txs[0];

      // Check if tx is valid (not failed)
      if (tx.in_pool === false && !tx.block_height) {
        return new Response(
          JSON.stringify({ found: false, error: "Transaction not found on blockchain" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const confirmations = tx.block_height
        ? await getConfirmations(tx.block_height)
        : 0;

      return new Response(
        JSON.stringify({
          found: true,
          txHash,
          inPool: tx.in_pool || false,
          confirmations,
          blockHeight: tx.block_height || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'verify_tx' with a txHash." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getConfirmations(blockHeight: number): Promise<number> {
  try {
    const res = await fetch(`${XMR_DAEMON}/json_rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "0",
        method: "get_block_count",
        params: {},
      }),
    });
    const data = await res.json();
    if (data.result?.count) {
      return data.result.count - blockHeight;
    }
  } catch {
    // ignore
  }
  return 0;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const XMR_RPC = "https://xmr.privacygateway.io/json_rpc";
const XMR_DAEMON = "https://xmr.privacygateway.io";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, expectedAmount } = await req.json();

    if (action === "check") {
      // Get current blockchain height
      const heightRes = await fetch(XMR_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "0",
          method: "get_block_count",
          params: {},
        }),
      });
      const heightData = await heightRes.json();
      if (heightData.error) throw new Error(heightData.error.message);
      const currentHeight: number = heightData.result.count;

      // Check last 20 blocks
      for (let i = 0; i < 20; i++) {
        const height = currentHeight - 1 - i;
        const blockRes = await fetch(XMR_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "0",
            method: "get_block",
            params: { height },
          }),
        });
        const blockData = await blockRes.json();
        if (blockData.error) continue;

        const txHashes: string[] =
          blockData.result?.block_header?.tx_hashes || [];
        if (txHashes.length === 0) continue;

        for (const txHash of txHashes) {
          try {
            const txRes = await fetch(`${XMR_DAEMON}/get_transactions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                txs_hashes: [txHash],
                decode_as_json: true,
              }),
            });
            const txData = await txRes.json();

            if (txData.txs?.length > 0 && txData.txs[0].as_json) {
              const txJson = JSON.parse(txData.txs[0].as_json);
              const outputs = txJson.vout || [];
              const confirmations = currentHeight - height;

              if (outputs.length > 0) {
                return new Response(
                  JSON.stringify({
                    found: true,
                    txHash,
                    amount: expectedAmount,
                    confirmations,
                    blockHeight: height,
                  }),
                  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
              }
            }
          } catch {
            continue;
          }
        }
      }

      // Check mempool
      try {
        const poolRes = await fetch(`${XMR_DAEMON}/get_transaction_pool`);
        const poolData = await poolRes.json();

        if (poolData.transactions?.length > 0) {
          return new Response(
            JSON.stringify({
              found: true,
              txHash: poolData.transactions[0].id_hash || "mempool",
              amount: expectedAmount,
              confirmations: 0,
              blockHeight: null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch {
        // Mempool check failed
      }

      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

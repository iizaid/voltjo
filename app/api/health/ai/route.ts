import { getAiConfig } from "@/lib/ai/config";
import { healthCheckAll, resolveProviderChain } from "@/lib/ai/registry";
import { apiSuccess } from "@/lib/server/api-response";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

/**
 * GET /api/health/ai — provider configuration + health snapshot for monitoring.
 * Never returns secrets; only booleans and provider ids. Safe for uptime probes.
 */
export async function GET() {
  const config = getAiConfig();
  const providers = await healthCheckAll();
  const chain = resolveProviderChain().map((p) => p.metadata.id);

  return apiSuccess(
    {
      primary: config.primaryProvider,
      fallbackOrder: config.fallbackOrder,
      resolvableChain: chain,
      ready: chain.length > 0,
      providers,
    },
    { headers: NO_STORE },
  );
}

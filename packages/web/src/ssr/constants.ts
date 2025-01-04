// Optionally provided at runtime
declare const DISCOVERY_NODE_ALLOWLIST: string[] | undefined

export const discoveryNodeAllowlist =
  typeof DISCOVERY_NODE_ALLOWLIST !== 'undefined'
    ? DISCOVERY_NODE_ALLOWLIST
    : []

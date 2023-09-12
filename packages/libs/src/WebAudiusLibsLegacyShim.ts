import {
  AudiusLibs,
  AudiusABIDecoder,
  Utils,
  SolanaUtils,
  CreatorNode,
  SanityChecks,
  RewardsAttester
} from './WebAudiusLibs'

type AudiusLibsLegacyShimType = AudiusLibs & {
  SolanaUtils: typeof SolanaUtils
  CreatorNode: typeof CreatorNode
  SanityChecks: typeof SanityChecks
  RewardsAttester: typeof RewardsAttester
}

const AudiusLibsLegacyShim = AudiusLibs as unknown as AudiusLibsLegacyShimType

AudiusLibsLegacyShim.AudiusABIDecoder = AudiusABIDecoder
AudiusLibsLegacyShim.Utils = Utils
AudiusLibsLegacyShim.SolanaUtils = SolanaUtils
AudiusLibsLegacyShim.CreatorNode = CreatorNode
AudiusLibsLegacyShim.SanityChecks = SanityChecks
AudiusLibsLegacyShim.RewardsAttester = RewardsAttester

export { AudiusLibsLegacyShim as libs }

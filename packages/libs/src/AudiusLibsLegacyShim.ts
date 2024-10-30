import {
  AudiusLibs,
  AudiusABIDecoder,
  Utils,
  SolanaUtils,
  CreatorNode,
  RewardsAttester
} from './AudiusLibs'

type AudiusLibsLegacyShimType = AudiusLibs & {
  SolanaUtils: typeof SolanaUtils
  CreatorNode: typeof CreatorNode
  RewardsAttester: typeof RewardsAttester
}

const AudiusLibsLegacyShim = AudiusLibs as unknown as AudiusLibsLegacyShimType

AudiusLibsLegacyShim.AudiusABIDecoder = AudiusABIDecoder
AudiusLibsLegacyShim.Utils = Utils
AudiusLibsLegacyShim.SolanaUtils = SolanaUtils
AudiusLibsLegacyShim.CreatorNode = CreatorNode
AudiusLibsLegacyShim.RewardsAttester = RewardsAttester

export { AudiusLibsLegacyShim as libs }

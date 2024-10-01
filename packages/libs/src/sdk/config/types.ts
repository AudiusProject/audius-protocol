import type { DiscoveryNode, StorageNode } from '../services'

export type SdkServicesConfig = {
  network: {
    minVersion: string
    discoveryNodes: DiscoveryNode[]
    storageNodes: StorageNode[]
    antiAbuseOracleNodes: {
      registeredAddresses: string[]
      endpoints: string[]
    }
    identityService: string
  }
  acdc: {
    entityManagerContractAddress: string
    chainId: number
  }
  solana: {
    claimableTokensProgramAddress: string
    rewardManagerProgramAddress: string
    rewardManagerStateAddress: string
    paymentRouterProgramAddress: string
    stakingBridgeProgramAddress: string
    rpcEndpoint: string
    usdcTokenMint: string
    wAudioTokenMint: string
    rewardManagerLookupTableAddress: string
  }
}

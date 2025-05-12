import {
  AudiusWalletClient,
  ClaimableTokensClient,
  PaymentRouterClient,
  RewardManagerClient,
  sdk,
  StorageNodeSelectorService
} from '@audius/sdk'
import { vi } from 'vitest'

export const audiusSdk = () => {
  return sdk({
    appName: 'test',
    environment: 'development',
    services: {
      claimableTokensClient: vi.fn() as unknown as ClaimableTokensClient,
      rewardManagerClient: vi.fn() as unknown as RewardManagerClient,
      paymentRouterClient: vi.fn() as unknown as PaymentRouterClient,
      storageNodeSelector: vi.fn() as unknown as StorageNodeSelectorService,
      audiusWalletClient: {
        signMessage: vi.fn(),
        getAddresses: vi
          .fn()
          .mockResolvedValue(['0x0000000000000000000000000000000000000000'])
      } as unknown as AudiusWalletClient
    }
  })
}

import { AudiusBackend } from './AudiusBackend'

export type CreateStripeSessionArgs = {
  destinationCurrency: 'sol' | 'usdc'
  destinationWallet: string
  amount: string
}

export const createStripeSession = async (
  audiusBackendInstance: AudiusBackend,
  config: CreateStripeSessionArgs
) => {
  return (
    await audiusBackendInstance.getAudiusLibs()
  ).identityService?.createStripeSession(config)
}

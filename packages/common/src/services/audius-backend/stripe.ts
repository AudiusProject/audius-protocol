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
  const libs = await audiusBackendInstance.getAudiusLibsTyped()
  if (!libs.identityService) {
    throw new Error('createStripeSession: Unexpected missing identity service')
  }
  return libs.identityService.createStripeSession(config)
}

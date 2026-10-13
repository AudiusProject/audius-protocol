import { createLazyLoader, type PublicInterface } from '../../../../utils/lazy'

import type { PaymentRouterClient } from './PaymentRouterClient'
import type { PaymentRouterClientConfig } from './types'

type Client = PaymentRouterClient

/**
 * Same interface as PaymentRouterClient, but the client (and @audius/spl,
 * anchor, spl-token) is only loaded on the first method call.
 */
export class LazyPaymentRouterClient implements PublicInterface<Client> {
  private readonly loader

  constructor(config: PaymentRouterClientConfig) {
    this.loader = createLazyLoader(async () => {
      const { PaymentRouterClient } = await import('./PaymentRouterClient')
      return new PaymentRouterClient(config)
    })
  }

  async createTransferInstruction(
    ...args: Parameters<Client['createTransferInstruction']>
  ) {
    return (await this.loader.get()).createTransferInstruction(...args)
  }

  async createRouteInstruction(
    ...args: Parameters<Client['createRouteInstruction']>
  ) {
    return (await this.loader.get()).createRouteInstruction(...args)
  }

  async createPurchaseMemoInstruction(
    ...args: Parameters<Client['createPurchaseMemoInstruction']>
  ) {
    return (await this.loader.get()).createPurchaseMemoInstruction(...args)
  }

  async createPurchaseContentInstructions(
    ...args: Parameters<Client['createPurchaseContentInstructions']>
  ) {
    return (await this.loader.get()).createPurchaseContentInstructions(...args)
  }

  async getOrCreateProgramTokenAccount(
    ...args: Parameters<Client['getOrCreateProgramTokenAccount']>
  ) {
    return (await this.loader.get()).getOrCreateProgramTokenAccount(...args)
  }
}

import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import { BaseAPI } from '../../api/generated/default'
import * as runtime from '../../api/generated/default/runtime'
import { parseParams } from '../../utils/parseParams'

import { type RelayRequestBody, RelayRequest, RelaySchema } from './types'

/**
 * Client for the Solana Relay Plugin on Discovery.
 */
export class SolanaRelay extends BaseAPI {
  /**
   * Public key of the currently selected transaction fee payer
   * from the selected Discovery Node.
   */
  private feePayer: PublicKey | null = null

  /**
   * Gets a random fee payer public key from the selected discovery node's
   * Solana relay plugin.
   *
   * Used when relay transactions don't specify a fee payer override.
   */
  public async getFeePayer(
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    if (this.feePayer !== null) {
      return this.feePayer
    }
    const headerParameters: runtime.HTTPHeaders = {}
    const response = await this.request(
      {
        path: '/feePayer',
        method: 'GET',
        headers: headerParameters
      },
      initOverrides
    )
    const { feePayer } = await new runtime.JSONApiResponse(
      response,
      (json) => ({
        feePayer: !runtime.exists(json, 'feePayer')
          ? undefined
          : new PublicKey(json.feePayer as string)
      })
    ).value()
    if (!feePayer) {
      throw new Error('Failed to get fee payer!')
    }
    this.feePayer = feePayer
    return this.feePayer
  }

  /**
   * Gets a location instruction to be sent along with a transaction.
   */
  public async getLocationInstruction(
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const headerParameters: runtime.HTTPHeaders = {}
    const response = await this.request(
      {
        path: '/instruction/location',
        method: 'GET',
        headers: headerParameters,
        query: {
          feePayer: (await this.getFeePayer()).toBase58()
        }
      },
      initOverrides
    )
    const { instruction } = await new runtime.JSONApiResponse(
      response,
      (json) => ({
        instruction: json.instruction as TransactionInstruction
      })
    ).value()
    if (!instruction) {
      throw new Error('Failed to get instruction!')
    }
    return instruction
  }

  /**
   * Relays a transaction to the selected discovery node's Solana relay plugin.
   */
  public async relay(
    params: RelayRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const { transaction, confirmationOptions, sendOptions } = await parseParams(
      'relay',
      RelaySchema
    )(params)

    const headerParameters: runtime.HTTPHeaders = {}
    const body: RelayRequestBody = {
      transaction: Buffer.from(transaction.serialize()).toString('base64'),
      confirmationOptions,
      sendOptions
    }

    const response = await this.request(
      {
        path: '/relay',
        method: 'POST',
        headers: headerParameters,
        body
      },
      initOverrides
    )

    return await new runtime.JSONApiResponse(response, (json) => {
      if (!runtime.exists(json, 'signature')) {
        throw new Error('Signature missing')
      }
      return {
        signature: json.signature as string
      }
    }).value()
  }
}

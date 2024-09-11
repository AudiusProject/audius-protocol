import {
  PublicKey,
  SendTransactionError,
  TransactionInstruction
} from '@solana/web3.js'

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
        headers: headerParameters
      },
      initOverrides
    )
    const { instruction } = await new runtime.JSONApiResponse(
      response,
      (json) => ({
        instruction: new TransactionInstruction({
          keys: json.instruction.keys,
          programId: new PublicKey(json.instruction.programId),
          data: Buffer.from(json.instruction.data)
        })
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

    let response: Response
    try {
      response = await this.request(
        {
          path: '/relay',
          method: 'POST',
          headers: headerParameters,
          body
        },
        initOverrides
      )
    } catch (e) {
      // Catch response errors, and if possible, recreate the original
      // SendTransactionError to transparently raise to the caller.
      if (e instanceof Error && e.name === 'ResponseError') {
        const resp = (e as runtime.ResponseError).response.clone()
        const body = await resp.json()
        if (
          'error' in body &&
          'transactionMessage' in body &&
          'signature' in body
        ) {
          throw new SendTransactionError({
            action: body.error.indexOf('Simulation') > -1 ? 'simulate' : 'send',
            signature: body.signature,
            transactionMessage: body.transactionMessage,
            logs: body.transactionLogs
          })
        }
      }
      throw e
    }

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

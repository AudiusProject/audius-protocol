import type { Chain, Client, SignableMessage, Transport } from 'viem'
import { stringToHex, toHex } from 'viem/utils'

import type { AudiusAccount } from '../types'

export type SignParameters<
  TAccount extends AudiusAccount | undefined = AudiusAccount | undefined
> = {
  account?: TAccount
  message: SignableMessage
}

export async function sign<
  TChain extends Chain | undefined,
  TAccount extends AudiusAccount | undefined
>(
  client: Client<Transport, TChain, TAccount>,
  { account: account_ = client.account, message: message_ }: SignParameters
): Promise<[Uint8Array, number]> {
  if (!account_) throw new Error('Account not found')
  const account =
    typeof account_ === 'string'
      ? { address: account_, type: 'json-rpc' }
      : account_

  const message = (() => {
    if (typeof message_ === 'string') return stringToHex(message_)
    if (message_.raw instanceof Uint8Array) return toHex(message_.raw)
    return message_.raw
  })()

  if ('sign' in account && account.sign) {
    return account.sign(message)
  }
  throw new Error(
    `Account type '${account.type}' does not implement 'sign' method.`
  )
}

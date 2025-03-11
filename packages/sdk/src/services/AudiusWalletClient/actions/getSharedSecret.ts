import type { Chain, Client, Transport } from 'viem'

import type { AudiusAccount } from '../types'

export type GetSharedSecretParameters<
  TAccount extends AudiusAccount | undefined = AudiusAccount | undefined
> = {
  account?: TAccount
  publicKey: string | Uint8Array
}

export async function getSharedSecret<
  TChain extends Chain | undefined,
  TAccount extends AudiusAccount | undefined
>(
  client: Client<Transport, TChain, TAccount>,
  {
    account: account_ = client.account,
    publicKey
  }: GetSharedSecretParameters<TAccount>
) {
  if (!account_) throw new Error('Account not found')
  const account =
    typeof account_ === 'string'
      ? { address: account_, type: 'json-rpc' }
      : account_
  if ('getSharedSecret' in account && account.getSharedSecret) {
    return account.getSharedSecret(publicKey)
  }
  throw new Error(
    `Account type '${account.type}' does not implement 'getSharedSecret' method.`
  )
}

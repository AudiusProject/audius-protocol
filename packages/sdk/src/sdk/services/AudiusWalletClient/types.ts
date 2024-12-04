import type { Account, Chain, Client, Hex, RpcSchema, Transport } from 'viem'

import type { Prettify } from '../../utils/prettify'

import type { AudiusWalletActions } from './decorators/audiusWallet'

/**
 * The AudiusAccount is like the LocalAccount from Viem, except it
 * has raw signing and sharedSecret capabilities for encryption purposes,
 * used for communications with comms to keep chats/DMs e2ee.
 */
export type AudiusAccount = Account & {
  /**
   * Get a shared secret, used for Chats
   */
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array>
  /**
   * Signs the keccak hash of some data, used for Chats
   * @deprecated use signMessage instead
   */
  signRaw: (data: Hex) => Promise<[Uint8Array, number]>
}

/**
 * AudiusWalletClient is the combination of a subset of WalletClient from Viem
 * and some additional actions, `getSharedSecret` and `sign`.
 */
export type AudiusWalletClient<
  TTransport extends Transport = Transport,
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends AudiusAccount = AudiusAccount,
  TRpcSchema extends RpcSchema | undefined = undefined
> = Prettify<
  Client<
    TTransport,
    TChain,
    TAccount,
    TRpcSchema,
    AudiusWalletActions<TChain, TAccount>
  >
>

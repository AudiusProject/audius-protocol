import type { Chain, Client, Transport, WalletActions } from 'viem'
import { getAddresses, signMessage, signTypedData } from 'viem/actions'

import {
  getSharedSecret,
  GetSharedSecretParameters
} from '../actions/getSharedSecret'
import { sign, type SignParameters } from '../actions/sign'
import type { AudiusAccount } from '../types'

export type AudiusWalletActions<
  TChain extends Chain | undefined = Chain | undefined,
  TAccount extends AudiusAccount | undefined = AudiusAccount | undefined
> = {
  /**
   * Returns a list of account addresses owned by the wallet or client.
   *
   * - Docs: https://viem.sh/docs/actions/wallet/getAddresses
   * - JSON-RPC Methods: [`eth_accounts`](https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_accounts)
   *
   * @returns List of account addresses owned by the wallet or client. {@link GetAddressesReturnType}
   *
   * @example
   * import { createWalletClient, custom } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const accounts = await client.getAddresses()
   */
  getAddresses: WalletActions<TChain, TAccount>['getAddresses']
  /**
   * Calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
   *
   * - Docs: https://viem.sh/docs/actions/wallet/signMessage
   * - JSON-RPC Methods:
   *   - JSON-RPC Accounts: [`personal_sign`](https://docs.metamask.io/guide/signing-data#personal-sign)
   *   - Local Accounts: Signs locally. No JSON-RPC request.
   *
   * With the calculated signature, you can:
   * - use [`verifyMessage`](https://viem.sh/docs/utilities/verifyMessage) to verify the signature,
   * - use [`recoverMessageAddress`](https://viem.sh/docs/utilities/recoverMessageAddress) to recover the signing address from a signature.
   *
   * @param args - {@link SignMessageParameters}
   * @returns The signed message. {@link SignMessageReturnType}
   *
   * @example
   * import { createWalletClient, custom } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const signature = await client.signMessage({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   message: 'hello world',
   * })
   *
   * @example
   * // Account Hoisting
   * import { createWalletClient, http } from 'viem'
   * import { privateKeyToAccount } from 'viem/accounts'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   account: privateKeyToAccount('0x…'),
   *   chain: mainnet,
   *   transport: http(),
   * })
   * const signature = await client.signMessage({
   *   message: 'hello world',
   * })
   */
  signMessage: WalletActions<TChain, TAccount>['signMessage']
  /**
   * Signs typed data and calculates an Ethereum-specific signature in [EIP-191 format](https://eips.ethereum.org/EIPS/eip-191): `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`.
   *
   * - Docs: https://viem.sh/docs/actions/wallet/signTypedData
   * - JSON-RPC Methods:
   *   - JSON-RPC Accounts: [`eth_signTypedData_v4`](https://docs.metamask.io/guide/signing-data#signtypeddata-v4)
   *   - Local Accounts: Signs locally. No JSON-RPC request.
   *
   * @param client - Client to use
   * @param args - {@link SignTypedDataParameters}
   * @returns The signed data. {@link SignTypedDataReturnType}
   *
   * @example
   * import { createWalletClient, custom } from 'viem'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   chain: mainnet,
   *   transport: custom(window.ethereum),
   * })
   * const signature = await client.signTypedData({
   *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
   *   domain: {
   *     name: 'Ether Mail',
   *     version: '1',
   *     chainId: 1,
   *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
   *   },
   *   types: {
   *     Person: [
   *       { name: 'name', type: 'string' },
   *       { name: 'wallet', type: 'address' },
   *     ],
   *     Mail: [
   *       { name: 'from', type: 'Person' },
   *       { name: 'to', type: 'Person' },
   *       { name: 'contents', type: 'string' },
   *     ],
   *   },
   *   primaryType: 'Mail',
   *   message: {
   *     from: {
   *       name: 'Cow',
   *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
   *     },
   *     to: {
   *       name: 'Bob',
   *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
   *     },
   *     contents: 'Hello, Bob!',
   *   },
   * })
   *
   * @example
   * // Account Hoisting
   * import { createWalletClient, http } from 'viem'
   * import { privateKeyToAccount } from 'viem/accounts'
   * import { mainnet } from 'viem/chains'
   *
   * const client = createWalletClient({
   *   account: privateKeyToAccount('0x…'),
   *   chain: mainnet,
   *   transport: http(),
   * })
   * const signature = await client.signTypedData({
   *   domain: {
   *     name: 'Ether Mail',
   *     version: '1',
   *     chainId: 1,
   *     verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
   *   },
   *   types: {
   *     Person: [
   *       { name: 'name', type: 'string' },
   *       { name: 'wallet', type: 'address' },
   *     ],
   *     Mail: [
   *       { name: 'from', type: 'Person' },
   *       { name: 'to', type: 'Person' },
   *       { name: 'contents', type: 'string' },
   *     ],
   *   },
   *   primaryType: 'Mail',
   *   message: {
   *     from: {
   *       name: 'Cow',
   *       wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
   *     },
   *     to: {
   *       name: 'Bob',
   *       wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
   *     },
   *     contents: 'Hello, Bob!',
   *   },
   * })
   */
  signTypedData: WalletActions<TChain, TAccount>['signTypedData']
  /**
   * Signs a raw keccak256 hash of some payload using secp256k1.
   * Not supported by most wallets.
   *
   * @deprecated Use `signMessage` instead for maximal wallet compatibility.
   *
   * @returns the signature encoded as a hex string, with the 0x prefix
   */
  sign: (args: SignParameters) => Promise<[Uint8Array, number]>
  /**
   * Gets a secret to be shared between this wallet and the target publicKey.
   *
   * WARNING: Not supported by most wallets!
   *
   * @returns the shared secret.
   */
  getSharedSecret: (
    args: GetSharedSecretParameters<TAccount>
  ) => Promise<Uint8Array>
}

export function audiusWalletActions<
  TTransport extends Transport,
  TChain extends Chain | undefined,
  TAccount extends AudiusAccount
>(
  client: Client<TTransport, TChain, TAccount>
): AudiusWalletActions<TChain, TAccount> {
  return {
    getAddresses: async () => getAddresses(client),
    sign: (args) => sign(client, args),
    signMessage: (args) => signMessage(client, args),
    signTypedData: (args) => signTypedData(client, args),
    getSharedSecret: (args) => getSharedSecret(client, args)
  }
}

export type WalletApiService = {
  getSharedSecret: (publicKey: string | Uint8Array) => Promise<Uint8Array>
  sign: (data: string) => Promise<[Uint8Array, number]>
  getAddress: () => Promise<string>
}

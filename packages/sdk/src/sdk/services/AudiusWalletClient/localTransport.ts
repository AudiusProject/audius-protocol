/**
 * A stub of a Viem transport. Used in cases where making an RPC call is unwanted,
 * which is true of most AudiusWalletClient implementations.
 */
export const localTransport = () => {
  const request = async ({
    method,
    params
  }: {
    method: string
    params?: unknown[] | object
  }) => {
    console.error('Local transport in use. RPC methods are not implemented.', {
      method,
      params
    })
    throw new Error(`Method '${method}' not implemented on local transport.`)
  }
  return { request }
}

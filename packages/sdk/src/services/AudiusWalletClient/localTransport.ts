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
    throw new Error(
      `Method '${method}' not implemented on local transport with params ${params}.`
    )
  }
  return { request }
}

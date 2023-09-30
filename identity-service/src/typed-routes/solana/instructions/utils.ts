import { Blob, Layout, blob } from '@solana/buffer-layout'

/**
 * Wrapper that makes Ethereum wallet addresses encoded and decoded as 20 byte blobs
 */
export class EthereumAddress extends Layout<string> {
  private blob: Blob
  constructor(property?: string) {
    super(-1, property)
    this.blob = blob(20, property)
  }

  /** @override */
  getSpan(b: Uint8Array, offset?: number) {
    return this.blob.getSpan(b, offset)
  }

  /**
   * Proxies the decoding to the underlying Blob, then
   * converts the buffer to hex and prepends '0x'.
   * @override
   * */
  decode(b: Uint8Array, offset = 0): string {
    const buffer = this.blob.decode(b, offset)
    return '0x' + Buffer.from(buffer).toString('hex')
  }

  /**
   * Strips the 0x and converts the address to a buffer, then
   * proxies the encoding to the underlying Blob.
   * @override
   * */
  encode(src: string, b: Uint8Array, offset: number): number {
    const strippedEthAddress = src.replace('0x', '')
    // Need to pad the array to length 20 - otherwise, hex eth keys starting with '0' would
    // result in truncated arrays, while eth spec is always 20 bytes
    const buf = Buffer.from(strippedEthAddress, 'hex')
    const fixedBuf = Buffer.alloc(20, 0)
    buf.copy(fixedBuf, 20 - buf.length)
    return this.blob.encode(buf, b, offset)
  }
}

/** Factory for EthereumAddress layouts */
export const ethAddress = (property?: string) => new EthereumAddress(property)

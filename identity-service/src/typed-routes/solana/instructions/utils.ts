/**
 * Converts the data buffer to hex, removes the instruction enum, and prefixes with 0x
 * @param data
 * @returns the ethereum wallet
 */
export const decodeEthereumWallet = (data: Buffer) =>
  '0x' + data.toString().substring(2)

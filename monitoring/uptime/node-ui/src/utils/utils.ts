import { ethers } from 'ethers'

export const utf8ToBytes32 = (utf8Str: string) => {
  return ethers.utils.formatBytes32String(utf8Str)
}

export const bytes32ToUtf8 = (bytes32Str: string) => {
  return ethers.utils.parseBytes32String(bytes32Str)
}

export const isEthAddressValid = (address: string) => {
  try {
    if (address.length !== 42 || !address.startsWith('0x')) {
      return false
    }
    const hexadecimalRegex = /^[0-9a-fA-F]+$/
    return hexadecimalRegex.test(address.slice(2))
  } catch (_e) {
    return false
  }
}

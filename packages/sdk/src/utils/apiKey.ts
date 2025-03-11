export const isApiKeyValid = (apiKey: string) => {
  try {
    if (apiKey.length !== 40) {
      return false
    }
    const hexadecimalRegex = /^[0-9a-fA-F]+$/
    return hexadecimalRegex.test(apiKey)
  } catch (_e) {
    return false
  }
}

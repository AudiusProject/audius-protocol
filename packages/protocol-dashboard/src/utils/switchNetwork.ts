export const decimalNetworkIdToHexNetworkId = (id: string | number) => {
  const intId = Number(id)
  const hexStr = intId.toString(16)
  return `0x${hexStr}`
}

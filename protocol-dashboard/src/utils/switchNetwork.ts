export const decimalNetworkIdToHexNetworkId = (id: string | number) => {
  const intId = Number(id)
  const hexStr = intId.toString(16)
  return `0x${hexStr}`
}

const MISSING_CHAIN_ERROR_CODE = 4902
export const ETH_NETWORK_ID = import.meta.env.VITE_ETH_NETWORK_ID

export const switchNetwork = async (to: string) => {
  const chainId = decimalNetworkIdToHexNetworkId(to)
  if (typeof window.ethereum !== 'undefined') {
    const ethereum = window.ethereum
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      })
    } catch (error) {
      if (error.code === MISSING_CHAIN_ERROR_CODE) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x102021',
                chainName: 'Audius Staging',
                rpcUrls: ['https://discoveryprovider.staging.audius.co/chain']
              }
            ]
          })
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId }]
          })
        } catch (error) {
          console.error(error.message)
          return false
        }
      } else {
        console.error('Network switch request rejected.')
        return false
      }
    }
  } else {
    console.error('MetaMask is not installed.')
    return false
  }
  return true
}

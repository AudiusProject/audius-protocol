import web3 from 'web3-utils'

export const isBItem = (id) => {
  return window.bItems.has(web3.sha3(`${id}`))
}

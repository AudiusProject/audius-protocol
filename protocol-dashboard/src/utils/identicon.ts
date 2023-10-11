import Identicon from 'identicon.js'

export const getRandomDefaultImage = (wallet: string) => {
  const data = new Identicon(wallet, 420).toString()
  return `data:image/png;base64,${data}`
}

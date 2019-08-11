const sessionManager = require('../../src/sessionManager')
const { User } = require('../../src/models')

const testEthereumConstants = {
  pubKey: '0xadD36bad12002f1097Cdb7eE24085C28e960FC32',
  privKeyHex: 'acd6db99f7354043bf7a14a4fbb81b348e028717933eda978afd97b3e80cf1da'
}

async function createStarterUser () {
  const user = await User.create({ walletPublicKey: testEthereumConstants.pubKey.toLowerCase() })
  return sessionManager.createSession(user.id)
}

module.exports = { createStarterUser, testEthereumConstants }

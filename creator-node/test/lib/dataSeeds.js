const sessionManager = require('../../src/sessionManager')
const { CNodeUser } = require('../../src/models')

const testEthereumConstants = {
  pubKey: '0xadD36bad12002f1097Cdb7eE24085C28e960FC32',
  privKeyHex: 'acd6db99f7354043bf7a14a4fbb81b348e028717933eda978afd97b3e80cf1da'
}

const getCNodeUser = async (cnodeUserUUID) => {
  const { dataValues } = await CNodeUser.findOne({ where: { cnodeUserUUID } })
  return dataValues
}

const destroyUsers = async () => (
  CNodeUser.destroy({
    where: {},
    truncate: true,
    cascade: true // cascades delete to all rows with foreign key on cnodeUser
  })
)

async function createStarterCNodeUser (userId = null, pubKey = testEthereumConstants.pubKey.toLowerCase()) {
  return createStarterCNodeUserWithKey(pubKey, userId)
}

async function createStarterCNodeUserWithKey (walletPublicKey, userId = null) {
  const cnodeUser = await CNodeUser.create({ walletPublicKey, clock: 0 })
  const sessionToken = await sessionManager.createSession(cnodeUser.cnodeUserUUID)
  const resp = {
    cnodeUserUUID: cnodeUser.cnodeUserUUID,
    sessionToken: sessionToken,
    walletPublicKey
  }
  if (userId) resp.userId = userId
  return resp
}

module.exports = { createStarterCNodeUser, createStarterCNodeUserWithKey, testEthereumConstants, getCNodeUser, destroyUsers }

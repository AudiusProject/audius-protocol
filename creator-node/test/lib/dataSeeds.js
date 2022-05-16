const uuid = require('uuid/v4')

const Utils = require('../../src/utils')
const sessionManager = require('../../src/sessionManager')
const models = require('../../src/models')

const { generateRandomCID } = require('./utils')

const testEthereumConstants = {
  pubKey: '0xadD36bad12002f1097Cdb7eE24085C28e960FC32',
  privKeyHex: 'acd6db99f7354043bf7a14a4fbb81b348e028717933eda978afd97b3e80cf1da'
}

const getCNodeUser = async (cnodeUserUUID) => {
  const { dataValues } = await models.CNodeUser.findOne({
    where: { cnodeUserUUID }
  })
  return dataValues
}

const destroyUsers = async () =>
  models.CNodeUser.destroy({
    where: {},
    truncate: true,
    cascade: true // cascades delete to all rows with foreign key on cnodeUser
  })

async function createStarterCNodeUser(
  userId = null,
  pubKey = testEthereumConstants.pubKey.toLowerCase()
) {
  return createStarterCNodeUserWithKey(pubKey, userId)
}

async function createStarterCNodeUserWithKey(walletPublicKey, userId = null) {
  const cnodeUser = await models.CNodeUser.create({ walletPublicKey, clock: 0 })
  const sessionToken = await sessionManager.createSession(
    cnodeUser.cnodeUserUUID
  )
  const resp = {
    cnodeUserUUID: cnodeUser.cnodeUserUUID,
    sessionToken: sessionToken,
    walletPublicKey
  }
  if (userId) resp.userId = userId
  return resp
}

async function createSession() {
  const dummyKey = uuid()
  const user = await createStarterCNodeUserWithKey(dummyKey, null)
  const tokenObject = await models.SessionToken.findOne({
    where: { token: user.sessionToken }
  })
  return tokenObject
}

// Seeds ContentBlacklist with the input number of tracks, cids, and users
const seedContentBlacklist = async ({
  numTracks = 10,
  numCids = 10,
  numUsers = 5
}) => {
  console.log('tracks', numTracks, 'cids', numCids, 'users', numUsers)

  const MAX_ID = 100
  const contentBlacklistEntries = []

  let i
  for (i = 0; i < numTracks; i++) {
    contentBlacklistEntries.push({
      value: Utils.getRandomInt(MAX_ID),
      type: models.ContentBlacklist.Types.track
    })
  }

  for (i = 0; i < numUsers; i++) {
    contentBlacklistEntries.push({
      value: Utils.getRandomInt(MAX_ID),
      type: models.ContentBlacklist.Types.user
    })
  }

  for (i = 0; i < numCids; i++) {
    contentBlacklistEntries.push({
      value: generateRandomCID(),
      type: models.ContentBlacklist.Types.cid
    })
  }

  await models.ContentBlacklist.bulkCreate({
    values
  })
}

const clearContentBlacklist = async () => {
  await models.ContentBlacklist.destory({
    where: {},
    truncate: true
  })
}

module.exports = {
  createStarterCNodeUser,
  createStarterCNodeUserWithKey,
  testEthereumConstants,
  getCNodeUser,
  destroyUsers,
  createSession,
  clearContentBlacklist,
  seedContentBlacklist
}

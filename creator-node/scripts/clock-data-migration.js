const fs = require('fs-extra')
const assert = require('assert')

const initDB = require('./db.js')


const discprovUsersFilePath = './discprov-users.txt'

const usersToRSetMap = {}
const nodeToUsersMap = {}

const endpointToDbUrl = {
  'http://cn1_creator-node_1:4000': 'postgres://postgres:postgres@127.0.0.1:4432/audius_creator_node',
  'http://cn2_creator-node_1:4001': 'postgres://postgres:postgres@127.0.0.1:4433/audius_creator_node',
  'http://cn3_creator-node_1:4002': 'postgres://postgres:postgres@127.0.0.1:4434/audius_creator_node'
}

const buildNodeToUsersMap = async () => {
  const fileData = fs.readFileSync(discprovUsersFilePath, 'utf8')
  
  const fileDataLines = fileData.split('\n')
  
  for (const fileDataLine of fileDataLines) {
    const [userId, wallet, endpointStr] = fileDataLine.split('\t')
    // console.log(userId, endpointStr)
    
    usersToRSetMap[userId] = { wallet, endpointStr }

    const [primary, ...secondaries] = endpointStr.split(',')
    if (nodeToUsersMap[primary]) {
      nodeToUsersMap[primary].push({ userId, secondaries })
    } else {
      nodeToUsersMap[primary] = [{ userId, secondaries }]
    }
  }

  // console.log('\n\n')
  // console.log(JSON.stringify(nodeToUsersMap, undefined, 2))

  assert.equal(fileDataLines.length, (Object.keys(usersToRSetMap)).length)
}

/**
for (primary of primaries)
  for (user_id of user_ids)
    update clock state on primary (in transaction)
      select cnodeUserUUID from AudiusUsers for blockchainId
      select all rows in Files, Tracks, AudiusUsers for cnodeUserUUID
      order all data in time order asc
      assign auto-inc clcokval to each row from 1
      assign final clockval to cnodeUsers row
    force sync secondaries against primary
 */
const populateClockVals = async () => {
  const nodes = Object.keys(nodeToUsersMap)

  for (const node of nodes) {
    // init DB instances
    const dbUrl = endpointToDbUrl[node]
    const models = await initDB(dbUrl)

    for (const { userId, secondaries } of nodeToUsersMap[node]) {
      console.log(node, dbUrl, userId, secondaries)

      const transaction = await models.sequelize.transaction()

      const audiusUser = await models.AudiusUser.findAll({
        where: { "blockchainId": userId },
        transaction
      })

      console.log(audiusUser)
      console.log('\n\n\n\n\n')

      await transaction.commit()
    }
  }
}

buildNodeToUsersMap()
populateClockVals()

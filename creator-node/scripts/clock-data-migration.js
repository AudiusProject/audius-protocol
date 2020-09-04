const fs = require('fs-extra')
const assert = require('assert')

const models = require('../src/models')


const discprovUsersFilePath = './discprov-users.txt'

const usersToRSetMap = {}
const nodeToUsersMap = {}

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
    for (const { userId, secondaries } of nodeToUsersMap[node]) {
      // console.log(node, userId, secondaries)
      // const { userId, secondaries } = userObj

      // const transaction = await models.sequelize.transaction()
      const resp = await models.CNodeUser.find()
      console.log(resp)
    }
  }
}

buildNodeToUsersMap()
populateClockVals()

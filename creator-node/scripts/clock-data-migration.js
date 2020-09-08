const fs = require('fs-extra')
const assert = require('assert')
const axios = require('axios')

const initDB = require('./db.js')

/**
 * select user_id, wallet, creator_node_endpoint from users
 *  where is_current = true and is_creator = true
 *  and creator_node_endpoint is not null;
 */
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
      const transaction = await models.sequelize.transaction()

      try {
        // console.log('\n\n\n')
        const audiusUsers = await models.AudiusUser.findAll({
          where: { blockchainId: userId },
          transaction
        })

        let cnodeUserUUID
        if (audiusUsers && audiusUsers.length > 0) {
          cnodeUserUUID = audiusUsers[0].cnodeUserUUID
  
          const tracks = await models.Track.findAll({
            where: { cnodeUserUUID },
            transaction
          })
          const files = await models.File.findAll({
            where: { cnodeUserUUID },
            transaction
          })
  
          // Aggregate all data in array
          const data = []
          for (const audiusUser of audiusUsers) data.push([audiusUser, 'audiusUser'])
          for (const track of tracks) data.push([track, 'track'])
          for (const file of files) data.push([file, `file - ${file.dataValues.type}`])
          // for (const datum of data) {
          //   const entry = datum[0].dataValues
          //   // console.log(`SIDTEST DATA ENTRY: ${entry.createdAt} - ${entry.clock}`)
          // }
  
          // order all rows from Files, Tracks, AudiusUsers by "created" ASC (compares times in milliseconds)
          data.sort((a, b) => {
            const dA = new Date(a[0].dataValues.createdAt).getTime()
            const dB = new Date(b[0].dataValues.createdAt).getTime()
            const diff = dA - dB
            return diff
          })
          // for (const datum of data) {
          //   const entry = datum[0].dataValues
          //   // console.log(`SIDTESTSORTED DATA ENTRY: ${entry.createdAt} - ${entry.clock} - ${datum[1]}`)
          // }
  
          // Update each data table row with new clock2 value
          let clockCounter = 0
          for (const datum of data) {
            const datumUpdateResp = await datum[0].update(
              { clock2: ++clockCounter },
              { transaction }
            )
          }
          
          // Update cnodeUser row with final clock2 value
          const numRowsChanged = await models.CNodeUser.update(
            { clock2: clockCounter },
            {
              where: { cnodeUserUUID },
              transaction
            }
          )
          if (!numRowsChanged) {
            throw new Error('CNodeUser update failed')
          }
        }
  
        await transaction.commit()

        // force sync secondaries
        if (cnodeUserUUID) {
          const cnodeUserWallet = usersToRSetMap[userId].wallet
          await triggerSecondarySyncs(node, secondaries, cnodeUserWallet)
          await timeout(2000)
        }
      } catch (e) {
        console.error(`SIDTESTERROR`, e)
        await transaction.rollback()
      }
    }
  }
}

buildNodeToUsersMap()
populateClockVals()


/**
 * Tell all secondaries to sync against self.
 * @dev - Is not a middleware so it can be run before responding to client.
 */
async function triggerSecondarySyncs (primary, secondaries, wallet) {
  // TODO - throw if resp fails
  // TODO - modify sync to not fail on equal blocknumber
  const resp = await Promise.all(secondaries.map(
    async (secondary) => {
      if (!secondary) return

      const axiosReq = {
        baseURL: secondary,
        url: '/sync',
        method: 'post',
        data: {
          wallet: [wallet],
          creator_node_endpoint: primary,
          immediate: true
        }
      }
      return axios(axiosReq)
    }
  ))
}

async function timeout (ms) {
  console.log(`starting timeout of ${ms}`)
  return new Promise(resolve => setTimeout(resolve, ms))
}
// const fs = require('fs-extra')
// const assert = require('assert')
// const axios = require('axios')

// const initDB = require('./db.js')

// /**
//  * select user_id, wallet, creator_node_endpoint from users
//  *  where is_current = true and is_creator = true
//  *  and creator_node_endpoint is not null;
//  */
// const discprovUsersFilePath = './discprov-users-PROD.txt'

// const usersToRSetMap = {}
// const nodeToUsersMap = {}

// const endpointToDbUrl = {
//   'http://cn1_creator-node_1:4000': 'postgres://postgres:postgres@127.0.0.1:4432/audius_creator_node',
//   'http://cn2_creator-node_1:4001': 'postgres://postgres:postgres@127.0.0.1:4433/audius_creator_node',
//   'http://cn3_creator-node_1:4002': 'postgres://postgres:postgres@127.0.0.1:4434/audius_creator_node'
// }
// const endpointToDbUrlProd = {
//   'https://creatornode.audius.co': 'postgres://creator_1:postgres@127.0.0.1:5475/audius_creator_node',
//   'https://creatornode2.audius.co': '',
//   'https://creatornode3.audius.co': ''
// }

// const buildNodeToUsersMap = async () => {
//   const fileData = fs.readFileSync(discprovUsersFilePath, 'utf8')
//   const fileDataLines = fileData.split('\n')

//   let count = 0
//   for (const fileDataLine of fileDataLines) {
//     const [userId, wallet, endpointStr] = fileDataLine.split('\t')
//     // console.log(`SIDTEST ROW #${++count}`, userId, wallet, endpointStr)

//     usersToRSetMap[userId] = { wallet, endpointStr }
//     const [primary, ...secondaries] = endpointStr.split(',')
//     // console.log(`     ENDPOINT SPLIT`, primary, secondaries)

//     if (nodeToUsersMap[primary]) {
//       nodeToUsersMap[primary].push({ userId, secondaries })
//     } else {
//       nodeToUsersMap[primary] = [{ userId, secondaries }]
//     }
//   }

//   count = 0
//   // for (const user of nodeToUsersMap['https://creatornode.audius.co']) {
//   //   if (++count > 300) break
//   //   console.log(`SIDTEST CN1 || USERID: `, user.userId, " || SECONDARIES: ", JSON.stringify(user.secondaries))
//   // }

//   assert.equal(fileDataLines.length, (Object.keys(usersToRSetMap)).length)
// }

// /**
// for (primary of primaries)
//   for (user_id of user_ids)
//     update clock state on primary (in transaction)
//       select cnodeUserUUID from AudiusUsers for blockchainId
//       select all rows in Files, Tracks, AudiusUsers for cnodeUserUUID
//       order all data in time order asc
//       assign auto-inc clcokval to each row from 1
//       assign final clockval to cnodeUsers row
//     force sync secondaries against primary
//  */
// const populateClockVals = async () => {
//   const nodes = Object.keys(nodeToUsersMap)

//   // TODO - modify all queries to add SELECT FOR UPDATE and hold lock until commit
//   for (const node of nodes) {
//     if (node != 'https://creatornode.audius.co') continue
//     // init DB instances
//     const dbUrl = endpointToDbUrlProd[node]
//     const models = await initDB(dbUrl)

//     console.log(`number of users on ${node}: ${nodeToUsersMap[node].length}`)
//     for (const { userId, secondaries } of nodeToUsersMap[node]) {
//       console.log('\n\n\n\n')
//       const start = Date.now()

//       const transaction = await models.sequelize.transaction()

//       try {
//         const audiusUsers = await models.AudiusUser.findAll({
//           where: { blockchainId: userId },
//           transaction
//         })

//         let cnodeUserUUID
//         if (audiusUsers && audiusUsers.length > 0) {
//           cnodeUserUUID = audiusUsers[0].cnodeUserUUID

//           console.log(`userId: ${userId} || audiusUserUUID: ${audiusUsers[0].audiusUserUUID} || cnodeUserUUID: ${cnodeUserUUID}`)

//           // Short circuit if audiusUser already has clock value
//           if (audiusUsers[0].clock != null) {
//             console.log(`audiusUser already has clock value of ${audiusUsers[0].clock}. Short-circuiting migration`)
//             continue
//           }

//           const tracks = await models.Track.findAll({
//             where: { cnodeUserUUID },
//             transaction
//           })
//           const files = await models.File.findAll({
//             where: { cnodeUserUUID },
//             transaction
//           })

//           // Aggregate all data in array
//           const data = []
//           for (const audiusUser of audiusUsers) data.push([audiusUser, `audiusUserUUID ${audiusUser.dataValues.audiusUserUUID}`])
//           for (const track of tracks) data.push([track, `trackUUID ${track.dataValues.trackUUID}`])
//           for (const file of files) data.push([file, `fileUUId ${file.dataValues.fileUUID} - ${file.dataValues.type}`])

//           // order all rows from Files, Tracks, AudiusUsers by "created" ASC (compares times in milliseconds)
//           data.sort((a, b) => {
//             const dA = new Date(a[0].dataValues.createdAt).getTime()
//             const dB = new Date(b[0].dataValues.createdAt).getTime()
//             const diff = dA - dB
//             return diff
//           })

//           // Update each data table row with new clock value
//           let clockCounter = 0
//           for (const datum of data) {
//             await datum[0].update(
//               { clock: ++clockCounter },
//               { transaction }
//             )
//           }

//           // Update cnodeUser row with final clock value
//           const numRowsChanged = await models.CNodeUser.update(
//             { clock: clockCounter },
//             {
//               where: { cnodeUserUUID },
//               transaction
//             }
//           )
//           if (!numRowsChanged) {
//             throw new Error('CNodeUser update failed')
//           }
//         } else {
//           console.log(`\n\n\nuserId: ${userId} || no audiusUser found`)
//         }

//         await transaction.commit()

//         // force sync secondaries
//         // if (cnodeUserUUID) {
//         //   const cnodeUserWallet = usersToRSetMap[userId].wallet
//         //   await triggerSecondarySyncs(node, secondaries, cnodeUserWallet)
//         //   await timeout(2000)
//         // }
//       } catch (e) {
//         console.error(`SIDTESTERROR`, e)
//         await transaction.rollback()
//       }

//       const durationMs = Date.now() - start
//       console.log(`USER ROUTE TIME (sec): ${Math.floor(durationMs / 1000)}`)
//     }
//   }
//   console.log('populateClockVals() COMPLETE')
// }

// buildNodeToUsersMap()
// populateClockVals()

// /**
//  * Tell all secondaries to sync against self.
//  * @dev - Is not a middleware so it can be run before responding to client.
//  */
// async function triggerSecondarySyncs (primary, secondaries, wallet) {
//   // TODO - throw if resp fails
//   // TODO - modify sync to not fail on equal blocknumber
//   const resp = await Promise.all(secondaries.map(
//     async (secondary) => {
//       if (!secondary) return

//       const axiosReq = {
//         baseURL: secondary,
//         url: '/sync',
//         method: 'post',
//         data: {
//           wallet: [wallet],
//           creator_node_endpoint: primary,
//           immediate: true
//         }
//       }
//       return axios(axiosReq)
//     }
//   ))
// }

// async function timeout (ms) {
//   console.log(`starting timeout of ${ms}`)
//   return new Promise(resolve => setTimeout(resolve, ms))
// }

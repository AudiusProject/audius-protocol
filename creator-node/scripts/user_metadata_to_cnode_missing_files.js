const axios = require('axios')
const path = require('path')
const fs = require('fs')
var { exec } = require('child_process')

const userIds = require('./user_metadata_to_cnode_missing_files_userids')
const DBManager = require('./dbManagerClone')

/**
 * Script usage
 *
 * The script can move files from user metadata to one content node at a time. It's also fully idempotent since it does a diff
 * between the existing files and the files it needs to add, so it will never add duplicates of existing files
 *
 * There's 5 env vars that are required
 * export UM_DB_URL=<user metadata connection string>
 * export CN_DB_URL=<content node connection string>
 * export KUBE_POD_NAME=<kubernetes pod name for content node (used to cp files from local file system to /file_storage)>
 * export KUBE_NAMESPACE=<kubernetes namespace>
 * export CN_URL=<DNS of the content node eg https://content-node.audius.co>
 */
if (!process.env.UM_DB_URL) throw new Error('Please pass in the required UM_DB_URL property')
const UM_MODELS = require('./sequelize')(process.env.UM_DB_URL)
if (!process.env.CN_DB_URL) throw new Error('Please pass in the required CN_DB_URL property')
const CN_MODELS = require('./sequelize')(process.env.CN_DB_URL)
if (!process.env.KUBE_POD_NAME) throw new Error('Please pass in the required KUBE_POD_NAME property')
const KUBE_POD_NAME = process.env.KUBE_POD_NAME
if (!process.env.KUBE_NAMESPACE) throw new Error('Please pass in the required KUBE_NAMESPACE property')
const KUBE_NAMESPACE = process.env.KUBE_NAMESPACE
if (!process.env.CN_URL) throw new Error('Please pass in the required CN_URL property')
const CN_URL = process.env.CN_URL

// constants
const USER_METADATA_ENDPOINT = 'https://usermetadata.audius.co'
const METADATA_NODE_ENDPOINT = 'https://discoveryprovider.audius.co'

let COMMANDS_RUN = new Set()
let SUCCESSFUL_USERS = []
let NO_DIFF_USERS = []

async function run () {
  for (let userId of userIds) {
    try {
      console.log(`------------ Starting run for userId ${userId} ------------`)
      // find user's primary
      const userObj = await findUsersPrimary(userId)
      if (!userObj) throw new Error('no primary for userId', userId)
      const { primary, wallet } = userObj

      if (!primary.includes(CN_URL)) {
        console.log(`Skipping user since primary for userId ${userId} is not ${primary}`)
        continue
      }

      // export data from user metadata for userId
      const exportData = await exportDataForWallet(wallet)
      // console.log('exportData', exportData)

      // write files from the export to the local files_um/ folder
      const { writesSuccessful, files } = await writeFilesLocallyForUser(exportData, userId)
      if (!writesSuccessful || files.length === 0) throw new Error(`Did not successfully fetch files for userId ${userId}`)

      // move files to primary
      await copyFilesToPrimary(userId, files)

      // write files to db
      await writeFilesToDB(wallet, files)
      console.log(`------------ Finished for userId ${userId} ------------\n`)
      SUCCESSFUL_USERS.push(userId)
    } catch (e) {
      console.error(`error transferring files from user metadata for user: ${userId}`, e)
      if (e.message.includes('No new records to add to users primary')) NO_DIFF_USERS.push(userId)
    }
  }
  console.log('successfully finished for', SUCCESSFUL_USERS)
  console.log('NO_DIFF_USERS', NO_DIFF_USERS)
  process.exit()
}

run()

/**
 *
 * Run functions
 *
*/

/**
  * Call export and get JSON response for wallet
*/
async function exportDataForWallet (wallet) {
  const exportQueryParams = {
    wallet_public_key: [wallet]
  }

  const resp = await axios({
    method: 'get',
    baseURL: USER_METADATA_ENDPOINT,
    url: '/export',
    params: exportQueryParams,
    responseType: 'json',
    timeout: 300000 /* 5m = 300000ms */
  })
  if (resp.status !== 200) {
    console.error(`Failed to retrieve export for wallets`, wallet)
    throw new Error(resp.data['error'])
  }

  if (!resp.data) {
    if (resp.request && resp.request.responseText) {
      resp.data = JSON.parse(resp.request.responseText)
    } else throw new Error(`Malformed response for export for wallet ${wallet}`)
  }
  if (!resp.data.hasOwnProperty('cnodeUsers') || !resp.data.hasOwnProperty('ipfsIDObj') || !resp.data.ipfsIDObj.hasOwnProperty('addresses')) {
    throw new Error(`Malformed response for export for wallet ${wallet}`)
  }

  // data is { cnodeUsers: {cnodeUserUUID: {clock: '', tracks: [], files: [], audiusUsers: [], clockRecords: []}}, ipfsIDObj: {} }
  const { data } = resp.data
  return data
}

/**
 * Given the data from the export, download the files and save them in the local fs under ./files_um/
 */
async function writeFilesLocallyForUser (data, wallet) {
  let writesSuccessful = true
  if (Object.values(data.cnodeUsers).length === 0) throw new Error(`No data for user: ${wallet}`)

  for (let cnodeUserUUID in data.cnodeUsers) {
    const cnodeUser = data.cnodeUsers[cnodeUserUUID]
    for (let file of cnodeUser.files) {
      // skip dir types for file fetching and writing, but insert these into db
      if (file.type === 'dir') continue

      console.log(`about to fetch file from user metadata: ${file.multihash}`)
      const responseStream = await _getFileFromUserMetadata(file.multihash)

      if (responseStream) {
        await _writeStreamToFileSystem(responseStream, path.join('files_um', file.multihash))
      } else {
        console.log(`could not download file for object`, file)
        writesSuccessful = false
      }
    }

    // this return is in a for loop, but we're assuming data.cnodeUsers is an object with a single property
    return { writesSuccessful, files: cnodeUser.files || [] }
  }
}

/**
 * Create the dir on the kube container volume and transfer the files to the appropriate file storage directory
 */
async function copyFilesToPrimary (wallet, files) {
  for (let file of files) {
    try {
      const mkdirCmd = _mkdirPathCommand(file.storagePath)
      if (!COMMANDS_RUN.has(mkdirCmd)) {
        await _runCommand(mkdirCmd)
        COMMANDS_RUN.add(mkdirCmd)
      }
      const sendFileCmd = _sendFileCommand(file.multihash, file.storagePath)
      if (!COMMANDS_RUN.has(sendFileCmd)) {
        await _runCommand(sendFileCmd)
        COMMANDS_RUN.add(sendFileCmd)
      }
    } catch (e) {
      throw new Error(`Error copying files to primary for wallet: ${wallet}, ${e.message}`)
    }
  }
}

/**
 * Given a user's id, find and return the primary creator node and wallet address
 */
async function findUsersPrimary (userId) {
  const resp = await axios({
    method: 'get',
    baseURL: METADATA_NODE_ENDPOINT,
    url: '/users',
    params: { id: userId },
    responseType: 'json',
    timeout: 300000 /* 5m = 300000ms */
  })

  if (resp.status !== 200) {
    console.error(`Failed to retrieve findUsersPrimary`, userId)
    throw new Error(resp.data['error'])
  }

  // resp.data is {data: [{user object}], signature: '', signer: ''}
  if (!resp.data || !resp.data.data || !resp.data.data[0] || !resp.data.data[0].creator_node_endpoint) {
    throw new Error(`Malformed response for findUsersPrimary ${userId}`)
  }

  const primary = resp.data.data[0].creator_node_endpoint.split(',')[0]
  const wallet = resp.data.data[0].wallet
  if (primary && wallet) {
    console.log(`primary endpoint for wallet ${wallet}: ${primary}`)
    return { primary, wallet }
  }

  return null
}

async function writeFilesToDB (wallet, files) {
  // find all existing files and dedupe
  // create a tx
  // in a try/catch, call dbManager function to write files
  let cnodeUserUM
  let cnodeUserCN
  let filesToAdd = []
  try {
    cnodeUserUM = await UM_MODELS.CNodeUser.findOne({ where: { walletPublicKey: wallet } })
    cnodeUserCN = await CN_MODELS.CNodeUser.findOne({ where: { walletPublicKey: wallet } })
    if (!cnodeUserUM || !cnodeUserCN) throw new Error(`could not find cnodeUser record in db for wallet ${wallet}`)
  } catch (e) {
    throw new Error(`writeFilesToDB - Could not retrieve cnodeUser - ${e.message}`)
  }

  try {
    let filesFromUM = await UM_MODELS.File.findAll({ where: { multihash: files.map(f => f.multihash), cnodeUserUUID: cnodeUserUM.cnodeUserUUID } })
    console.log('filesFromUM', filesFromUM.length)
    let multihashArrFromUM = filesFromUM.map(f => f.multihash)

    let filesFromCN = await CN_MODELS.File.findAll({ where: { multihash: files.map(f => f.multihash), cnodeUserUUID: cnodeUserCN.cnodeUserUUID } })
    console.log('filesFromCN', filesFromCN.length)
    let multihashArrFromCN = filesFromCN.map(f => f.multihash)

    const differenceSet = new Set([...multihashArrFromUM].filter(x => !(new Set(multihashArrFromCN)).has(x)))
    const intersectionSet = new Set([...multihashArrFromUM].filter(x => (new Set(multihashArrFromCN)).has(x)))
    console.log(`intersection set for user ${wallet}`, intersectionSet)
    if (differenceSet.size === 0) throw new Error('No new records to add to users primary')

    filesToAdd = files.filter(file => differenceSet.has(file.multihash))
  } catch (e) {
    throw new Error(`writeFilesToDB - Error in difference set - ${e.message}`)
  }

  console.log('adding', filesToAdd.length, 'to files table for user', wallet)
  const transaction = await CN_MODELS.sequelize.transaction()
  try {
    for (let file of filesToAdd) {
      let fileToAddObj = { ...file }
      delete fileToAddObj['clock']
      delete fileToAddObj['cnodeUserUUID']
      delete fileToAddObj['createdAt']
      delete fileToAddObj['updatedAt']
      // console.log(fileToAddObj)
      await DBManager.createNewDataRecord(fileToAddObj, cnodeUserCN.cnodeUserUUID, CN_MODELS.File, transaction, CN_MODELS)
    }
    await transaction.commit()
  } catch (e) {
    await transaction.rollback()
    throw new Error(`Error writing files to db ${e.message}`)
  }
}

/**
 *
 * Helper functions
 *
 */

function _sendFileCommand (cid, expectedStoragePath) {
  const cmd = `${KUBE_NAMESPACE} cp ./files_um/${cid} ${KUBE_POD_NAME}:${expectedStoragePath}`
  return cmd
}

function _mkdirPathCommand (expectedStoragePath) {
  const dirPath = path.parse(expectedStoragePath).dir
  const cmd = `${KUBE_NAMESPACE} exec ${KUBE_POD_NAME} -- mkdir -p ${dirPath}`
  return cmd
}

const _runCommand = async (command) => {
  return new Promise((resolve, reject) => {
    console.log(`Running command: '${command}'`)
    // resolve() //DELETE THIS

    exec(`${command}`, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }
      if (stderr) console.log(`stderr: ${stderr}`)
      console.log(`Reponse: ${stdout}`)
      resolve(stdout.trim())
    })
  })
}

/**
 * Write data via an axios stream to local file system
 */
async function _writeStreamToFileSystem (stream, expectedStoragePath) {
  const destinationStream = fs.createWriteStream(expectedStoragePath)
  stream.pipe(destinationStream)
  return new Promise((resolve, reject) => {
    destinationStream.on('finish', () => {
      resolve()
    })
    destinationStream.on('error', err => { reject(err) })
    stream.on('error', err => { destinationStream.end(); reject(err) })
  })
}

/**
 * Fetch stream from user metadata for CID (or return null if no stream)
 */
async function _getFileFromUserMetadata (cid) {
  let response = null
  try {
    const reqURL = `${USER_METADATA_ENDPOINT}/ipfs/${cid}`

    const resp = await axios({
      method: 'get',
      url: reqURL,
      responseType: 'stream',
      timeout: 20000
    })

    // this is the stream
    if (resp.data) {
      response = resp.data
    }
  } catch (e) {
    console.error(`Error fetching file ${e.message}`)
    return null
  }

  return response
}

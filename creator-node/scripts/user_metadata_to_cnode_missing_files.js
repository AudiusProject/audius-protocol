const axios = require('axios')
const path = require('path')
const fs = require('fs')
var { exec } = require('child_process')

const wallets = require('./user_metadata_to_cnode_missing_files_wallets')

if (!process.env.UM_DB_URL) throw new Error('Please pass in the required UM_DB_URL property')
const UM_MODELS = require('./sequelize')(process.env.UM_DB_URL)
if (!process.env.CN_DB_URL) throw new Error('Please pass in the required CN_DB_URL property')
const CN_MODELS = require('./sequelize')(process.env.CN_DB_URL)
const dbManager = require('./dbManagerClone')

const USER_METADATA_ENDPOINT = 'https://usermetadata.audius.co'
const METADATA_NODE_ENDPOINT = 'https://discoveryprovider.audius.co'

const PRIMARY_TO_PODS = {
  'https://creatornode.audius.co': 'creator-1-backend-8596d98c4b-69hk9',
  'https://creatornode2.audius.co': 'creator-2-backend-6fbbc79578-brvpr',
  'https://creatornode3.audius.co': 'creator-3-backend-68f784cffb-csf92'
}
const KUBE_NAMESPACE = `kubectl -n stage`

let COMMANDS_RUN = new Set()

async function run () {
  for (let wallet of wallets) {
    try {
      console.log(`------------ Starting run for wallet ${wallet} ------------`)
      // find user's primary
      const primary = await findUsersPrimary(wallet)
      if (!primary) throw new Error('no primary for wallet', wallet)
      if (!primary.includes('creatornode.audius.co')) {
        console.log(`Skipping content-node primary for wallet ${wallet}`)
        continue
      }

      // export data from user metadata for wallet
      const exportData = await exportDataForWallet(wallet)
      // console.log('exportData', exportData)

      // write files from the export to the local files_um/ folder
      const { writesSuccessful, files } = await writeFilesLocallyForUser(exportData, wallet)
      if (!writesSuccessful || files.length === 0) throw new Error(`Did not successfully fetch files for wallet ${wallet}`)

      // move files to primary
      // await copyFilesToPrimary(wallet, files, primary)

      // write files to db
      await writeFilesToDB(wallet, files)
      console.log(`------------ Finished for wallet ${wallet} ------------\n`)
    } catch (e) {
      console.error(`error transferring files from user metadata for user: ${wallet}`, e)
    }
  }
  process.exit()
}

run()

// TODO
// create a tx and write files to db
// Move set of commands already run to persistent storage like file (optimization)

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
async function copyFilesToPrimary (wallet, files, primaryUrl) {
  const containerName = PRIMARY_TO_PODS[primaryUrl]

  for (let file of files) {
    try {
      const mkdirCmd = _mkdirPathCommand(file.storagePath, containerName)
      if (!COMMANDS_RUN.has(mkdirCmd)) {
        await _runCommand(mkdirCmd)
        COMMANDS_RUN.add(mkdirCmd)
      }
      const sendFileCmd = _sendFileCommand(file.multihash, file.storagePath, containerName)
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
 * Given a user's wallet, find the primary creator node
 */
async function findUsersPrimary (wallet) {
  const resp = await axios({
    method: 'get',
    baseURL: METADATA_NODE_ENDPOINT,
    url: '/users',
    params: { wallet },
    responseType: 'json',
    timeout: 300000 /* 5m = 300000ms */
  })

  if (resp.status !== 200) {
    console.error(`Failed to retrieve findUsersPrimary`, wallet)
    throw new Error(resp.data['error'])
  }

  // resp.data is {data: [{user object}], signature: '', signer: ''}
  if (!resp.data || !resp.data.data || !resp.data.data[0]) {
    throw new Error(`Malformed response for findUsersPrimary ${wallet}`)
  }

  const primary = resp.data.data[0].creator_node_endpoint.split(',')[0]
  if (primary) {
    console.log(`primary endpoint for wallet ${wallet}: ${primary}`)
    return primary
  }

  return null
}

async function writeFilesToDB (wallet, files) {
  // find all existing files and dedupe
  // create a tx
  // in a try/catch, call dbManager function to write files
  let cnodeUserUM
  let cnodeUserCN
  try {
    cnodeUserUM = await UM_MODELS.CNodeUser.findOne({ where: { walletPublicKey: wallet }})
    // console.log(cnodeUserUM)
    cnodeUserCN = await CN_MODELS.CNodeUser.findOne({ where: { walletPublicKey: wallet }})
    // console.log(cnodeUserCN)
  } catch (e) {
    throw new Error(`writeFilesToDB - Could not retrieve cnodeUser - ${e.message}`)
  }


  try {
    let filesFromUM = await UM_MODELS.File.findAll({ where: { multihash: files.map(f => f.multihash), cnodeUserUUID: cnodeUserUM.cnodeUserUUID }})
    console.log('filesFromUM', filesFromUM.length)
    let multihashArrFromUM = filesFromUM.map(f => f.multihash)
    
    let filesFromCN = await CN_MODELS.File.findAll({ where: { multihash: files.map(f => f.multihash), cnodeUserUUID: cnodeUserCN.cnodeUserUUID }})
    console.log('filesFromCN', filesFromCN.length)
    let multihashArrFromCN = filesFromCN.map(f => f.multihash)
    
    const differenceSet = new Set([...multihashArrFromUM].filter(x => !(new Set(multihashArrFromCN)).has(x) ))
    if (differenceSet.size === 0) throw new Error('No new records to add to users primary')
    console.log('adding', differenceSet.size, 'to files table')
  } catch (e) {
    throw new Error(`writeFilesToDB - Error in difference set - ${e.message}`)
  }
}

/**
 *
 * Helper functions
 *
 */

function _sendFileCommand (cid, expectedStoragePath, containerName) {
  const cmd = `${KUBE_NAMESPACE} cp ./files_um/${cid} ${containerName}:${expectedStoragePath}`
  return cmd
}

function _mkdirPathCommand (expectedStoragePath, containerName) {
  const dirPath = path.parse(expectedStoragePath).dir
  const cmd = `${KUBE_NAMESPACE} exec ${containerName} -- mkdir -p ${dirPath}`
  return cmd
}

const _runCommand = async (command) => {
  return await new Promise((resolve, reject) => {
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

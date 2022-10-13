const fs = require('fs-extra')
const bunyan = require('bunyan')
const CID = require('cids')
const path = require('path')
const config = require('../config')

// taken from: https://github.com/trentm/node-bunyan/issues/194#issuecomment-347801909
// since there is no official support for string-based "level" values
// response from author: https://github.com/trentm/node-bunyan/issues/194#issuecomment-70397668
function RawStdOutWithLevelName() {
  return {
    write: (log) => {
      // duplicate log object before sending to stdout
      const clonedLog = { ...log }

      // add new level (string) to level key
      clonedLog.logLevel = bunyan.nameFromLevel[clonedLog.level]

      // stringify() uses the safeCycles() replacer, which returns '[Circular]'
      // when circular references are detected
      // related code: https://github.com/trentm/node-bunyan/blob/0ff1ae29cc9e028c6c11cd6b60e3b90217b66a10/lib/bunyan.js#L1155-L1200
      const logLine = JSON.stringify(clonedLog, bunyan.safeCycles()) + '\n'
      process.stdout.write(logLine)
    }
  }
}

const genericLogger = bunyan.createLogger({
  name: 'audius_creator_node',
  streams: [
    {
      level: config.get('logLevel') || 'info',
      stream: RawStdOutWithLevelName(),
      type: 'raw'
    }
  ]
})

/**
 * Given a directory path, this function will create the dirPath if it doesn't exist
 * If it does exist, it will not overwrite, effectively a no-op
 * @param {*} dirPath fs directory path to create if it does not exist
 */
async function ensureDirPathExists(dirPath) {
  try {
    // the mkdir recursive option is equivalent to `mkdir -p` and should created nested folders several levels deep
    await fs.mkdir(dirPath, { recursive: true })
  } catch (e) {
    genericLogger.error(
      `Error making directory, dirName=${dirPath}, error=${e.toString()}`
    )
    throw new Error(`Error making directory at ${dirPath} - ${e.message}`)
  }
}

/**
 * Return the storagePath from the config
 */
function getConfigStoragePath() {
  return config.get('storagePath')
}

/**
 * Construct the path to a file or directory given a CID
 *
 * eg. if you have a file CID `Qmabcxyz`, use this function to get the path /file_storage/files/cxy/Qmabcxyz
 * eg. if you have a dir CID `Qmdir123`, use this function to get the path /file_storage/files/r12/Qmdir123/
 * Use `computeFilePathInDir` if you want to get the path for a file inside a directory.
 *
 * @dev Returns a path with the three characters before the last character
 *      eg QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6 will be eg /file_storage/muU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6
 * @param {String} cid file system destination, either filename or directory
 */
async function computeFilePath(cid, shouldEnsureDirPathExists = true) {
  try {
    CID.isCID(new CID(cid))
  } catch (e) {
    genericLogger.error(`CID invalid, cid=${cid}, error=${e.toString()}`)
    throw new Error(
      `Please pass in a valid cid to computeFilePath. Passed in ${cid} ${e.message}`
    )
  }

  const directoryID = cid.slice(-4, -1)
  const parentDirPath = path.join(getConfigStoragePath(), 'files', directoryID)

  if (shouldEnsureDirPathExists) {
    await ensureDirPathExists(parentDirPath)
  }

  return path.join(parentDirPath, cid)
}

/**
 * Given a directory name and a file name, construct the full file system path for a directory and a folder inside a directory
 *
 * eg if you're manually computing the file path to an file `Qmabcxyz` inside a dir `Qmdir123`, use this function to get the
 * path with both the dir and the file /file_storage/files/r12/Qmdir123/Qmabcxyz
 * Use `computeFilePath` if you just want to get to the path of a file or directory.
 *
 * @param {String} dirName directory name
 * @param {String} fileName file name
 */
async function computeFilePathInDir(dirName, fileName) {
  if (!dirName || !fileName) {
    genericLogger.error(
      `Invalid dirName and/or fileName, dirName=${dirName}, fileName=${fileName}`
    )
    throw new Error('Must pass in valid dirName and fileName')
  }

  try {
    CID.isCID(new CID(dirName))
    CID.isCID(new CID(fileName))
  } catch (e) {
    genericLogger.error(
      `CID invalid, dirName=${dirName}, fileName=${fileName}, error=${e.toString()}`
    )
    throw new Error(
      `Please pass in a valid cid to computeFilePathInDir for dirName and fileName. Passed in dirName: ${dirName} fileName: ${fileName} ${e.message}`
    )
  }

  const parentDirPath = await computeFilePath(dirName)
  const absolutePath = path.join(parentDirPath, fileName)
  genericLogger.info(`File path computed, absolutePath=${absolutePath}`)
  return absolutePath
}

module.exports = {
  genericLogger,
  ensureDirPathExists,
  getConfigStoragePath,
  computeFilePath,
  computeFilePathInDir,
  RawStdOutWithLevelName
}

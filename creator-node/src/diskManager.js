const path = require('path')
const fs = require('fs')
const config = require('./config')

// use this set to cache existing paths we know we've created so we don't make extraneous file system calls
let EXISTING_PATHS = new Set()

class DiskManager {
  /**
   * Return the storagePath from the config
   */
  static getConfigStoragePath () {
    return config.get('storagePath')
  }

  /**
   * Construct a subdirectory path given a file CID or dir CID
   * @dev Returns a subdirectory path with the three characters before the last character
   *      eg QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6 will be eg /file_storage/uU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6
   * @param {String} fileName file CID or dir CID name
   */
  static computeCIDFilePath (fileName) {
    if (!fileName || fileName.length < 4) throw new Error(`Please pass in a valid fileName to computeCIDFilePath. Passed in ${fileName}`)

    // this is the directory path that file with fileName will go into
    const parentDirPath = path.join(this.getConfigStoragePath(), fileName.slice(-4, -1))

    // create the subdirectories in parentDirHash if they don't exist
    this.ensureDirPathExists(parentDirPath)

    return path.join(parentDirPath, fileName)
  }

  /**
   *
   * @param {*} dirPath fs directory path to create if it does not exist
   */
  static ensureDirPathExists (dirPath) {
    try {
      if (!EXISTING_PATHS.has(dirPath)) {
        // calling this on an existing directory doesn't overwrite the existing data or throw an error
        // the mkdir recursive is equivalent to `mkdir -p`
        fs.mkdirSync(dirPath, { recursive: true })
        EXISTING_PATHS.add(dirPath)
      }
    } catch (e) {
      throw new Error(`Error making directory at ${dirPath} - ${e.message}`)
    }
  }
}

module.exports = DiskManager

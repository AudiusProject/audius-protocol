const path = require('path')
const fs = require('fs')
const config = require('./config')

// use this set to cache existing directory paths we know we've created so we don't make extraneous file system calls
let EXISTING_PATHS = new Set()

// regex to check if a directory or just a regular file
// if directory - will have both outer and inner properties in match.groups
// else - will have just outer property, no inner
const CID_DIRECTORY_REGEX = /\/(?<outer>Qm[a-zA-Z0-9]{44})\/?(?<inner>Qm[a-zA-Z0-9]{44})?/

class DiskManager {
  /**
   * Return the storagePath from the config
   */
  static getConfigStoragePath () {
    return config.get('storagePath')
  }

  /**
   * Construct the path to a file or directory
   *
   * eg. if you have a file `Qmabcxyz`, use this function to get the path /file_storage/files/cxy/Qmabcxyz
   * eg. if you have a dir `Qmdir123`, use this function to get the path /file_storage/files/r12/Qmdir123/
   * Use `computeFilePathInDir` if you want to get the path for a file inside a directory.
   *
   * @dev Returns a path with the three characters before the last character
   *      eg QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6 will be eg /file_storage/muU/QmYfSQCgCwhxwYcdEwCkFJHicDe6rzCAb7AtLz3GrHmuU6
   * @param {String} fsDest file system destination, either filename or directory name
   */
  static computeBasePath (fsDest) {
    if (!fsDest || fsDest.length < 4) throw new Error(`Please pass in a valid fsDest to computeBasePath. Passed in ${fsDest}`)
    if (fsDest.includes('/')) throw new Error('Cannot pass in a directory path into this function, please pass in the leaf dir or file name')

    // This is the directory path that file with fsDest will go into.
    // The reason for nesting `files` inside `/file_storage` is because legacy nodes store files at the root of `/file_storage`, and
    // that can cause potential collisions if we're creating large amounts of subdirectories. A way to mitigate this is create one
    // directory in the root `/file_storage` and all other directories inside of it like `file_storage/files/<directoryID>/<fsDest>
    const directoryID = fsDest.slice(-4, -1)
    const parentDirPath = path.join(this.getConfigStoragePath(), 'files', directoryID)
    // in order to easily dev against the older and newer paths, the line below is the legacy storage path
    // const parentDirPath = this.getConfigStoragePath()

    // create the subdirectories in parentDirHash if they don't exist
    this.ensureDirPathExists(parentDirPath)

    return path.join(parentDirPath, fsDest)
  }

  /**
   * Given a directory name and a file name, construct the full file system path for a directory and a folder inside a directory
   *
   * eg if you're manually computing the file path to an file `Qmabcxyz` inside a dir `Qmdir123`, use this function to get the
   * path with both the dir and the file /file_storage/files/r12/Qmdir123/Qmabcxyz
   * Use `computeBasePath` if you just want to get to the path of a file or directory.
   *
   * @param {String} dirName directory name
   * @param {String} fileName file name
   */
  static computeFilePathInDir (dirName, fileName) {
    if (!dirName || !fileName) throw new Error('Must pass in valid dirName and fileName')

    const parentDirPath = this.computeBasePath(dirName)
    return path.join(parentDirPath, fileName)
  }

  /**
   * Given a directory path, this function will create the dirPath if it doesn't exist
   * If it does exist, it will not overwrite, effectively a no-op
   * @param {*} dirPath fs directory path to create if it does not exist
   */
  static ensureDirPathExists (dirPath) {
    try {
      if (!EXISTING_PATHS.has(dirPath)) {
        // the mkdir recursive option is equivalent to `mkdir -p` and should created nested folders several levels deep
        fs.mkdirSync(dirPath, { recursive: true })
        EXISTING_PATHS.add(dirPath)
      }
    } catch (e) {
      throw new Error(`Error making directory at ${dirPath} - ${e.message}`)
    }
  }

  /**
   * Given a file system path, extract CID's from the path and returns obj
   * @param {String} fsPath file system path like /file_storage/files/r12/Qmdir123/Qmabcxyz
   * @returns {Object} {isDir: Boolean, outer: CID, inner: CID|null}
   *    outer should always be defined and can either be a file if not dir, or the dir name if dir
   *    inner will be defined if the file is inside the dir matched by the outer match group
   */
  static extractCIDsFromFSPath (fsPath) {
    const match = CID_DIRECTORY_REGEX.exec(fsPath)
    if (!match || !match.groups) return null

    let ret = null
    if (match && match.groups && match.groups.outer && match.groups.inner) {
      ret = { isDir: true, outer: match.groups.outer, inner: match.groups.inner }
    } else if (match.groups.outer && !match.groups.inner) {
      ret = { isDir: false, outer: match.groups.outer, inner: null }
    }

    return ret
  }
}

module.exports = DiskManager

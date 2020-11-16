const path = require('path')
const fs = require('fs')
const config = require('./config')
const { CID } = require('ipfs-http-client-latest')

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
   * Returns the folder that stores track artifacts uploaded by creators. The reason this is all stored together
   * is we should be able to delete the contents of this folder without scanning through other folders with the
   * naming scheme.
   */
  static getTmpTrackUploadArtifactsPath () {
    const dirPath = path.join(config.get('storagePath'), 'files', 'tmp_track_artifacts')
    this.ensureDirPathExists(dirPath)
    return dirPath
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
  static computeFilePath (cid) {
    try {
      CID.isCID(new CID(cid))
    } catch (e) {
      throw new Error(`Please pass in a valid cid to computeFilePath. Passed in ${cid} ${e.message}`)
    }

    // This is the directory path that file with cid will go into.
    // The reason for nesting `files` inside `/file_storage` is because legacy nodes store files at the root of `/file_storage`, and
    // that can cause potential collisions if we're creating large amounts of subdirectories. A way to mitigate this is create one
    // directory in the root `/file_storage` and all other directories inside of it like `file_storage/files/<directoryID>/<cid>
    const directoryID = cid.slice(-4, -1)
    const parentDirPath = path.join(this.getConfigStoragePath(), 'files', directoryID)
    // in order to easily dev against the older and newer paths, the line below is the legacy storage path
    // const parentDirPath = this.getConfigStoragePath()

    // create the subdirectories in parentDirHash if they don't exist
    this.ensureDirPathExists(parentDirPath)

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
  static computeFilePathInDir (dirName, fileName) {
    if (!dirName || !fileName) throw new Error('Must pass in valid dirName and fileName')
    try {
      CID.isCID(new CID(dirName))
      CID.isCID(new CID(fileName))
    } catch (e) {
      throw new Error(`Please pass in a valid cid to computeFilePathInDir for dirName and fileName. Passed in dirName: ${dirName} fileName: ${fileName} ${e.message}`)
    }

    const parentDirPath = this.computeFilePath(dirName)
    return path.join(parentDirPath, fileName)
  }

  /**
   * Given a directory path, this function will create the dirPath if it doesn't exist
   * If it does exist, it will not overwrite, effectively a no-op
   * @param {*} dirPath fs directory path to create if it does not exist
   */
  static ensureDirPathExists (dirPath) {
    try {
      // the mkdir recursive option is equivalent to `mkdir -p` and should created nested folders several levels deep
      fs.mkdirSync(dirPath, { recursive: true })
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

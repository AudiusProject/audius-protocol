/**
 * NOTE: we import everything explicitly an re-export it
 * in order to support both commonjs style exports (`module.exports`)
 * and the new module style exports (`export`).
 * In the future, once we get a significant amount of the codebase
 * typed, we'll remove the commonjs export syntax and just use
 * the new way of importing/exporting
 */
import { strToReplicaSet } from './strToReplicaSet'
import { timeout, getRandomInt, verifySignature, stringifyMap } from './utils'
import {
  validateMetadata,
  validateAssociatedWallets
} from './validateAudiusUserMetadata'
import {
  findCIDInNetwork,
  verifyCIDMatchesExpected,
  EMPTY_FILE_CID
} from './cidUtils'
import {
  createDirForFile,
  writeStreamToFileSystem,
  getIfAttemptedStateFix,
  validateStateForImageDirCIDAndReturnFileUUID,
  _streamFileToDiskHelper
} from './fsUtils'
import { runShellCommand } from './runShellCommand'
import {
  currentNodeShouldHandleTranscode,
  getAllRegisteredCNodes
} from './contentNodeUtils'
import { clusterUtils } from './clusterUtils'

export type { ReplicaSet } from './strToReplicaSet'
export {
  timeout,
  getRandomInt,
  verifySignature,
  currentNodeShouldHandleTranscode,
  validateStateForImageDirCIDAndReturnFileUUID,
  findCIDInNetwork,
  getAllRegisteredCNodes,
  getIfAttemptedStateFix,
  createDirForFile,
  writeStreamToFileSystem,
  _streamFileToDiskHelper,
  runShellCommand,
  validateAssociatedWallets,
  validateMetadata,
  strToReplicaSet,
  stringifyMap,
  clusterUtils
}

module.exports = {
  timeout,
  getRandomInt,
  verifySignature,
  currentNodeShouldHandleTranscode,
  validateStateForImageDirCIDAndReturnFileUUID,
  findCIDInNetwork,
  getAllRegisteredCNodes,
  getIfAttemptedStateFix,
  createDirForFile,
  writeStreamToFileSystem,
  _streamFileToDiskHelper,
  runShellCommand,
  validateAssociatedWallets,
  validateMetadata,
  strToReplicaSet,
  stringifyMap,
  verifyCIDMatchesExpected,
  EMPTY_FILE_CID,
  clusterUtils
}
